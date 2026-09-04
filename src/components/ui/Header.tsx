import React from "react";
import { View, Text, Pressable } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  rightComponent,
  leftComponent,
  className,
}: HeaderProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <View className={cn("flex-row items-center justify-between px-5 py-4", className)}>
      <View className="flex-1">
        <View className="flex-row items-center">
          {leftComponent && <View className="mr-3">{leftComponent}</View>}
          <View className="flex-1">
            <Text
              className={cn(
                "text-xl font-bold",
                isDark ? "text-white" : "text-[#1E1E2D]"
              )}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                className={cn(
                  "mt-0.5 text-sm",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>
      {rightComponent && <View className="ml-3">{rightComponent}</View>}
    </View>
  );
}
