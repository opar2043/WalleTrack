import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Wallet } from "lucide-react-native";
import { useThemeStore } from "@stores/themeStore";
import { formatCurrency } from "@utils/format";
import { maskCardNumber } from "@utils/helpers";
import i18n from "@i18n/index";

interface BalanceCardProps {
  balance: number;
  currency: string;
  cardLast4?: string;
  cardBrand?: string;
  showCardStyle?: boolean;
  accountName?: string;
  showBalanceMask?: boolean;
}

export function BalanceCard({
  balance,
  currency,
  cardLast4,
  cardBrand = "VISA",
  showCardStyle = false,
  accountName,
  showBalanceMask = false,
}: BalanceCardProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <LinearGradient
      colors={isDark ? ["#2A2A3C", "#1A1A26"] : ["#2A2A3C", "#1E2436"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="overflow-hidden rounded-[28px] p-6 shadow-lg"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      {/* Decorative shapes */}
      <View pointerEvents="none" className="absolute inset-0">
        <View className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/[0.07]" />
        <View className="absolute -bottom-20 right-4 h-48 w-48 rounded-full bg-[#6C5CE7]/30" />
        <View className="absolute -right-6 top-8 h-20 w-20 rounded-full bg-white/[0.05]" />
      </View>

      {/* Top row: label + currency */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <Wallet size={18} color="#FFFFFF" />
          </View>
          <Text className="ml-3 text-sm font-medium text-gray-300">
            {accountName || i18n.t("home.totalBalance")}
          </Text>
        </View>
        <View className="rounded-full bg-white/10 px-3 py-1.5">
          <Text className="text-xs font-bold tracking-wide text-white">{currency}</Text>
        </View>
      </View>

      {/* Balance */}
      <View className="mt-6">
        <Text
          className="text-4xl font-extrabold text-white"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
        >
          {showBalanceMask ? "••••••" : formatCurrency(balance, currency)}
        </Text>
      </View>

      {/* Bottom row */}
      <View className="mt-6 flex-row items-center justify-between">
        {showCardStyle && cardLast4 ? (
          <Text className="text-xs tracking-[0.2em] text-gray-500">
            {maskCardNumber(cardLast4)}
          </Text>
        ) : (
          <Text className="text-xs tracking-[0.25em] text-gray-500">{cardBrand}</Text>
        )}
        <Text className="text-xs font-semibold tracking-wide text-gray-500">WalleTrack</Text>
      </View>
    </LinearGradient>
  );
}