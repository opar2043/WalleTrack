import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightElement,
  className,
  inputClassName,
  ...props
}: InputProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <View className={cn("w-full", className)}>
      {label && (
        <TextInputLabel isDark={isDark} label={label} />
      )}
      <View
        className={cn(
          "flex-row items-center rounded-2xl border px-4",
          isDark
            ? "border-[#2A2A3C] bg-[#1E1E2D]"
            : "border-[#E5E7EB] bg-white",
          error && "border-[#EF4444]",
          inputClassName
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          className={cn(
            "flex-1 py-3 text-base",
            isDark ? "text-white" : "text-[#1E1E2D]"
          )}
          {...props}
        />
        {rightElement && <View className="ml-2">{rightElement}</View>}
      </View>
      {error && (
        <Text className="mt-1 text-xs text-[#EF4444]">{error}</Text>
      )}
    </View>
  );
}

function TextInputLabel({ isDark, label }: { isDark: boolean; label: string }) {
  return (
    <Text
      className={cn(
        "mb-1.5 text-sm font-semibold",
        isDark ? "text-gray-300" : "text-gray-700"
      )}
    >
      {label}
    </Text>
  );
}
