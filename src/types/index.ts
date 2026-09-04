export type TransactionType = "income" | "expense" | "transfer";
export type ThemeMode = "light" | "dark" | "system";
export type AccountType = "cash" | "bank" | "card";
export type CategoryType = "income" | "expense";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type BudgetPeriod = "weekly" | "monthly" | "yearly";
export type DateRangeFilter = "day" | "week" | "month" | "year" | "custom";
export type UserLanguage = "en" | "hi";

export interface Profile {
  userId: string;
  fullName: string;
  avatarFileId?: string;
  nationality?: string;
  baseCurrency?: string;
  language?: string;
  theme: ThemeMode;
  biometricEnabled: boolean;
  isPremium: boolean;
  familyGroupId?: string;
}

export interface Account {
  $id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  icon: string;
  color: string;
  cardLast4?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  $id: string;
  userId?: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export interface TransactionSplit {
  categoryId: string;
  amount: number;
}

export interface Transaction {
  $id: string;
  userId: string;
  accountId: string;
  toAccountId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  convertedAmount: number;
  categoryId?: string;
  splits?: TransactionSplit[];
  note?: string;
  receiptFileId?: string;
  date: Date;
  paymentMethod?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringRuleId?: string;
  createdAt: string;
}

export interface RecurringRule {
  $id: string;
  userId: string;
  templateTransaction: {
    amount: number;
    categoryId: string;
    accountId: string;
    note?: string;
    currency: string;
  };
  frequency: RecurringFrequency;
  nextRunDate: Date;
  endDate?: Date;
  reminderEnabled: boolean;
  createdAt: string;
}

export interface Budget {
  $id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  alertThresholdPercent: number;
  createdAt: string;
}

export interface FamilyGroup {
  $id: string;
  ownerId: string;
  name: string;
  memberIds: string[];
  sharedAccountIds: string[];
}

export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
}

export interface OfflineOperation {
  id: string;
  collection: string;
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  documentId?: string;
  timestamp: number;
}
