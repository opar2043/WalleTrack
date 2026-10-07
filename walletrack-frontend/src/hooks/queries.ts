/**
 * React Query hooks. Each mutation declares the query keys it invalidates, so
 * a new transaction immediately refreshes the dashboard, budgets, analytics and
 * every affected account balance without any manual cache plumbing.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useAuthStore } from '../store/authStore';
import {
  accountsApi,
  analyticsApi,
  authApi,
  budgetsApi,
  categoriesApi,
  dashboardApi,
  insightsApi,
  premiumApi,
  transactionsApi,
  usersApi,
  type AccountInput,
  type BudgetInput,
  type LoginInput,
  type RegisterInput,
  type TransactionInput,
} from '../api/endpoints';
import type {
  Account,
  Budget,
  Category,
  DashboardData,
  InsightsData,
  MonthlyAnalytics,
  Paginated,
  PremiumLimits,
  PremiumPlansResponse,
  PremiumStatus,
  Transaction,
  TransactionMutationResult,
  TransactionQuery,
  User,
} from '../types/api';

export const queryKeys = {
  user: ['user'] as const,
  categories: (type?: string) => ['categories', type ?? 'all'] as const,
  accounts: (includeArchived: boolean) => ['accounts', includeArchived] as const,
  transactions: (query: TransactionQuery) => ['transactions', query] as const,
  budgets: (month: string) => ['budgets', month] as const,
  dashboard: (range: number) => ['dashboard', range] as const,
  monthlyAnalytics: (month: string) => ['analytics', 'monthly', month] as const,
  analyticsMonths: ['analytics', 'months'] as const,
  categoryDetail: (categoryId: string, month: string) =>
    ['analytics', 'category', categoryId, month] as const,
  insights: (month: string) => ['insights', month] as const,
  premiumStatus: ['premium', 'status'] as const,
  premiumLimits: ['premium', 'limits'] as const,
  premiumPlans: ['premium', 'plans'] as const,
};

/** Everything whose contents change when money moves. */
function useInvalidateMoneyViews() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['insights'] });
  };
}

/* ------------------------------------------------------------------ profile */

export const useCurrentUser = (): UseQueryResult<User> =>
  useQuery({ queryKey: queryKeys.user, queryFn: usersApi.me, staleTime: 5 * 60_000 });

export function useUpdateProfile(): UseMutationResult<User, Error, Partial<User>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(queryKeys.user, user);
    },
  });
}

export function useCompleteOnboarding(): UseMutationResult<
  User,
  Error,
  { country: string; currency: string; locale: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.completeOnboarding,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(queryKeys.user, user);
    },
  });
}

export function useUpdatePreferences(): UseMutationResult<User, Error, Partial<Pick<User, 'themePreference' | 'notificationsEnabled' | 'hideBalances' | 'country' | 'currency' | 'locale'>>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updatePreferences,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(queryKeys.user, user);
    },
  });
}

export const useChangePassword = (): UseMutationResult<
  null,
  Error,
  { currentPassword: string; newPassword: string }
> =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
  });

export const useDeleteAccount = (): UseMutationResult<null, Error, void> =>
  useMutation({ mutationFn: () => usersApi.deleteAccount() });

/* --------------------------------------------------------------- categories */

export const useCategories = (type?: 'income' | 'expense'): UseQueryResult<Category[]> =>
  useQuery({ queryKey: queryKeys.categories(type), queryFn: () => categoriesApi.list(type) });

export function useCreateCategory(): UseMutationResult<
  Category,
  Error,
  { name: string; type: 'income' | 'expense'; icon?: string; color?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory(): UseMutationResult<
  Category,
  Error,
  { id: string; input: { name?: string; icon?: string; color?: string; monthlyTarget?: number | null } }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => categoriesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory(): UseMutationResult<null, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

/* ----------------------------------------------------------------- accounts */

export const useAccounts = (includeArchived = false): UseQueryResult<Account[]> =>
  useQuery({
    queryKey: queryKeys.accounts(includeArchived),
    queryFn: () => accountsApi.list(includeArchived),
  });

export function useCreateAccount(): UseMutationResult<Account, Error, AccountInput> {
  const invalidate = useInvalidateMoneyViews();
  return useMutation({ mutationFn: accountsApi.create, onSuccess: invalidate });
}

export function useUpdateAccount(): UseMutationResult<
  Account,
  Error,
  { id: string; input: Partial<AccountInput> }
> {
  const invalidate = useInvalidateMoneyViews();
  return useMutation({
    mutationFn: ({ id, input }) => accountsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useArchiveAccount(): UseMutationResult<
  Account,
  Error,
  { id: string; isArchived: boolean }
> {
  const invalidate = useInvalidateMoneyViews();
  return useMutation({
    mutationFn: ({ id, isArchived }) => accountsApi.archive(id, isArchived),
    onSuccess: invalidate,
  });
}

export function useDeleteAccountItem(): UseMutationResult<null, Error, string> {
  const invalidate = useInvalidateMoneyViews();
  return useMutation({ mutationFn: accountsApi.remove, onSuccess: invalidate });
}

/* ------------------------------------------------------------- transactions */

const TRANSACTIONS_PAGE_SIZE = 25;

/** Infinite scroll for the transaction history list. */
export function useTransactions(query: TransactionQuery = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions(query),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      transactionsApi.list({ ...query, page: pageParam, limit: TRANSACTIONS_PAGE_SIZE }),
    getNextPageParam: (lastPage: Paginated<Transaction>) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
  });
}

export const useTransaction = (id: string | undefined): UseQueryResult<Transaction> =>
  useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.get(id as string),
    enabled: Boolean(id),
  });

/** Every mutation that moves money invalidates the same set of views. */
function useMoneyMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
): UseMutationResult<TOutput, Error, TInput> {
  const invalidate = useInvalidateMoneyViews();
  return useMutation({ mutationFn, onSuccess: invalidate });
}

export const useCreateTransaction = () =>
  useMoneyMutation<TransactionInput, TransactionMutationResult>(transactionsApi.create);

export const useUpdateTransaction = () =>
  useMoneyMutation<{ id: string; input: Partial<TransactionInput> }, TransactionMutationResult>(
    ({ id, input }) => transactionsApi.update(id, input),
  );

export const useDeleteTransaction = () =>
  useMoneyMutation<string, { alerts: never[] }>(transactionsApi.remove);

/* ------------------------------------------------------------------ budgets */

export const useBudgetSummary = (month: string) =>
  useQuery({
    queryKey: queryKeys.budgets(month),
    queryFn: () => budgetsApi.summary(month),
    enabled: /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
  });

export function useCreateBudget(): UseMutationResult<Budget, Error, BudgetInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget(): UseMutationResult<
  Budget,
  Error,
  { id: string; input: Partial<Omit<BudgetInput, 'month'>> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => budgetsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget(): UseMutationResult<null, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export const useCopyBudgets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromMonth, toMonth }: { fromMonth: string; toMonth: string }) =>
      budgetsApi.copy(fromMonth, toMonth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
};

/* -------------------------------------------------- dashboard & analytics */

export const useDashboard = (range: 7 | 30): UseQueryResult<DashboardData> =>
  useQuery({
    queryKey: queryKeys.dashboard(range),
    queryFn: () => dashboardApi.get(range),
    staleTime: 30_000,
  });

export const useMonthlyAnalytics = (month: string): UseQueryResult<MonthlyAnalytics> =>
  useQuery({
    queryKey: queryKeys.monthlyAnalytics(month),
    queryFn: () => analyticsApi.monthly(month),
    enabled: /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
  });

export const useAnalyticsMonths = (): UseQueryResult<string[]> =>
  useQuery({ queryKey: queryKeys.analyticsMonths, queryFn: analyticsApi.months });

export const useCategoryDetail = (categoryId: string | undefined, month: string) =>
  useQuery({
    queryKey: queryKeys.categoryDetail(categoryId ?? '', month),
    queryFn: () => analyticsApi.category(categoryId as string, month),
    enabled: Boolean(categoryId),
  });

export const useInsights = (month: string): UseQueryResult<InsightsData> =>
  useQuery({
    queryKey: queryKeys.insights(month),
    queryFn: () => insightsApi.get(month),
    enabled: /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
  });

/* ------------------------------------------------------------------ premium */

export const usePremiumPlans = (): UseQueryResult<PremiumPlansResponse> =>
  useQuery({ queryKey: queryKeys.premiumPlans, queryFn: premiumApi.plans, staleTime: 10 * 60_000 });

export const usePremiumStatus = (): UseQueryResult<PremiumStatus> =>
  useQuery({ queryKey: queryKeys.premiumStatus, queryFn: premiumApi.status });

export const usePremiumLimits = (): UseQueryResult<PremiumLimits> =>
  useQuery({ queryKey: queryKeys.premiumLimits, queryFn: premiumApi.limits });

export const usePremiumPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, purchaseToken }: { productId: string; purchaseToken: string }) =>
      premiumApi.purchase(productId, purchaseToken),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.invalidateQueries({ queryKey: ['premium'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRestorePremium = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, purchaseToken }: { productId: string; purchaseToken: string }) =>
      premiumApi.restore(productId, purchaseToken),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.invalidateQueries({ queryKey: ['premium'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useCancelPremium = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: premiumApi.cancel,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.invalidateQueries({ queryKey: ['premium'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export type { LoginInput, RegisterInput, TransactionInput, AccountInput, BudgetInput };
