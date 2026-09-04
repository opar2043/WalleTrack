import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <View className={cn("flex-1 items-center justify-center py-16", className)}>
      <ActivityIndicator size="large" color="#6C5CE7" />
      <Text
        className={cn(
          "mt-4 text-sm",
          isDark ? "text-gray-400" : "text-gray-500"
        )}
      >
        {message}
      </Text>
    </View>
  );
}
