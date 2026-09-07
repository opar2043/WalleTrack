import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Crown, Check, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@components/ui/Button";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";

interface PremiumScreenProps {
  navigation: { goBack: () => void };
}

const FEATURES = [
  { key: "unlimitedAccounts", icon: "💰" },
  { key: "prioritySupport", icon: "🎧" },
  { key: "customCategories", icon: "🎨" },
  { key: "familySharing", icon: "👨‍👩‍👧" },
  { key: "offlineSync", icon: "📡" },
  { key: "advancedAnalytics", icon: "📊" },
  { key: "noAds", icon: "🚫" },
  { key: "dataExport", icon: "📤" },
];

export default function PremiumScreen({ navigation }: PremiumScreenProps) {
  const isDark = useThemeStore((s) => s.isDark);

  const handleUpgrade = () => {
    toast.success(i18n.t("premium.toast"));
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("premium.title")}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        <LinearGradient
          colors={["#6C5CE7", "#8B5CF6", "#FF6B4A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mb-6 rounded-3xl p-6"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-4xl font-bold">WalleTrack</Text>
            <Crown size={28} color="#FFD700" />
          </View>
          <Text className="mt-1 text-base text-white/80">
            {i18n.t("premium.subtitle")}
          </Text>
          <View className="mt-4 flex-row items-end">
            <Text className="text-5xl font-bold text-white">$4.99</Text>
            <Text className="mb-1 ml-2 text-base text-white/70">/ {i18n.t("premium.month")}</Text>
          </View>
          <Pressable className="mt-4 flex-row items-center justify-center rounded-2xl bg-white py-3" onPress={handleUpgrade}>
            <Sparkles size={18} color="#6C5CE7" className="mr-2" />
            <Text className="font-bold text-[#6C5CE7]">{i18n.t("premium.upgradeNow")}</Text>
          </Pressable>
        </LinearGradient>

        <Text className={cn("mb-3 text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("premium.features")}
        </Text>

        <View className="flex-row flex-wrap justify-between gap-3">
          {FEATURES.map((f) => (
            <View key={f.key} className={cn("w-[48%] rounded-2xl p-4", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
              <Text className="text-2xl">{f.icon}</Text>
              <Text className={cn("mt-2 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                {i18n.t(`premium.feature.${f.key}` as never)}
              </Text>
            </View>
          ))}
        </View>

        <View className={cn("mt-6 rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
          <View className="flex-row items-center">
            <Check size={18} color="#10B981" />
            <Text className={cn("ml-2 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("premium.oneTimePurchase")}
            </Text>
          </View>
          <View className="mt-3 flex-row items-center">
            <Check size={18} color="#10B981" />
            <Text className={cn("ml-2 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("premium.lifetimeUpdates")}
            </Text>
          </View>
        </View>

        <Button title={i18n.t("premium.upgradeNow")} onPress={handleUpgrade} size="lg" className="mt-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
