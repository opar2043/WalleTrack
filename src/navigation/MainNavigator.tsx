import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { MainTabParamList, MainStackParamList } from "./types";
import { CustomTabBar } from "@components/common/CustomTabBar";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";

import HomeScreen from "@screens/main/HomeScreen";
import AccountsScreen from "@screens/accounts/AccountsScreen";
import AddTransactionScreen from "@screens/transactions/AddTransactionScreen";
import ReportsScreen from "@screens/analytics/ReportsScreen";
import SettingsScreen from "@screens/settings/SettingsScreen";
import AnalyticsDetailScreen from "@screens/analytics/AnalyticsDetailScreen";
import BudgetsScreen from "@screens/budgets/BudgetsScreen";
import InsightsScreen from "@screens/insights/InsightsScreen";
import FiltersScreen from "@screens/transactions/FiltersScreen";
import TransactionDetailScreen from "@screens/transactions/TransactionDetailScreen";
import CategoryManagementScreen from "@screens/settings/CategoryManagementScreen";
import PremiumScreen from "@screens/settings/PremiumScreen";
import FamilyScreen from "@screens/settings/FamilyScreen";
import ProfileEditScreen from "@screens/settings/ProfileEditScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function MainTabs() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: i18n.t("tabs.home") }}
      />
      <Tab.Screen
        name="AccountsTab"
        component={AccountsScreen}
        options={{ title: i18n.t("tabs.accounts") }}
      />
      <Tab.Screen
        name="AddTab"
        component={AddTransactionScreen}
        options={{ title: "" }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{ title: i18n.t("tabs.reports") }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: i18n.t("tabs.settings") }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? "#121212" : "#F5F5F7",
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="AnalyticsDetail" component={AnalyticsDetailScreen} />
      <Stack.Screen name="Budgets" component={BudgetsScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryManagementScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Family" component={FamilyScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}
