import { Pressable, View } from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChartPie,
  LayoutGrid,
  Plus,
  Receipt,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import { Text } from '../components/ui/Text';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import BudgetsScreen from '../screens/budgets/BudgetsScreen';
import HomeScreen from '../screens/home/HomeScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import { useTheme } from '../theme/ThemeProvider';
import { colorVar } from '../theme/utils';
import { useResponsive } from '../utils/responsive';

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Add: undefined;
  Budgets: undefined;
  Analytics: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabConfig = { name: keyof MainTabParamList; label: string; icon: LucideIcon };

const TABS: TabConfig[] = [
  { name: 'Home', label: 'Home', icon: LayoutGrid },
  { name: 'Transactions', label: 'Activity', icon: Receipt },
  { name: 'Add', label: 'Add', icon: Plus },
  { name: 'Budgets', label: 'Budgets', icon: Wallet },
  { name: 'Analytics', label: 'Insights', icon: ChartPie },
];

/**
 * Custom tab bar. The centre slot is a raised primary action rather than a
 * destination: it presents the transaction sheet on the parent stack and never
 * changes tabs. Labels are capped at 10pt so longer names never clip on a
 * narrow device.
 */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isPhone } = useResponsive();

  const surface = colorVar('surface', isDark);
  const border = colorVar('border', isDark);
  const muted = colorVar('contentMuted', isDark);
  const primary = colorVar('primary', isDark);

  const openAddSheet = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // The transaction form lives on the root stack as a modal, not as a tab.
    navigation.getParent()?.navigate('TransactionFormModal' as never);
  };

  return (
    <View
      className="flex-row border-t"
      style={{
        backgroundColor: surface,
        borderTopColor: border,
        paddingBottom: insets.bottom,
        height: 62 + insets.bottom,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
        elevation: 10,
      }}
    >
      {state.routes.map((route, index) => {
        const config = TABS.find((tab) => tab.name === route.name);
        if (!config) return null;
        const isFocused = state.index === index;
        const Icon = config.icon;

        if (config.name === 'Add') {
          return (
            <View key={route.key} className="flex-1 items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a transaction"
                onPress={openAddSheet}
                className="-mt-6 h-14 w-14 items-center justify-center rounded-pill active:opacity-80"
                style={{
                  backgroundColor: primary,
                  shadowColor: '#000',
                  shadowOpacity: 0.22,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                }}
              >
                <Icon size={26} color="#FFFFFF" strokeWidth={2.6} />
              </Pressable>
              <Text variant="2xs" tone="muted" style={{ fontSize: 10, marginTop: 2 }}>
                Add
              </Text>
            </View>
          );
        }

        const tint = isFocused ? primary : muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={config.label}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            className="flex-1 items-center justify-start pt-2 active:opacity-60"
          >
            <Icon size={isPhone ? 22 : 24} color={tint} strokeWidth={isFocused ? 2.4 : 1.9} />
            <Text variant="2xs" numberOfLines={1} style={{ fontSize: 10, marginTop: 3, color: tint }}>
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      {/* Declared so the tab bar's route list matches the visual order. */}
      <Tab.Screen name="Add" component={HomeScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}
