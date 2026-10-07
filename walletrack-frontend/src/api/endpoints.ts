/**
 * Typed endpoint map. Every screen goes through these functions, so the URL
 * strings and payload shapes live in exactly one place.
 */

import { api } from './client';
import type {
  Account,
  AuthResponse,
  Budget,
  BudgetSummary,
  Category,
  CategoryDetail,
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

export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string };

export type AccountInput = {
  name: string;
  type: Account['type'];
  startingBalance?: number;
  color?: string;
  icon?: string | null;
  note?: string | null;
};

export type TransactionInput = {
  type: Transaction['type'];
  amount: number;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  date?: string;
  note?: string | null;
};

export type BudgetInput = {
  month: string;
  limit: number;
  categoryId?: string | null;
  note?: string | null;
};

function revocationOptions(token?: string) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', input, { skipAuth: true }),
  login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input, { skipAuth: true }),
  /**
   * The token can be passed explicitly so revocation still authenticates after
   * the local copy has been dropped from the keystore.
   */
  logout: (token?: string) =>
    api.post<null>('/auth/logout', undefined, revocationOptions(token)),
  logoutAll: (token?: string) =>
    api.post<null>('/auth/logout-all', undefined, revocationOptions(token)),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<null>('/auth/change-password', { currentPassword, newPassword }),
};

export const usersApi = {
  me: () => api.get<User>('/users/me'),
  updateProfile: (input: Partial<Pick<User, 'name' | 'avatarColor'>>) =>
    api.patch<User>('/users/me', input),
  completeOnboarding: (input: {
    country: string;
    currency: string;
    locale: string;
  }) => api.post<User>('/users/me/onboarding', input),
  updatePreferences: (
    input: Partial<
      Pick<User, 'themePreference' | 'notificationsEnabled' | 'hideBalances' | 'country' | 'currency' | 'locale'>
    >,
  ) => api.patch<User>('/users/me/preferences', input),
  deleteAccount: () => api.delete<null>('/users/me'),
};

export const categoriesApi = {
  list: (type?: 'income' | 'expense') => api.get<Category[]>('/categories', { params: { type } }),
  create: (input: { name: string; type: 'income' | 'expense'; icon?: string; color?: string }) =>
    api.post<Category>('/categories', input),
  update: (
    id: string,
    input: { name?: string; icon?: string; color?: string; monthlyTarget?: number | null },
  ) => api.patch<Category>(`/categories/${id}`, input),
  remove: (id: string) => api.delete<null>(`/categories/${id}`),
};

export const accountsApi = {
  list: (includeArchived = false) =>
    api.get<Account[]>('/accounts', { params: { includeArchived } }),
  create: (input: AccountInput) => api.post<Account>('/accounts', input),
  update: (id: string, input: Partial<AccountInput>) => api.patch<Account>(`/accounts/${id}`, input),
  archive: (id: string, isArchived: boolean) =>
    api.post<Account>(`/accounts/${id}/archive`, { isArchived }),
  remove: (id: string) => api.delete<null>(`/accounts/${id}`),
};

function toQueryParams(query: TransactionQuery) {
  const params: Record<string, string | number | undefined> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value as string | number;
    }
  });
  return params;
}

export const transactionsApi = {
  list: (query: TransactionQuery = {}) =>
    api.get<Paginated<Transaction>>('/transactions', { params: toQueryParams(query) }),
  get: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  create: (input: TransactionInput) =>
    api.post<TransactionMutationResult>('/transactions', input),
  update: (id: string, input: Partial<TransactionInput>) =>
    api.patch<TransactionMutationResult>(`/transactions/${id}`, input),
  remove: (id: string) => api.delete<{ alerts: never[] }>(`/transactions/${id}`),
};

export const budgetsApi = {
  summary: (month: string) => api.get<BudgetSummary>('/budgets', { params: { month } }),
  create: (input: BudgetInput) => api.post<Budget>('/budgets', input),
  copy: (fromMonth: string, toMonth: string) =>
    api.post<{ copied: number; skipped: number }>('/budgets/copy', { fromMonth, toMonth }),
  update: (id: string, input: Partial<Omit<BudgetInput, 'month'>>) =>
    api.patch<Budget>(`/budgets/${id}`, input),
  remove: (id: string) => api.delete<null>(`/budgets/${id}`),
};

export const dashboardApi = {
  get: (range: 7 | 30 = 7) => api.get<DashboardData>('/dashboard', { params: { range } }),
};

export const analyticsApi = {
  monthly: (month: string) => api.get<MonthlyAnalytics>('/analytics/monthly', { params: { month } }),
  months: () => api.get<string[]>('/analytics/months'),
  category: (categoryId: string, month: string) =>
    api.get<CategoryDetail>(`/analytics/categories/${categoryId}`, { params: { month } }),
};

export const insightsApi = {
  get: (month: string) => api.get<InsightsData>('/insights', { params: { month } }),
};

export const premiumApi = {
  plans: () => api.get<PremiumPlansResponse>('/premium/plans', { skipAuth: true }),
  status: () => api.get<PremiumStatus>('/premium/status'),
  limits: () => api.get<PremiumLimits>('/premium/limits'),
  purchase: (productId: string, purchaseToken: string) =>
    api.post<User>('/premium/purchase', { productId, purchaseToken }),
  restore: (productId: string, purchaseToken: string) =>
    api.post<User>('/premium/restore', { productId, purchaseToken }),
  cancel: () => api.post<User>('/premium/cancel'),
};
