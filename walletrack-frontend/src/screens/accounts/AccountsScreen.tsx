import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Plus,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react-native';

import { Badge, EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader, StatTile } from '../../components/ui/Card';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { cn } from '../../theme/utils';
import { useAccounts, useUpdatePreferences } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { formatMoney } from '../../utils/format';
import type { Account, AccountType } from '../../types/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../utils/toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const TYPE_META: Record<AccountType, { label: string; icon: typeof WalletIcon }> = {
  cash: { label: 'Cash', icon: WalletIcon },
  bank: { label: 'Bank', icon: Landmark },
  credit: { label: 'Credit card', icon: CreditCard },
  savings: { label: 'Savings', icon: TrendingUp },
  investment: { label: 'Investment', icon: TrendingUp },
};

export default function AccountsScreen() {
  const toast = useToast();

  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const updatePreferences = useUpdatePreferences();
  const currency = user?.currency ?? 'USD';
  const hideBalances = user?.hideBalances ?? false;

  const [showArchived, setShowArchived] = useState(false);
  const accounts = useAccounts(showArchived);

  const all = accounts.data ?? [];
  const active = all.filter((account) => !account.isArchived);

  const totals = useMemo(
    () => ({
      total: active.reduce((sum, account) => sum + account.balance, 0),
      liquid: active
        .filter((account) => account.type !== 'investment' && account.type !== 'credit')
        .reduce((sum, account) => sum + account.balance, 0),
      debt: active
        .filter((account) => account.type === 'credit')
        .reduce((sum, account) => sum + Math.abs(Math.min(account.balance, 0)), 0),
    }),
    [active],
  );

  const handleRefresh = useCallback(() => {
    void accounts.refetch();
  }, [accounts]);

  const masked = (value: string) => (hideBalances ? '••••••' : value);

  return (
    <Screen
      edges={{ top: true, bottom: false }}
      bottomInset={80}
      refreshing={accounts.isRefetching}
      onRefresh={handleRefresh}
    >
      <ScreenHeader
        title="Accounts"
        subtitle={`${active.length} active account${active.length === 1 ? '' : 's'}`}
        right={
          <>
            <IconButton
              accessibilityLabel={hideBalances ? 'Show balances' : 'Hide balances'}
              icon={
                hideBalances ? <EyeOff size={20} color="#8B8B94" /> : <Eye size={20} color="#8B8B94" />
              }
              onPress={() => {
                const next = !hideBalances;
                patchUser({ hideBalances: next });
                updatePreferences.mutate({ hideBalances: next });
              }}
            />
            <IconButton
              accessibilityLabel="New account"
              icon={<Plus size={22} color="#4F46E5" />}
              tone="primary"
              onPress={() => navigation.navigate('AccountForm')}
            />
          </>
        }
      />

      {/* ------------------------------------------------------ net balance */}
      <Card variant="raised" padded={false}>
        <View className="bg-primary px-5 pb-5 pt-5">
          <Text variant="overline" className="text-white/80">
            NET WORTH
          </Text>
          <Text variant="amountLarge" className="mt-1 text-white" tabular>
            {masked(formatMoney(totals.total, currency))}
          </Text>
        </View>
        <View className="flex-row">
          <View className="flex-1 p-4">
            <StatTile
              label="Available"
              value={masked(formatMoney(totals.liquid, currency))}
              tone="income"
            />
          </View>
          <View className="w-3" />
          <View className="flex-1 p-4">
            <StatTile
              label="Card debt"
              value={masked(formatMoney(totals.debt, currency))}
              tone={totals.debt > 0 ? 'expense' : 'default'}
            />
          </View>
        </View>
      </Card>

      {/* -------------------------------------------------- archive toggle */}
      <View className="mt-4 flex-row items-center justify-between px-1">
        <Text variant="label" tone="secondary">
          {showArchived ? 'All accounts' : 'Active accounts'}
        </Text>
        <Button
          label={showArchived ? 'Hide archived' : 'Show archived'}
          variant="ghost"
          size="sm"
          fullWidth={false}
          onPress={() => setShowArchived((value) => !value)}
        />
      </View>

      {/* -------------------------------------------------------- list */}
      {accounts.isError ? (
        <ErrorState message={accounts.error.message} onRetry={handleRefresh} />
      ) : accounts.isLoading ? (
        <View className="mt-1">
          <SkeletonList count={4} />
        </View>
      ) : all.length === 0 ? (
        <Card>
          <EmptyState
            icon={<WalletIcon size={26} color="#8B8B94" />}
            title="No accounts yet"
            message="Add your cash, bank and card accounts so every transaction has a home."
            actionLabel="Add an account"
            onAction={() => navigation.navigate('AccountForm')}
          />
        </Card>
      ) : (
        <View className="mt-1 gap-3">
          {all.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              currency={currency}
              hideBalances={hideBalances}
              onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
            />
          ))}
        </View>
      )}

      <SectionHeader title="Add another" className="mt-6" />
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(TYPE_META) as AccountType[]).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              onPress={() => navigation.navigate('AccountForm', { accountId: undefined })}
              className="flex-row items-center rounded-pill border border-border bg-surface px-3.5 py-2.5 active:opacity-60"
            >
              <Icon size={16} color="#4F46E5" />
              <Text variant="captionStrong" tone="secondary" className="ml-1.5">
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="New account"
        icon={<Plus size={18} color="#FFFFFF" />}
        className="mt-5"
        onPress={() => navigation.navigate('AccountForm')}
      />
      <View style={{ height: 4 }} />
    </Screen>
  );
}

function AccountCard({
  account,
  currency,
  hideBalances,
  onPress,
}: {
  account: Account;
  currency: string;
  hideBalances: boolean;
  onPress: () => void;
}) {
  const meta = TYPE_META[account.type];
  const Icon = meta.icon;
  const isDebt = account.type === 'credit' && account.balance < 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${account.name}, ${formatMoney(account.balance, currency)}`}
      onPress={onPress}
      className={cn('active:opacity-60', account.isArchived ? 'opacity-60' : '')}
    >
      <Card padded={false}>
        <View className="flex-row items-center p-4">
          <View
            className="h-11 w-11 items-center justify-center rounded-pill"
            style={{ backgroundColor: `${account.color}1F` }}
          >
            <Icon size={20} color={account.color} />
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text variant="bodyStrong" numberOfLines={1} className="flex-1">
                {account.name}
              </Text>
              {account.isArchived ? <Badge label="Archived" tone="neutral" /> : null}
            </View>
            <Text variant="caption" tone="muted">
              {meta.label}
              {account.transactionCount > 0 ? ` · ${account.transactionCount} transactions` : ''}
            </Text>
          </View>

          <View className="items-end">
            <Text
              variant="amountSmall"
              tone={isDebt ? 'expense' : account.balance < 0 ? 'expense' : 'default'}
              tabular
            >
              {hideBalances ? '••••••' : formatMoney(account.balance, currency)}
            </Text>
            <Text variant="2xs" tone="muted" style={{ fontSize: 11 }}>
              {account.isArchived ? 'Hidden' : 'Balance'}
            </Text>
          </View>
          <ChevronRight size={16} color="#8B8B94" style={{ marginLeft: 6 }} />
        </View>
      </Card>
    </Pressable>
  );
}

export { TYPE_META };
