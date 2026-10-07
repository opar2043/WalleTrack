import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, X } from 'lucide-react-native';

import { ErrorState, SkeletonCard } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader, StatTile } from '../../components/ui/Card';
import { LineChart } from '../../components/charts/Charts';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { useCategoryDetail } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import {
  formatMoney,
  formatPercent,
  formatTransactionDate,
  monthLabelShort,
} from '../../utils/format';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type CategoryRoute = RouteProp<RootStackParamList, 'AnalyticsCategory'>;

export default function CategoryDetailScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<CategoryRoute>();
  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';

  const query = useCategoryDetail(params.categoryId, params.month);
  const data = query.data;

  const line = useMemo(
    () =>
      (data?.dailySeries ?? []).map((point) => ({
        label: point.date.slice(8),
        value: point.total,
      })),
    [data?.dailySeries],
  );

  if (query.isLoading) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ScreenHeader title="Category" onBack={() => navigation.goBack()} />
        <SkeletonCard lines={4} />
      </Screen>
    );
  }

  if (query.isError || !data) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ScreenHeader title="Category" onBack={() => navigation.goBack()} />
        <ErrorState message={query.error?.message} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title={data.name}
        subtitle={monthLabelShort(params.month)}
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            accessibilityLabel="Close"
            icon={<X size={20} color="#8B8B94" />}
            onPress={() => navigation.goBack()}
          />
        }
      />

      <Card variant="raised">
        <View className="flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-pill"
            style={{ backgroundColor: `${data.color}1F` }}
          >
            <Text variant="title3" style={{ color: data.color }}>
              {data.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text variant="overline" tone="muted">
              TOTAL SPENT
            </Text>
            <Text variant="amount" tabular className="mt-0.5">
              {formatMoney(data.total, currency)}
            </Text>
          </View>
        </View>
      </Card>

      <View className="mt-4 flex-row">
        <View className="flex-1">
          <StatTile
            label="Transactions"
            value={String(data.transactionCount)}
            caption="recorded"
          />
        </View>
        <View className="w-3" />
        <View className="flex-1">
          <StatTile
            label="Average"
            value={formatMoney(data.averageTransaction, currency)}
            caption="per transaction"
          />
        </View>
      </View>

      {data.dailySeries.length > 1 ? (
        <Card className="mt-4">
          <SectionHeader title="Spending over time" />
          <LineChart data={line} color={data.color} currency={currency} height={150} />
        </Card>
      ) : null}

      <SectionHeader title="Recent transactions" className="mt-6" />
      {data.recentTransactions.length > 0 ? (
        <Card padded={false}>
          {data.recentTransactions.map((transaction, index) => (
            <Pressable
              key={transaction.id}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('TransactionDetail', { transactionId: transaction.id })
              }
              className={`flex-row items-center px-4 py-3 active:opacity-60 ${
                index > 0 ? 'border-t border-border' : ''
              }`}
            >
              <View className="flex-1">
                <Text variant="bodyStrong" numberOfLines={1}>
                  {transaction.note || transaction.categoryName || data.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {formatTransactionDate(transaction.date)} · {transaction.accountName}
                </Text>
              </View>
              <Text variant="amountSmall" tabular>
                {formatMoney(transaction.amount, currency)}
              </Text>
              <ChevronRight size={16} color="#8B8B94" style={{ marginLeft: 6 }} />
            </Pressable>
          ))}
        </Card>
      ) : (
        <Card>
          <Text variant="callout" tone="muted" center>
            No transactions in this category for {monthLabelShort(params.month)} yet.
          </Text>
        </Card>
      )}

      <Button
        label="Back to insights"
        variant="secondary"
        className="mt-6"
        onPress={() => navigation.goBack()}
      />
    </Screen>
  );
}