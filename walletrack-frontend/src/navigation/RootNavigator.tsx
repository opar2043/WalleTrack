import { useEffect, useMemo } from 'react';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';

import { MainTabNavigator, type MainTabParamList } from './MainTabNavigator';
import AccountDetailScreen from '../screens/accounts/AccountDetailScreen';
import AccountFormScreen from '../screens/accounts/AccountFormScreen';
import AccountsScreen from '../screens/accounts/AccountsScreen';
import AnalyticsCategoryScreen from '../screens/analytics/CategoryDetailScreen';
import CategoryFormScreen from '../screens/settings/CategoryFormScreen';
import PremiumScreen from '../screens/premium/PremiumScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import TransactionFormScreen from '../screens/transactions/TransactionFormScreen';
import { setUnauthorizedHandler } from '../api/client';
import { Text } from '../components/ui/Text';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../store/authStore';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  Region: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  TransactionFormModal: { transactionId?: string } | undefined;
  TransactionDetail: { transactionId: string };
  Accounts: undefined;
  AccountForm: { accountId?: string } | undefined;
  AccountDetail: { accountId: string };
  CategoryForm: { categoryId?: string } | undefined;
  AnalyticsCategory: { categoryId: string; month: string };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Privacy: undefined;
  Premium: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

function navigationTheme(isDark: boolean, colors: Record<string, string>): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.content,
      border: colors.border,
      notification: colors.expense,
    },
  };
}

function FullScreenLoader({ label }: { label: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text variant="callout" tone="muted" className="mt-4">
        {label}
      </Text>
    </View>
  );
}

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const clearLocalSession = useAuthStore((state) => state.clearLocalSession);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  // Restore the stored session once, before the first render of any screen.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // A 401 anywhere in the app drops the session and returns to sign-in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearLocalSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

  const theme = useMemo(() => navigationTheme(isDark, colors), [colors, isDark]);

  if (status === 'loading') {
    return <FullScreenLoader label="Opening Walletrack…" />;
  }

  const needsOnboarding = status === 'authenticated' && user !== null && !user.onboardingCompleted;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.content,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {status === 'unauthenticated' ? (
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : needsOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />

            <Stack.Screen
              name="Region"
              component={OnboardingScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />

            <Stack.Screen
              name="TransactionFormModal"
              component={TransactionFormScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="TransactionDetail"
              component={TransactionDetailScreen}
              options={{ title: 'Transaction', headerShown: false }}
            />
            <Stack.Screen
              name="Accounts"
              component={AccountsScreen}
              options={{ title: 'Accounts', headerShown: false }}
            />
            <Stack.Screen
              name="AccountForm"
              component={AccountFormScreen}
              options={{ title: 'Account', headerShown: false }}
            />
            <Stack.Screen
              name="AccountDetail"
              component={AccountDetailScreen}
              options={{ title: 'Account', headerShown: false }}
            />
            <Stack.Screen
              name="CategoryForm"
              component={CategoryFormScreen}
              options={{ title: 'Category', headerShown: false }}
            />
            <Stack.Screen
              name="AnalyticsCategory"
              component={AnalyticsCategoryScreen}
              options={{ title: 'Category', headerShown: false }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings', headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Profile', headerShown: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'Password', headerShown: false }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ title: 'Privacy', headerShown: false }}
            />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{ title: 'Walletrack Premium', headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type { MainTabParamList };
