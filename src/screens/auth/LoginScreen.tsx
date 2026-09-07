import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, ArrowLeft } from "lucide-react-native";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useAuthStore } from "@stores/authStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { isValidEmail } from "@utils/helpers";
import { cn } from "@utils/cn";

type Navigation = {
  navigate: (screen: string) => void;
};

interface LoginScreenProps {
  navigation: Navigation;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isDark = useThemeStore((s) => s.isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) newErrors.email = i18n.t("auth.invalidEmail");
    if (password.length === 0) newErrors.password = i18n.t("auth.enterPassword");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const success = await login(email.trim(), password);
    if (success) {
      toast.success(i18n.t("auth.loginSuccess"));
    } else {
      toast.error(i18n.t("errors.invalidCredentials"));
    }
  };

  const handleGoogleLogin = async () => {
    toast.info(i18n.t("auth.googleLogin"));
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
            onPress={() => navigation.navigate("Signup")}
            className="mb-4 flex-row items-center"
          >
            <ArrowLeft size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <Text className={cn("ml-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {i18n.t("auth.createAccount")}
            </Text>
          </Pressable>

          <View className="mb-8">
            <Text
              className={cn(
                "text-3xl font-bold",
                isDark ? "text-white" : "text-[#1E1E2D]"
              )}
            >
              {i18n.t("auth.welcomeBack")}
            </Text>
            <Text
              className={cn(
                "mt-2 text-base",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              {i18n.t("common.appName")}
            </Text>
          </View>

          <Input
            label={i18n.t("auth.email")}
            placeholder={i18n.t("auth.enterEmail")}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            leftIcon={<Mail size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />}
            className="mb-4"
          />

          <Input
            label={i18n.t("auth.password")}
            placeholder={i18n.t("auth.enterPassword")}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={<Lock size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />}
            className="mb-2"
          />

          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            className="mb-6 self-end"
          >
            <Text className="text-sm font-semibold text-[#6C5CE7]">
              {i18n.t("auth.forgotPassword")}
            </Text>
          </Pressable>

          <Button
            title={i18n.t("auth.login")}
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
          />

          <View className="my-6 flex-row items-center gap-4">
            <View className={cn("h-px flex-1", isDark ? "bg-[#2A2A3C]" : "bg-[#E5E7EB]")} />
            <Text className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              {i18n.t("common.continue")}
            </Text>
            <View className={cn("h-px flex-1", isDark ? "bg-[#2A2A3C]" : "bg-[#E5E7EB]")} />
          </View>

          <Button
            title={i18n.t("auth.signInWithGoogle")}
            onPress={handleGoogleLogin}
            variant="outline"
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
