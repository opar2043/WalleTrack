import React from "react";
import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@stores/themeStore";
import { formatCurrency } from "@utils/format";
import { maskCardNumber } from "@utils/helpers";

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
      colors={["#2A2A3C", "#1E1E2D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="overflow-hidden rounded-3xl p-5 shadow-lg"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      {/* Subtle wave pattern overlay using decorative elements */}
      <View className="absolute inset-0 opacity-10">
        <View className="absolute -right-8 -top-6 h-32 w-32 rounded-full bg-white" />
        <View className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-white" />
        <View className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white" />
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          {accountName ? (
            <Text className="text-sm text-gray-400">{accountName}</Text>
          ) : (
            <Text className="text-sm text-gray-400">Total Balance</Text>
          )}
          <Text className="mt-1 text-3xl font-bold text-white">
            {showBalanceMask ? "••••••" : formatCurrency(balance, currency)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs tracking-widest text-gray-500">{cardBrand}</Text>
          {cardLast4 && (
            <Text className="mt-1 text-sm tracking-widest text-gray-300">
              {maskCardNumber(cardLast4)}
            </Text>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}
