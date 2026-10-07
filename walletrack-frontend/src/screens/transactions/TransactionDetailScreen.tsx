import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pencil, Trash2 } from 'lucide-react-native';

import { ConfirmDialog } from '../../components/ui/Sheet';
import { ErrorState, SkeletonCard } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { useDeleteTransaction, useTransaction } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { formatMoney, formatTransactionDate } from '../../utils/format';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../utils/toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'TransactionDetail'>;

export default function TransactionDetailScreen() {
  const toast = useToast();

  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<DetailRoute>();
  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';

  const query = useTransaction(params.transactionId);
  const remove = useDeleteTransaction();
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (query.isLoading) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ScreenHeader title="Transaction" onBack={() => navigation.goBack()} />
        <SkeletonCard lines={5} />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ScreenHeader title="Transaction" onBack={() => navigation.goBack()} />
        <ErrorState message={query.error?.message} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const transaction = query.data;
  const tone =
    transaction.type === 'income' ? 'income' : transaction.type === 'expense' ? 'expense' : 'transfer';
  const signed =
    transaction.type === 'income'
      ? `+${formatMoney(transaction.amount, currency)}`
      : transaction.type === 'expense'
        ? `-${formatMoney(transaction.amount, currency)}`
        : formatMoney(transaction.amount, currency);

  async function handleDelete() {
    try {
      await remove.mutateAsync(transaction.id);
      setConfirmVisible(false);
      toast.success('Transaction deleted');
      navigation.goBack();
    } catch {
      setConfirmVisible(false);
      toast.error('Could not delete the transaction');
    }
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title={transaction.categoryName ?? (transaction.type === 'transfer' ? 'Transfer' : 'Transaction')}
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            accessibilityLabel="Edit transaction"
            icon={<Pencil size={19} color="#4F46E5" />}
            onPress={() =>
              navigation.navigate('TransactionFormModal', { transactionId: transaction.id })
            }
          />
        }
      />

      <Card variant="raised" className="items-center py-7">
        <Text variant="overline" tone="muted">
          {transaction.type.toUpperCase()}
        </Text>
        <Text variant="amountLarge" tone={tone} tabular className="mt-1">
          {signed}
        </Text>
        <Text variant="callout" tone="muted" className="mt-1.5">
          {formatTransactionDate(transaction.date)}
        </Text>
      </Card>

      <SectionHeader title="Details" className="mt-6" />
      <Card padded={false}>
        <DetailRow label="Amount" value={formatMoney(transaction.amount, currency)} tabular />
        <DetailRow
          label={transaction.type === 'transfer' ? 'From' : 'Account'}
          value={transaction.accountName}
        />
        {transaction.type === 'transfer' ? (
          <DetailRow label="To" value={transaction.toAccountName ?? '—'} />
        ) : (
          <DetailRow label="Category" value={transaction.categoryName ?? 'Uncategorised'} />
        )}
        <DetailRow label="Note" value={transaction.note || '—'} />
      </Card>

      <Button
        label="Delete transaction"
        variant="danger"
        icon={<Trash2 size={18} color="#FFFFFF" />}
        className="mt-6"
        onPress={() => setConfirmVisible(true)}
        loading={remove.isPending}
      />

      <Text variant="caption" tone="muted" center className="mt-4">
        Deleting restores the balance exactly as it was.
      </Text>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete this transaction?"
        message="The account balance will be restored. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

function DetailRow({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  return (
    <View className="flex-row items-center border-b border-border px-4 py-3 last:border-b-0">
      <Text variant="callout" tone="secondary" className="w-32">
        {label}
      </Text>
      <Text variant="bodyStrong" className="flex-1" tabular={tabular} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}