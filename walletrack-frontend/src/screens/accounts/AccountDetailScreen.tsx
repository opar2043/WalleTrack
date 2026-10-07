import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Archive, ArrowLeftRight, Pencil, Trash2, X } from 'lucide-react-native';

import { Badge, ErrorState, SkeletonCard } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { LineChart, type Point } from '../../components/charts/Charts';
import {
  useAccounts,
  useArchiveAccount,
  useDeleteAccountItem,
  useTransactions,
} from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { formatMoney, formatTransactionDate } from '../../utils/format';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { TYPE_META } from './AccountsScreen';
import { useToast } from '../../utils/toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'AccountDetail'>;

export default function AccountDetailScreen() {
  const toast = useToast();

  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<DetailRoute>();
  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';

  const accounts = useAccounts(true);
  const archive = useArchiveAccount();
  const remove = useDeleteAccountItem();
  const recent = useTransactions({ accountId: params.accountId, limit: 30, sort: 'date', order: 'asc' });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const account = accounts.data?.find((item) => item.id === params.accountId);

  /**
   * Real balance history: start from the opening balance, replay this account's
   * own transactions oldest to newest, and keep the last 30 points.
   */
  const trend = useMemo<Point[]>(() => {
    if (!account) return [];
    const rows = (recent.data?.pages ?? []).flatMap((page) => page.items);
    if (rows.length === 0) {
      return [{ label: 'Now', value: account.balance }];
    }

    let running = account.startingBalance;
    const points: Point[] = [{ label: 'Start', value: running }];

    for (const transaction of rows) {
      if (transaction.type === 'income') running += transaction.amount;
      else if (transaction.type === 'expense') running -= transaction.amount;
      else if (transaction.toAccountId === account.id) running += transaction.amount;
      else running -= transaction.amount;

      points.push({
        label: formatTransactionDate(transaction.date).replace(/[A-Za-z]+ /, ''),
        value: running,
      });
    }

    return points.slice(-30);
  }, [account, recent.data]);

  if (accounts.isLoading) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ScreenHeader title="Account" onBack={() => navigation.goBack()} />
        <SkeletonCard lines={4} />
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen edges={{ top: true, bottom: true }}>
        <ScreenHeader title="Account" onBack={() => navigation.goBack()} />
        <ErrorState message="This account no longer exists." />
      </Screen>
    );
  }

  const meta = TYPE_META[account.type];
  const Icon = meta.icon;
  const canDelete = account.transactionCount === 0;
  const accountId = account.id;

  async function handleArchive(next: boolean) {
    try {
      await archive.mutateAsync({ id: accountId, isArchived: next });
      toast.success(next ? 'Account archived' : 'Account restored');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the account.');
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(accountId);
      setConfirmDelete(false);
      toast.success('Account deleted');
      navigation.goBack();
    } catch (error) {
      setConfirmDelete(false);
      toast.error(error instanceof Error ? error.message : 'Could not delete the account.');
    }
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title={account.name}
        subtitle={meta.label}
        onBack={() => navigation.goBack()}
        right={
          <>
            <IconButton
              accessibilityLabel="Edit account"
              icon={<Pencil size={19} color="#4F46E5" />}
              onPress={() => navigation.navigate('AccountForm', { accountId: account.id })}
            />
            <IconButton
              accessibilityLabel="Close"
              icon={<X size={20} color="#8B8B94" />}
              onPress={() => navigation.goBack()}
            />
          </>
        }
      />

      <Card variant="raised">
        <View className="flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-pill"
            style={{ backgroundColor: `${account.color}1F` }}
          >
            <Icon size={24} color={account.color} />
          </View>
          <View className="ml-3 flex-1">
            <Text variant="overline" tone="muted">
              CURRENT BALANCE
            </Text>
            <Text variant="amount" tabular className="mt-0.5">
              {formatMoney(account.balance, currency)}
            </Text>
          </View>
          {account.isArchived ? <Badge label="Archived" tone="neutral" /> : null}
        </View>

        <View className="mt-5">
          {trend.length > 1 ? (
            <LineChart data={trend} color={account.color} currency={currency} height={130} />
          ) : (
            <Text variant="caption" tone="muted" center className="py-4">
              No history yet. Add a transaction to see this balance move.
            </Text>
          )}
        </View>
      </Card>

      <SectionHeader title="Details" className="mt-6" />
      <Card padded={false}>
        <Row label="Type" value={meta.label} />
        <Row label="Starting balance" value={formatMoney(account.startingBalance, currency)} />
        <Row label="Transactions" value={String(account.transactionCount)} />
        <Row label="Note" value={account.note || '—'} />
      </Card>

      <SectionHeader title="Actions" className="mt-6" />
      <View className="gap-3">
        <Button
          label="Add transaction"
          icon={<ArrowLeftRight size={18} color="#FFFFFF" />}
          onPress={() => navigation.navigate('TransactionFormModal')}
        />
        <Button
          label="Edit account"
          variant="secondary"
          icon={<Pencil size={18} color="#18181B" />}
          onPress={() => navigation.navigate('AccountForm', { accountId: account.id })}
        />
        <Button
          label={account.isArchived ? 'Restore account' : 'Archive account'}
          variant="secondary"
          icon={<Archive size={18} color="#18181B" />}
          loading={archive.isPending}
          onPress={() => void handleArchive(!account.isArchived)}
        />
        <Button
          label="Delete account"
          variant="danger"
          icon={<Trash2 size={18} color="#FFFFFF" />}
          disabled={!canDelete}
          onPress={() => setConfirmDelete(true)}
        />
      </View>

      {!canDelete ? (
        <Card className="mt-3">
          <Text variant="caption" tone="muted">
            This account has {account.transactionCount} transactions. Delete or reassign them
            first, or archive the account to hide it while keeping its history.
          </Text>
        </Card>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this account?"
        message={
          canDelete
            ? 'The account will be removed permanently. This cannot be undone.'
            : 'Accounts with transactions cannot be deleted. Archive it instead.'
        }
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center border-b border-border px-4 py-3 last:border-b-0">
      <Text variant="callout" tone="secondary" className="w-40">
        {label}
      </Text>
      <Text variant="bodyStrong" className="flex-1" tabular numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}