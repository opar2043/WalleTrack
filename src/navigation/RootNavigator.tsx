import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@stores/authStore";
import { useThemeStore } from "@stores/themeStore";
import { getBoolean, setBoolean, CACHE_KEYS } from "@services/storage";
import type { RootStackParamList } from "./types";

import AuthNavigator from "./AuthNavigator";
import OnboardingScreen from "@screens/onboarding/OnboardingScreen";
import MainNavigator from "./MainNavigator";
import SetupNavigator from "./SetupNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn, checkAuth } = useAuthStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [onboardingSeen, setOnboardingSeen] = React.useState(
    getBoolean(CACHE_KEYS.ONBOARDING_DONE)
  );

  useEffect(() => {
    checkAuth();
    useThemeStore.getState().initTheme();
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: isDark ? "#121212" : "#F5F5F7",
      card: isDark ? "#1E1E2D" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#1E1E2D",
      border: isDark ? "#2A2A3C" : "#E5E7EB",
      primary: "#6C5CE7",
    },
  };

  const handleOnboardingDone = () => {
    setBoolean(CACHE_KEYS.ONBOARDING_DONE, true);
    setOnboardingSeen(true);
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <>
              {!onboardingSeen && (
                <Stack.Screen name="Onboarding">
                  {(props) => <OnboardingScreen {...props} onFinish={handleOnboardingDone} />}
                </Stack.Screen>
              )}
              <Stack.Screen name="Auth" component={AuthNavigator} />
            </>
          ) : (
            <>
              <Stack.Screen name="Setup" component={SetupNavigator} />
              <Stack.Screen name="Main" component={MainNavigator} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
