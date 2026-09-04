import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Film,
  HeartPulse,
  BookOpen,
  Plane,
  RefreshCw,
  Sparkles,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Gift,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  LucideIcon,
} from "lucide-react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";
import { formatCurrency, formatTime, formatDateShort } from "@utils/format";
import type { Transaction } from "@t/index";

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
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  const IconComponent = iconMap[icon] || MoreHorizontal;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}20`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconComponent size={size * 0.45} color={color} />
    </View>
  );
}

interface TransactionListItemProps {
  transaction: Transaction;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  currencySymbol?: string;
  onPress?: () => void;
}

export function TransactionListItem({
  transaction,
  categoryName,
  categoryColor = "#6C5CE7",
  categoryIcon = "more-horizontal",
  currencySymbol = "$",
  onPress,
}: TransactionListItemProps) {
  const isDark = useThemeStore((s) => s.isDark);

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.type === "transfer";

  const TypeIcon = isTransfer
    ? ArrowLeftRight
    : isIncome
    ? ArrowUpRight
    : ArrowDownRight;

  const displayName =
    categoryName || (isTransfer ? "Transfer" : isIncome ? "Income" : "Expense");

  const amountColor = isTransfer
    ? isDark
      ? "text-gray-300"
      : "text-gray-600"
    : isIncome
    ? "text-[#10B981]"
    : isDark
    ? "text-white"
    : "text-[#1E1E2D]";

  const amountPrefix = isIncome ? "+" : isExpense ? "-" : "";

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center px-5 py-3",
        isDark ? "bg-[#1E1E2D]" : "bg-white"
      )}
    >
      <View className="mr-3">
        <CategoryIcon
          icon={categoryIcon}
          color={isTransfer ? "#6B7280" : categoryColor}
        />
      </View>
      <View className="flex-1">
        <Text
          className={cn("text-base font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text
          className={cn("mt-0.5 text-xs", isDark ? "text-gray-400" : "text-gray-500")}
        >
          {formatDateShort(transaction.date)} • {formatTime(transaction.date)}
        </Text>
      </View>
      <View className="items-end">
        <Text className={cn("text-base font-bold", amountColor)}>
          {amountPrefix}
          {formatCurrency(transaction.amount, transaction.currency, false)}
        </Text>
        {transaction.note ? (
          <Text
            className={cn("mt-0.5 text-xs", isDark ? "text-gray-500" : "text-gray-400")}
            numberOfLines={1}
          >
            {transaction.note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
