'use strict';

/**
 * Demo seed data.
 *
 * Creates (or resets) a demo user with accounts, ~4 months of realistic
 * transactions and budgets so every chart has something to draw.
 *
 *   npm run seed            # creates/reset demo@walletrack.app
 *   npm run seed -- --email me@example.com --password secret123
 */

const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { connectDatabase, closeDatabase, collections } = require('../src/config/db');
const {
  seedCategoriesForUser,
  seedAccountsForUser,
} = require('../src/module/route/categories/categories');
const { balanceEffects, applyEffects } = require('../src/module/route/transactions/transactions');
const { monthKey, addDays } = require('../src/utils/dates');

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const DEMO_EMAIL = arg('email', 'demo@walletrack.app');
const DEMO_PASSWORD = arg('password', 'demo1234');
const DEMO_NAME = arg('name', 'Demo User');

/** Deterministic pseudo random so repeated seeds produce the same charts. */
let seedState = 42;
function random() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function between(min, max) {
  return Math.floor(min + random() * (max - min));
}

function daysAgo(count) {
  return addDays(new Date(), -count);
}

async function resetUser(email) {
  const existing = await collections.users.findOne({ email });
  if (!existing) return null;

  const userId = existing._id;
  await Promise.all([
    collections.accounts.deleteMany({ userId }),
    collections.categories.deleteMany({ userId }),
    collections.transactions.deleteMany({ userId }),
    collections.budgets.deleteMany({ userId }),
    collections.sessions.deleteMany({ userId }),
  ]);
  await collections.users.deleteOne({ _id: userId });
  return existing;
}

const EXPENSE_PLAN = {
  'food & dining': [1200, 6500],
  groceries: [2200, 9800],
  transport: [300, 4200],
  shopping: [1500, 12000],
  'bills & utilities': [4000, 15000],
  health: [800, 6000],
  entertainment: [600, 5500],
  education: [1500, 9000],
  travel: [8000, 45000],
  'gifts & donations': [500, 4000],
  housing: [60000, 60000],
  other: [400, 3000],
};

async function build() {
  await connectDatabase();
  console.log(`[seed] connected to "${env.DB_NAME}"`);

  await resetUser(DEMO_EMAIL);
  console.log(`[seed] cleared any previous demo user ${DEMO_EMAIL}`);

  const now = new Date();
  const user = {
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: await bcrypt.hash(DEMO_PASSWORD, 12),
    country: 'US',
    currency: 'USD',
    locale: 'en-US',
    avatarColor: '#4F46E5',
    themePreference: 'system',
    notificationsEnabled: true,
    onboardingCompleted: true,
    isPremium: false,
    premiumStatus: 'none',
    premiumPlanId: null,
    premiumExpiresAt: null,
    premiumPurchaseToken: null,
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await collections.users.insertOne(user);
  const userId = insertedId;
  console.log(`[seed] created user ${DEMO_EMAIL}`);

  await seedCategoriesForUser(userId);
  await seedAccountsForUser(userId);

  const categories = await collections.categories.find({ userId }).toArray();
  const categoryByName = new Map(
    categories.map((category) => [category.name.toLowerCase(), category]),
  );

  const accounts = await collections.accounts.find({ userId }).toArray();
  const cash = accounts.find((account) => account.type === 'cash');
  const bank = accounts.find((account) => account.type === 'bank');

  // Give the bank account a realistic opening balance.
  await collections.accounts.updateOne(
    { _id: bank._id },
    { $set: { startingBalance: 185000, balance: 185000, note: 'Everyday account' } },
  );
  await collections.accounts.updateOne(
    { _id: cash._id },
    { $set: { startingBalance: 4500, balance: 4500 } },
  );

  const expenses = [];
  const incomes = [];
  const transfers = [];

  // Salary on the 1st of each month for the last four months.
  for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo -= 1) {
    const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
    const salaryDate =
      anchor.getTime() > now.getTime()
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 1))
        : anchor;

    for (const salaryCategory of ['salary', 'freelance']) {
      incomes.push({
        userId,
        type: 'income',
        amount: salaryCategory === 'salary' ? 320000 : between(40000, 95000),
        accountId: bank._id,
        toAccountId: null,
        categoryId: categoryByName.get(salaryCategory)._id,
        date: salaryDate,
        monthKey: monthKey(salaryDate),
        note: salaryCategory === 'salary' ? 'Monthly salary' : 'Client project',
        createdAt: salaryDate,
        updatedAt: salaryDate,
      });
    }
  }

  // Spending across the last ~110 days.
  for (let daysBack = 109; daysBack >= 0; daysBack -= 1) {
    const date = daysAgo(daysBack);
    const month = monthKey(date);
    const entriesToday = between(1, 4);

    for (let entry = 0; entry < entriesToday; entry += 1) {
      const name = pick(Object.keys(EXPENSE_PLAN));
      const category = categoryByName.get(name);
      if (!category) continue;
      const [min, max] = EXPENSE_PLAN[name];
      const amount = max === min ? min : between(min, max);

      expenses.push({
        userId,
        type: 'expense',
        amount,
        accountId: random() > 0.35 ? bank._id : cash._id,
        toAccountId: null,
        categoryId: category._id,
        date,
        monthKey: month,
        note: `${name.split(' ')[0]} ${pick(['purchase', 'payment', 'top-up', 'bill', 'order'])}`,
        createdAt: date,
        updatedAt: date,
      });
    }

    // An occasional transfer to cash.
    if (random() > 0.85) {
      const date2 = daysAgo(daysBack);
      transfers.push({
        userId,
        type: 'transfer',
        amount: between(2000, 8000),
        accountId: bank._id,
        toAccountId: cash._id,
        categoryId: null,
        date: date2,
        monthKey: monthKey(date2),
        note: 'Cash withdrawal',
        createdAt: date2,
        updatedAt: date2,
      });
    }
  }

  const all = [...expenses, ...incomes, ...transfers];
  await collections.transactions.insertMany(all);
  console.log(`[seed] inserted ${all.length} transactions`);

  // Balances follow from the transactions themselves.
  for (const effect of all.flatMap(balanceEffects)) {
    await applyEffects([effect]);
  }

  const currentMonth = monthKey(new Date());
  const previousMonth = monthKey(addDays(new Date(), -32));
  const budgetPlans = [
    { category: 'food & dining', limit: 45000 },
    { category: 'groceries', limit: 60000 },
    { category: 'transport', limit: 20000 },
    { category: 'shopping', limit: 50000 },
    { category: 'entertainment', limit: 20000 },
  ];

  const budgets = budgetPlans.map((plan) => ({
    userId,
    month: currentMonth,
    categoryId: categoryByName.get(plan.category)?._id ?? null,
    limit: plan.limit,
    note: null,
    createdAt: now,
    updatedAt: now,
  }));
  budgets.push({
    userId,
    month: currentMonth,
    categoryId: null,
    limit: 400000,
    note: 'Monthly spending cap',
    createdAt: now,
    updatedAt: now,
  });
  budgets.push({
    userId,
    month: previousMonth,
    categoryId: null,
    limit: 380000,
    note: 'Monthly spending cap',
    createdAt: now,
    updatedAt: now,
  });

  await collections.budgets.insertMany(budgets);
  console.log(`[seed] inserted ${budgets.length} budgets`);

  const balances = await collections.accounts.find({ userId }).toArray();
  for (const account of balances) {
    console.log(`[seed]   ${account.name}: ${(account.balance / 100).toFixed(2)} USD`);
  }

  console.log(`\n[seed] done. Sign in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
  await closeDatabase();
}

build().catch(async (error) => {
  console.error('[seed] failed:', error);
  await closeDatabase();
  process.exit(1);
});
