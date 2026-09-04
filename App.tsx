import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastManager from "react-native-toast-alert";
import RootNavigator from "./src/navigation/RootNavigator";
import { useThemeStore } from "./src/stores/themeStore";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { getExchangeRates } from "./src/services/exchange/rates";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    getExchangeRates().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <View className={isDark ? "flex-1 bg-bg-dark" : "flex-1 bg-bg-light"}>
          <RootNavigator />
          <ToastManager />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
