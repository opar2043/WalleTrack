import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { ArrowLeft, Plus, Trash2, TrendingDown } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button } from "@components/ui/Button";
import { CategoryListItem } from "@components/common/CategoryListItem";
import { EmptyState } from "@components/ui/EmptyState";
import { Header } from "@components/ui/Header";
import { useAuthStore } from "@stores/authStore";
import { useBudgetsStore } from "@stores/budgetsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";
import { formatCurrency } from "@utils/format";
import type { BudgetPeriod } from "@t/index";

interface BudgetsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string) => void };
}

export default function BudgetsScreen({ navigation }: BudgetsScreenProps) {
  const { userId } = useAuthStore();
  const { budgets, loadBudgets, addBudget, deleteBudget, getSpentForBudget, getBudgetProgress } = useBudgetsStore();
  const { categories, loadCategories } = useCategoriesStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);

  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");

  const baseCurrency = profile?.baseCurrency || "USD";
  const expenseCategories = useMemo(() => categories.filter((c) => c.type === "expense"), [categories]);

  useEffect(() => {
    if (userId) {
      loadBudgets(userId);
      loadCategories(userId);
    }
  }, [userId]);

  const handleAdd = async () => {
    if (!userId) return;
    if (!selectedCategory) {
      toast.error(i18n.t("transactions.category"));
      return;
    }
    if (!parseFloat(amount)) {
      toast.error(i18n.t("common.amount"));
      return;
    }
    await addBudget(userId, {
      categoryId: selectedCategory,
      amount: parseFloat(amount),
      period,
      startDate: new Date(),
      alertThresholdPercent: 80,
    });
    toast.success(i18n.t("budgets.budgetAdded"));
    setShowModal(false);
    setAmount("");
    setSelectedCategory("");
  };

  const handleDelete = async (id: string) => {
    await deleteBudget(id);
    toast.success(i18n.t("budgets.budgetDeleted"));
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("budgets.title")}
        </Text>
        <Pressable onPress={() => setShowModal(true)} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]">
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        {budgets.length === 0 ? (
          <EmptyState
            title={i18n.t("budgets.noBudgets")}
            message={i18n.t("empty.budgets")}
            icon={<TrendingDown size={40} color={isDark ? "#6B7280" : "#9CA3AF"} />}
          />
        ) : (
          budgets.map((budget, idx) => {
            const category = categories.find((c) => c.$id === budget.categoryId);
            if (!category) return null;
            const spent = getSpentForBudget(budget);
            const progress = getBudgetProgress(budget);
            const over = progress > 1;
            const remaining = budget.amount - spent;

            return (
              <Animated.View
                key={budget.$id}
                entering={FadeInDown.duration(350).delay(idx * 60)}
                className="mb-3"
              >
                <View className={cn("rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: category.color }} />
                      <Text className={cn("ml-2 text-base font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                        {category.name}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleDelete(budget.$id)} className="h-8 w-8 items-center justify-center rounded-full bg-[#EF4444]/10">
                      <Trash2 size={14} color="#EF4444" />
                    </Pressable>
                  </View>

                  <View className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                    <View
                      style={{ width: `${Math.min(progress * 100, 100)}%` }}
                      className={cn("h-full rounded-full", over ? "bg-[#EF4444]" : progress > 0.8 ? "bg-[#F59E0B]" : "bg-[#6C5CE7]")}
                    />
                  </View>

                  <View className="mt-2 flex-row justify-between">
                    <Text className={cn("text-sm font-semibold", over ? "text-[#EF4444]" : isDark ? "text-white" : "text-[#1E1E2D]")}>
                      {formatCurrency(spent, baseCurrency, false)}
                    </Text>
                    <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                      {i18n.t("budgets.of")} {formatCurrency(budget.amount, baseCurrency, false)}
                    </Text>
                  </View>

                  {over && (
                    <View className="mt-2 rounded-xl bg-[#EF4444]/10 px-3 py-2">
                      <Text className="text-xs font-semibold text-[#EF4444]">
                        🔔 {i18n.t("budgets.overBudget")} {formatCurrency(Math.abs(remaining), baseCurrency, false)}
                      </Text>
                    </View>
                  )}
                  {!over && remaining < budget.amount * 0.2 && (
                    <View className="mt-2 rounded-xl bg-[#F59E0B]/10 px-3 py-2">
                      <Text className="text-xs font-semibold text-[#F59E0B]">
                        {i18n.t("budgets.closeToLimit")}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className={cn("rounded-t-3xl p-6", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />
            <Text className={cn("mb-4 text-xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("budgets.addBudget")}
            </Text>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("transactions.category")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {expenseCategories.map((c) => (
                  <Pressable
                    key={c.$id}
                    onPress={() => setSelectedCategory(c.$id)}
                    className={cn(
                      "rounded-2xl border px-3 py-2",
                      selectedCategory === c.$id
                        ? "border-[#6C5CE7] bg-[#6C5CE7]/10"
                        : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                    )}
                  >
                    <Text className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-600")}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("common.amount")} ({baseCurrency})
            </Text>
            <View className={cn("mb-4 rounded-2xl border px-4", isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white")}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                className={cn("py-3 text-base", isDark ? "text-white" : "text-[#1E1E2D]")}
              />
            </View>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("budgets.budgetFor")}
            </Text>
            <View className="mb-6 flex-row gap-2">
              {(["weekly", "monthly", "yearly"] as BudgetPeriod[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5",
                    period === p ? "border-[#6C5CE7] bg-[#6C5CE7]" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                  )}
                >
                  <Text className={cn("text-center text-sm font-semibold capitalize", period === p ? "text-white" : isDark ? "text-gray-300" : "text-gray-600")}>
                    {i18n.t(`budgets.${p}` as never)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button title={i18n.t("common.save")} onPress={handleAdd} size="lg" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
