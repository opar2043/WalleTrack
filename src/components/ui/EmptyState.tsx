import React from "react";
import { View, Text, Image } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  message,
  className,
}: EmptyStateProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <View className={cn("flex-1 items-center justify-center px-8 py-12", className)}>
      <View
        className={cn(
          "mb-4 h-20 w-20 items-center justify-center rounded-3xl",
          isDark ? "bg-[#2A2A3C]" : "bg-[#F0EEFE]"
        )}
      >
        {icon || (
          <View className="h-10 w-10 items-center justify-center">
            <Text className={cn("text-3xl", isDark ? "text-gray-500" : "text-gray-400")}>
              📭
            </Text>
          </View>
        )}
      </View>
      {title && (
        <Text
          className={cn(
            "mb-2 text-center text-lg font-bold",
            isDark ? "text-white" : "text-[#1E1E2D]"
          )}
        >
          {title}
        </Text>
      )}
      {message && (
        <Text
          className={cn(
            "text-center text-sm leading-6",
            isDark ? "text-gray-400" : "text-gray-500"
          )}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
