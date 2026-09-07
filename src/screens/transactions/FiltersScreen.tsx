import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Filter as FilterIcon, RotateCcw } from "lucide-react-native";
import { Button } from "@components/ui/Button";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { cn } from "@utils/cn";
import type { TransactionType } from "@t/index";

interface FiltersScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route?: { params?: Record<string, unknown> };
}

export default function FiltersScreen({ navigation }: FiltersScreenProps) {
  const { categories } = useCategoriesStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);

  const [type, setType] = useState<TransactionType | "all">("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showSplits, setShowSplits] = useState(true);
  const [showRecurring, setShowRecurring] = useState(true);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const apply = () => {
    navigation.navigate("Home", {
      filters: {
        type,
        categories: selectedCategories,
        showSplits,
        showRecurring,
      },
    });
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("transactions.filters")}
        </Text>
        <Pressable
          onPress={() => {
            setType("all");
            setSelectedCategories([]);
            setShowSplits(true);
            setShowRecurring(true);
          }}
          className="flex-row items-center"
        >
          <RotateCcw size={14} color="#6C5CE7" />
          <Text className="ml-1 text-xs font-semibold text-[#6C5CE7]">{i18n.t("common.reset")}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        <Text className={cn("mb-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("transactions.type")}
        </Text>
        <View className="mb-6 flex-row gap-2">
          {(["all", "income", "expense", "transfer"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={cn(
                "flex-1 rounded-xl border py-2.5",
                type === t ? "border-[#6C5CE7] bg-[#6C5CE7]" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
              )}
            >
              <Text className={cn("text-center text-sm font-semibold capitalize", type === t ? "text-white" : isDark ? "text-gray-300" : "text-gray-600")}>
                {t === "all" ? i18n.t("common.all") : i18n.t(`transactions.${t}` as never)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className={cn("mb-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("transactions.category")}
        </Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {categories.map((c) => {
            const active = selectedCategories.includes(c.$id);
            return (
              <Pressable
                key={c.$id}
                onPress={() => toggleCategory(c.$id)}
                className={cn(
                  "flex-row items-center rounded-full border px-3 py-2",
                  active ? "border-[#6C5CE7] bg-[#6C5CE7]/10" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                )}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color }} className="mr-2" />
                <Text className={cn("text-sm", active ? "text-[#6C5CE7]" : isDark ? "text-gray-300" : "text-gray-600")}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className={cn("mb-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("transactions.options")}
        </Text>
        <View className={cn("mb-6 rounded-2xl px-4", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
          <View className="flex-row items-center justify-between py-4">
            <Text className={cn("text-base", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.showSplits")}
            </Text>
            <Switch value={showSplits} onValueChange={setShowSplits} trackColor={{ false: "#D1D5DB", true: "#6C5CE7" }} thumbColor="#FFFFFF" />
          </View>
          <View className="flex-row items-center justify-between border-t border-[#2A2A3C]/20 py-4">
            <Text className={cn("text-base", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("transactions.showRecurring")}
            </Text>
            <Switch value={showRecurring} onValueChange={setShowRecurring} trackColor={{ false: "#D1D5DB", true: "#6C5CE7" }} thumbColor="#FFFFFF" />
          </View>
        </View>

        <Button title={i18n.t("common.apply")} onPress={apply} size="lg" icon={<FilterIcon size={18} color="white" />} />
      </ScrollView>
    </SafeAreaView>
  );
}
