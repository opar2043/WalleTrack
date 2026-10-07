import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Target,
  Trash2,
} from 'lucide-react-native';

import {
  Badge,
  EmptyState,
  ErrorState,
  ProgressBar,
  SkeletonCard,
  STATUS_LABEL,
  STATUS_TONE,
} from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Input, SegmentedControl } from '../../components/ui/Input';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Sheet } from '../../components/ui/Sheet';
import { Text } from '../../components/ui/Text';
import {
  useBudgetSummary,
  useCategories,
  useCopyBudgets,
  useCreateBudget,
  useDeleteBudget,
} from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import {
  addMonths,
  currencySymbol,
  formatMoney,
  formatPercent,
  monthKeyOf,
  monthLabel,
  parseAmountToMinorUnits,
} from '../../utils/format';
import type { Budget } from '../../types/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useToast } from '../../utils/toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function BudgetsScreen() {
  const toast = useToast();

  const navigation = useNavigation<Navigation>();
  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';

  const [month, setMonth] = useState(monthKeyOf());
  const [createVisible, setCreateVisible] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);

  const summary = useBudgetSummary(month);
  const removeBudget = useDeleteBudget();

  const data = summary.data;
  const isCurrentMonth = month === monthKeyOf();

  const overallTone = useMemo(() => {
    if (!data) return 'safe' as const;
    if (data.overallStatus === 'overspent') return 'overspent' as const;
    if (data.overallStatus === 'warning') return 'warning' as const;
    return 'safe' as const;
  }, [data]);

  function handleDelete(budget: Budget) {
    removeBudget.mutate(budget.id, {
      onSuccess: () => toast.success('Budget removed'),
      onError: (error) => toast.error(error.message),
    });
  }

  if (summary.isError) {
    return (
      <Screen edges={{ top: true, bottom: false }} bottomInset={80}>
        <ScreenHeader title="Budgets" />
        <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      edges={{ top: true, bottom: false }}
      bottomInset={80}
      refreshing={summary.isRefetching}
      onRefresh={() => void summary.refetch()}
    >
      <ScreenHeader
        title="Budgets"
        subtitle={monthLabel(month)}
        right={
          <IconButton
            accessibilityLabel="Copy budgets to another month"
            icon={<Copy size={19} color="#8B8B94" />}
            onPress={() => setCopyVisible(true)}
          />
        }
      />

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
          <Text variant="captionStrong">{isCurrentMonth ? 'This month' : monthLabel(month)}</Text>
        </Pressable>
        <IconButton
          accessibilityLabel="Next month"
          icon={<ChevronRight size={22} color="#18181B" />}
          onPress={() => setMonth(addMonths(month, 1))}
        />
      </View>

      {/* ------------------------------------------------------ overall card */}
      <Card variant="raised">
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text variant="overline" tone="muted">
              TOTAL SPENT
            </Text>
            <Text variant="amount" tabular className="mt-1">
              {summary.isLoading ? '—' : formatMoney(data?.totalSpent ?? 0, currency)}
            </Text>
            <Text variant="caption" tone="muted" className="mt-0.5">
              of {formatMoney(data?.totalLimit ?? 0, currency)} budgeted
            </Text>
          </View>
          <Badge
            label={STATUS_LABEL[overallTone]}
            tone={STATUS_TONE[overallTone]}
            icon={<Target size={13} color="#059669" />}
          />
        </View>

        <ProgressBar
          percentage={data?.overallPercentage ?? 0}
          tone={overallTone}
          className="mt-4"
          height={10}
        />

        {data && data.totalRemaining < 0 ? (
          <View className="mt-3 flex-row items-center rounded-md bg-dangerSoft px-3 py-2">
            <AlertTriangle size={15} color="#DC2626" />
            <Text variant="caption" tone="danger" className="ml-2 flex-1">
              You are {formatMoney(Math.abs(data.totalRemaining), currency)} over budget.
            </Text>
          </View>
        ) : null}

        {(data?.warningCount ?? 0) > 0 || (data?.overspentCount ?? 0) > 0 ? (
          <View className="mt-3 flex-row gap-2">
            {data!.overspentCount > 0 ? (
              <Badge label={`${data!.overspentCount} overspent`} tone="danger" />
            ) : null}
            {data!.warningCount > 0 ? (
              <Badge label={`${data!.warningCount} close to limit`} tone="warning" />
            ) : null}
          </View>
        ) : null}
      </Card>

      {/* ---------------------------------------------------- budget list */}
      <SectionHeader
        title="Category budgets"
        className="mt-6"
        action={
          <Text
            variant="captionStrong"
            tone="primary"
            onPress={() => setCreateVisible(true)}
            suppressHighlighting
          >
            + Add
          </Text>
        }
      />

      {summary.isLoading ? (
        <View className="gap-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </View>
      ) : data && data.budgets.length > 0 ? (
        <View className="gap-3">
          {data.budgets.map((budget) => (
            <Card key={budget.id} padded={false}>
              <View className="p-4">
                <View className="flex-row items-start">
                  <View className="flex-1 pr-2">
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {budget.name}
                    </Text>
                    <Text variant="caption" tone="muted" tabular>
                      {formatMoney(budget.spent, currency)} of {formatMoney(budget.limit, currency)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text variant="label" tabular>
                      {formatPercent(budget.percentage)}
                    </Text>
                    <Badge
                      label={STATUS_LABEL[budget.status]}
                      tone={STATUS_TONE[budget.status]}
                      className="mt-1"
                    />
                  </View>
                </View>

                <ProgressBar percentage={budget.percentage} tone={budget.status} className="mt-3" />

                <Text variant="caption" tone="muted" className="mt-2" tabular>
                  {budget.remaining >= 0
                    ? `${formatMoney(budget.remaining, currency)} left`
                    : `${formatMoney(Math.abs(budget.remaining), currency)} over`}
                </Text>
              </View>

              <View className="flex-row items-center border-t border-border px-2 py-1">
                <View className="flex-1" />
                <IconButton
                  accessibilityLabel={`Delete ${budget.name} budget`}
                  icon={<Trash2 size={17} color="#DC2626" />}
                  size={40}
                  tone="danger"
                  onPress={() => handleDelete(budget)}
                />
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card>
          <EmptyState
            icon={<Target size={26} color="#8B8B94" />}
            title="No budgets yet"
            message="Set a monthly limit and Walletrack will warn you at 80% and again at 100%."
            actionLabel="Create a budget"
            onAction={() => setCreateVisible(true)}
          />
        </Card>
      )}

      <Button
        label="New budget"
        icon={<Plus size={18} color="#FFFFFF" />}
        className="mt-5"
        onPress={() => setCreateVisible(true)}
      />
      <View style={{ height: 4 }} />

      <CreateBudgetSheet
        visible={createVisible}
        month={month}
        onClose={() => setCreateVisible(false)}
        onCreated={(name) => {
          setCreateVisible(false);
          toast.success(`${name} budget created`);
        }}
      />

      <CopyBudgetSheet
        visible={copyVisible}
        fromMonth={month}
        onClose={() => setCopyVisible(false)}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------ create sheet */

function CreateBudgetSheet({
  visible,
  month,
  onClose,
  onCreated,
}: {
  visible: boolean;
  month: string;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const currency = useAuthStore((state) => state.user?.currency) ?? 'USD';
  const categories = useCategories('expense');
  const summary = useBudgetSummary(month);
  const createBudget = useCreateBudget();

  const [scope, setScope] = useState<'overall' | 'category'>('category');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [limitInput, setLimitInput] = useState('');
  const [error, setError] = useState<string | undefined>();

  const existingIds = useMemo(
    () => new Set((summary.data?.budgets ?? []).map((budget) => budget.categoryId).filter(Boolean)),
    [summary.data],
  );

  const available = (categories.data ?? []).filter((category) => !existingIds.has(category.id));

  async function handleSave() {
    const limit = parseAmountToMinorUnits(limitInput, currency);
    if (limit === null || limit <= 0) {
      setError('Enter a limit greater than zero.');
      return;
    }
    if (scope === 'category' && !categoryId) {
      setError('Choose a category.');
      return;
    }

    try {
      await createBudget.mutateAsync({
        month,
        limit,
        categoryId: scope === 'overall' ? null : categoryId,
      });
      setLimitInput('');
      setCategoryId(undefined);
      setError(undefined);
      onCreated(
        scope === 'overall'
          ? 'Monthly'
          : (categories.data ?? []).find((category) => category.id === categoryId)?.name ??
              'Category',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the budget.');
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="New budget"
      subtitle={monthLabel(month)}
      footer={
        <Button
          label="Create budget"
          onPress={() => void handleSave()}
          loading={createBudget.isPending}
        />
      }
    >
      <SegmentedControl
        label="Applies to"
        value={scope}
        onChange={(value) => {
          setScope(value);
          setError(undefined);
        }}
        options={[
          { value: 'category', label: 'A category' },
          { value: 'overall', label: 'Everything' },
        ]}
      />

      {scope === 'category' ? (
        <View className="mt-4">
          <Text variant="label" tone="secondary" className="mb-2">
            Category
          </Text>
          {available.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {available.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category.id === categoryId }}
                  onPress={() => {
                    setCategoryId(category.id);
                    setError(undefined);
                  }}
                  className={[
                    'flex-row items-center rounded-pill border px-3 py-2',
                    category.id === categoryId
                      ? 'border-primary bg-primarySoft'
                      : 'border-border bg-surface',
                  ].join(' ')}
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
                </Pressable>
              ))}
            </View>
          ) : (
            <Text variant="caption" tone="muted">
              Every expense category already has a budget for this month.
            </Text>
          )}
        </View>
      ) : null}

      <Input
        label="Monthly limit"
        value={limitInput}
        onChangeText={(value) => {
          setLimitInput(value.replace(/[^0-9.]/g, ''));
          setError(undefined);
        }}
        placeholder="0.00"
        keyboardType="decimal-pad"
        leading={<Text variant="body" tone="muted">{currencySymbol(currency)}</Text>}
        error={error}
        containerClassName="mt-4"
      />
    </Sheet>
  );
}

/* -------------------------------------------------------------- copy sheet */

function CopyBudgetSheet({
  visible,
  fromMonth,
  onClose,
}: {
  visible: boolean;
  fromMonth: string;
  onClose: () => void;
}) {
  const copyBudgets = useCopyBudgets();
  const toast = useToast();
  const [target, setTarget] = useState(addMonths(fromMonth, 1));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Copy budgets"
      subtitle={`Duplicates every budget from ${monthLabel(fromMonth)}.`}
      footer={
        <Button
          label="Copy budgets"
          onPress={() =>
            copyBudgets.mutate(
              { fromMonth, toMonth: target },
              {
                onSuccess: (result) => {
                  onClose();
                  toast.success(`Copied ${result.copied} budget${result.copied === 1 ? '' : 's'}`);
                },
                onError: (error) => toast.error(error.message),
              },
            )
          }
          loading={copyBudgets.isPending}
        />
      }
    >
      <Input
        label="Destination month"
        value={target}
        onChangeText={setTarget}
        placeholder="YYYY-MM"
        autoCapitalize="none"
        hint="Use the format YYYY-MM, for example 2026-11."
        error={!/^\d{4}-(0[1-9]|1[0-2])$/.test(target) ? 'Use the format YYYY-MM.' : undefined}
      />
      <View className="mt-3 flex-row gap-2">
        {[1, 2, 3].map((offset) => (
          <Button
            key={offset}
            label={monthLabel(addMonths(fromMonth, offset))}
            variant="secondary"
            size="sm"
            fullWidth={false}
            className="flex-1"
            onPress={() => setTarget(addMonths(fromMonth, offset))}
          />
        ))}
      </View>
    </Sheet>
  );
}