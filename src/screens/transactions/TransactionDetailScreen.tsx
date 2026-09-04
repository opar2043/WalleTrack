import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { ArrowLeft, Trash2, Pencil, Repeat, Share2 } from "lucide-react-native";
import { CategoryIcon } from "@components/common/CategoryListItem";
import { Button } from "@components/ui/Button";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useAccountsStore } from "@stores/accountsStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";
import { formatCurrency, formatDate } from "@utils/format";
import type { Transaction } from "@t/index";

interface TransactionDetailScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  route: { params: { transactionId: string } };
}

export default function TransactionDetailScreen({ navigation, route }: TransactionDetailScreenProps) {
  const { transactionId } = route.params;
  const { transactions, deleteTransaction } = useTransactionsStore();
  const { getCategoryById } = useCategoriesStore();
  const { accounts } = useAccountsStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const transaction = useMemo(
    () => transactions.find((t) => t.$id === transactionId),
    [transactions, transactionId]
  );

  if (!transaction) {
    return (
      <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className={cn("text-lg font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {i18n.t("errors.notFound")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const baseCurrency = profile?.baseCurrency || "USD";
  const category = transaction.categoryId ? getCategoryById(transaction.categoryId) : undefined;
  const account = accounts.find((a) => a.$id === transaction.accountId);
  const amount = transaction.currency === baseCurrency ? transaction.amount : transaction.convertedAmount;

  const typeColor =
    transaction.type === "income" ? "#10B981" : transaction.type === "expense" ? "#FF6B4A" : "#6C5CE7";

  const rows: { label: string; value: string }[] = [
    { label: i18n.t("transactions.category"), value: category?.name || i18n.t("transactions.uncategorized") },
    { label: i18n.t("transactions.date"), value: formatDate(new Date(transaction.date)) },
    { label: i18n.t("transactions.account"), value: account?.name || "-" },
    { label: i18n.t("common.note"), value: transaction.note || "-" },
    { label: i18n.t("transactions.paymentMethod"), value: transaction.paymentMethod || "-" },
  ];

  const handleDelete = async () => {
    await deleteTransaction(transaction.$id);
    toast.success(i18n.t("transactions.deleted"));
    setShowDeleteConfirm(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("transactions.details")}
        </Text>
        <View className="flex-row">
          <Pressable
            onPress={() => navigation.navigate("AddTransaction", { transactionId: transaction.$id })}
            className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10"
          >
            <Pencil size={18} color="#6C5CE7" />
          </Pressable>
          <Pressable onPress={() => setShowDeleteConfirm(true)} className="h-10 w-10 items-center justify-center rounded-full bg-[#EF4444]/10">
            <Trash2 size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        <View className="mb-5 items-center">
          <CategoryIcon icon={category?.icon || "more-horizontal"} color={category?.color || "#9CA3AF"} size={72} />
          <Text className={cn("mt-4 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {category?.name || i18n.t("transactions.uncategorized")}
          </Text>
          <Text style={{ color: typeColor }} className="text-4xl font-bold">
            {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
            {formatCurrency(amount, baseCurrency, false)}
          </Text>
          {transaction.currency !== baseCurrency && (
            <Text className={cn("mt-1 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              {formatCurrency(transaction.amount, transaction.currency, false)} {transaction.currency}
            </Text>
          )}
        </View>

        {transaction.recurringRuleId && (
          <View className="mb-3 flex-row items-center justify-center rounded-2xl bg-[#6C5CE7]/10 px-4 py-3">
            <Repeat size={16} color="#6C5CE7" />
            <Text className="ml-2 text-sm font-semibold text-[#6C5CE7]">
              {i18n.t("transactions.recurring")}
            </Text>
          </View>
        )}

        <View className={cn("rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
          {rows.map((row, idx) => (
            <View
              key={row.label}
              className={cn("flex-row items-center justify-between py-3", idx < rows.length - 1 && "border-b border-[#2A2A3C]/20")}
            >
              <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{row.label}</Text>
              <Text className={cn("text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className={cn("w-full rounded-3xl bg-[#1E1E2D] p-6")}>
            <View className="mx-auto mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10">
              <Trash2 size={24} color="#EF4444" />
            </View>
            <Text className="mb-2 text-center text-lg font-bold text-white">
              {i18n.t("transactions.deleteTitle")}
            </Text>
            <Text className="mb-6 text-center text-sm text-gray-400">
              {i18n.t("transactions.deleteConfirm")}
            </Text>
            <Button title={i18n.t("transactions.deleteYes")} onPress={handleDelete} variant="danger" className="mb-2" />
            <Button title={i18n.t("common.cancel")} onPress={() => setShowDeleteConfirm(false)} variant="outline" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
