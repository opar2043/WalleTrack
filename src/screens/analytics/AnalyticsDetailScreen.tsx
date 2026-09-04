import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { CalendarStrip } from "@components/common/CalendarStrip";
import { CategoryListItem } from "@components/common/CategoryListItem";
import { useAuthStore } from "@stores/authStore";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { cn } from "@utils/cn";
import { formatCurrency, isSameDay, getRelativeTimeSpent } from "@utils/format";
import { getChartTheme } from "@utils/format";

interface AnalyticsDetailScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string) => void };
}

export default function AnalyticsDetailScreen({ navigation }: AnalyticsDetailScreenProps) {
  const { userId } = useAuthStore();
  const { transactions } = useTransactionsStore();
  const { categories, getCategoryById } = useCategoriesStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const baseCurrency = profile?.baseCurrency || "USD";
  const chartTheme = getChartTheme(isDark);

  useEffect(() => {
    if (userId) {
      useTransactionsStore.getState().loadTransactions(userId);
    }
  }, [userId]);

  const dayTransactions = useMemo(
    () => transactions.filter((t) => isSameDay(new Date(t.date), selectedDate)),
    [transactions, selectedDate]
  );

  const monthTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
      }),
    [transactions, selectedDate]
  );

  const totalMonthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.currency === baseCurrency ? t.amount : t.convertedAmount), 0);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
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
  }, [monthTransactions, getCategoryById, baseCurrency]);

  const pieData = useMemo(() => {
    const total = expenseByCategory.reduce((s, x) => s + x.amount, 0);
    const colors = chartTheme.pieColors;
    return expenseByCategory.slice(0, 4).map((item, idx) => {
      const pct = total > 0 ? (item.amount / total) * 100 : 0;
      return {
        value: item.amount,
        text: `${pct.toFixed(0)}%`,
        color: colors[idx % colors.length],
        category: item.category?.name ?? "",
      };
    });
  }, [expenseByCategory, chartTheme.pieColors]);

  const timeSpent = getRelativeTimeSpent(new Date(), new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("transactions.title")}
        </Text>
        <View className="w-10" />
      </View>

      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-32">
        {/* Spent this month progress */}
        <View className={cn("mb-4 rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
          <Text className={cn("text-base font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {i18n.t("transactions.spentThisMonth")}{" "}
            <Text className="font-bold text-[#FF6B4A]">
              {formatCurrency(totalMonthExpense, baseCurrency, false)}
            </Text>
          </Text>
          <View className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <View
              style={{ width: `${Math.min(timeSpent * 100, 100)}%` }}
              className="h-full rounded-full bg-[#6C5CE7]"
            />
          </View>
          <Text className={cn("mt-2 text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            {Math.round(timeSpent * 100)}% of the month elapsed
          </Text>
        </View>

        {/* Pie chart */}
        {pieData.length > 0 ? (
          <View className={cn("mb-4 items-center rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={55}
              innerCircleColor={isDark ? "#1E1E2D" : "#FFFFFF"}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                    {i18n.t("transactions.totalExpense")}
                  </Text>
                  <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                    {formatCurrency(totalMonthExpense, baseCurrency, false)}
                  </Text>
                </View>
              )}
              textColor={isDark ? "#FFFFFF" : "#FFFFFF"}
            />
            <View className="mt-4 w-full gap-2">
              {expenseByCategory.map(({ catId, amount, category }) => {
                if (!category) return null;
                const total = expenseByCategory.reduce((s, x) => s + x.amount, 0);
                const pct = total > 0 ? (amount / total) * 100 : 0;
                return (
                  <View key={catId} className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: category.color }} />
                      <Text className={cn("ml-2 text-sm", isDark ? "text-gray-300" : "text-gray-600")}>
                        {category.name}
                      </Text>
                    </View>
                    <Text className={cn("text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                      {formatCurrency(amount, baseCurrency, false)} ({pct.toFixed(0)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className={cn("mb-4 items-center rounded-3xl p-8", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <Text className={cn("text-base font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.noTransactions")}
            </Text>
          </View>
        )}

        {/* View all categories */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {i18n.t("transactions.category")}
          </Text>
          <Pressable className="flex-row items-center">
            <Text className="text-[13px] font-semibold text-gray-400">{i18n.t("common.viewAll")}</Text>
            <ChevronRight size={16} color="#9CA3AF" />
          </Pressable>
        </View>

        <View className="gap-3">
          {expenseByCategory.map(({ catId, amount, category }) => {
            if (!category) return null;
            return (
              <CategoryListItem
                key={catId}
                name={category.name}
                icon={category.icon}
                color={category.color}
                amount={amount}
                onPress={() => navigation.navigate("AnalyticsDetail")}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
