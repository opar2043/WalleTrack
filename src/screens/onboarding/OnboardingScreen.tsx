import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { cn } from "@utils/cn";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingScreenProps {
  onFinish: () => void;
  navigation: { navigate: (screen: string) => void };
}

const slides = [
  {
    id: "1",
    emoji: "💰",
    titleKey: "onboarding.slide1Title",
    descKey: "onboarding.slide1Desc",
  },
  {
    id: "2",
    emoji: "📊",
    titleKey: "onboarding.slide2Title",
    descKey: "onboarding.slide2Desc",
  },
  {
    id: "3",
    emoji: "📈",
    titleKey: "onboarding.slide3Title",
    descKey: "onboarding.slide3Desc",
  },
];

export default function OnboardingScreen({ onFinish, navigation }: OnboardingScreenProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    const idx = viewableItems[0]?.index;
    if (idx !== null && idx !== undefined) {
      setCurrentIndex(idx);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onFinish();
    }
  };

  const skip = () => {
    onFinish();
  };

  const goToLogin = () => {
    navigation.navigate("Auth");
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row justify-between px-6 py-4">
        <Pressable onPress={skip}>
          <Text className={cn("text-sm font-semibold", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("common.skip")}
          </Text>
        </Pressable>
        <View className="flex-row gap-2">
          {slides.map((_, index) => (
            <View
              key={index}
              className={cn(
                "h-2 rounded-full",
                index === currentIndex ? "w-6 bg-[#6C5CE7]" : "w-2",
                isDark ? "bg-[#2A2A3C]" : "bg-[#E5E7EB]"
              )}
            />
          ))}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="w-full flex-1 items-center justify-center px-8"
            style={{ width }}
          >
            <View className="mb-12">
              <Text className="text-8xl">{item.emoji}</Text>
            </View>
            <Text
              className={cn(
                "mb-3 text-center text-3xl font-bold",
                isDark ? "text-white" : "text-[#1E1E2D]"
              )}
            >
              {i18n.t(item.titleKey as never)}
            </Text>
            <Text
              className={cn(
                "text-center text-base leading-7",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              {i18n.t(item.descKey as never)}
            </Text>
          </Animated.View>
        )}
      />

      <View className="px-6 pb-8">
        <Pressable
          onPress={goNext}
          className="rounded-2xl bg-[#6C5CE7] py-4"
        >
          <Text className="text-center text-lg font-bold text-white">
            {currentIndex < slides.length - 1
              ? i18n.t("common.next")
              : i18n.t("onboarding.getStarted")}
          </Text>
        </Pressable>
        <Pressable onPress={goToLogin} className="mt-4">
          <Text
            className={cn(
              "text-center text-sm font-semibold",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            {i18n.t("onboarding.alreadyHaveAccount")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
