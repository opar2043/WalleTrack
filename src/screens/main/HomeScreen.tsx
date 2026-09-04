import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, ChevronRight } from "lucide-react-native";
import { BarChart } from "react-native-gifted-charts";
import { BalanceCard } from "@components/common/BalanceCard";
import { TransactionListItem } from "@components/common/TransactionListItem";
import { EmptyState } from "@components/ui/EmptyState";
import { Button } from "@components/ui/Button";
import { LoadingState } from "@components/ui/LoadingState";
import { useAuthStore } from "@stores/authStore";
import { useAccountsStore } from "@stores/accountsStore";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { cn } from "@utils/cn";
import { formatCurrency, formatMonthYear, getStartOfMonth } from "@utils/format";
import { CUSTOM_CURRENCY_SYMBOLS } from "@constants/index";

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { userId } = useAuthStore();
  const { accounts, loadAccounts } = useAccountsStore();
  const { transactions, loadTransactions, isLoading } = useTransactionsStore();
  const { categories, getCategoryById, loadCategories } = useCategoriesStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const baseCurrency = profile?.baseCurrency || "USD";
  const currencySymbol = CUSTOM_CURRENCY_SYMBOLS[baseCurrency] || "$";

  useEffect(() => {
    if (!userId) return;
    loadAccounts(userId);
    loadCategories(userId);
    loadTransactions(userId, { limit: 50 });
  }, [userId]);

  const totalBalance = useMemo(
    () =>
      accounts.reduce((sum, acc) => {
        const factor = acc.currency === baseCurrency ? 1 : 1;
        return sum + acc.balance * factor;
      }, 0),
    [accounts, baseCurrency]
  );

  const monthTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = getStartOfMonth(now);
    return transactions.filter((t) => new Date(t.date) >= startOfMonth);
  }, [transactions]);

  const totalMonthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.currency === baseCurrency ? t.amount : t.convertedAmount), 0);

  const totalMonthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.currency === baseCurrency ? t.amount : t.convertedAmount), 0);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await Promise.all([
        loadAccounts(userId),
        loadTransactions(userId, { limit: 50 }),
      ]);
    }
    setRefreshing(false);
  };

  const maskedBalance = "••••••";

  // Monthly bar chart data
  const barData = useMemo(() => {
    const now = new Date();
    const monthStart = getStartOfMonth(now);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeks: { label: string; income: number; expense: number }[] = [];

    for (let w = 0; w < 4; w++) {
      weeks.push({
        label: `W${w + 1}`,
        income: 0,
        expense: 0,
      });
    }

    monthTransactions.forEach((t) => {
      const day = new Date(t.date).getDate();
      const weekIdx = Math.min(Math.floor(((day - 1) / 7)), 3);
      if (t.type === "income") {
        weeks[weekIdx].income += t.currency === baseCurrency ? t.amount : t.convertedAmount;
      } else if (t.type === "expense") {
        weeks[weekIdx].expense += t.currency === baseCurrency ? t.amount : t.convertedAmount;
      }
    });

    return weeks;
  }, [monthTransactions, baseCurrency]);

  const chartData = useMemo(() => {
    const items: { value: number; frontColor: string; label?: string }[] = [];
    barData.forEach((week) => {
      items.push({ value: week.income, frontColor: "#10B981" });
      items.push({ value: week.expense, frontColor: "#FF6B4A", label: week.label });
    });
    return items;
  }, [barData]);

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      {/* Header */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {formatMonthYear(new Date())}
            </Text>
            <Text className={cn("text-2xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("tabs.home")}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowBalances(!showBalances)}
            className={cn(
              "h-10 w-10 items-center justify-center rounded-full",
              isDark ? "bg-[#2A2A3C]" : "bg-white"
            )}
          >
            {showBalances ? (
              <EyeOff size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
            ) : (
              <Eye size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View className="px-5 pt-4">
          <BalanceCard
            balance={showBalances ? totalBalance : 0}
            currency={baseCurrency}
            showBalanceMask={!showBalances}
          />
        </View>

        {/* Income/Expense summary */}
        <View className="mt-4 flex-row gap-3 px-5">
          <View
            className={cn(
              "flex-1 flex-row items-center rounded-2xl p-4",
              isDark ? "bg-[#1E1E2D]" : "bg-white"
            )}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#10B981]/10">
              <ArrowUpRight size={20} color="#10B981" />
            </View>
            <View>
              <Text className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {i18n.t("home.income")}
              </Text>
              <Text className={cn("text-base font-bold text-[#10B981]", isDark ? "text-[#34D399]" : "")}>
                {showBalances
                  ? formatCurrency(totalMonthIncome, baseCurrency, false)
                  : maskedBalance}
              </Text>
            </View>
          </View>
          <View
            className={cn(
              "flex-1 flex-row items-center rounded-2xl p-4",
              isDark ? "bg-[#1E1E2D]" : "bg-white"
            )}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#FF6B4A]/10">
              <ArrowDownRight size={20} color="#FF6B4A" />
            </View>
            <View>
              <Text className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {i18n.t("home.expense")}
              </Text>
              <Text className="text-base font-bold text-[#FF6B4A]">
                {showBalances
                  ? formatCurrency(totalMonthExpense, baseCurrency, false)
                  : maskedBalance}
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics section */}
        <View className="px-5 pt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("home.analytics")}
            </Text>
            <Pressable onPress={() => navigation.navigate("AnalyticsDetail")}>
              <Text className="text-[13px] font-semibold text-gray-400">
                {i18n.t("common.viewAll")}
              </Text>
            </Pressable>
          </View>

          <View
            className={cn(
              "rounded-3xl p-5",
              isDark ? "bg-[#1E1E2D]" : "bg-white"
            )}
          >
            <BarChart
              data={chartData}
              width={300}
              height={150}
              barWidth={12}
              spacing={18}
              frontColor="#10B981"
              isAnimated
              roundedTop
              noOfSections={4}
              maxValue={Math.max(...barData.map((w) => Math.max(w.income, w.expense)), 1) * 1.2}
              yAxisThickness={0}
              xAxisThickness={0}
              rulesColor={isDark ? "#2A2A3C" : "#F0F0F5"}
              xAxisLabelTextStyle={{ color: isDark ? "#6B7280" : "#9CA3AF", fontSize: 11 }}
              yAxisTextStyle={{ color: isDark ? "#6B7280" : "#9CA3AF", fontSize: 10 }}
              hideRules={false}
              disableScroll
            />
            <View className="mt-3 flex-row items-center justify-center gap-5">
              <View className="flex-row items-center">
                <View className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                <Text className={cn("ml-1.5 text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  {i18n.t("home.income")}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="h-2.5 w-2.5 rounded-full bg-[#FF6B4A]" />
                <Text className={cn("ml-1.5 text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  {i18n.t("home.expense")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="px-5 pt-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("home.recentTransactions")}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("MainTabs", { screen: "ReportsTab" })}
              className="flex-row items-center"
            >
              <Text className="text-[13px] font-semibold text-gray-400">
                {i18n.t("common.viewAll")}
              </Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {isLoading && recentTransactions.length === 0 ? (
          <LoadingState message={i18n.t("common.loading")} />
        ) : recentTransactions.length === 0 ? (
          <EmptyState
            title={i18n.t("common.noTransactions")}
            message={i18n.t("empty.transactions")}
          />
        ) : (
          <View className="overflow-hidden rounded-3xl mx-5">
            {recentTransactions.map((tx, idx) => {
              const cat = getCategoryById(tx.categoryId);
              return (
                <View key={tx.$id} className={cn(idx > 0 && "mt-1")}>
                  <TransactionListItem
                    transaction={tx}
                    categoryName={cat?.name}
                    categoryColor={cat?.color}
                    categoryIcon={cat?.icon}
                    onPress={() => navigation.navigate("TransactionDetail", { transactionId: tx.$id })}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
