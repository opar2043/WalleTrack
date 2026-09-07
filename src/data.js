// =============================================================================
// WalleTrack – RAW DEMO DATA
// -----------------------------------------------------------------------------
// This file is the single source of truth for the demo. Every screen reads its
// data from here. No network calls are made. When you wire up a real backend,
// replace the service functions (src/services/appwrite/*) to fetch from Appwrite
// and keep this file as the seed/mock payload shape.
// =============================================================================

// Demo login credentials
export const DEMO_EMAIL = "demo@gmail.com";
export const DEMO_PASSWORD = "12345678";

export const DEMO_USER_ID = "user_demo";

export const DEMO_USER = {
  userId: DEMO_USER_ID,
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  name: "Demo User",
};

// -----------------------------------------------------------------------------
// Relative date helper (keeps the demo data looking "live" on any day)
// -----------------------------------------------------------------------------
function iso(daysAgo, hour = 10, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function created(daysAgo) {
  return iso(daysAgo, 0, 0);
}

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------
export const DEMO_PROFILE = {
  userId: DEMO_USER_ID,
  fullName: "Demo User",
  avatarFileId: "",
  nationality: "US",
  baseCurrency: "USD",
  language: "en",
  theme: "system",
  biometricEnabled: false,
  isPremium: true,
  familyGroupId: "group_family",
};

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
export const DEMO_ACCOUNTS = [
  {
    $id: "acc_cash",
    userId: DEMO_USER_ID,
    name: "Cash Wallet",
    type: "cash",
    currency: "USD",
    balance: 1250.0,
    icon: "cash",
    color: "#6C5CE7",
    cardLast4: "",
    createdAt: created(120),
    updatedAt: created(0),
  },
  {
    $id: "acc_checking",
    userId: DEMO_USER_ID,
    name: "Main Checking",
    type: "bank",
    currency: "USD",
    balance: 12480.55,
    icon: "bank",
    color: "#3B82F6",
    cardLast4: "",
    createdAt: created(120),
    updatedAt: created(0),
  },
  {
    $id: "acc_savings",
    userId: DEMO_USER_ID,
    name: "Savings",
    type: "bank",
    currency: "USD",
    balance: 25000.0,
    icon: "bank",
    color: "#10B981",
    cardLast4: "",
    createdAt: created(90),
    updatedAt: created(0),
  },
  {
    $id: "acc_credit",
    userId: DEMO_USER_ID,
    name: "Credit Card",
    type: "card",
    currency: "USD",
    balance: -840.25,
    icon: "card",
    color: "#FF6B4A",
    cardLast4: "4412",
    createdAt: created(60),
    updatedAt: created(0),
  },
];

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------
export const DEMO_CATEGORIES = [
  { $id: "cat_food", userId: "", name: "Food & Dining", icon: "utensils", color: "#FF6B4A", type: "expense" },
  { $id: "cat_transport", userId: "", name: "Transport", icon: "car", color: "#6C5CE7", type: "expense" },
  { $id: "cat_shopping", userId: "", name: "Shopping", icon: "shopping-bag", color: "#F59E0B", type: "expense" },
  { $id: "cat_housing", userId: "", name: "Housing", icon: "home", color: "#10B981", type: "expense" },
  { $id: "cat_utilities", userId: "", name: "Utilities", icon: "zap", color: "#3B82F6", type: "expense" },
  { $id: "cat_entertainment", userId: "", name: "Entertainment", icon: "film", color: "#EC4899", type: "expense" },
  { $id: "cat_health", userId: "", name: "Health", icon: "heart-pulse", color: "#EF4444", type: "expense" },
  { $id: "cat_education", userId: "", name: "Education", icon: "book-open", color: "#8B5CF6", type: "expense" },
  { $id: "cat_travel", userId: "", name: "Travel", icon: "plane", color: "#14B8A6", type: "expense" },
  { $id: "cat_subscriptions", userId: "", name: "Subscriptions", icon: "refresh-cw", color: "#6366F1", type: "expense" },
  { $id: "cat_personal", userId: "", name: "Personal Care", icon: "sparkles", color: "#F472B6", type: "expense" },
  { $id: "cat_other", userId: "", name: "Other", icon: "more-horizontal", color: "#9CA3AF", type: "expense" },
  { $id: "cat_salary", userId: "", name: "Salary", icon: "briefcase", color: "#10B981", type: "income" },
  { $id: "cat_freelance", userId: "", name: "Freelance", icon: "laptop", color: "#6C5CE7", type: "income" },
  { $id: "cat_business", userId: "", name: "Business", icon: "store", color: "#3B82F6", type: "income" },
  { $id: "cat_investments", userId: "", name: "Investments", icon: "trending-up", color: "#F59E0B", type: "income" },
  { $id: "cat_gifts", userId: "", name: "Gifts", icon: "gift", color: "#EC4899", type: "income" },
  { $id: "cat_other_income", userId: "", name: "Other Income", icon: "plus-circle", color: "#8B5CF6", type: "income" },
];

// -----------------------------------------------------------------------------
// Transactions
// -----------------------------------------------------------------------------
const tx = (id, type, amount, categoryId, accountId, daysAgo, note, extras = {}) => ({
  $id: id,
  userId: DEMO_USER_ID,
  accountId,
  type,
  amount,
  currency: "USD",
  convertedAmount: amount,
  categoryId,
  note: note || "",
  date: iso(daysAgo),
  paymentMethod: extras.paymentMethod || "",
  tags: extras.tags || [],
  isRecurring: extras.isRecurring || false,
  recurringRuleId: extras.recurringRuleId || "",
  createdAt: created(daysAgo),
  toAccountId: extras.toAccountId || "",
  splits: extras.splits || [],
});

export const DEMO_TRANSACTIONS = [
  // --- Income (this month)
  tx("txn_salary", "income", 5200, "cat_salary", "acc_checking", 1, "Monthly salary", { tags: ["salary"] }),
  tx("txn_freelance", "income", 850, "cat_freelance", "acc_checking", 5, "Freelance website project", { tags: ["freelance"] }),
  tx("txn_dividends", "income", 120, "cat_investments", "acc_savings", 15, "Stock dividends"),
  tx("txn_gift", "income", 100, "cat_gifts", "acc_cash", 22, "Birthday gift"),

  // --- Expenses (this month)
  tx("txn_groceries_1", "expense", 64.2, "cat_food", "acc_credit", 0, "Grocery store", { paymentMethod: "Card" }),
  tx("txn_uber_1", "expense", 18.5, "cat_transport", "acc_credit", 0, "Uber ride", { paymentMethod: "Card" }),
  tx("txn_lunch_1", "expense", 32, "cat_food", "acc_cash", 0, "Lunch with team"),
  tx("txn_electricity", "expense", 120, "cat_utilities", "acc_checking", 1, "Electricity bill", { paymentMethod: "Auto-debit" }),
  tx("txn_netflix", "expense", 15.99, "cat_subscriptions", "acc_credit", 1, "Netflix", { isRecurring: true, recurringRuleId: "rule_netflix", paymentMethod: "Card" }),
  tx("txn_coffee_1", "expense", 4.75, "cat_food", "acc_cash", 1, "Morning coffee"),
  tx("txn_clothes", "expense", 145, "cat_shopping", "acc_credit", 2, "Clothes shopping", { paymentMethod: "Card" }),
  tx("txn_fuel_1", "expense", 55, "cat_transport", "acc_credit", 2, "Fuel refill", { paymentMethod: "Card" }),
  tx("txn_movie", "expense", 28, "cat_entertainment", "acc_credit", 3, "Movie tickets", { paymentMethod: "Card" }),
  tx("txn_pharmacy", "expense", 45.3, "cat_health", "acc_credit", 3, "Pharmacy", { paymentMethod: "Card" }),
  tx("txn_groceries_2", "expense", 86.75, "cat_food", "acc_credit", 4, "Grocery store", { paymentMethod: "Card" }),
  tx("txn_internet", "expense", 60, "cat_utilities", "acc_checking", 4, "Internet bill"),
  tx("txn_dining_1", "expense", 78.4, "cat_food", "acc_credit", 5, "Dinner at restaurant", { paymentMethod: "Card" }),
  tx("txn_train", "expense", 40, "cat_transport", "acc_cash", 5, "Monthly train pass"),
  tx("txn_online_shopping", "expense", 210, "cat_shopping", "acc_credit", 6, "Online shopping", { paymentMethod: "Card" }),
  tx("txn_spotify", "expense", 9.99, "cat_subscriptions", "acc_credit", 6, "Spotify", { isRecurring: true, recurringRuleId: "rule_spotify", paymentMethod: "Card" }),
  tx("txn_family_dinner", "expense", 120, "cat_food", "acc_credit", 7, "Family dinner out", { paymentMethod: "Card" }),
  tx("txn_parking", "expense", 12, "cat_transport", "acc_cash", 7, "Parking fee"),
  tx("txn_rent", "expense", 1400, "cat_housing", "acc_checking", 12, "Monthly rent", { paymentMethod: "Bank transfer" }),
  tx("txn_water", "expense", 45, "cat_utilities", "acc_checking", 12, "Water bill"),
  tx("txn_flight", "expense", 320, "cat_travel", "acc_credit", 14, "Flight booking", { paymentMethod: "Card", tags: ["vacation"] }),
  tx("txn_takeout", "expense", 42.5, "cat_food", "acc_credit", 14, "Weekend takeout", { paymentMethod: "Card" }),
  tx("txn_phone", "expense", 55, "cat_utilities", "acc_checking", 18, "Phone bill"),
  tx("txn_haircut", "expense", 30, "cat_personal", "acc_cash", 18, "Haircut"),
  tx("txn_groceries_3", "expense", 54.3, "cat_food", "acc_credit", 9, "Grocery store", { paymentMethod: "Card" }),
  tx("txn_gym", "expense", 35, "cat_health", "acc_credit", 9, "Gym membership", { isRecurring: true, recurringRuleId: "rule_gym", paymentMethod: "Card" }),
  tx("txn_amazon", "expense", 65.8, "cat_shopping", "acc_credit", 24, "Amazon purchase", { paymentMethod: "Card" }),

  // --- Transfer (this month)
  tx("txn_to_savings", "transfer", 500, "", "acc_checking", 8, "Transfer to savings", { toAccountId: "acc_savings" }),

  // --- Previous month (for reports history)
  tx("txn_prev_rent", "expense", 1400, "cat_housing", "acc_checking", 34, "Monthly rent", { paymentMethod: "Bank transfer" }),
  tx("txn_prev_salary", "income", 5200, "cat_salary", "acc_checking", 30, "Monthly salary", { tags: ["salary"] }),
  tx("txn_prev_groceries", "expense", 95, "cat_food", "acc_credit", 33, "Grocery store", { paymentMethod: "Card" }),
  tx("txn_prev_utilities", "expense", 185, "cat_utilities", "acc_checking", 31, "Utility bills"),
  tx("txn_prev_shopping", "expense", 132.5, "cat_shopping", "acc_credit", 38, "Clothes shopping", { paymentMethod: "Card" }),
];

// -----------------------------------------------------------------------------
// Budgets
// -----------------------------------------------------------------------------
export const DEMO_BUDGETS = [
  { $id: "budget_food", userId: DEMO_USER_ID, categoryId: "cat_food", amount: 600, period: "monthly", startDate: iso(0, 0, 1), alertThresholdPercent: 80, createdAt: created(30) },
  { $id: "budget_shopping", userId: DEMO_USER_ID, categoryId: "cat_shopping", amount: 400, period: "monthly", startDate: iso(0, 0, 1), alertThresholdPercent: 80, createdAt: created(30) },
  { $id: "budget_transport", userId: DEMO_USER_ID, categoryId: "cat_transport", amount: 300, period: "monthly", startDate: iso(0, 0, 1), alertThresholdPercent: 80, createdAt: created(30) },
  { $id: "budget_utilities", userId: DEMO_USER_ID, categoryId: "cat_utilities", amount: 300, period: "monthly", startDate: iso(0, 0, 1), alertThresholdPercent: 80, createdAt: created(30) },
  { $id: "budget_entertainment", userId: DEMO_USER_ID, categoryId: "cat_entertainment", amount: 200, period: "monthly", startDate: iso(0, 0, 1), alertThresholdPercent: 80, createdAt: created(30) },
];

// -----------------------------------------------------------------------------
// Family group
// -----------------------------------------------------------------------------
export const DEMO_FAMILY_GROUP = {
  $id: "group_family",
  ownerId: DEMO_USER_ID,
  name: "Demo Family",
  memberIds: [DEMO_USER_ID, "member_faq"],
  sharedAccountIds: ["acc_checking"],
};

// -----------------------------------------------------------------------------
// Static exchange rates (1 unit = value in USD)
// Used by src/services/exchange/rates.ts – no network calls.
// -----------------------------------------------------------------------------
export const DEMO_USD_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  JPY: 149.5,
  CNY: 7.15,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  SGD: 1.34,
  HKD: 7.8,
  AED: 3.67,
  SAR: 3.75,
  BRL: 5.1,
  MXN: 17.2,
  KRW: 1320,
  TRY: 32.4,
  ZAR: 18.2,
  NZD: 1.66,
  THB: 35.5,
  IDR: 15500,
  MYR: 4.7,
  PHP: 56.2,
  VND: 24700,
  NGN: 1450,
  EGP: 47.5,
  PKR: 278,
  BDT: 110,
  LKR: 295,
  RUB: 91.5,
};