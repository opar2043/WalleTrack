import React from "react";
import { View, Text, Pressable } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Wallet, Plus, BarChart3, Settings } from "lucide-react-native";
import { useThemeStore } from "@stores/themeStore";
import { cn } from "@utils/cn";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  HomeTab: Home,
  AccountsTab: Wallet,
  AddTab: Plus,
  ReportsTab: BarChart3,
  SettingsTab: Settings,
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const insets = useSafeAreaInsets();

  const tabs = state.routes.slice(0);

  const onPress = (routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0"
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View
        className={cn(
          "w-full flex-row items-center justify-between",
          "rounded-3xl px-2 py-3",
          "shadow-lg",
          isDark
            ? "bg-[#1E1E2D] shadow-black/40"
            : "bg-white shadow-black/10"
        )}
        style={{
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {tabs.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = iconMap[route.name];

          // Center item is the FAB
          if (route.name === "AddTab") {
            return (
              <Pressable
                key={route.key}
                onPress={() => onPress(route.name, isFocused)}
                className="-mt-12"
              >
                <View
                  className="h-14 w-14 items-center justify-center rounded-full shadow-lg"
                  style={{
                    backgroundColor: "#FF6B4A",
                    shadowColor: "#FF6B4A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Plus size={28} color="white" strokeWidth={2.5} />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={() => onPress(route.name, isFocused)}
              className="flex-1 items-center py-1"
            >
              {Icon && React.createElement(Icon, {
                size: 24,
                color: isFocused ? "#FF6B4A" : isDark ? "#6B7280" : "#9CA3AF",
                strokeWidth: isFocused ? 2.5 : 2,
              })}
              <Text
                className={cn(
                  "mt-1 text-[10px] font-semibold",
                  isFocused
                    ? "text-[#FF6B4A]"
                    : isDark
                    ? "text-gray-500"
                    : "text-gray-400"
                )}
              >
                {typeof options.tabBarLabel === "string"
                  ? options.tabBarLabel
                  : options.title || route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
