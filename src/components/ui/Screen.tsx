import React from "react";
import { View, Text, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
}

export function Screen({ children, className }: ScreenProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <SafeAreaView
      className={cn(
        "flex-1",
        isDark ? "bg-bg-dark" : "bg-bg-light",
        className
      )}
    >
      {children}
    </SafeAreaView>
  );
}
