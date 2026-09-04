import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  className,
  textClassName,
}: ButtonProps) {
  const isDark = useThemeStore((s) => s.isDark);

  const variantClasses: Record<string, string> = {
    primary: "bg-[#6C5CE7] text-white",
    secondary: isDark ? "bg-[#2A2A3C] text-white" : "bg-[#F0EEFE] text-[#6C5CE7]",
    outline: isDark
      ? "border border-[#3A3A50] text-white"
      : "border border-[#E5E7EB] text-[#1E1E2D]",
    ghost: isDark ? "text-white" : "text-[#1E1E2D]",
    danger: "bg-[#EF4444] text-white",
    accent: "bg-[#FF6B4A] text-white",
  };

  const sizeClasses: Record<string, string> = {
    sm: "px-4 py-2 rounded-xl",
    md: "px-5 py-3 rounded-2xl",
    lg: "px-6 py-4 rounded-2xl",
  };

  const textSize: Record<string, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center",
        sizeClasses[size],
        variantClasses[variant],
        (disabled || loading) && "opacity-50",
        className
      )}
    >
      {loading && <ActivityIndicator color="white" className="mr-2" />}
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className={cn(
          "font-bold",
          textSize[size],
          variantClasses[variant].split(" ")[1],
          textClassName
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
