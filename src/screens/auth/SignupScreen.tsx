import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useAuthStore } from "@stores/authStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { isValidEmail, isValidPassword } from "@utils/helpers";
import { cn } from "@utils/cn";

interface SignupScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const signup = useAuthStore((s) => s.signup);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isDark = useThemeStore((s) => s.isDark);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (name.trim().length === 0) newErrors.name = i18n.t("auth.enterFullName");
    if (!isValidEmail(email)) newErrors.email = i18n.t("auth.invalidEmail");
    if (!isValidPassword(password)) newErrors.password = i18n.t("auth.weakPassword");
    if (confirmPassword !== password)
      newErrors.confirmPassword = i18n.t("auth.passwordMismatch");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const success = await signup(name.trim(), email.trim(), password);
    if (success) {
      toast.success(i18n.t("auth.signupSuccess"));
    } else {
      toast.error(i18n.t("errors.generic"));
    }
  };

  const handleGoogleSignup = async () => {
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
            onPress={() => navigation.navigate("Login")}
            className="mb-4 flex-row items-center"
          >
            <ArrowLeft size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <Text className={cn("ml-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {i18n.t("auth.login")}
            </Text>
          </Pressable>

          <Text
            className={cn(
              "mb-8 text-3xl font-bold",
              isDark ? "text-white" : "text-[#1E1E2D]"
            )}
          >
            {i18n.t("auth.createAccount")}
          </Text>

          <Input
            label={i18n.t("auth.fullName")}
            placeholder={i18n.t("auth.enterFullName")}
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<User size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />}
            className="mb-4"
          />

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
            rightElement={undefined}
            className="mb-4"
          />

          <Input
            label={i18n.t("auth.confirmPassword")}
            placeholder={i18n.t("auth.enterConfirmPassword")}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            leftIcon={<Lock size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />}
            className="mb-6"
          />

          <Button
            title={i18n.t("auth.signup")}
            onPress={handleSignup}
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
            onPress={handleGoogleSignup}
            variant="outline"
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
