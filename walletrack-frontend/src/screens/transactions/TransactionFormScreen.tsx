import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarDays, ChevronDown, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Badge, InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, SegmentedControl } from '../../components/ui/Input';
import { Sheet } from '../../components/ui/Sheet';
import { Text } from '../../components/ui/Text';
import {
  useAccounts,
  useCategories,
  useCreateTransaction,
  useTransaction,
  useUpdateTransaction,
} from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../theme/utils';
import { useTheme } from '../../theme/ThemeProvider';
import { colorVar } from '../../theme/utils';
import {
  currencySymbol,
  dateKeyOf,
  formatMoney,
  minorUnitsToInput,
  parseAmountToMinorUnits,
} from '../../utils/format';
import type { BudgetAlert, TransactionType } from '../../types/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../utils/toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type FormRoute = RouteProp<RootStackParamList, 'TransactionFormModal'>;

type TypeOption = { value: TransactionType; label: string };

const TYPES: TypeOption[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
];

/** A forgiving date field: today by default, editable as `YYYY-MM-DD`. */
function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(draft);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Transaction date"
        onPress={() => {
          setDraft(value);
          setVisible(true);
        }}
        className="h-12 w-full flex-row items-center rounded-md border border-border bg-surface px-3"
      >
        <CalendarDays size={18} color="#8B8B94" />
        <Text variant="body" className="ml-2 flex-1" tabular>
          {valid ? new Date(`${value}T12:00:00`).toLocaleDateString() : value}
        </Text>
        <ChevronDown size={16} color={colorVar('contentMuted', isDark)} />
      </Pressable>

      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Transaction date"
        maxHeightRatio={0.6}
      >
        <Input
          label="Date"
          value={draft}
          onChangeText={setDraft}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          error={draft && !valid ? 'Use the format YYYY-MM-DD.' : undefined}
        />
        <View className="mt-3 flex-row gap-2">
          <Button
            label="Today"
            variant="secondary"
            fullWidth={false}
            className="flex-1"
            onPress={() => setDraft(dateKeyOf())}
          />
          <Button
            label="Yesterday"
            variant="secondary"
            fullWidth={false}
            className="flex-1"
            onPress={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setDraft(dateKeyOf(yesterday));
            }}
          />
        </View>
        <Button
          label="Done"
          className="mt-4"
          onPress={() => {
            if (valid) {
              onChange(draft);
              setVisible(false);
            }
          }}
        />
      </Sheet>
    </>
  );
}

export default function TransactionFormScreen() {
  const toast = useToast();

  const navigation = useNavigation<Navigation>();
  const route = useRoute<FormRoute>();
  const transactionId = route.params?.transactionId;

  const user = useAuthStore((state) => state.user);
  const currency = user?.currency ?? 'USD';

  const accounts = useAccounts();
  const expenseCategories = useCategories('expense');
  const incomeCategories = useCategories('income');
  const existing = useTransaction(transactionId);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>();
  const [toAccountId, setToAccountId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [date, setDate] = useState(dateKeyOf());
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState<'account' | 'toAccount' | 'category' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  // Prefill from the existing transaction, or fall back to the first account.
  useEffect(() => {
    if (existing.data) {
      const transaction = existing.data;
      setType(transaction.type);
      setAmountInput(minorUnitsToInput(transaction.amount, currency));
      setAccountId(transaction.accountId);
      setToAccountId(transaction.toAccountId ?? undefined);
      setCategoryId(transaction.categoryId ?? undefined);
      setDate(transaction.date);
      setNote(transaction.note ?? '');
    }
  }, [currency, existing.data]);

  useEffect(() => {
    if (!accountId && accounts.data && accounts.data.length > 0) {
      setAccountId(accounts.data[0].id);
    }
  }, [accountId, accounts.data]);

  // Income and expense categories are disjoint, so clear a now-invalid pick.
  useEffect(() => {
    if (!categoryId || !categories.data) return;
    if (!categories.data.some((category) => category.id === categoryId)) {
      setCategoryId(undefined);
    }
  }, [categories.data, categoryId]);

  const amountInMinorUnits = useMemo(
    () => parseAmountToMinorUnits(amountInput, currency),
    [amountInput, currency],
  );

  const selectedAccount = accounts.data?.find((account) => account.id === accountId);
  const selectedCategory = categories.data?.find((category) => category.id === categoryId);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (amountInMinorUnits === null || amountInMinorUnits <= 0) {
      next.amount = 'Enter an amount greater than zero.';
    }
    if (!accountId) next.accountId = 'Choose an account.';
    if (type === 'transfer') {
      if (!toAccountId) next.toAccountId = 'Choose a destination account.';
      else if (toAccountId === accountId) {
        next.toAccountId = 'Pick a different account than the source.';
      }
    } else if (!categoryId) {
      next.categoryId = 'Choose a category.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Use the format YYYY-MM-DD.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate() || amountInMinorUnits === null) return;

    const payload = {
      type,
      amount: amountInMinorUnits,
      accountId: accountId as string,
      toAccountId: type === 'transfer' ? toAccountId : null,
      categoryId: type === 'transfer' ? null : categoryId,
      date,
      note: note.trim() || null,
    };

    try {
      if (transactionId) {
        await updateTransaction.mutateAsync({ id: transactionId, input: payload });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Transaction updated');
      } else {
        const result: { alerts?: BudgetAlert[] } = await createTransaction.mutateAsync(payload);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const alert = result?.alerts?.[0];
        if (alert) {
          // Budget crossings surface immediately rather than waiting for the tab.
          if (alert.severity === 'danger') toast.error(alert.message);
          else if (alert.severity === 'warning') toast.warning(alert.message);
          else toast.success(alert.message);
        } else {
          toast.success('Transaction saved');
        }
      }
      navigation.goBack();
    } catch {
      // Inline error covers this.
    }
  }

  const isSaving = createTransaction.isPending || updateTransaction.isPending;
  const hasAccounts = (accounts.data?.length ?? 0) > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <View className="flex-1">
          <Text variant="title3">{transactionId ? 'Edit transaction' : 'New transaction'}</Text>
        </View>
        <IconButton
          accessibilityLabel="Close"
          icon={<X size={22} color="#8B8B94" />}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl options={TYPES} value={type} onChange={(next) => {
          setType(next);
          setCategoryId(undefined);
          setErrors({});
        }} />

        {/* --------------------------------------------------------- amount */}
        <Card className="mt-4">
          <Text variant="overline" tone="muted">
            AMOUNT
          </Text>
          <View className="mt-1 flex-row items-center">
            <Text variant="title1" tone="muted" tabular>
              {currencySymbol(currency)}
            </Text>
            <Input
              value={amountInput}
              onChangeText={(value) => {
                setAmountInput(value.replace(/[^0-9.]/g, ''));
                setErrors((current) => ({ ...current, amount: '' }));
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              size="lg"
              error={errors.amount}
              containerClassName="flex-1 ml-1"
              autoFocus={!transactionId}
              style={{ fontVariant: ['tabular-nums'] }}
            />
          </View>
          {amountInMinorUnits !== null && amountInMinorUnits > 0 ? (
            <Badge
              label={`${type === 'expense' ? '−' : type === 'income' ? '+' : ''}${formatMoney(
                amountInMinorUnits,
                currency,
              )}`}
              tone={type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'transfer'}
            />
          ) : null}
        </Card>

        {!hasAccounts ? (
          <Card className="mt-4">
            <Text variant="bodyStrong">Add an account first</Text>
            <Text variant="callout" tone="muted" className="mt-1">
              Transactions always belong to an account, so create one before recording
              money.
            </Text>
            <Button
              label="New account"
              className="mt-3"
              onPress={() => navigation.navigate('AccountForm')}
            />
          </Card>
        ) : (
          <>
            {/* ---------------------------------------------------- account */}
            <Card className="mt-4" padded={false}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPicker('account')}
                className="flex-row items-center px-4 py-3.5 active:opacity-60"
              >
                <View className="flex-1">
                  <Text variant="overline" tone="muted">
                    FROM
                  </Text>
                  <Text variant="bodyStrong">{selectedAccount?.name ?? 'Choose account'}</Text>
                </View>
                <ChevronDown size={18} color="#8B8B94" />
              </Pressable>
              {errors.accountId ? (
                <Text variant="caption" tone="danger" className="px-4 pb-3">
                  {errors.accountId}
                </Text>
              ) : null}

              {type === 'transfer' ? (
                <>
                  <View className="h-px bg-border" />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setPicker('toAccount')}
                    className="flex-row items-center px-4 py-3.5 active:opacity-60"
                  >
                    <View className="flex-1">
                      <Text variant="overline" tone="muted">
                        TO
                      </Text>
                      <Text variant="bodyStrong">
                        {accounts.data?.find((account) => account.id === toAccountId)?.name ??
                          'Choose destination'}
                      </Text>
                    </View>
                    <ChevronDown size={18} color="#8B8B94" />
                  </Pressable>
                  {errors.toAccountId ? (
                    <Text variant="caption" tone="danger" className="px-4 pb-3">
                      {errors.toAccountId}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </Card>

            {/* --------------------------------------------------- category */}
            {type !== 'transfer' ? (
              <Card className="mt-4" padded={false}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPicker('category')}
                  className="flex-row items-center px-4 py-3.5 active:opacity-60"
                >
                  <View className="flex-1">
                    <Text variant="overline" tone="muted">
                      CATEGORY
                    </Text>
                    <Text variant="bodyStrong">
                      {selectedCategory?.name ?? 'Choose category'}
                    </Text>
                  </View>
                  <ChevronDown size={18} color="#8B8B94" />
                </Pressable>
                {errors.categoryId ? (
                  <Text variant="caption" tone="danger" className="px-4 pb-3">
                    {errors.categoryId}
                  </Text>
                ) : null}
              </Card>
            ) : null}

            {/* ------------------------------------------------------- date */}
            <View className="mt-4">
              <Text variant="label" tone="secondary" className="mb-1.5">
                Date
              </Text>
              <DateField value={date} onChange={setDate} />
              {errors.date ? (
                <Text variant="caption" tone="danger" className="mt-1.5">
                  {errors.date}
                </Text>
              ) : null}
            </View>

            {/* ------------------------------------------------------- note */}
            <Input
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="Lunch with the team"
              maxLength={120}
              containerClassName="mt-4"
            />
          </>
        )}

        <View className="mt-5">
          <InlineError
            message={createTransaction.error?.message ?? updateTransaction.error?.message}
          />
          <Button
            label={transactionId ? 'Save changes' : 'Save transaction'}
            size="lg"
            onPress={handleSave}
            loading={isSaving}
            disabled={!hasAccounts}
          />
        </View>
      </ScrollView>

      {/* ------------------------------------------------------- pickers */}
      <Sheet
        visible={picker === 'account'}
        onClose={() => setPicker(null)}
        title="From account"
        maxHeightRatio={0.7}
      >
        {(accounts.data ?? []).map((account) => (
          <PickerRow
            key={account.id}
            title={account.name}
            caption={`${account.type} · ${formatMoney(account.balance, currency)}`}
            selected={account.id === accountId}
            onPress={() => {
              setAccountId(account.id);
              setPicker(null);
              setErrors({});
            }}
          />
        ))}
      </Sheet>

      <Sheet
        visible={picker === 'toAccount'}
        onClose={() => setPicker(null)}
        title="Destination account"
        maxHeightRatio={0.7}
      >
        {(accounts.data ?? [])
          .filter((account) => account.id !== accountId)
          .map((account) => (
            <PickerRow
              key={account.id}
              title={account.name}
              caption={`${account.type} · ${formatMoney(account.balance, currency)}`}
              selected={account.id === toAccountId}
              onPress={() => {
                setToAccountId(account.id);
                setPicker(null);
                setErrors({});
              }}
            />
          ))}
      </Sheet>

      <Sheet
        visible={picker === 'category'}
        onClose={() => setPicker(null)}
        title="Category"
        subtitle={`Shows ${type === 'income' ? 'income' : 'expense'} categories`}
        maxHeightRatio={0.75}
      >
        <View className="flex-row flex-wrap gap-2">
          {(categories.data ?? []).map((category) => (
            <View
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected: category.id === categoryId }}
              onTouchEnd={() => {
                setCategoryId(category.id);
                setPicker(null);
                setErrors({});
              }}
              className={cn(
                'flex-row items-center rounded-pill border px-3 py-2',
                category.id === categoryId
                  ? 'border-primary bg-primarySoft'
                  : 'border-border bg-surface',
              )}
            >
              <View
                className="h-2.5 w-2.5 rounded-pill"
                style={{ backgroundColor: category.color }}
              />
              <Text
                variant="captionStrong"
                tone={category.id === categoryId ? 'primary' : 'secondary'}
                className="ml-1.5"
              >
                {category.name}
              </Text>
            </View>
          ))}
        </View>
        <Button
          label="New category"
          variant="secondary"
          className="mt-5"
          onPress={() => {
            setPicker(null);
            navigation.navigate('CategoryForm');
          }}
        />
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function PickerRow({
  title,
  caption,
  selected,
  onPress,
}: {
  title: string;
  caption: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'flex-row items-center rounded-md px-3 py-3',
        selected ? 'bg-primarySoft' : 'bg-transparent',
      )}
    >
      <View className="flex-1">
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="muted">
          {caption}
        </Text>
      </View>
      {selected ? <Text variant="body" tone="primary">✓</Text> : null}
    </Pressable>
  );
}