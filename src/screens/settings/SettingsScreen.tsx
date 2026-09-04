import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import {
  User,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Fingerprint,
  Bell,
  Database,
  Crown,
  Users,
  LogOut,
  Trash2,
  Wallet,
  PieChart,
  Lightbulb,
  Download,
} from "lucide-react-native";
import { Avatar } from "@components/ui/Avatar";
import { Header } from "@components/ui/Header";
import { useAuthStore } from "@stores/authStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import { useAccountsStore } from "@stores/accountsStore";
import { useTransactionsStore } from "@stores/transactionsStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useBudgetsStore } from "@stores/budgetsStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";
import { isBiometricAvailable, authenticate, isBiometricEnabled, setBiometricEnabled } from "@services/crypto/biometric";
import { CACHE_KEYS, setString } from "@services/storage";
import { setLanguage } from "@i18n/index";
import { deleteAccount as deleteUserAccount } from "@services/appwrite/auth";
import type { ThemeMode } from "@t/index";

interface SettingsScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { userId, logout, name, email } = useAuthStore();
  const { profile, setBiometric, setTheme, setPremium } = useProfileStore();
  const { clear: clearTransactions } = useTransactionsStore();
  const isDark = useThemeStore((s) => s.isDark);
  const theme = useThemeStore((s) => s.theme);
  const setThemeStore = useThemeStore((s) => s.setTheme);
  const [bioEnabled, setBioEnabled] = React.useState(false);
  const [bioAvailable, setBioAvailable] = React.useState(false);

  useEffect(() => {
    setBioEnabled(isBiometricEnabled());
    isBiometricAvailable().then(setBioAvailable);
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    if (value && !bioAvailable) {
      toast.error(i18n.t("errors.biometricUnavailable"));
      return;
    }
    if (value) {
      const ok = await authenticate(i18n.t("settings.biometricLock"));
      if (!ok) {
        toast.error(i18n.t("errors.biometricFailed"));
        return;
      }
    }
    setBioEnabled(value);
    setBiometricEnabled(value);
    setBiometric(value);
    toast.success(
      value
        ? i18n.t("settings.biometricEnabled")
        : i18n.t("settings.biometricDisabled")
    );
  };

  const handleChangeTheme = (t: ThemeMode) => {
    setThemeStore(t);
    setTheme(t);
    toast.success(i18n.t("settings.themeChanged"));
  };

  const handleLogout = () => {
    Alert.alert(
      i18n.t("settings.logout"),
      i18n.t("settings.logoutConfirm"),
      [
        { text: i18n.t("common.cancel"), style: "cancel" },
        {
          text: i18n.t("settings.logout"),
          style: "destructive",
          onPress: async () => {
            clearTransactions();
            useAccountsStore.setState({ accounts: [] });
            useCategoriesStore.setState({ categories: [] });
            useBudgetsStore.setState({ budgets: [] });
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      i18n.t("settings.deleteAccount"),
      i18n.t("settings.deleteAccountConfirm"),
      [
        { text: i18n.t("common.cancel"), style: "cancel" },
        {
          text: i18n.t("settings.deleteAccount"),
          style: "destructive",
          onPress: async () => {
            if (userId) {
              try {
                await deleteUserAccount(userId);
                toast.success(i18n.t("settings.deleteAccount"));
                clearTransactions();
                await logout();
              } catch (e) {
                toast.error(i18n.t("errors.generic"));
              }
            }
          },
        },
      ]
    );
  };

  const profilePhrase = `${profile?.baseCurrency || "USD"} • ${profile?.nationality || "US"} • ${
    profile?.language?.toUpperCase() || "EN"
  }`;

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    toggleValue,
    onToggleChange,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (v: boolean) => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center rounded-2xl px-4 py-4",
        isDark ? "bg-[#1E1E2D]" : "bg-white",
        "mb-2"
      )}
    >
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-[#6C5CE7]/10">
        {icon}
      </View>
      <View className="flex-1">
        <Text className={cn("text-base font-medium", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {label}
        </Text>
        {value && (
          <Text className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{value}</Text>
        )}
      </View>
      {toggleValue !== undefined ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: "#D1D5DB", true: "#6C5CE7" }}
          thumbColor="#FFFFFF"
        />
      ) : showChevron ? (
        <ChevronRight size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />
      ) : null}
    </Pressable>
  );

  const renderTheme = () => (
    <View className="mb-4 flex-row gap-2">
      {(["light", "dark", "system"] as ThemeMode[]).map((t) => {
        const Icon =
          t === "light" ? Sun : t === "dark" ? Moon : Monitor;
        return (
          <Pressable
            key={t}
            onPress={() => handleChangeTheme(t)}
            className={cn(
              "flex-1 items-center rounded-2xl border py-3",
              theme === t
                ? "border-[#6C5CE7] bg-[#6C5CE7]/10"
                : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
            )}
          >
            <Icon size={20} color={theme === t ? "#6C5CE7" : isDark ? "#9CA3AF" : "#6B7280"} />
            <Text className={cn("mt-1 text-xs font-semibold capitalize", theme === t ? "text-[#6C5CE7]" : isDark ? "text-gray-300" : "text-gray-600")}>
              {i18n.t(`settings.${t}` as never)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <Header title={i18n.t("settings.title")} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-32">
        {/* Profile */}
        <Pressable
          onPress={() => navigation.navigate("ProfileEdit")}
          className={cn(
            "mb-6 flex-row items-center rounded-3xl p-5",
            isDark ? "bg-[#1E1E2D]" : "bg-white"
          )}
        >
          <Avatar uri={profile?.avatarFileId} name={name || profile?.fullName} size={64} className="mr-4" />
          <View className="flex-1">
            <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {name || profile?.fullName || "User"}
            </Text>
            <Text className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {email || "user@email.com"}
            </Text>
            <Text className={cn("mt-1 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              {profilePhrase}
            </Text>
          </View>
          <ChevronRight size={20} color={isDark ? "#6B7280" : "#9CA3AF"} />
        </Pressable>

        {/* Appearance */}
        <Text className={cn("mb-2 px-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("settings.appearance")}
        </Text>
        {renderTheme()}

        {/* Preferences */}
        <Text className={cn("mb-2 px-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("settings.preferences")}
        </Text>
        <SettingRow
          icon={<Wallet size={18} color="#6C5CE7" />}
          label={i18n.t("settings.currency")}
          value={profile?.baseCurrency || "USD"}
          onPress={() => navigation.navigate("ProfileEdit")}
        />
        <SettingRow
          icon={<User size={18} color="#6C5CE7" />}
          label={i18n.t("settings.nationality")}
          value={profile?.nationality || "US"}
          onPress={() => navigation.navigate("ProfileEdit")}
        />
        <SettingRow
          icon={<Monitor size={18} color="#6C5CE7" />}
          label={i18n.t("settings.language")}
          value={(profile?.language || "en").toUpperCase()}
          onPress={() => navigation.navigate("ProfileEdit")}
        />

        {/* Security */}
        <Text className={cn("mb-2 px-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("settings.security")}
        </Text>
        <SettingRow
          icon={<Fingerprint size={18} color="#6C5CE7" />}
          label={i18n.t("settings.biometricLock")}
          value={i18n.t("settings.biometricDesc")}
          toggleValue={bioEnabled}
          onToggleChange={handleToggleBiometric}
        />

        {/* Data & Tools */}
        <Text className={cn("mb-2 px-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("settings.data")}
        </Text>
        <SettingRow
          icon={<Database size={18} color="#6C5CE7" />}
          label={i18n.t("settings.backup")}
          onPress={() => toast.success(i18n.t("settings.backupComplete"))}
        />
        <SettingRow
          icon={<Download size={18} color="#6C5CE7" />}
          label={i18n.t("settings.exportData")}
          onPress={() => toast.success(i18n.t("settings.exportComplete"))}
        />

        {/* Features */}
        <Text className={cn("mb-2 px-2 text-sm font-semibold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("settings.premium")}
        </Text>
        <SettingRow
          icon={<PieChart size={18} color="#6C5CE7" />}
          label={i18n.t("budgets.title")}
          onPress={() => navigation.navigate("Budgets")}
        />
        <SettingRow
          icon={<Lightbulb size={18} color="#6C5CE7" />}
          label={i18n.t("insights.title")}
          onPress={() => navigation.navigate("Insights")}
        />
        <SettingRow
          icon={<Users size={18} color="#6C5CE7" />}
          label={i18n.t("family.title")}
          onPress={() => navigation.navigate("Family")}
        />
        <SettingRow
          icon={<Crown size={18} color="#6C5CE7" />}
          label={i18n.t("settings.upgradePremium")}
          onPress={() => navigation.navigate("Premium")}
        />

        {/* Danger zone */}
        <View className="mt-4 gap-2">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center rounded-2xl border border-[#EF4444]/30 py-3.5"
          >
            <LogOut size={18} color="#EF4444" className="mr-2" />
            <Text className="font-semibold text-[#EF4444]">{i18n.t("settings.logout")}</Text>
          </Pressable>
          <Pressable
            onPress={handleDeleteAccount}
            className="flex-row items-center justify-center rounded-2xl bg-[#EF4444]/10 py-3.5"
          >
            <Trash2 size={18} color="#EF4444" className="mr-2" />
            <Text className="font-semibold text-[#EF4444]">{i18n.t("settings.deleteAccount")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
