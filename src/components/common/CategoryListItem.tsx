import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  Utensils, Car, ShoppingBag, Home, Zap, Film, HeartPulse, BookOpen,
  Plane, RefreshCw, Sparkles, MoreHorizontal, Briefcase, Laptop, Store,
  TrendingUp, Gift, PlusCircle, LucideIcon,
} from "lucide-react-native";
import { cn } from "@utils/cn";
import { useThemeStore } from "@stores/themeStore";

const iconMap: Record<string, LucideIcon> = {
  "utensils": Utensils,
  "car": Car,
  "shopping-bag": ShoppingBag,
  "home": Home,
  "zap": Zap,
  "film": Film,
  "heart-pulse": HeartPulse,
  "book-open": BookOpen,
  "plane": Plane,
  "refresh-cw": RefreshCw,
  "sparkles": Sparkles,
  "more-horizontal": MoreHorizontal,
  "briefcase": Briefcase,
  "laptop": Laptop,
  "store": Store,
  "trending-up": TrendingUp,
  "gift": Gift,
  "plus-circle": PlusCircle,
};

export function CategoryIcon({
  icon,
  color,
  size = 40,
  outline = true,
}: {
  icon: string;
  color: string;
  size?: number;
  outline?: boolean;
}) {
  const IconComponent = iconMap[icon] || MoreHorizontal;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: outline ? size / 2 : 12,
        backgroundColor: `${color}20`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconComponent size={size * 0.45} color={color} />
    </View>
  );
}

export function CategoryListItem({
  name,
  icon,
  color,
  amount,
  progress,
  budgetAmount,
  onPress,
}: {
  name: string;
  icon: string;
  color: string;
  amount?: number;
  progress?: number;
  budgetAmount?: number;
  onPress?: () => void;
}) {
  const isDark = useThemeStore((s) => s.isDark);

  const pct = progress ?? 0;
  const overBudget = pct > 1;

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center rounded-2xl border px-4 py-3",
        isDark ? "border-[#2A2A3C] bg-[#1E1E2D]" : "border-[#E5E7EB] bg-white"
      )}
    >
      <View className="mr-3">
        <CategoryIcon icon={icon} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className={cn("text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {name}
          </Text>
          {amount !== undefined && (
            <Text className={cn("text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {amount.toFixed(2)}
            </Text>
          )}
        </View>
        {budgetAmount !== undefined && (
          <View className="mt-2">
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <View
                style={{ width: `${Math.min(pct * 100, 100)}%` }}
                className={cn("h-full rounded-full", overBudget ? "bg-[#EF4444]" : "bg-[#6C5CE7]")}
              />
            </View>
            <View className="mt-1 flex-row justify-between">
              <Text className="text-[10px] text-gray-400">
                {overBudget ? "Over" : "Used"} {Math.round(pct * 100)}%
              </Text>
              <Text className="text-[10px] text-gray-400">of {budgetAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
