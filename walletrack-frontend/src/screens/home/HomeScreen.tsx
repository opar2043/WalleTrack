import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react-native';

import { Badge, Skeleton, SkeletonCard } from '../../components/ui/Feedback';
import { Card, SectionHeader, StatTile } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/Button';
import { LineChart, type Point } from '../../components/charts/Charts';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { cn } from '../../theme/utils';
import { formatMoney, formatPercent, formatTransactionDate, formatWeekdayShort } from '../../utils/format';
import { useDashboard, useUpdatePreferences } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** Small "you spent $X, that is N% less than last period" chip. */
function TrendChip({ percentage, inverted }: { percentage: number; inverted?: boolean }) {
  const positive = inverted ? percentage <= 0 : percentage >= 0;
  const Icon = positive ? ArrowDownRight : ArrowUpRight;
  return (
    <View
      className={cn(
        'flex-row items-center rounded-pill px-2 py-1',
        positive ? 'bg-successSoft' : 'bg-dangerSoft',
      )}
    >
      <Icon size={13} color={positive ? '#059669' : '#DC2626'} strokeWidth={2.6} />
      <Text
        variant="2xs"
        className="ml-0.5"
        style={{ color: positive ? '#059669' : '#DC2626', fontSize: 11 }}
      >
        {formatPercent(Math.abs(percentage), 1)}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const updatePreferences = useUpdatePreferences();

  const [range, setRange] = useState<7 | 30>(7);
  const dashboard = useDashboard(range);

  const data = dashboard.data;
  const currency = data?.currency ?? user?.currency ?? 'USD';
  const hideBalances = user?.hideBalances ?? false;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const balanceSeries = useMemo<Point[]>(
    () =>
      (data?.balanceSeries ?? []).map((point) => ({
        label: range === 7 ? formatWeekdayShort(point.date) : point.date.slice(8),
        value: point.balance,
      })),
    [data?.balanceSeries, range],
  );

  const expenseSeries = useMemo<Point[]>(
    () =>
      (data?.expenseSeries ?? []).map((point) => ({
        label: range === 7 ? formatWeekdayShort(point.date) : point.date.slice(8),
        value: point.total,
      })),
    [data?.expenseSeries, range],
  );

  function toggleHideBalances() {
    const next = !hideBalances;
    patchUser({ hideBalances: next });
    updatePreferences.mutate({ hideBalances: next });
  }

  const handleRefresh = useCallback(() => {
    void dashboard.refetch();
  }, [dashboard]);

  /** Jumps to the full activity tab from the dashboard's "See all" links. */
  const openTransactionsTab = useCallback(() => {
    navigation.navigate('Main', { screen: 'Transactions' });
  }, [navigation]);

  const masked = (value: string) => (hideBalances ? '••••••' : value);

  return (
    <Screen
      refreshing={dashboard.isRefetching}
      onRefresh={handleRefresh}
      edges={{ top: true, bottom: false }}
      bottomInset={80}
    >
      <ScreenHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        subtitle={new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date())}
        right={
          <>
            <IconButton
              accessibilityLabel={hideBalances ? 'Show balances' : 'Hide balances'}
              icon={
                hideBalances ? (
                  <EyeOff size={20} color="#8B8B94" />
                ) : (
                  <Eye size={20} color="#8B8B94" />
                )
              }
              onPress={toggleHideBalances}
            />
            <IconButton
              accessibilityLabel="Settings"
              icon={<SettingsIcon size={20} color="#8B8B94" />}
              onPress={() => navigation.navigate('Settings')}
            />
          </>
        }
      />

      {/* ------------------------------------------------------ total balance */}
      <Card variant="raised" padded={false} className="overflow-hidden">
        <View className="bg-primary px-5 pb-6 pt-5">
          <View className="flex-row items-center">
            <Text variant="overline" className="text-white/80">
              TOTAL BALANCE
            </Text>
            <View className="flex-1" />
            {data ? <TrendChip percentage={data.balanceChangePercentage} inverted /> : null}
          </View>

          {dashboard.isLoading ? (
            <Skeleton height={40} width="70%" className="mt-2" />
          ) : (
            <Text
              variant="amountLarge"
              className="mt-1.5 text-white"
              tabular
              accessibilityLabel={`Total balance ${formatMoney(data?.totalBalance ?? 0, currency)}`}
            >
              {masked(formatMoney(data?.totalBalance ?? 0, currency))}
            </Text>
          )}

          <Text variant="caption" className="mt-1 text-white/80" tabular>
            {data && data.balanceChange !== 0
              ? `${data.balanceChange >= 0 ? '+' : ''}${formatMoney(data.balanceChange, currency)} in the last ${range} days`
              : `Across ${data?.recentTransactions?.length ?? 0} recent entries`}
          </Text>
        </View>

        <View className="flex-row px-5 py-4">
          <StatTile
            label="Income"
            value={masked(formatMoney(data?.income ?? 0, currency))}
            caption={data ? `${formatPercent(Math.abs(data.comparison?.incomePercentage))} vs prev` : undefined}
            tone="income"
          />
          <View className="w-3" />
          <StatTile
            label="Spent"
            value={masked(formatMoney(data?.expenses ?? 0, currency))}
            caption={data ? `${formatPercent(Math.abs(data.comparison?.expensePercentage))} vs prev` : undefined}
            tone="expense"
          />
        </View>
      </Card>

      {/* -------------------------------------------------------- range toggle */}
      <View className="mt-4 flex-row self-start rounded-md bg-surfaceSunken p-1">
        {([7, 30] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: range === option }}
            onPress={() => setRange(option)}
            className={cn(
              'rounded-sm px-4 py-1.5',
              range === option ? 'bg-surface' : 'bg-transparent',
            )}
          >
            <Text variant="captionStrong" tone={range === option ? 'default' : 'muted'}>
              {option} days
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ---------------------------------------------------------- net flow */}
      <Card className="mt-4">
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text variant="overline" tone="muted">
              NET CASH FLOW
            </Text>
            <Text variant="amount" tone={netTone(data?.netCashFlow ?? 0)} tabular className="mt-1">
              {masked(formatMoney(data?.netCashFlow ?? 0, currency))}
            </Text>
          </View>
          <View className="items-end">
            <Text variant="caption" tone="muted">
              Savings rate
            </Text>
            <Text variant="title3" tabular className="mt-0.5">
              {formatPercent(data?.savingsRate ?? 0)}
            </Text>
          </View>
        </View>
      </Card>

      {/* ---------------------------------------------------------- trend chart */}
      <Card className="mt-4">
        <SectionHeader
          title="Balance trend"
          subtitle={`Last ${range} days`}
          action={
            <Badge
              label={formatPercent(Math.abs(data?.balanceChangePercentage ?? 0), 1)}
              tone={(data?.balanceChangePercentage ?? 0) >= 0 ? 'success' : 'danger'}
            />
          }
        />
        {dashboard.isLoading ? (
          <Skeleton height={180} />
        ) : (
          <LineChart data={balanceSeries} currency={currency} fill />
        )}
      </Card>

      {/* ------------------------------------------------------ spending chart */}
      <Card className="mt-4">
        <SectionHeader title="Spending this period" />
        {dashboard.isLoading ? (
          <Skeleton height={160} />
        ) : (
          <LineChart data={expenseSeries} color="#DC2626" currency={currency} height={150} />
        )}
      </Card>

      {/* ------------------------------------------------------ top categories */}
      <SectionHeader
        title="Top spending"
        action={
          <Text
            variant="captionStrong"
            tone="primary"
            onPress={openTransactionsTab}
            suppressHighlighting
          >
            See all
          </Text>
        }
        className="mt-6"
      />
      {dashboard.isLoading ? (
        <SkeletonCard lines={2} />
      ) : data && data?.topCategories?.length > 0 ? (
        <Card padded={false}>
          {data.topCategories.slice(0, 5).map((category, index) => (
            <View
              key={category.categoryId ?? category.name}
              className={cn(
                'flex-row items-center px-4 py-3',
                index > 0 ? 'border-t border-border' : '',
              )}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-pill"
                style={{ backgroundColor: `${category.color}1F` }}
              >
                <Text variant="captionStrong" style={{ color: category.color }}>
                  {category.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text variant="bodyStrong" numberOfLines={1}>
                  {category.name}
                </Text>
                <Text variant="caption" tone="muted" tabular>
                  {formatPercent(category.percentage)} of spending
                </Text>
              </View>
              <Text variant="amountSmall" tabular>
                {masked(formatMoney(category.total, currency))}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <Text variant="callout" tone="muted" center>
            No spending recorded yet. Add your first transaction to see this breakdown.
          </Text>
        </Card>
      )}

      {/* --------------------------------------------------- recent activity */}
      <SectionHeader
        title="Recent activity"
        className="mt-6"
        action={
          <Text
            variant="captionStrong"
            tone="primary"
            onPress={openTransactionsTab}
            suppressHighlighting
          >
            See all
          </Text>
        }
      />
      {dashboard.isLoading ? (
        <SkeletonCard lines={3} />
      ) : data && data.recentTransactions.length > 0 ? (
        <Card padded={false}>
          {data.recentTransactions.map((transaction, index) => {
            const tone =
              transaction.type === 'income'
                ? 'income'
                : transaction.type === 'expense'
                  ? 'expense'
                  : 'transfer';
            const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;

            return (
              <Pressable
                key={transaction.id}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('TransactionDetail', { transactionId: transaction.id })
                }
                className={cn(
                  'flex-row items-center px-4 py-3 active:opacity-60',
                  index > 0 ? 'border-t border-border' : '',
                )}
              >
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-pill',
                    tone === 'income' ? 'bg-incomeSoft' : tone === 'expense' ? 'bg-expenseSoft' : 'bg-transferSoft',
                  )}
                >
                  <Text variant="captionStrong" tone={tone}>
                    {(transaction.categoryName ?? transaction.accountName ?? '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {transaction.categoryName ??
                      (transaction.type === 'transfer' ? 'Transfer' : transaction.accountName)}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {formatTransactionDate(transaction.date)}
                    {transaction.note ? ` · ${transaction.note}` : ''}
                  </Text>
                </View>
                <Text variant="amountSmall" tone={tone} tabular>
                  {masked(
                    transaction.type === 'transfer'
                      ? formatMoney(transaction.amount, currency)
                      : `${amount >= 0 ? '+' : '-'}${formatMoney(Math.abs(amount), currency)}`,
                  )}
                </Text>
                <ChevronRight size={16} color="#8B8B94" style={{ marginLeft: 6 }} />
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card>
          <Text variant="callout" tone="muted" center>
            Nothing here yet. Tap Add to record your first transaction.
          </Text>
        </Card>
      )}

      {/* ------------------------------------------------------------- upgrade */}
      {!data?.budgetSummary ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Premium')}
          className="mt-5 flex-row items-center rounded-lg border border-primary bg-primarySoft p-4 active:opacity-80"
        >
          <Sparkles size={20} color="#4F46E5" />
          <View className="ml-3 flex-1">
            <Text variant="bodyStrong" tone="primary">
              Unlock advanced insights
            </Text>
            <Text variant="caption" tone="secondary">
              Unlimited accounts, exportable data and deeper trends.
            </Text>
          </View>
          <ChevronRight size={18} color="#4F46E5" />
        </Pressable>
      ) : (
        <Card className="mt-5 flex-row items-center" padded={false}>
          <View className="flex-1 p-4">
            <Text variant="overline" tone="muted">
              MONTHLY SPEND
            </Text>
            <Text variant="amount" tabular className="mt-1">
              {masked(formatMoney(data.budgetSummary.totalSpent, currency))}
            </Text>
          </View>
          <View className="border-l border-border p-4">
            <Text variant="overline" tone="muted">
              BALANCE
            </Text>
            <Text variant="amountSmall" tabular className="mt-1">
              {masked(formatMoney(data.totalBalance, currency))}
            </Text>
          </View>
        </Card>
      )}

      <View style={{ height: 4 }} />
    </Screen>
  );
}

function netTone(value: number) {
  if (value > 0) return 'income' as const;
  if (value < 0) return 'expense' as const;
  return 'default' as const;
}