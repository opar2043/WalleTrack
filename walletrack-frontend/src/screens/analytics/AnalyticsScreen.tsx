import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react-native';

import { ErrorState, SkeletonCard } from '../../components/ui/Feedback';
import { Card, SectionHeader, StatTile } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/Button';
import { BarChart, ChartLegend, DonutChart, type Slice } from '../../components/charts/Charts';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { useInsights, useMonthlyAnalytics } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import {
  addMonths,
  formatMoney,
  formatPercent,
  formatTransactionDate,
  monthKeyOf,
  monthLabel,
  monthLabelShort,
} from '../../utils/format';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const INSIGHT_TONE: Record<string, { bg: string; text: string }> = {
  positive: { bg: 'bg-successSoft', text: '#059669' },
  warning: { bg: 'bg-warningSoft', text: '#D97706' },
  negative: { bg: 'bg-dangerSoft', text: '#DC2626' },
  neutral: { bg: 'bg-surfaceSunken', text: '#52525B' },
};

export default function AnalyticsScreen() {
  const navigation = useNavigation<Navigation>();
  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';

  const [month, setMonth] = useState(monthKeyOf());

  const monthly = useMonthlyAnalytics(month);
  const insights = useInsights(month);

  const data = monthly.data;

  const slices = useMemo<Slice[]>(
    () =>
      (data?.topCategories ?? []).map((category) => ({
        label: category.name,
        value: category.total,
        color: category.color,
      })),
    [data?.topCategories],
  );

  const dailyBars = useMemo(
    () =>
      (data?.dailySeries ?? []).map((point) => ({
        label: monthLabelShort(monthKeyOf(new Date(`${point.date}T12:00:00`))),
        value: point.total,
      })),
    [data?.dailySeries],
  );

  const isEmpty = !monthly.isLoading && (data?.income ?? 0) === 0 && (data?.expenses ?? 0) === 0;

  return (
    <Screen
      edges={{ top: true, bottom: false }}
      bottomInset={80}
      refreshing={monthly.isRefetching}
      onRefresh={() => void monthly.refetch()}
    >
      <ScreenHeader title="Insights" subtitle={monthLabel(month)} />

      {/* --------------------------------------------------- month selector */}
      <View className="mb-4 flex-row items-center justify-between">
        <IconButton
          accessibilityLabel="Previous month"
          icon={<ChevronLeft size={22} color="#18181B" />}
          onPress={() => setMonth(addMonths(month, -1))}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setMonth(monthKeyOf())}
          className="rounded-pill bg-surfaceSunken px-4 py-2"
        >
          <Text variant="captionStrong">{month === monthKeyOf() ? 'This month' : monthLabel(month)}</Text>
        </Pressable>
        <IconButton
          accessibilityLabel="Next month"
          icon={<ChevronRight size={22} color="#18181B" />}
          onPress={() => setMonth(addMonths(month, 1))}
          disabled={month >= monthKeyOf()}
        />
      </View>

      {monthly.isError ? (
        <ErrorState message={monthly.error.message} onRetry={() => void monthly.refetch()} />
      ) : monthly.isLoading ? (
        <View className="gap-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </View>
      ) : isEmpty ? (
        <Card>
          <Text variant="title3" center>
            Nothing to analyse yet
          </Text>
          <Text variant="callout" tone="muted" center className="mt-1.5">
            Once you record income and expenses for {monthLabel(month).toLowerCase()}, Walletrack
            will chart your trends and surface tips here.
          </Text>
        </Card>
      ) : (
        <>
          {/* ------------------------------------------------------ headline */}
          <Card variant="raised" padded={false}>
            <View className="flex-row">
              <View className="flex-1 p-4">
                <StatTile
                  label="Income"
                  value={formatMoney(data!.income, currency)}
                  caption={`${formatPercent(Math.abs(data!.comparison.incomePercentage))} vs prev`}
                  tone="income"
                />
              </View>
              <View className="w-3" />
              <View className="flex-1 p-4">
                <StatTile
                  label="Expenses"
                  value={formatMoney(data!.expenses, currency)}
                  caption={`${formatPercent(Math.abs(data!.comparison.expensePercentage))} vs prev`}
                  tone="expense"
                />
              </View>
            </View>

            <View className="border-t border-border p-4">
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text variant="overline" tone="muted">
                    SAVINGS RATE
                  </Text>
                  <Text variant="amount" tabular className="mt-1">
                    {formatPercent(data!.savingsRate)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text variant="caption" tone="muted">
                    {data!.transactionCount} transactions
                  </Text>
                  <Text variant="captionStrong" tone={data!.net >= 0 ? 'income' : 'expense'} tabular>
                    {data!.net >= 0 ? '+' : ''}
                    {formatMoney(data!.net, currency)} net
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* --------------------------------------------------- category pie */}
          {slices.length > 0 ? (
            <Card className="mt-4">
              <SectionHeader title="Where the money went" subtitle="Tap a category for detail" />
              <View className="items-center">
                <DonutChart
                  slices={slices}
                  currency={currency}
                  centerLabel="total spent"
                  centerValue={formatMoney(data!.expenses, currency)}
                  size={190}
                />
              </View>

              <View className="mt-5 gap-2">
                {slices.map((slice) => {
                  const category = data!.topCategories.find((item) => item.name === slice.label);
                  return (
                    <Pressable
                      key={slice.label}
                      accessibilityRole="button"
                      disabled={!category?.categoryId}
                      onPress={() =>
                        category?.categoryId &&
                        navigation.navigate('AnalyticsCategory', {
                          categoryId: category.categoryId,
                          month,
                        })
                      }
                      className="flex-row items-center rounded-md px-1 py-1 active:opacity-60"
                    >
                      <View
                        className="h-2.5 w-2.5 rounded-pill"
                        style={{ backgroundColor: slice.color }}
                      />
                      <Text variant="callout" className="ml-2 flex-1" numberOfLines={1}>
                        {slice.label}
                      </Text>
                      <Text variant="callout" tone="secondary" tabular>
                        {formatMoney(slice.value, currency)}
                      </Text>
                      <Text
                        variant="caption"
                        tone="muted"
                        tabular
                        className="ml-2 w-10 text-right"
                      >
                        {formatPercent((slice.value / (data!.expenses || 1)) * 100)}
                      </Text>
                      {category?.categoryId ? (
                        <ChevronRight size={14} color="#8B8B94" style={{ marginLeft: 4 }} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ) : null}

          {/* ---------------------------------------------------- daily spend */}
          <Card className="mt-4">
            <SectionHeader title="Daily spending" subtitle={monthLabel(month)} />
            <BarChart data={dailyBars} color="#DC2626" currency={currency} height={150} />
          </Card>

          {/* ------------------------------------------------------- insights */}
          <SectionHeader title="What stands out" className="mt-6" />
          {insights.isLoading ? (
            <SkeletonCard lines={4} />
          ) : insights.data && insights.data.insights.length > 0 ? (
            <View className="gap-3">
              {insights.data.insights.map((insight) => {
                const tone = INSIGHT_TONE[insight.tone] ?? INSIGHT_TONE.neutral;
                return (
                  <Card key={insight.id} padded={false}>
                    <View className="flex-row p-4">
                      <View
                        className={[
                          'h-9 w-9 items-center justify-center rounded-pill',
                          tone.bg,
                        ].join(' ')}
                      >
                        <Lightbulb size={17} color={tone.text} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text variant="bodyStrong">{insight.title}</Text>
                        <Text variant="caption" tone="secondary" className="mt-0.5">
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card>
              <Text variant="callout" tone="muted" center>
                No insights for this month yet.
              </Text>
            </Card>
          )}

          {/* --------------------------------------------------- quick stats */}
          {insights.data ? (
            <Card className="mt-4">
              <SectionHeader title="Averages" />
              <View className="gap-3">
                <AverageRow
                  icon={<TrendingUp size={16} color="#059669" />}
                  label="Average daily spend"
                  value={formatMoney(insights.data.averageDailySpend, currency)}
                />
                <AverageRow
                  icon={<TrendingUp size={16} color="#4F46E5" />}
                  label="Average transaction"
                  value={formatMoney(insights.data.averageTransaction, currency)}
                />
                {insights.data.topSpendingDay ? (
                  <AverageRow
                    icon={<TrendingDown size={16} color="#DC2626" />}
                    label={`Heaviest day (${formatTransactionDate(insights.data.topSpendingDay.date)})`}
                    value={formatMoney(insights.data.topSpendingDay.total, currency)}
                  />
                ) : null}
              </View>
            </Card>
          ) : null}
        </>
      )}
      <View style={{ height: 4 }} />
    </Screen>
  );
}

function AverageRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center">
      <View className="h-8 w-8 items-center justify-center rounded-pill bg-surfaceSunken">
        {icon}
      </View>
      <Text variant="callout" tone="secondary" className="ml-3 flex-1">
        {label}
      </Text>
      <Text variant="bodyStrong" tabular>
        {value}
      </Text>
    </View>
  );
}