import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Check } from "lucide-react-native";
import { Button } from "@components/ui/Button";
import { useAuthStore } from "@stores/authStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { AVAILABLE_LANGUAGES } from "@constants/languages";
import { CURRENCIES, NATIONALITIES } from "@constants/index";
import { CACHE_KEYS, setBoolean, setString } from "@services/storage";
import { setLanguage } from "@i18n/index";
import { cn } from "@utils/cn";
import { Avatar } from "@components/ui/Avatar";

const STEPS = ["nationality", "currency", "language", "avatar"] as const;

export default function ProfileSetupScreen({ navigation }: { navigation: { reset: (n: object) => void } }) {
  const { userId } = useAuthStore();
  const { profile, setProfile, syncProfile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [currentStep, setCurrentStep] = useState(0);
  const [nationality, setNationality] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguagePref] = useState("en");
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const downloadAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Permission needed to access photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step - save profile
    if (!userId) return;
    setIsSaving(true);
    try {
      await setLanguage(language);
      setString(CACHE_KEYS.CURRENCY, currency);
      setString(CACHE_KEYS.NATIONALITY, nationality);
      setBoolean(CACHE_KEYS.ONBOARDING_DONE, true);
      setBoolean(CACHE_KEYS.SETUP_DONE, true);

      setProfile({
        nationality,
        baseCurrency: currency,
        language,
        ...(avatarUri ? { avatarFileId: avatarUri } : {}),
      });
      await syncProfile(userId);

      toast.success(i18n.t("setup.setupComplete"));
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (error) {
      toast.error(i18n.t("errors.generic"));
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case "nationality":
        return (
          <View>
            <View className="mb-4">
              <StepTitle title={i18n.t("setup.chooseNationality")} />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {NATIONALITIES.map((nat) => (
                <Pressable
                  key={nat.code}
                  onPress={() => setNationality(nat.code)}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    nationality === nat.code
                      ? "border-[#6C5CE7] bg-[#6C5CE7]"
                      : isDark
                      ? "border-[#2A2A3C] bg-[#1E1E2D]"
                      : "border-[#E5E7EB] bg-white"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      nationality === nat.code ? "text-white" : isDark ? "text-gray-200" : "text-[#1E1E2D]"
                    )}
                  >
                    {nat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case "currency":
        return (
          <View>
            <StepTitle title={i18n.t("setup.chooseCurrency")} />
            <View className="flex-row flex-wrap gap-2">
              {CURRENCIES.map((cur) => (
                <Pressable
                  key={cur.code}
                  onPress={() => setCurrency(cur.code)}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    currency === cur.code
                      ? "border-[#6C5CE7] bg-[#6C5CE7]"
                      : isDark
                      ? "border-[#2A2A3C] bg-[#1E1E2D]"
                      : "border-[#E5E7EB] bg-white"
                  )}
                >
                  <Text className={cn("text-base font-semibold", currency === cur.code ? "text-white" : "")}>
                    {cur.symbol}
                  </Text>
                  <Text
                    className={cn(
                      "mt-0.5 text-xs",
                      currency === cur.code ? "text-white/80" : isDark ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    {cur.name}
                  </Text>
                  <Text
                    className={cn(
                      "text-xs font-bold",
                      currency === cur.code ? "text-white" : "text-[#6C5CE7]"
                    )}
                  >
                    {cur.code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case "language":
        return (
          <View>
            <StepTitle title={i18n.t("setup.chooseLanguage")} />
            <View className="gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguagePref(lang.code)}
                  className={cn(
                    "flex-row items-center justify-between rounded-2xl border px-5 py-4",
                    language === lang.code
                      ? "border-[#6C5CE7] bg-[#6C5CE7]"
                      : isDark
                      ? "border-[#2A2A3C] bg-[#1E1E2D]"
                      : "border-[#E5E7EB] bg-white"
                  )}
                >
                  <View className="flex-row items-center">
                    <Text className={cn("text-lg font-bold", language === lang.code ? "text-white" : isDark ? "text-white" : "text-[#1E1E2D]")}>
                      {lang.nativeName}
                    </Text>
                    <Text className={cn("ml-2 text-sm", language === lang.code ? "text-white/70" : isDark ? "text-gray-400" : "text-gray-500")}>
                      {lang.name}
                    </Text>
                  </View>
                  {language === lang.code && <Check size={20} color="white" />}
                </Pressable>
              ))}
            </View>
          </View>
        );

      case "avatar":
        return (
          <View className="items-center">
            <StepTitle title={i18n.t("setup.chooseAvatar")} />
            <Text className={cn("mb-8 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {i18n.t("setup.avatarDesc")}
            </Text>
            <Pressable onPress={downloadAvatar}>
              <Avatar uri={avatarUri} name={profile?.fullName} size={120} className="mb-6" />
            </Pressable>
            <Button
              title={i18n.t("setup.chooseAvatar")}
              onPress={downloadAvatar}
              variant="outline"
              className="w-full"
            />
          </View>
        );
    }
  };

  const isStepValid = () => {
    switch (STEPS[currentStep]) {
      case "nationality":
        return nationality.length > 0;
      case "currency":
        return currency.length > 0;
      case "language":
        return language.length > 0;
      case "avatar":
        return true;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-1 px-6 pt-8">
        <View className="mb-8 flex-row justify-center gap-2">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className={cn(
                "h-2 rounded-full",
                index === currentStep
                  ? "w-8 bg-[#6C5CE7]"
                  : index < currentStep
                  ? "w-2 bg-[#6C5CE7]"
                  : "w-2",
                isDark && index > currentStep ? "bg-[#2A2A3C]" : ""
              )}
            />
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
        >
          {renderStep()}
        </ScrollView>

        <View className="pb-6">
          <Button
            title={
              currentStep < STEPS.length - 1
                ? i18n.t("common.next")
                : i18n.t("setup.finish")
            }
            onPress={handleNext}
            disabled={!isStepValid()}
            loading={isSaving}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function StepTitle({ title }: { title: string }) {
  const isDark = useThemeStore((s) => s.isDark);
  return (
    <Text className={cn("text-2xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
      {title}
    </Text>
  );
}
