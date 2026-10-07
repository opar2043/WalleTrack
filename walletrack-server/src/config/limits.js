'use strict';

/**
 * Free-tier limits.
 *
 * Single source of truth: the backend enforces them, the frontend reads the
 * same values from `GET /api/v1/premium/limits` so a limit is never hard-coded
 * in many places. Premium status bypasses every limit.
 */

const FREE_TIER = {
  maxAccounts: 3,
  maxBudgets: 5,
  maxCustomCategories: 5,
  monthsOfHistory: 12,
  features: {
    unlimitedAccounts: false,
    unlimitedBudgets: false,
    customCategories: false,
    advancedAnalytics: false,
    exportData: false,
    multiCurrency: false,
  },
};

const PREMIUM_TIER = {
  maxAccounts: null,
  maxBudgets: null,
  maxCustomCategories: null,
  monthsOfHistory: null,
  features: {
    unlimitedAccounts: true,
    unlimitedBudgets: true,
    customCategories: true,
    advancedAnalytics: true,
    exportData: true,
    multiCurrency: true,
  },
};

const PLANS = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    period: 'monthly',
    intervalDays: 30,
    priceMinor: 499,
    currency: 'USD',
    badge: null,
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    period: 'yearly',
    intervalDays: 365,
    priceMinor: 3999,
    currency: 'USD',
    badge: 'Best value',
  },
];

function tierFor(isPremium) {
  return isPremium ? PREMIUM_TIER : FREE_TIER;
}

function limitsFor(isPremium) {
  return { tier: isPremium ? 'premium' : 'free', ...tierFor(isPremium) };
}

module.exports = { FREE_TIER, PREMIUM_TIER, PLANS, tierFor, limitsFor };
