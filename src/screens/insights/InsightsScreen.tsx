import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  Target,
  Zap,
} from "lucide-react-native";
import { Header } from "@components/ui/Header";
import { EmptyState } from "@components/ui/EmptyState";
import { useAuthStore } from "@stores/authStore";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useBudgetsStore } from "@stores/budgetsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { cn } from "@utils/cn";
import { formatCurrency } from "@utils/format";
import type { Category } from "@t/index";

interface InsightsScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const { userId } = useAuthStore();
  const { transactions } = useTransactionsStore();
  const { budgets } = useBudgetsStore();
  const { categories, getCategoryById } = useCategoriesStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);

  const baseCurrency = profile?.baseCurrency || "USD";

  useEffect(() => {
    if (userId) {
      useTransactionsStore.getState().loadTransactions(userId);
      useBudgetsStore.getState().loadBudgets(userId);
    }
  }, [userId]);

  const { totalIncome, totalExpense, thisMonthIncome, thisMonthExpense, avgDaily } = useMemo(() => {
    const now = new Date();
    let totalIncome = 0;
    let totalExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    transactions.forEach((t) => {
      const amount = t.currency === baseCurrency ? t.amount : t.convertedAmount;
      if (t.type === "income") {
        totalIncome += amount;
        if (new Date(t.date).getMonth() === now.getMonth()) thisMonthIncome += amount;
      } else if (t.type === "expense") {
        totalExpense += amount;
        if (new Date(t.date).getMonth() === now.getMonth()) thisMonthExpense += amount;
      }
    });

    const avgDaily = thisMonthExpense / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return { totalIncome, totalExpense, thisMonthIncome, thisMonthExpense, avgDaily };
  }, [transactions, baseCurrency]);

  const mostSpentCategory = useMemo<{ category: Category | null; amount: number } | null>(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (t.categoryId) {
          const amount = t.currency === baseCurrency ? t.amount : t.convertedAmount;
          map.set(t.categoryId, (map.get(t.categoryId) || 0) + amount);
        }
      });
    let topId: string | null = null;
    let topAmount = 0;
    map.forEach((amount, catId) => {
      if (topId === null || amount > topAmount) {
        topId = catId;
        topAmount = amount;
      }
    });
    if (topId === null) return null;
    const category = getCategoryById(topId);
    return category ? { category, amount: topAmount } : null;
  }, [transactions, getCategoryById, baseCurrency]);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const cards = [
    {
      icon: <TrendingUp size={20} color="#10B981" />,
      title: i18n.t("insights.savingsRate"),
      value: `${savingsRate.toFixed(0)}%`,
      sub: i18n.t("insights.savingsRateDesc"),
      color: "#10B981",
    },
    {
      icon: <PiggyBank size={20} color="#6C5CE7" />,
      title: i18n.t("insights.avgDailySpend"),
      value: formatCurrency(avgDaily, baseCurrency, true),
      sub: i18n.t("insights.avgDailySpendDesc"),
      color: "#6C5CE7",
    },
    {
      icon: <Zap size={20} color="#FF6B4A" />,
      title: i18n.t("insights.topSpend"),
      value: mostSpentCategory ? formatCurrency(mostSpentCategory.amount, baseCurrency, true) : "-",
      sub: mostSpentCategory?.category?.name || "-",
      color: "#FF6B4A",
    },
  ];

  const overBudgets = budgets.filter((b) => useBudgetsStore.getState().getBudgetProgress(b) > 1);

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <Header title={i18n.t("insights.title")} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-32">
        {transactions.length === 0 ? (
          <EmptyState
            title={i18n.t("insights.noData")}
            message={i18n.t("empty.insights")}
            icon={<Target size={40} color={isDark ? "#6B7280" : "#9CA3AF"} />}
          />
        ) : (
          <View className="gap-3">
            {cards.map((card, idx) => (
              <View key={idx} className={cn("flex-row items-center rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${card.color}18` }}>
                  {card.icon}
                </View>
                <View className="flex-1">
                  <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{card.title}</Text>
                  <Text className={cn("text-2xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                    {card.value}
                  </Text>
                  <Text className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{card.sub}</Text>
                </View>
              </View>
            ))}

            {/* Budget alerts */}
            {overBudgets.length > 0 && (
              <View className="mt-2">
                <View className="mb-2 flex-row items-center">
                  <AlertTriangle size={18} color="#F59E0B" />
                  <Text className={cn("ml-2 text-base font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                    {i18n.t("insights.budgetAlerts")}
                  </Text>
                </View>
                {overBudgets.map((b) => {
                  const cat = categories.find((c) => c.$id === b.categoryId);
                  return (
                    <View key={b.$id} className="mb-2 rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4">
                      <Text className="font-semibold text-[#EF4444]">
                        {cat?.name}: {formatCurrency(b.amount, baseCurrency, true)}
                      </Text>
                      <Text className="mt-1 text-xs text-[#EF4444]/80">
                        {i18n.t("budgets.overBudget")}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Goal suggestion */}
            <View className={cn("mt-2 rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
              <View className="mb-3 flex-row items-center">
                <Target size={18} color="#6C5CE7" />
                <Text className={cn("ml-2 text-base font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                  {i18n.t("insights.goals")}
                </Text>
              </View>
              <Text className={cn("text-sm leading-relaxed", isDark ? "text-gray-300" : "text-gray-600")}>
                {savingsRate > 20
                  ? i18n.t("insights.goalGood")
                  : savingsRate > 0
                  ? i18n.t("insights.goalAverage")
                  : i18n.t("insights.goalLow")}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
