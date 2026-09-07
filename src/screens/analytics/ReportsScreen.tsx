import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpRight, ArrowDownRight, PieChart as PieIcon, SlidersHorizontal } from "lucide-react-native";
import { CalendarStrip } from "@components/common/CalendarStrip";
import { CategoryListItem } from "@components/common/CategoryListItem";
import { Header } from "@components/ui/Header";
import { EmptyState } from "@components/ui/EmptyState";
import { useAuthStore } from "@stores/authStore";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useBudgetsStore } from "@stores/budgetsStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { cn } from "@utils/cn";
import { formatCurrency, isSameDay } from "@utils/format";

interface ReportsScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
  const { userId } = useAuthStore();
  const { transactions } = useTransactionsStore();
  const { categories, getCategoryById } = useCategoriesStore();
  const { budgets } = useBudgetsStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const baseCurrency = profile?.baseCurrency || "USD";

  useEffect(() => {
    if (userId) {
      Promise.all([
        useTransactionsStore.getState().loadTransactions(userId),
        useBudgetsStore.getState().loadBudgets(userId),
      ]);
    }
  }, [userId]);

  const dayTransactions = useMemo(
    () => transactions.filter((t) => isSameDay(new Date(t.date), selectedDate)),
    [transactions, selectedDate]
  );

  const totalIncome = dayTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.currency === baseCurrency ? t.amount : t.convertedAmount), 0);

  const totalExpense = dayTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.currency === baseCurrency ? t.amount : t.convertedAmount), 0);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    dayTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (t.categoryId) {
          const current = map.get(t.categoryId) || 0;
          const amount = t.currency === baseCurrency ? t.amount : t.convertedAmount;
          map.set(t.categoryId, current + amount);
        }
      });
    return Array.from(map.entries())
      .map(([catId, amount]) => ({ catId, amount, category: getCategoryById(catId) }))
      .filter((x) => x.category)
      .sort((a, b) => b.amount - a.amount);
  }, [dayTransactions, getCategoryById, baseCurrency]);

  const hasData = dayTransactions.length > 0;

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <Header
        title={i18n.t("tabs.reports")}
        rightComponent={
          <Pressable
            onPress={() => navigation.navigate("Filters")}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10"
          >
            <SlidersHorizontal size={18} color="#6C5CE7" />
          </Pressable>
        }
      />

      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-32">
        {/* Income/Expense summary */}
        <View className="mb-4 flex-row gap-3">
          <View className={cn("flex-1 rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <View className="flex-row items-center justify-between">
              <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {i18n.t("transactions.totalSalary")}
              </Text>
              <View className="h-8 w-8 items-center justify-center rounded-full bg-[#10B981]/10">
                <ArrowUpRight size={16} color="#10B981" />
              </View>
            </View>
            <Text className="mt-2 text-2xl font-bold text-[#10B981]">
              {formatCurrency(totalIncome, baseCurrency, false)}
            </Text>
          </View>
          <View className={cn("flex-1 rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <View className="flex-row items-center justify-between">
              <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {i18n.t("transactions.totalExpense")}
              </Text>
              <View className="h-8 w-8 items-center justify-center rounded-full bg-[#FF6B4A]/10">
                <ArrowDownRight size={16} color="#FF6B4A" />
              </View>
            </View>
            <Text className="mt-2 text-2xl font-bold text-[#FF6B4A]">
              {formatCurrency(totalExpense, baseCurrency, false)}
            </Text>
          </View>
        </View>

        {/* Category breakdown */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {i18n.t("transactions.category")}
          </Text>
          <Pressable onPress={() => navigation.navigate("AnalyticsDetail")}>
            <Text className="text-[13px] font-semibold text-gray-400">
              {i18n.t("common.viewAll")}
            </Text>
          </Pressable>
        </View>

        {!hasData ? (
          <EmptyState
            title={i18n.t("transactions.noTransactions")}
            message={i18n.t("empty.transactions")}
            icon={<Text className="text-3xl">📊</Text>}
          />
        ) : expenseByCategory.length === 0 ? (
          <View className={cn("items-center rounded-3xl p-8", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <Text className={cn("text-base font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.totalExpense")}: {formatCurrency(totalExpense, baseCurrency, false)}
            </Text>
            <Text className={cn("mt-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              No expense categories for this day
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {expenseByCategory.map(({ catId, amount, category }) => {
              if (!category) return null;
              const budget = budgets.find((b) => b.categoryId === catId);
              const progress = budget
                ? useBudgetsStore.getState().getBudgetProgress(budget)
                : undefined;
              return (
                <CategoryListItem
                  key={catId}
                  name={category.name}
                  icon={category.icon}
                  color={category.color}
                  amount={amount}
                  budgetAmount={budget?.amount}
                  progress={progress}
                  onPress={() => navigation.navigate("AnalyticsDetail")}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
