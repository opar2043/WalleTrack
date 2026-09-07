import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, ArrowLeft } from "lucide-react-native";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { isValidEmail } from "@utils/helpers";
import { sendPasswordReset } from "@services/appwrite/auth";
import { cn } from "@utils/cn";

interface ForgotPasswordScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError(i18n.t("auth.invalidEmail"));
      return;
    }
    setError(undefined);
    setIsLoading(true);
    try {
      await sendPasswordReset(email.trim());
      toast.success(i18n.t("auth.resetSent"));
      navigation.goBack();
    } catch (e) {
      toast.error(i18n.t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="mb-6 flex-row items-center"
          >
            <ArrowLeft size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <Text className={cn("ml-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {i18n.t("auth.login")}
            </Text>
          </Pressable>

          <Text
            className={cn(
              "mb-2 text-3xl font-bold",
              isDark ? "text-white" : "text-[#1E1E2D]"
            )}
          >
            {i18n.t("auth.forgotTitle")}
          </Text>
          <Text
            className={cn(
              "mb-8 text-base",
              isDark ? "text-gray-400" : "text-gray-600"
            )}
          >
            {i18n.t("auth.forgotDesc")}
          </Text>

          <Input
            label={i18n.t("auth.email")}
            placeholder={i18n.t("auth.enterEmail")}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={error}
            leftIcon={<Mail size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />}
            className="mb-6"
          />

          <Button
            title={i18n.t("auth.resetPassword")}
            onPress={handleSubmit}
            loading={isLoading}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
