'use strict';

/**
 * Default categories seeded for every new user.
 * `type` splits spending categories from income categories so the Add screen
 * only offers sensible options for the selected transaction type.
 */

const DEFAULT_CATEGORIES = [
  {
    key: 'food',
    name: 'Food & Dining',
    type: 'expense',
    icon: 'restaurant',
    color: '#F97316',
    order: 1,
  },
  {
    key: 'groceries',
    name: 'Groceries',
    type: 'expense',
    icon: 'shopping-cart',
    color: '#84CC16',
    order: 2,
  },
  { key: 'transport', name: 'Transport', type: 'expense', icon: 'car', color: '#0EA5E9', order: 3 },
  {
    key: 'shopping',
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#EC4899',
    order: 4,
  },
  {
    key: 'bills',
    name: 'Bills & Utilities',
    type: 'expense',
    icon: 'receipt',
    color: '#6366F1',
    order: 5,
  },
  {
    key: 'health',
    name: 'Health',
    type: 'expense',
    icon: 'heart-pulse',
    color: '#EF4444',
    order: 6,
  },
  {
    key: 'entertainment',
    name: 'Entertainment',
    type: 'expense',
    icon: 'film',
    color: '#A855F7',
    order: 7,
  },
  {
    key: 'education',
    name: 'Education',
    type: 'expense',
    icon: 'graduation-cap',
    color: '#14B8A6',
    order: 8,
  },
  { key: 'housing', name: 'Housing', type: 'expense', icon: 'home', color: '#8B5CF6', order: 9 },
  { key: 'travel', name: 'Travel', type: 'expense', icon: 'plane', color: '#06B6D4', order: 10 },
  {
    key: 'gifts',
    name: 'Gifts & Donations',
    type: 'expense',
    icon: 'gift',
    color: '#F43F5E',
    order: 11,
  },
  {
    key: 'other',
    name: 'Other',
    type: 'expense',
    icon: 'more-horizontal',
    color: '#64748B',
    order: 12,
  },
  { key: 'salary', name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981', order: 1 },
  {
    key: 'freelance',
    name: 'Freelance',
    type: 'income',
    icon: 'laptop',
    color: '#22C55E',
    order: 2,
  },
  {
    key: 'investments',
    name: 'Investments',
    type: 'income',
    icon: 'trending-up',
    color: '#0D9488',
    order: 3,
  },
  {
    key: 'refund',
    name: 'Refunds',
    type: 'income',
    icon: 'rotate-ccw',
    color: '#7C3AED',
    order: 4,
  },
  {
    key: 'other-income',
    name: 'Other Income',
    type: 'income',
    icon: 'more-horizontal',
    color: '#64748B',
    order: 5,
  },
];

/** A friendly starter set of accounts so the dashboard is not empty on day one. */
const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'cash', color: '#10B981', icon: 'wallet', note: 'Pocket money', order: 1 },
  {
    name: 'Main Bank',
    type: 'bank',
    color: '#4F46E5',
    icon: 'landmark',
    note: 'Everyday account',
    order: 2,
  },
];

module.exports = { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS };
