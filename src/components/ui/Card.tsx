import React from "react";
import { View, Text, Pressable } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

export function Card({ children, className, onPress }: CardProps) {
  const isDark = useThemeStore((s) => s.isDark);

  const content = (
    <View
      className={cn(
        "rounded-3xl p-5",
        isDark ? "bg-[#1E1E2D]" : "bg-white",
        className
      )}
    >
      {children}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
