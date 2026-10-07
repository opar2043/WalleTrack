import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sparkles,
  Sun,
  Tags,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react-native';

import { Avatar, Badge, InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { ConfirmDialog, Sheet } from '../../components/ui/Sheet';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { useDeleteAccount, usePremiumStatus, useUpdatePreferences } from '../../hooks/queries';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import { cn } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../utils/toast';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Match system', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export default function SettingsScreen() {
  const navigation = useNavigation<Navigation>();

  const { preference, setPreference } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const logoutEverywhere = useAuthStore((state) => state.logoutEverywhere);

  const premium = usePremiumStatus();
  const updatePreferences = useUpdatePreferences();
  const deleteAccount = useDeleteAccount();
  const toast = useToast();

  const [themeVisible, setThemeVisible] = useState(false);
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  const hideBalances = user.hideBalances;

  function toggleHideBalances() {
    updatePreferences.mutate(
      { hideBalances: !hideBalances },
      { onError: (error) => toast.error(error.message) },
    );
  }

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync();
      setConfirmDelete(false);
      await logout();
    } catch (error) {
      setConfirmDelete(false);
      toast.error(error instanceof Error ? error.message : 'Could not delete the account.');
    }
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title="Settings"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            accessibilityLabel="Close"
            icon={<X size={20} color="#8B8B94" />}
            onPress={() => navigation.goBack()}
          />
        }
      />

      {/* ------------------------------------------------------------ profile */}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('EditProfile')}
        className="active:opacity-70"
      >
        <Card>
          <View className="flex-row items-center">
            <Avatar name={user.name} color={user.avatarColor} size={56} />
            <View className="ml-3 flex-1">
              <Text variant="title3" numberOfLines={1}>
                {user.name}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <ChevronRight size={20} color="#8B8B94" />
          </View>
        </Card>
      </Pressable>

      {/* ------------------------------------------------------------ premium */}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Premium')}
        className="mt-4 active:opacity-80"
      >
        <Card className="flex-row items-center border-primary bg-primarySoft">
          <Sparkles size={20} color="#4F46E5" />
          <View className="ml-3 flex-1">
            <Text variant="bodyStrong" tone="primary">
              {premium.data?.isPremium ? 'Walletrack Premium' : 'Go Premium'}
            </Text>
            <Text variant="caption" tone="secondary">
              {premium.data?.isPremium
                ? 'Thanks for supporting Walletrack'
                : 'Unlimited accounts, advanced insights, exports'}
            </Text>
          </View>
          {premium.data?.isPremium ? (
            <Badge label="Active" tone="success" />
          ) : (
            <ChevronRight size={18} color="#4F46E5" />
          )}
        </Card>
      </Pressable>

      {/* --------------------------------------------------------- appearance */}
      <SectionHeader title="Appearance" className="mt-6" />
      <Card padded={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setThemeVisible(true)}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          <Palette size={19} color="#4F46E5" />
          <View className="ml-3 flex-1">
            <Text variant="body">Theme</Text>
            <Text variant="caption" tone="muted">
              {THEME_OPTIONS.find((option) => option.value === preference)?.label ?? 'Match system'}
            </Text>
          </View>
          <ChevronRight size={18} color="#8B8B94" />
        </Pressable>

        <View className="h-px bg-border" />

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hideBalances }}
          accessibilityLabel="Hide balances"
          onPress={toggleHideBalances}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          {hideBalances ? (
            <EyeOff size={19} color="#4F46E5" />
          ) : (
            <Eye size={19} color="#4F46E5" />
          )}
          <View className="ml-3 flex-1">
            <Text variant="body">Hide balances</Text>
            <Text variant="caption" tone="muted">
              Mask amounts everywhere, useful in public
            </Text>
          </View>
          <Toggle checked={hideBalances} />
        </Pressable>
      </Card>

      {/* ------------------------------------------------------------ region */}
      <SectionHeader title="Region" className="mt-6" />
      <Card padded={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Region')}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          <Globe size={19} color="#4F46E5" />
          <View className="ml-3 flex-1">
            <Text variant="body">Country and currency</Text>
            <Text variant="caption" tone="muted">
              {user.country} · {user.currency}
            </Text>
          </View>
          <ChevronRight size={18} color="#8B8B94" />
        </Pressable>
      </Card>

      {/* ----------------------------------------------------------- security */}
      <SectionHeader title="Security" className="mt-6" />
      <Card padded={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ChangePassword')}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          <Shield size={19} color="#4F46E5" />
          <View className="ml-3 flex-1">
            <Text variant="body">Change password</Text>
            <Text variant="caption" tone="muted">
              Signs out every other device
            </Text>
          </View>
          <ChevronRight size={18} color="#8B8B94" />
        </Pressable>

        <View className="h-px bg-border" />

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Privacy')}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          <CreditCard size={19} color="#4F46E5" />
          <View className="ml-3 flex-1">
            <Text variant="body">Privacy and data</Text>
            <Text variant="caption" tone="muted">
              What Walletrack stores about you
            </Text>
          </View>
          <ChevronRight size={18} color="#8B8B94" />
        </Pressable>
      </Card>

      {/* ---------------------------------------------------------- organise */}
      <SectionHeader title="Organise" className="mt-6" />
      <Card padded={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Accounts')}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          <Wallet size={19} color="#4F46E5" />
          <Text variant="body" className="ml-3 flex-1">
            Accounts
          </Text>
          <ChevronRight size={18} color="#8B8B94" />
        </Pressable>

        <View className="h-px bg-border" />

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('CategoryForm')}
          className="flex-row items-center px-4 py-3.5 active:opacity-60"
        >
          <Tags size={19} color="#4F46E5" />
          <Text variant="body" className="ml-3 flex-1">
            New category
          </Text>
          <ChevronRight size={18} color="#8B8B94" />
        </Pressable>
      </Card>

      {/* ------------------------------------------------------------ session */}
      <SectionHeader title="Session" className="mt-6" />
      <View className="gap-3">
        <InlineError message={updatePreferences.error?.message} />
        <Button
          label="Sign out of this device"
          variant="secondary"
          icon={<LogOut size={18} color="#18181B" />}
          onPress={() => void logout()}
        />
        <Button
          label="Sign out everywhere"
          variant="secondary"
          icon={<LogOut size={18} color="#18181B" />}
          onPress={() => setConfirmSignOutAll(true)}
        />
        <Button label="Delete account" variant="danger" onPress={() => setConfirmDelete(true)} />
      </View>

      <Text variant="caption" tone="muted" center className="mt-6">
        {user.currency} · Member since {new Date(user.createdAt).toLocaleDateString()}
      </Text>

      {/* ------------------------------------------------------------- sheets */}
      <Sheet
        visible={themeVisible}
        onClose={() => setThemeVisible(false)}
        title="Theme"
        subtitle="Applies instantly across the whole app."
        maxHeightRatio={0.5}
      >
        <View className="gap-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = option.value === preference;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setPreference(option.value);
                  updatePreferences.mutate(
                    { themePreference: option.value },
                    { onError: (error) => toast.error(error.message) },
                  );
                  setThemeVisible(false);
                }}
                className={cn(
                  'flex-row items-center rounded-md px-3 py-3.5',
                  active ? 'bg-primarySoft' : 'bg-transparent',
                )}
              >
                <Icon size={19} color={active ? '#4F46E5' : '#52525B'} />
                <Text variant="body" tone={active ? 'primary' : 'default'} className="ml-3 flex-1">
                  {option.label}
                </Text>
                {active ? (
                  <Text variant="body" tone="primary">
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <ConfirmDialog
        visible={confirmSignOutAll}
        title="Sign out everywhere?"
        message="Every device, including this one, will need to sign in again."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirmSignOutAll(false)}
        onConfirm={() => {
          setConfirmSignOutAll(false);
          void logoutEverywhere();
        }}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete your account?"
        message="All accounts, transactions, budgets and settings are removed permanently. This cannot be undone."
        confirmLabel="Delete forever"
        destructive
        loading={deleteAccount.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <View
      className={cn(
        'h-7 w-12 justify-center rounded-pill px-1',
        checked ? 'bg-primary' : 'bg-borderStrong',
      )}
    >
      <View
        className="h-5 w-5 rounded-pill bg-white"
        style={{ transform: [{ translateX: checked ? 20 : 0 }] }}
      />
    </View>
  );
}