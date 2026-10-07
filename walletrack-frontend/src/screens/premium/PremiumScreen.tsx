import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, Crown, Download, X } from 'lucide-react-native';

import { Badge, InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import {
  useCancelPremium,
  usePremiumPlans,
  usePremiumStatus,
} from '../../hooks/queries';
import { cn } from '../../theme/utils';
import { useToast } from '../../utils/toast';
import { formatMoney } from '../../utils/format';

export default function PremiumScreen() {
  const navigation = useNavigation();
  const plans = usePremiumPlans();
  const status = usePremiumStatus();
  const cancel = useCancelPremium();
  const toast = useToast();

  const isPremium = status.data?.isPremium ?? false;
  const activePlan = plans.data?.plans.find((plan) => plan.id === status.data?.planId);

  function handleRestore() {
    toast.error('Google Play Billing is not connected in this build.');
  }

  async function handleCancel() {
    try {
      await cancel.mutateAsync();
      toast.success('Premium cancelled. You keep access until the period ends.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not cancel premium.');
    }
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title="Premium"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            accessibilityLabel="Close"
            icon={<X size={20} color="#8B8B94" />}
            onPress={() => navigation.goBack()}
          />
        }
      />

      <Card className="items-center border-primary bg-primarySoft">
        <View className="h-12 w-12 items-center justify-center rounded-pill bg-white">
          <Crown size={24} color="#4F46E5" />
        </View>
        <Text variant="title3" tone="primary" center className="mt-3">
          {isPremium ? 'You have Premium' : 'Walletrack Premium'}
        </Text>
        <Text variant="callout" tone="secondary" center className="mt-1">
          {isPremium
            ? `${activePlan?.name ?? 'Premium'}${
                status.data?.expiresAt
                  ? ` · active until ${new Date(status.data.expiresAt).toLocaleDateString()}`
                  : ''
              }`
            : 'One payment, no subscription tricks. Everything stays yours even if you cancel.'}
        </Text>
      </Card>

      <SectionHeader title="What you get" className="mt-6" />
      <Card padded={false}>
        {[
          'Unlimited accounts, budgets and transaction history',
          'Advanced analytics, trends and category insights',
          'Export your data as CSV any time',
          'Priority support',
        ].map((feature, index) => (
          <View key={feature}>
            {index > 0 ? <View className="h-px bg-border" /> : null}
            <View className="flex-row items-center px-4 py-3">
              <View className="h-6 w-6 items-center justify-center rounded-pill bg-successSoft">
                <Check size={14} color="#059669" strokeWidth={3} />
              </View>
              <Text variant="body" className="ml-3 flex-1">
                {feature}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {status.data ? (
        <Card className="mt-4">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text variant="bodyStrong">Your limits</Text>
              <Text variant="caption" tone="muted">
                {status.data.limits.tier === 'premium' ? 'Premium tier' : 'Free tier'}
              </Text>
            </View>
            <Badge
              label={status.data.limits.tier === 'premium' ? 'Unlimited' : 'Free'}
              tone={status.data.limits.tier === 'premium' ? 'success' : 'neutral'}
            />
          </View>
          <View className="mt-3">
            <LimitRow label="Accounts" value={status.data.limits.maxAccounts} />
            <LimitRow label="Budgets" value={status.data.limits.maxBudgets} />
            <LimitRow label="Custom categories" value={status.data.limits.maxCustomCategories} />
            <LimitRow label="Months of history" value={status.data.limits.monthsOfHistory} />
          </View>
        </Card>
      ) : null}

      {plans.data?.plans.map((plan) => {
        const isActive = isPremium && plan.id === status.data?.planId;
        return (
          <Card key={plan.id} className={cn('mt-4', plan.badge && 'border-primary')}>
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text variant="bodyStrong">{plan.name}</Text>
                <Text variant="caption" tone="muted">
                  {plan.period === 'yearly'
                    ? `${formatMoney(plan.priceMinor, plan.currency)} a year · ${formatMoney(
                        plan.pricePerMonthMinor,
                        plan.currency,
                      )} a month`
                    : `${formatMoney(plan.priceMinor, plan.currency)} a month`}
                </Text>
              </View>
              {plan.badge ? <Badge label={plan.badge} tone="primary" /> : null}
            </View>

            {isActive ? (
              <View className="mt-3 flex-row items-center">
                <Check size={14} color="#059669" />
                <Text variant="caption" tone="success" className="ml-2">
                  Current plan
                </Text>
              </View>
            ) : (
              <Button
                label="Choose plan"
                variant={plan.badge ? 'primary' : 'secondary'}
                className="mt-4"
                disabled={isPremium}
                onPress={() =>
                  toast.error('Google Play Billing is not connected in this build.')
                }
              />
            )}
          </Card>
        );
      })}

      <SectionHeader title="Billing" className="mt-6" />
      <View className="gap-3">
        <Button
          label="Restore purchase"
          variant="secondary"
          icon={<Download size={18} color="#18181B" />}
          onPress={handleRestore}
        />
        {isPremium ? (
          <Button label="Cancel premium" variant="danger" onPress={() => void handleCancel()} loading={cancel.isPending} />
        ) : null}
      </View>

      <Text variant="caption" tone="muted" center className="mt-6">
        Payments are handled by Google Play. Walletrack never sees your card details.
      </Text>
    </Screen>
  );
}

function LimitRow({ label, value }: { label: string; value: number | null }) {
  return (
    <View className="flex-row items-center py-1.5">
      <Text variant="callout" tone="secondary" className="flex-1">
        {label}
      </Text>
      <Text variant="bodyStrong" tone={value === null ? 'success' : 'default'}>
        {value === null ? 'Unlimited' : value}
      </Text>
    </View>
  );
}