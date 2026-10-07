/** Shared API types. These mirror the server's serialised response shapes. */

export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type BudgetStatus = 'safe' | 'warning' | 'overspent';
export type AlertSeverity = 'success' | 'warning' | 'danger';

/** Mirrors `toPublicUser` on the server: flat, stable, and screen-shaped. */
export type UserPreferences = {
  themePreference: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
  hideBalances: boolean;
  currency: string;
  locale: string;
  country: string;
};

export type UserPremium = {
  status: 'none' | 'active';
  planId: string | null;
  expiresAt: string | null;
  purchaseToken: string | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  country: string | null;
  currency: string;
  locale: string | null;
  themePreference: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
  hideBalances: boolean;
  onboardingCompleted: boolean;
  isPremium: boolean;
  premium: UserPremium;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: User;
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  startingBalance: number;
  balance: number;
  color: string;
  icon: string | null;
  note: string | null;
  isArchived: boolean;
  transactionCount: number;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  monthlyTarget?: number | null;
};

export type BudgetAlert = {
  severity: AlertSeverity;
  message: string;
  budget: {
    id: string;
    name: string;
    limit: number;
    spent: number;
    percentage: number;
    status: BudgetStatus;
  };
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  accountId: string;
  accountName: string;
  toAccountId: string | null;
  toAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  date: string;
  note: string | null;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type TransactionQuery = {
  page?: number;
  limit?: number;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date' | 'amount';
  order?: 'asc' | 'desc';
};

export type Budget = {
  id: string;
  month: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  note: string | null;
};

export type BudgetSummary = {
  month: string;
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  overallStatus: BudgetStatus;
  warningCount: number;
  overspentCount: number;
  budgets: Budget[];
};

export type DashboardData = {
  range: number;
  currency: string;
  totalBalance: number;
  balanceChange: number;
  balanceChangePercentage: number;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  comparison: { incomePercentage: number; expensePercentage: number };
  recentTransactions: Transaction[];
  topCategories: {
    categoryId: string | null;
    name: string;
    color: string;
    icon: string | null;
    total: number;
    percentage: number;
  }[];
  balanceSeries: { date: string; balance: number }[];
  expenseSeries: { date: string; total: number }[];
  budgetSummary: Pick<
    BudgetSummary,
    'month' | 'totalLimit' | 'totalSpent' | 'overallPercentage' | 'overallStatus'
  > | null;
};

export type MonthlyAnalytics = {
  month: string;
  currency: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  comparison: { incomePercentage: number; expensePercentage: number };
  transactionCount: number;
  dailySeries: { date: string; total: number }[];
  topCategories: {
    categoryId: string | null;
    name: string;
    color: string;
    icon: string | null;
    total: number;
    percentage: number;
  }[];
};

export type CategoryDetail = {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  month: string;
  total: number;
  transactionCount: number;
  averageTransaction: number;
  largestTransaction: number;
  dailySeries: { date: string; total: number }[];
  recentTransactions: Transaction[];
};

export type InsightsData = {
  month: string;
  currency: string;
  savingsRate: number;
  averageDailySpend: number;
  averageTransaction: number;
  biggestCategory: { name: string; total: number; percentage: number } | null;
  topSpendingDay: { date: string; total: number } | null;
  spendingTrend: number;
  insights: { id: string; title: string; message: string; tone: string }[];
};

export type PremiumLimits = {
  tier: 'free' | 'premium';
  maxAccounts: number | null;
  maxBudgets: number | null;
  maxCustomCategories: number | null;
  monthsOfHistory: number | null;
  features: {
    unlimitedAccounts: boolean;
    unlimitedBudgets: boolean;
    customCategories: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
    multiCurrency: boolean;
  };
};

export type PremiumStatus = {
  isPremium: boolean;
  status: 'none' | 'active';
  planId: string | null;
  expiresAt: string | null;
  limits: PremiumLimits;
};

export type PremiumPlan = {
  id: string;
  name: string;
  period: 'monthly' | 'yearly';
  intervalDays: number;
  /** Minor units, e.g. 499 = $4.99. */
  priceMinor: number;
  pricePerMonthMinor: number;
  currency: string;
  badge: string | null;
};

export type PremiumBenefit = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type PremiumPlansResponse = {
  plans: PremiumPlan[];
  benefits: PremiumBenefit[];
};

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: { path: string; message: string }[];
};

export type TransactionMutationResult = {
  transaction: Transaction;
  alerts: BudgetAlert[];
};
