import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, SegmentedControl } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAccounts, useCreateAccount, useUpdateAccount } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { AVATAR_COLORS, cn } from '../../theme/utils';
import {
  currencySymbol,
  formatMoney,
  minorUnitsToInput,
  parseAmountToMinorUnits,
} from '../../utils/format';
import type { AccountType } from '../../types/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../utils/toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type FormRoute = RouteProp<RootStackParamList, 'AccountForm'>;

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit', label: 'Card' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
];

export default function AccountFormScreen() {
  const toast = useToast();

  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<FormRoute>();
  const accountId = params?.accountId;

  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';
  const accounts = useAccounts(true);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const existing = accounts.data?.find((account) => account.id === accountId);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balanceInput, setBalanceInput] = useState('');
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setType(existing.type);
      setBalanceInput(minorUnitsToInput(existing.startingBalance, currency));
      setColor(existing.color);
      setNote(existing.note ?? '');
    }
  }, [currency, existing]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Give this account a name.';
    if (accountId) {
      // On edit the field is a starting balance shift, so zero is valid.
      if (parseAmountToMinorUnits(balanceInput || '0', currency) === null) {
        next.balance = 'Enter a valid number.';
      }
    } else if ((parseAmountToMinorUnits(balanceInput || '0', currency) ?? 0) < 0) {
      next.balance = 'Starting balance cannot be negative. Use a card for debt.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const startingBalance = parseAmountToMinorUnits(balanceInput || '0', currency) ?? 0;

    try {
      if (accountId) {
        await updateAccount.mutateAsync({
          id: accountId,
          input: { name: name.trim(), type, startingBalance, color, note: note.trim() || null },
        });
        toast.success('Account updated');
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          startingBalance,
          color,
          note: note.trim() || null,
        });
        toast.success('Account created');
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      // Inline error covers this.
    }
  }

  const isSaving = createAccount.isPending || updateAccount.isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <View className="flex-1">
          <Text variant="title3">{accountId ? 'Edit account' : 'New account'}</Text>
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
        <SegmentedControl options={TYPES} value={type} onChange={setType} />

        <Input
          label="Name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: '' }));
          }}
          placeholder={type === 'bank' ? 'Main Bank' : type === 'cash' ? 'Wallet' : 'Travel Card'}
          autoCapitalize="words"
          error={errors.name}
          containerClassName="mt-4"
          autoFocus={!accountId}
        />

        <Input
          label={accountId ? 'New starting balance' : 'Starting balance'}
          value={balanceInput}
          onChangeText={(value) => {
            setBalanceInput(value.replace(/[^0-9.]/g, ''));
            setErrors((current) => ({ ...current, balance: '' }));
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          leading={<Text variant="body" tone="muted">{currencySymbol(currency)}</Text>}
          error={errors.balance}
          hint={
            accountId
              ? 'Changing this shifts the current balance by the same amount.'
              : "What's in the account right now. You can change it later."
          }
          containerClassName="mt-4"
        />

        {parseAmountToMinorUnits(balanceInput || '0', currency) !== null &&
        (parseAmountToMinorUnits(balanceInput || '0', currency) ?? 0) > 0 ? (
          <Text variant="caption" tone="muted" className="mt-1.5" tabular>
            {formatMoney(parseAmountToMinorUnits(balanceInput, currency) ?? 0, currency)}
          </Text>
        ) : null}

        <View className="mt-4">
          <Text variant="label" tone="secondary" className="mb-2">
            Colour
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {AVATAR_COLORS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${option}`}
                accessibilityState={{ selected: option === color }}
                onPress={() => setColor(option)}
                className="h-9 w-9 items-center justify-center rounded-pill"
                style={{ backgroundColor: `${option}26` }}
              >
                <View
                  className="h-6 w-6 items-center justify-center rounded-pill"
                  style={{ backgroundColor: option }}
                >
                  {option === color ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Emergency fund"
          maxLength={120}
          containerClassName="mt-4"
        />

        {type === 'credit' ? (
          <Card className="mt-4">
            <Text variant="callout" tone="secondary">
              Card balances go negative as you spend, and Walletrack tracks what you owe
              separately from what you hold.
            </Text>
          </Card>
        ) : null}

        <View className="mt-5">
          <InlineError
            message={createAccount.error?.message ?? updateAccount.error?.message}
          />
          <Button
            label={accountId ? 'Save changes' : 'Create account'}
            size="lg"
            onPress={() => void handleSave()}
            loading={isSaving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}