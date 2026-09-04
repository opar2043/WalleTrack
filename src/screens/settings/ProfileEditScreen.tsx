import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput as RNTextInput,
  Image,
} from "react-native";
import { ArrowLeft, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "@components/ui/Avatar";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useAuthStore } from "@stores/authStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";
import type { UserLanguage } from "@t/index";

interface ProfileEditScreenProps {
  navigation: { goBack: () => void };
}

const CURRENCIES = [
  "USD", "INR", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD", "AED", "SAR",
  "CNY", "CHF", "NZD", "BRL", "MXN", "KRW", "ZAR", "TRY", "HKD", "SEK",
];

const NATIONALITIES = [
  "US", "IN", "GB", "DE", "FR", "JP", "CA", "AU", "SG", "AE", "SA",
  "CN", "CH", "BR", "MX", "KR", "ZA", "TR", "HK", "SE",
];

const LANGUAGES: { code: UserLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

export default function ProfileEditScreen({ navigation }: ProfileEditScreenProps) {
  const { userId } = useAuthStore();
  const { profile, setProfile, syncProfile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [nationality, setNationality] = useState(profile?.nationality || "US");
  const [currency, setCurrency] = useState(profile?.baseCurrency || "USD");
  const [language, setLanguage] = useState<UserLanguage>(
    (profile?.language as UserLanguage) || "en"
  );
  const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatarFileId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setNationality(profile.nationality || "US");
      setCurrency(profile.baseCurrency || "USD");
      setLanguage((profile.language as UserLanguage) || "en");
      setAvatarUri(profile.avatarFileId);
    }
  }, [profile]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!res.canceled) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  const save = async () => {
    setSaving(true);
    setProfile({
      fullName: fullName || undefined,
      nationality,
      baseCurrency: currency,
      language,
    });
    if (userId) {
      await syncProfile(userId);
    }
    toast.success(i18n.t("settings.profileUpdated"));
    setSaving(false);
    navigation.goBack();
  };

  const renderPicker = (options: string[], value: string, onChange: (v: string) => void) => (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            className={cn(
              "rounded-full border px-3 py-2",
              active ? "border-[#6C5CE7] bg-[#6C5CE7]/10" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
            )}
          >
            <Text className={cn("text-sm font-semibold", active ? "text-[#6C5CE7]" : isDark ? "text-gray-300" : "text-gray-600")}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("settings.profile")}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        {/* Avatar */}
        <View className="mb-6 items-center">
          <Pressable onPress={pickImage} className="relative">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="h-24 w-24 rounded-full" />
            ) : (
              <Avatar name={fullName} size={96} />
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7]">
              <Camera size={14} color="white" />
            </View>
          </Pressable>
          <Text className={cn("mt-2 text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("settings.tapToChange")}
          </Text>
        </View>

        {/* Name */}
        <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
          {i18n.t("settings.fullName")}
        </Text>
        <Input value={fullName} onChangeText={setFullName} placeholder={i18n.t("settings.fullName")} className="mb-4" />

        {/* Nationality */}
        <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
          {i18n.t("settings.nationality")}
        </Text>
        {renderPicker(NATIONALITIES, nationality, setNationality)}

        {/* Currency */}
        <Text className={cn("mb-2 mt-4 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
          {i18n.t("settings.currency")}
        </Text>
        {renderPicker(CURRENCIES, currency, setCurrency)}

        {/* Language */}
        <Text className={cn("mb-2 mt-4 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
          {i18n.t("settings.language")}
        </Text>
        <View className="flex-row gap-2">
          {LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                className={cn(
                  "flex-1 items-center rounded-2xl border py-3",
                  active ? "border-[#6C5CE7] bg-[#6C5CE7]/10" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                )}
              >
                <Text className={cn("text-sm font-semibold", active ? "text-[#6C5CE7]" : isDark ? "text-gray-300" : "text-gray-600")}>
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button title={i18n.t("common.save")} onPress={save} size="lg" loading={saving} className="mt-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
