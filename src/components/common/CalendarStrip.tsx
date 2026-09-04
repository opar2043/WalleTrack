import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";
import { isSameDay, getDayName, getStartOfWeek } from "@utils/format";

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function CalendarStrip({ selectedDate, onSelectDate }: CalendarStripProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const days = useMemo(() => {
    const startOfWeek = getStartOfWeek(selectedDate);
    return Array.from({ length: 21 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    }).filter((d) => d.getMonth() === currentMonth && d.getFullYear() === currentYear);
  }, [currentMonth, currentYear, selectedDate]);

  return (
    <View className="py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-2"
      >
        <View className="flex-row gap-3">
          {days.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            return (
              <Pressable
                key={date.toISOString()}
                onPress={() => onSelectDate(date)}
                className="items-center"
              >
                <Text
                  className={cn(
                    "mb-1 text-xs font-semibold",
                    isSelected
                      ? "text-white"
                      : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                  )}
                >
                  {getDayName(date.getDay())}
                </Text>
                <View
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-full",
                    isSelected
                      ? "bg-[#FF6B4A]"
                      : isToday && !isSelected
                      ? isDark
                        ? "bg-[#2A2A3C]"
                        : "bg-[#F0EEFE]"
                      : "bg-transparent"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      isSelected
                        ? "text-white"
                        : isDark
                        ? "text-gray-200"
                        : "text-[#1E1E2D]"
                    )}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
