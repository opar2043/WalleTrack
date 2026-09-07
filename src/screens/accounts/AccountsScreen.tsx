import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banknote, Landmark, CreditCard, Trash2, Pencil, X, Check } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuthStore } from "@stores/authStore";
import { useAccountsStore } from "@stores/accountsStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Card } from "@components/ui/Card";
import { EmptyState } from "@components/ui/EmptyState";
import { Header } from "@components/ui/Header";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { formatCurrency } from "@utils/format";
import { cn } from "@utils/cn";
import { CUSTOM_CURRENCY_SYMBOLS } from "@constants/index";
import type { AccountType } from "@t/index";

const typeIcons: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={20} color="#6C5CE7" />,
  bank: <Landmark size={20} color="#3B82F6" />,
  card: <CreditCard size={20} color="#FF6B4A" />,
};

const typeColors: Record<AccountType, string> = {
  cash: "#6C5CE7",
  bank: "#3B82F6",
  card: "#FF6B4A",
};

export default function AccountsScreen() {
  const { userId } = useAuthStore();
  const { accounts, loadAccounts, addAccount, updateAccount, deleteAccount } =
    useAccountsStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [balance, setBalance] = useState("");
  const [cardLast4, setCardLast4] = useState("");

  const baseCurrency = profile?.baseCurrency || "USD";

  useEffect(() => {
    if (userId) loadAccounts(userId);
  }, [userId]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setType("cash");
    setBalance("");
    setCardLast4("");
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const acc = accounts.find((a) => a.$id === id);
    if (!acc) return;
    setEditingId(id);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setCardLast4(acc.cardLast4 || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(i18n.t("accounts.accountName"));
      return;
    }
    if (!userId) return;

    if (editingId) {
      await updateAccount(editingId, {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        ...(cardLast4 ? { cardLast4 } : {}),
      });
      toast.success(i18n.t("accounts.accountUpdated"));
    } else {
      await addAccount(userId, {
        name: name.trim(),
        type,
        currency: baseCurrency,
        balance: parseFloat(balance) || 0,
        icon: type,
        color: typeColors[type],
        ...(cardLast4 ? { cardLast4 } : {}),
      });
      toast.success(i18n.t("accounts.accountAdded"));
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
    toast.success(i18n.t("accounts.accountDeleted"));
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <Header
        title={i18n.t("accounts.title")}
        subtitle={`${formatCurrency(totalBalance, baseCurrency)}`}
        rightComponent={
          <Pressable
            onPress={openAdd}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]"
          >
            <Text className="text-xl font-bold text-white">+</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-32 pt-2"
      >
        {accounts.length === 0 ? (
          <EmptyState
            title={i18n.t("accounts.noAccounts")}
            message={i18n.t("empty.accounts")}
            icon={
              <View>
                <Text className="text-3xl">👛</Text>
              </View>
            }
          />
        ) : (
          accounts.map((acc, idx) => (
            <Animated.View
              key={acc.$id}
              entering={FadeInDown.duration(350).delay(idx * 60)}
              className="mb-3"
            >
              <Card className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#6C5CE7]/10">
                  {typeIcons[acc.type]}
                </View>
                <View className="flex-1">
                  <Text className={cn("text-base font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                    {acc.name}
                  </Text>
                  <Text className={cn("text-xs capitalize", isDark ? "text-gray-400" : "text-gray-500")}>
                    {i18n.t(`accounts.${acc.type}` as never)} • {acc.currency}
                  </Text>
                  {acc.cardLast4 && (
                    <Text className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                      •••• {acc.cardLast4}
                    </Text>
                  )}
                </View>
                <View className="flex-shrink items-end pl-3">
                  <Text
                    className={cn("text-base font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatCurrency(acc.balance, acc.currency, false)}
                  </Text>
                  <View className="mt-1 flex-row gap-2">
                    <Pressable
                      onPress={() => openEdit(acc.$id)}
                      className="h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7]/10"
                    >
                      <Pencil size={14} color="#6C5CE7" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(acc.$id)}
                      className="h-8 w-8 items-center justify-center rounded-full bg-[#EF4444]/10"
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className={cn(
              "rounded-t-3xl p-6",
              isDark ? "bg-[#1E1E2D]" : "bg-white"
            )}
          >
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />
            <Text className={cn("mb-6 text-xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {editingId ? i18n.t("accounts.editAccount") : i18n.t("accounts.addAccount")}
            </Text>

            <Input
              label={i18n.t("accounts.accountName")}
              placeholder={i18n.t("accounts.accountNamePlaceholder")}
              value={name}
              onChangeText={setName}
              className="mb-4"
            />

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("accounts.accountType")}
            </Text>
            <View className="mb-4 flex-row gap-2">
              {(["cash", "bank", "card"] as AccountType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={cn(
                    "flex-1 items-center rounded-2xl border py-3",
                    type === t
                      ? "border-[#6C5CE7] bg-[#6C5CE7]/10"
                      : isDark
                      ? "border-[#2A2A3C]"
                      : "border-[#E5E7EB]"
                  )}
                >
                  {typeIcons[t]}
                  <Text className={cn("mt-1 text-xs font-semibold capitalize", isDark ? "text-gray-200" : "text-[#1E1E2D]")}>
                    {i18n.t(`accounts.${t}` as never)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input
              label={i18n.t("accounts.enterInitialBalance")}
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholder="0.00"
              className="mb-4"
            />

            {type === "card" && (
              <Input
                label={i18n.t("accounts.cardLast4")}
                placeholder={i18n.t("accounts.cardLast4Placeholder")}
                value={cardLast4}
                onChangeText={setCardLast4}
                maxLength={4}
                keyboardType="number-pad"
                className="mb-4"
              />
            )}

            <Button title={i18n.t("common.save")} onPress={handleSave} size="lg" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
