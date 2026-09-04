import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Switch,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { X, Camera, RefreshCw, Plus, Trash2, ChevronDown, Image as ImageIcon } from "lucide-react-native";
import { useAuthStore } from "@stores/authStore";
import { useAccountsStore } from "@stores/accountsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { CategoryIcon } from "@components/common/CategoryListItem";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";
import { formatCurrency } from "@utils/format";
import type { TransactionType, TransactionSplit, RecurringFrequency } from "@t/index";

const frequencies: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: i18n.t("transactions.daily") },
  { value: "weekly", label: i18n.t("transactions.weekly") },
  { value: "monthly", label: i18n.t("transactions.monthly") },
  { value: "yearly", label: i18n.t("transactions.yearly") },
];

export default function AddTransactionScreen({ navigation }: { navigation: { goBack: () => void; navigate: (screen: string) => void } }) {
  const { userId } = useAuthStore();
  const { accounts } = useAccountsStore();
  const { categories } = useCategoriesStore();
  const { addTransaction } = useTransactionsStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [splitCategoryId, setSplitCategoryId] = useState("");
  const [splitAmount, setSplitAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [receiptUri, setReceiptUri] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const baseCurrency = profile?.baseCurrency || "USD";

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories]
  );

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].$id);
    }
    if (accounts.length > 1 && !toAccountId) {
      setToAccountId(accounts[1].$id);
    }
  }, [accounts]);

  const selectedAccount = accounts.find((a) => a.$id === accountId);
  const selectedCategory = categories.find((c) => c.$id === categoryId);

  const numericAmount = parseFloat(amount) || 0;

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Permission needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const addSplit = () => {
    if (!splitCategoryId || !parseFloat(splitAmount)) return;
    setSplits([
      ...splits,
      { categoryId: splitCategoryId, amount: parseFloat(splitAmount) },
    ]);
    setSplitCategoryId("");
    setSplitAmount("");
  };

  const removeSplit = (idx: number) => {
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!userId) return;
    if (numericAmount <= 0) {
      toast.error(i18n.t("transactions.amount"));
      return;
    }
    if (!accountId) {
      toast.error(i18n.t("transactions.account"));
      return;
    }
    if (type !== "transfer" && !categoryId) {
      toast.error(i18n.t("transactions.category"));
      return;
    }
    if (type === "transfer" && !toAccountId) {
      toast.error(i18n.t("transactions.toAccount"));
      return;
    }

    setIsSaving(true);
    try {
      const account = accounts.find((a) => a.$id === accountId);
      await addTransaction({
        userId,
        accountId,
        ...(type === "transfer" ? { toAccountId } : {}),
        type,
        amount: numericAmount,
        currency: account?.currency || baseCurrency,
        baseCurrency,
        ...(type !== "transfer" ? { categoryId } : {}),
        ...(isSplit && type === "expense" ? { splits } : {}),
        ...(note ? { note } : {}),
        date: new Date(),
        ...(paymentMethod ? { paymentMethod } : {}),
        isRecurring,
      });
      toast.success(i18n.t("transactions.transactionAdded"));
      navigation.goBack();
    } catch (e) {
      toast.error(i18n.t("errors.generic"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#EF4444]/10">
          <X size={20} color="#EF4444" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("transactions.addTransaction")}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        {/* Type toggle */}
        <View className={cn("mb-5 flex-row rounded-2xl p-1", isDark ? "bg-[#2A2A3C]" : "bg-[#F0F0F4]")}>
          {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={cn(
                "flex-1 rounded-xl py-2.5",
                type === t ? "bg-white shadow" : ""
              )}
            >
              <Text
                className={cn(
                  "text-center text-sm font-bold capitalize",
                  type === t
                    ? t === "income"
                      ? "text-[#10B981]"
                      : t === "expense"
                      ? "text-[#FF6B4A]"
                      : "text-[#6C5CE7]"
                    : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
                )}
              >
                {i18n.t(`transactions.${t}` as never)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Amount display */}
        <View className="mb-5 items-center">
          <Text className={cn("text-sm font-semibold", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("common.amount")} ({baseCurrency})
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            className={cn(
              "w-full text-center text-5xl font-bold",
              type === "income"
                ? "text-[#10B981]"
                : type === "expense"
                ? "text-[#FF6B4A]"
                : "text-[#6C5CE7]",
              isDark ? "" : ""
            )}
          />
        </View>

        {/* Account picker */}
        <Pressable
          onPress={() => setShowAccountPicker(true)}
          className={cn(
            "mb-3 flex-row items-center justify-between rounded-2xl border px-4 py-3.5",
            isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white"
          )}
        >
          <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("transactions.account")}
          </Text>
          <View className="flex-row items-center">
            <Text className={cn("mr-1 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {selectedAccount?.name || "Select"}
            </Text>
            <ChevronDown size={16} color={isDark ? "#6B7280" : "#9CA3AF"} />
          </View>
        </Pressable>

        {type === "transfer" && (
          <Pressable
            onPress={() => setShowToAccountPicker(true)}
            className={cn(
              "mb-3 flex-row items-center justify-between rounded-2xl border px-4 py-3.5",
              isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white"
            )}
          >
            <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {i18n.t("transactions.toAccount")}
            </Text>
            <View className="flex-row items-center">
              <Text className={cn("mr-1 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                {accounts.find((a) => a.$id === toAccountId)?.name || "Select"}
              </Text>
              <ChevronDown size={16} color={isDark ? "#6B7280" : "#9CA3AF"} />
            </View>
          </Pressable>
        )}

        {/* Category picker */}
        {type !== "transfer" && (
          <Pressable
            onPress={() => setShowCategoryPicker(true)}
            className={cn(
              "mb-3 flex-row items-center justify-between rounded-2xl border px-4 py-3.5",
              isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white"
            )}
          >
            <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {i18n.t("transactions.category")}
            </Text>
            {selectedCategory ? (
              <View className="flex-row items-center">
                <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={28} />
                <Text className={cn("ml-2 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                  {selectedCategory.name}
                </Text>
              </View>
            ) : (
              <Text className={cn("text-sm font-semibold", isDark ? "text-gray-500" : "text-gray-400")}>
                Select
              </Text>
            )}
          </Pressable>
        )}

        {/* Split toggle */}
        {type === "expense" && (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {i18n.t("transactions.split")}
              </Text>
              <Switch
                value={isSplit}
                onValueChange={setIsSplit}
                trackColor={{ false: "#D1D5DB", true: "#6C5CE7" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isSplit && (
              <View className="mb-3">
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Pressable
                      onPress={() => setShowCategoryPicker(true)}
                      className={cn(
                        "rounded-2xl border px-3 py-3",
                        isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white"
                      )}
                    >
                      <Text numberOfLines={1} className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-600")}>
                        {categories.find((c) => c.$id === splitCategoryId)?.name || "Category"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={splitAmount}
                    onChangeText={setSplitAmount}
                    keyboardType="numeric"
                    placeholder="Amount"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    className={cn(
                      "w-28 rounded-2xl border px-3 py-3 text-sm",
                      isDark ? "border-[#2A2A3C] bg-[#1E1E2D] text-white" : "border-[#E5E7EB] bg-white text-[#1E1E2D]"
                    )}
                  />
                  <Pressable
                    onPress={addSplit}
                    className="h-11 w-11 items-center justify-center rounded-2xl bg-[#6C5CE7]"
                  >
                    <Plus size={18} color="white" />
                  </Pressable>
                </View>
                {splits.map((sp, idx) => {
                  const cat = categories.find((c) => c.$id === sp.categoryId);
                  return (
                    <View key={idx} className="mt-2 flex-row items-center justify-between rounded-xl bg-[#6C5CE7]/5 px-3 py-2">
                      <Text className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-600")}>
                        {cat?.name} • {formatCurrency(sp.amount, baseCurrency, false)}
                      </Text>
                      <Pressable onPress={() => removeSplit(idx)}>
                        <Trash2 size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Note */}
        <Input
          placeholder={i18n.t("common.note")}
          value={note}
          onChangeText={setNote}
          className="mb-3"
        />

        {/* Payment method */}
        <Input
          placeholder={i18n.t("transactions.paymentMethodPlaceholder")}
          value={paymentMethod}
          onChangeText={setPaymentMethod}
          className="mb-3"
        />

        {/* Recurring */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("transactions.recurring")}
          </Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: "#D1D5DB", true: "#6C5CE7" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {isRecurring && (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {frequencies.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                className={cn(
                  "rounded-xl border px-4 py-2",
                  frequency === f.value
                    ? "border-[#6C5CE7] bg-[#6C5CE7]"
                    : isDark
                    ? "border-[#2A2A3C]"
                    : "border-[#E5E7EB]"
                )}
              >
                <Text className={cn("text-sm", frequency === f.value ? "text-white" : isDark ? "text-gray-300" : "text-gray-600")}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Receipt */}
        <Pressable
          onPress={pickReceipt}
          className={cn(
            "mb-6 flex-row items-center justify-between rounded-2xl border px-4 py-3.5",
            isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white"
          )}
        >
          <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("transactions.receipt")}
          </Text>
          <View className="flex-row items-center">
            {receiptUri ? (
              <Text className="mr-2 text-xs text-[#10B981]">✓</Text>
            ) : (
              <ImageIcon size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />
            )}
            <Text className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              {receiptUri ? "Added" : i18n.t("transactions.chooseFromGallery")}
            </Text>
          </View>
        </Pressable>

        <Button
          title={i18n.t("common.save")}
          onPress={handleSave}
          loading={isSaving}
          size="lg"
        />
      </ScrollView>

      {/* Account picker modal */}
      <Modal visible={showAccountPicker} transparent animationType="slide" onRequestClose={() => setShowAccountPicker(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className={cn("rounded-t-3xl p-6", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <Text className={cn("mb-4 text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.account")}
            </Text>
            {accounts.map((a) => (
              <Pressable
                key={a.$id}
                onPress={() => {
                  setAccountId(a.$id);
                  setShowAccountPicker(false);
                }}
                className={cn(
                  "mb-2 rounded-2xl border px-4 py-3",
                  accountId === a.$id ? "border-[#6C5CE7] bg-[#6C5CE7]/10" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                )}
              >
                <Text className={cn("font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>{a.name}</Text>
                <Text className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  {formatCurrency(a.balance, a.currency, false)} {a.currency}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* To-account picker modal */}
      <Modal visible={showToAccountPicker} transparent animationType="slide" onRequestClose={() => setShowToAccountPicker(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className={cn("rounded-t-3xl p-6", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <Text className={cn("mb-4 text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.toAccount")}
            </Text>
            {accounts.filter((a) => a.$id !== accountId).map((a) => (
              <Pressable
                key={a.$id}
                onPress={() => {
                  setToAccountId(a.$id);
                  setShowToAccountPicker(false);
                }}
                className={cn(
                  "mb-2 rounded-2xl border px-4 py-3",
                  toAccountId === a.$id ? "border-[#6C5CE7] bg-[#6C5CE7]/10" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                )}
              >
                <Text className={cn("font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Category picker modal */}
      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className={cn("max-h-[60%] rounded-t-3xl p-6", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <Text className={cn("mb-4 text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.category")}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2">
                {(type === "income" ? incomeCategories : expenseCategories).map((c) => (
                  <Pressable
                    key={c.$id}
                    onPress={() => {
                      if (isSplit && type === "expense") {
                        setSplitCategoryId(c.$id);
                      } else {
                        setCategoryId(c.$id);
                      }
                      setShowCategoryPicker(false);
                    }}
                    className={cn(
                      "mb-2 flex-row items-center rounded-2xl border px-3 py-2",
                      categoryId === c.$id || splitCategoryId === c.$id
                        ? "border-[#6C5CE7] bg-[#6C5CE7]/10"
                        : isDark
                        ? "border-[#2A2A3C]"
                        : "border-[#E5E7EB]"
                    )}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size={32} />
                    <Text className={cn("ml-2 text-sm", isDark ? "text-gray-200" : "text-[#1E1E2D]")}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
