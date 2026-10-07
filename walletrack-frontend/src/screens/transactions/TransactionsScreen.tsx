import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';

import { Badge, EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, Input, SegmentedControl } from '../../components/ui/Input';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { useAccounts, useTransactions } from '../../hooks/queries';
import { cn } from '../../theme/utils';
import {
  formatDayHeading,
  formatMoney,
  formatTransactionDate,
  addMonths,
  monthKeyOf,
} from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import type { Transaction, TransactionType } from '../../types/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Filter = TransactionType | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

function toneFor(type: TransactionType) {
  return type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'transfer';
}

function TransactionRow({
  transaction,
  currency,
  onPress,
}: {
  transaction: Transaction;
  currency: string;
  onPress: () => void;
}) {
  const tone = toneFor(transaction.type);
  const signed =
    transaction.type === 'income'
      ? `+${formatMoney(transaction.amount, currency)}`
      : transaction.type === 'expense'
        ? `-${formatMoney(transaction.amount, currency)}`
        : formatMoney(transaction.amount, currency);

  const subtitle =
    transaction.type === 'transfer'
      ? `${transaction.accountName} → ${transaction.toAccountName ?? '…'}`
      : `${transaction.categoryName ?? 'Uncategorised'} · ${transaction.accountName}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${transaction.categoryName ?? transaction.type}, ${signed}`}
      onPress={onPress}
      className="flex-row items-center px-4 py-3 active:opacity-60"
    >
      <View
        className={cn(
          'h-10 w-10 items-center justify-center rounded-pill',
          tone === 'income' ? 'bg-incomeSoft' : tone === 'expense' ? 'bg-expenseSoft' : 'bg-transferSoft',
        )}
      >
        <Text variant="captionStrong" tone={tone}>
          {(transaction.categoryName ?? transaction.type).slice(0, 2).toUpperCase()}
        </Text>
      </View>

      <View className="ml-3 flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {transaction.categoryName ??
            (transaction.type === 'transfer' ? 'Transfer' : 'Uncategorised')}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </View>

      <View className="items-end">
        <Text variant="amountSmall" tone={tone} tabular>
          {signed}
        </Text>
        <Text variant="2xs" tone="muted" style={{ fontSize: 11 }} tabular>
          {formatTransactionDate(transaction.date)}
        </Text>
      </View>
      <ChevronRight size={16} color="#8B8B94" style={{ marginLeft: 6 }} />
    </Pressable>
  );
}

export default function TransactionsScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const currency = user?.currency ?? 'USD';

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>();
  const [month, setMonth] = useState(monthKeyOf());
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const accounts = useAccounts();
  const query = useMemo(
    () => ({
      type: filter === 'all' ? undefined : filter,
      accountId,
      from: `${month}-01`,
      to: `${month}-31`,
      search: search.trim() || undefined,
      sort: 'date' as const,
      order: 'desc' as const,
    }),
    [accountId, filter, month, search],
  );

  const transactions = useTransactions(query);

  const all = useMemo(
    () => (transactions.data?.pages ?? []).flatMap((page) => page.items),
    [transactions.data],
  );

  const totals = useMemo(
    () => ({
      income: all.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: all.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    }),
    [all],
  );

  /** Day headings, computed once from the flat list. */
  const sections = useMemo(() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    for (const transaction of all) {
      const title = formatDayHeading(transaction.date);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.data.push(transaction);
      else groups.push({ title, data: [transaction] });
    }
    return groups;
  }, [all]);

  const activeFilterCount = (accountId ? 1 : 0) + (search.trim() ? 1 : 0);

  if (transactions.isError) {
    return (
      <Screen edges={{ top: true, bottom: false }}>
        <ScreenHeader title="Activity" />
        <ErrorState message={transactions.error.message} onRetry={() => void transactions.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      edges={{ top: true, bottom: false }}
      bottomInset={80}
      refreshing={transactions.isRefetching && !transactions.isFetchingNextPage}
      onRefresh={() => void transactions.refetch()}
    >
      <ScreenHeader
        title="Activity"
        subtitle={`${all.length} transaction${all.length === 1 ? '' : 's'} this month`}
        right={
          <>
            <IconButton
              accessibilityLabel="Search transactions"
              icon={
                searchOpen ? (
                  <X size={20} color="#4F46E5" />
                ) : (
                  <Search size={20} color="#8B8B94" />
                )
              }
              onPress={() => {
                setSearchOpen((value) => !value);
                if (searchOpen) setSearch('');
              }}
            />
            <IconButton
              accessibilityLabel="Filters"
              icon={<SlidersHorizontal size={20} color={activeFilterCount ? '#4F46E5' : '#8B8B94'} />}
              onPress={() => setFiltersOpen((value) => !value)}
            />
          </>
        }
      />

      {/* ------------------------------------------------------- month totals */}
      <Card padded={false}>
        <View className="flex-row">
          <View className="flex-1 p-4">
            <Text variant="overline" tone="muted">
              INCOME
            </Text>
            <Text variant="amount" tone="income" tabular className="mt-1">
              {formatMoney(totals.income, currency)}
            </Text>
          </View>
          <View className="w-px bg-border" />
          <View className="flex-1 p-4">
            <Text variant="overline" tone="muted">
              EXPENSES
            </Text>
            <Text variant="amount" tone="expense" tabular className="mt-1">
              {formatMoney(totals.expense, currency)}
            </Text>
          </View>
          <View className="w-px bg-border" />
          <View className="flex-1 p-4">
            <Text variant="overline" tone="muted">
              NET
            </Text>
            <Text
              variant="amount"
              tone={totals.income - totals.expense >= 0 ? 'income' : 'expense'}
              tabular
              className="mt-1"
            >
              {formatMoney(totals.income - totals.expense, currency)}
            </Text>
          </View>
        </View>
      </Card>

      {searchOpen ? (
        <View className="mt-4">
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes and categories"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            leading={<Search size={18} color="#8B8B94" />}
            trailing={
              search ? (
                <IconButton
                  accessibilityLabel="Clear search"
                  icon={<X size={16} color="#8B8B94" />}
                  size={32}
                  onPress={() => setSearch('')}
                />
              ) : undefined
            }
          />
        </View>
      ) : null}

      {filtersOpen ? (
        <Card className="mt-4">
          <SegmentedControl
            label="Type"
            value={filter}
            onChange={setFilter}
            options={FILTERS}
          />
          <View className="mt-4">
            <Text variant="label" tone="secondary" className="mb-2">
              Account
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip label="All accounts" selected={!accountId} onPress={() => setAccountId(undefined)} />
              {(accounts.data ?? []).map((account) => (
                <Chip
                  key={account.id}
                  label={account.name}
                  selected={accountId === account.id}
                  onPress={() => setAccountId(accountId === account.id ? undefined : account.id)}
                />
              ))}
            </View>
          </View>
          <View className="mt-4 flex-row gap-2">
            <Chip
              label="This month"
              selected={month === monthKeyOf()}
              onPress={() => setMonth(monthKeyOf())}
            />
            <Chip
              label="Last month"
              selected={month !== monthKeyOf()}
              onPress={() => setMonth(addMonths(monthKeyOf(), -1))}
            />
          </View>
        </Card>
      ) : null}

      <View className="mt-4">
        {transactions.isLoading ? (
          <SkeletonList count={6} />
        ) : all.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Receipt size={26} color="#8B8B94" />}
              title={search ? 'No matches' : 'No transactions yet'}
              message={
                search
                  ? 'Try a different search term, or clear the filters.'
                  : 'Record your first transaction to start building your history.'
              }
              actionLabel={search ? 'Clear search' : 'Add transaction'}
              onAction={() =>
                search ? setSearch('') : navigation.navigate('TransactionFormModal')
              }
            />
          </Card>
        ) : (
          <View className="gap-4">
            {sections.map((section) => (
              <View key={section.title}>
                <View className="mb-2 flex-row items-center justify-between px-1">
                  <Text variant="overline" tone="muted">
                    {section.title.toUpperCase()}
                  </Text>
                  <Badge
                    label={`${formatMoney(
                      section.data.reduce(
                        (sum, t) => sum + (t.type === 'expense' ? t.amount : t.type === 'income' ? -t.amount : 0),
                        0,
                      ),
                      currency,
                    )}`}
                    tone="neutral"
                  />
                </View>
                <Card padded={false}>
                  {section.data.map((transaction, index) => (
                    <View
                      key={transaction.id}
                      className={index > 0 ? 'border-t border-border' : ''}
                    >
                      <TransactionRow
                        transaction={transaction}
                        currency={currency}
                        onPress={() =>
                          navigation.navigate('TransactionDetail', {
                            transactionId: transaction.id,
                          })
                        }
                      />
                    </View>
                  ))}
                </Card>
              </View>
            ))}

            {transactions.hasNextPage ? (
              <Button
                label="Load more"
                variant="secondary"
                loading={transactions.isFetchingNextPage}
                onPress={() => void transactions.fetchNextPage()}
              />
            ) : (
              <Text variant="caption" tone="muted" center className="py-2">
                That is every transaction this month.
              </Text>
            )}
          </View>
        )}
      </View>

      <View className="mt-5">
        <Button
          label="Add transaction"
          icon={<Plus size={18} color="#FFFFFF" />}
          onPress={() => navigation.navigate('TransactionFormModal')}
        />
      </View>
      <View style={{ height: 4 }} />
    </Screen>
  );
}