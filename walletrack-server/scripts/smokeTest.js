'use strict';

/**
 * End to end API smoke test.
 *
 * Boots a real MongoDB (in-memory by default), starts the Express app on an
 * ephemeral port and walks the whole product surface, asserting behaviour
 * rather than just status codes.
 *
 *   npm run test:api                     # uses an in-memory MongoDB
 *   MONGO_URI=mongodb://... npm run test:api   # uses a real database
 *
 * Requires the optional dev dependency `mongodb-memory-server` for the default
 * mode: npm install --save-dev mongodb-memory-server
 */

const assert = require('assert/strict');

let mongoUri = process.env.MONGO_URI;
let memoryServer = null;

async function setupDatabase() {
  if (mongoUri) {
    console.log('[test] using MONGO_URI from the environment');
    return;
  }
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  mongoUri = memoryServer.getUri();
  console.log('[test] started an in-memory MongoDB');
}

let passed = 0;
let failed = 0;

async function test(label, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${label}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${label}`);
    console.log(`       ${error.message}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

async function main() {
  await setupDatabase();

  const dbName = `walletrack_test_${Date.now()}`;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.MONGODB_URI = mongoUri;
  process.env.DB_NAME = dbName;
  process.env.SESSION_EXPIRES = '30d';
  process.env.CLIENT_ORIGIN = '*';

  // Fresh module registry so config/env picks up the variables above.
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  const { connectDatabase, collections } = require('../src/config/db');
  const app = require('../src/app');
  await connectDatabase();

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;

  /** Minimal fetch wrapper that tracks the session token. */
  let token = null;

  async function api(method, path, body) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = await response.json();
    return { status: response.status, json };
  }

  const stamp = Date.now();
  const email = `tester${stamp}@walletrack.test`;
  const otherEmail = `other${stamp}@walletrack.test`;
  const month = new Date().toISOString().slice(0, 7);

  // ---------------------------------------------------------------- health
  section('Health');
  await test('GET /health returns ok', async () => {
    const { status, json } = await api('GET', '/health');
    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'ok');
  });

  // ------------------------------------------------------------------ auth
  section('Auth');
  let userId = null;

  await test('POST /auth/register creates a user and seeds defaults', async () => {
    const { status, json } = await api('POST', '/auth/register', {
      name: 'Test User',
      email,
      password: 'password123',
    });
    assert.equal(status, 201);
    assert.ok(json.data.token.startsWith('wt_'));
    assert.equal(json.data.token.length, 67);
    assert.equal(json.data.user.onboardingCompleted, false);
    assert.equal(json.data.user.isPremium, false);
    assert.equal(json.data.user.hideBalances, false, 'hideBalances defaults to false');
    token = json.data.token;
    userId = json.data.user.id;

    const stored = await collections.users.findOne({ email });
    assert.ok(stored.password.startsWith('$2'), 'password must be a bcrypt hash');
    assert.equal(stored.password.length > 50, true);
  });

  await test('password hash is never returned by the API', async () => {
    const { json } = await api('GET', '/users/me');
    assert.equal(json.data.password, undefined);
  });

  await test('POST /auth/register rejects a duplicate email', async () => {
    const { status, json } = await api('POST', '/auth/register', {
      name: 'Someone',
      email,
      password: 'password123',
    });
    assert.equal(status, 409);
    assert.equal(json.success, false);
  });

  await test('POST /auth/register validates a weak password', async () => {
    const { status, json } = await api('POST', '/auth/register', {
      name: 'Weak',
      email: `weak${stamp}@walletrack.test`,
      password: 'short',
    });
    assert.equal(status, 400);
    assert.ok(Array.isArray(json.errors));
    assert.equal(json.errors[0].field, 'password');
  });

  await test('POST /auth/login succeeds with the right password', async () => {
    const { status, json } = await api('POST', '/auth/login', { email, password: 'password123' });
    assert.equal(status, 200);
    token = json.data.token;
  });

  await test('POST /auth/login fails with the wrong password', async () => {
    const { status } = await api('POST', '/auth/login', { email, password: 'wrongpassword' });
    assert.equal(status, 401);
  });

  await test('protected routes reject a missing token', async () => {
    const saved = token;
    token = null;
    const { status } = await api('GET', '/accounts');
    token = saved;
    assert.equal(status, 401);
  });

  await test('protected routes reject a malformed token', async () => {
    const saved = token;
    token = 'wt_not-a-real-token';
    const { status } = await api('GET', '/accounts');
    token = saved;
    assert.equal(status, 401);
  });

  await test('the session token is stored hashed, never in plain text', async () => {
    const sessions = await collections.sessions.find({}).toArray();
    assert.ok(sessions.length >= 1);
    for (const session of sessions) {
      assert.equal(session.tokenHash.length, 64);
      assert.equal(session.token, undefined);
      assert.equal(session.tokenHash === token, false);
    }
  });

  await test('POST /auth/logout revokes the session', async () => {
    const saved = token;
    const { status } = await api('POST', '/auth/logout');
    assert.equal(status, 200);

    const after = await api('GET', '/accounts');
    assert.equal(after.status, 401, 'a revoked token must stop working');

    token = saved;
    const relogin = await api('POST', '/auth/login', { email, password: 'password123' });
    token = relogin.json.data.token;
  });

  // ------------------------------------------------------------ categories
  section('Categories');
  let foodCategory = null;
  let salaryCategory = null;

  await test('GET /categories returns seeded defaults', async () => {
    const { status, json } = await api('GET', '/categories');
    assert.equal(status, 200);
    assert.ok(json.data.length >= 17);
    foodCategory = json.data.find((item) => item.key === 'food');
    salaryCategory = json.data.find((item) => item.key === 'salary');
    assert.ok(foodCategory && salaryCategory);
    assert.equal(foodCategory.isCustom, false);
    assert.ok(foodCategory.color.startsWith('#'));
  });

  await test('POST /categories creates a custom category', async () => {
    const { status, json } = await api('POST', '/categories', {
      name: 'Coffee',
      type: 'expense',
      icon: 'coffee',
      color: '#A16207',
    });
    assert.equal(status, 201);
    assert.equal(json.data.isCustom, true);
  });

  await test('default categories cannot be deleted', async () => {
    const { status } = await api('DELETE', `/categories/${foodCategory.id}`);
    assert.equal(status, 400);
  });

  // ------------------------------------------------------------- onboarding
  section('Onboarding');
  await test('POST /users/me/onboarding saves country and currency', async () => {
    const { status, json } = await api('POST', '/users/me/onboarding', {
      country: 'US',
      currency: 'USD',
      locale: 'en-US',
    });
    assert.equal(status, 200);
    assert.equal(json.data.onboardingCompleted, true);
    assert.equal(json.data.currency, 'USD');
  });

  await test('PATCH /users/me/preferences persists the theme', async () => {
    const { status, json } = await api('PATCH', '/users/me/preferences', {
      themePreference: 'dark',
    });
    assert.equal(status, 200);
    assert.equal(json.data.themePreference, 'dark');
    assert.equal(json.data.hideBalances, false);

    const masked = await api('PATCH', '/users/me/preferences', { hideBalances: true });
    assert.equal(masked.json.data.hideBalances, true);

    await api('PATCH', '/users/me/preferences', { themePreference: 'system', hideBalances: false });
  });

  // --------------------------------------------------------------- accounts
  section('Accounts');
  let bankId = null;
  let cashId = null;

  await test('register seeds a Cash and a Bank account', async () => {
    const { json } = await api('GET', '/accounts');
    const cash = json.data.accounts.find((item) => item.type === 'cash');
    const bank = json.data.accounts.find((item) => item.type === 'bank');
    assert.ok(cash && bank);
    cashId = cash.id;
    bankId = bank.id;
  });

  await test('POST /accounts creates a card with a starting balance', async () => {
    const { status, json } = await api('POST', '/accounts', {
      name: 'Credit Card',
      type: 'card',
      startingBalance: -25_000,
      color: '#0EA5E9',
    });
    assert.equal(status, 201);
    assert.equal(json.data.balance, -25_000);
    assert.equal(json.data.type, 'card');
  });

  await test('PATCH /accounts shifts the balance when the starting balance changes', async () => {
    const { status, json } = await api('PATCH', `/accounts/${bankId}`, {
      startingBalance: 100_000,
    });
    assert.equal(status, 200);
    assert.equal(json.data.startingBalance, 100_000);
    assert.equal(json.data.balance, 100_000);
  });

  await test('GET /accounts returns the net total balance', async () => {
    const { json } = await api('GET', '/accounts');
    const expected = json.data.accounts.reduce((sum, item) => sum + item.balance, 0);
    assert.equal(json.data.totalBalance, expected);
  });

  // ----------------------------------------------------------- transactions
  section('Transactions and balance logic');
  let expenseId = null;
  let incomeId = null;
  let transferId = null;

  const balanceOf = async (id) => {
    const { json } = await api('GET', `/accounts/${id}`);
    return json.data.balance;
  };

  await test('POST expense decreases the account balance', async () => {
    const before = await balanceOf(bankId);
    const { status, json } = await api('POST', '/transactions', {
      type: 'expense',
      amount: 12_500,
      accountId: bankId,
      categoryId: foodCategory.id,
      date: `${month}-05`,
      note: 'Lunch',
    });
    assert.equal(status, 201);
    assert.equal(json.data.transaction.amount, 12_500);
    assert.equal(json.data.transaction.category.name, 'Food & Dining');
    assert.equal(json.data.transaction.date, `${month}-05`);
    expenseId = json.data.transaction.id;
    assert.equal(await balanceOf(bankId), before - 12_500);
  });

  await test('POST income increases the account balance', async () => {
    const before = await balanceOf(bankId);
    const { status, json } = await api('POST', '/transactions', {
      type: 'income',
      amount: 200_000,
      accountId: bankId,
      categoryId: salaryCategory.id,
      date: `${month}-01`,
    });
    assert.equal(status, 201);
    incomeId = json.data.transaction.id;
    assert.equal(await balanceOf(bankId), before + 200_000);
  });

  await test('POST transfer moves money between two accounts', async () => {
    const bankBefore = await balanceOf(bankId);
    const cashBefore = await balanceOf(cashId);
    const { status, json } = await api('POST', '/transactions', {
      type: 'transfer',
      amount: 30_000,
      accountId: bankId,
      toAccountId: cashId,
      date: `${month}-06`,
    });
    assert.equal(status, 201);
    assert.equal(json.data.transaction.type, 'transfer');
    transferId = json.data.transaction.id;
    assert.equal(await balanceOf(bankId), bankBefore - 30_000);
    assert.equal(await balanceOf(cashId), cashBefore + 30_000);
  });

  await test('a transfer needs two different accounts', async () => {
    const { status } = await api('POST', '/transactions', {
      type: 'transfer',
      amount: 1_000,
      accountId: bankId,
      toAccountId: bankId,
    });
    assert.equal(status, 400);
  });

  await test('an expense category cannot be used for income', async () => {
    const { status } = await api('POST', '/transactions', {
      type: 'income',
      amount: 1_000,
      accountId: bankId,
      categoryId: foodCategory.id,
    });
    assert.equal(status, 400);
  });

  await test('PATCH transaction reverses the old effect and applies the new one', async () => {
    const before = await balanceOf(bankId);
    const { status, json } = await api('PATCH', `/transactions/${expenseId}`, { amount: 20_000 });
    assert.equal(status, 200);
    assert.equal(json.data.transaction.amount, 20_000);
    // Was 12_500 out, now 20_000 out, so the account is 7_500 lower.
    assert.equal(await balanceOf(bankId), before - 7_500);
  });

  await test('PATCH transaction can move money to a different account', async () => {
    const bankBefore = await balanceOf(bankId);
    const cashBefore = await balanceOf(cashId);
    await api('PATCH', `/transactions/${expenseId}`, { accountId: cashId });
    assert.equal(await balanceOf(bankId), bankBefore + 20_000);
    assert.equal(await balanceOf(cashId), cashBefore - 20_000);
    await api('PATCH', `/transactions/${expenseId}`, { accountId: bankId });
  });

  await test('DELETE transaction restores the balance exactly', async () => {
    const before = await balanceOf(bankId);
    const { status } = await api('DELETE', `/transactions/${incomeId}`);
    assert.equal(status, 200);
    assert.equal(await balanceOf(bankId), before - 200_000);
  });

  await test('a second income transaction gives the month some income', async () => {
    const { status } = await api('POST', '/transactions', {
      type: 'income',
      amount: 200_000,
      accountId: bankId,
      categoryId: salaryCategory.id,
      date: `${month}-01`,
    });
    assert.equal(status, 201);
    incomeId = (await api('GET', '/transactions?type=income')).json.data.transactions[0].id;
  });

  await test('recalculated balance matches the stored balance', async () => {
    const { recalculateAccountBalance } = require('../src/module/route/transactions/transactions');
    const account = await collections.accounts.findOne({ name: 'Main Bank' });
    const stored = await balanceOf(bankId);
    const recomputed = await recalculateAccountBalance(account.userId, account._id);
    assert.equal(
      recomputed,
      stored,
      `balance drifted from transaction history (recomputed=${recomputed} stored=${stored})`,
    );
  });

  await test('GET /transactions paginates and filters', async () => {
    const { status, json } = await api('GET', '/transactions?page=1&limit=2');
    assert.equal(status, 200);
    assert.ok(json.data.transactions.length <= 2);
    assert.ok(json.data.pagination.total >= 2);

    const filtered = await api('GET', '/transactions?type=transfer');
    assert.equal(filtered.json.data.transactions.length, 1);
    assert.equal(filtered.json.data.transactions[0].id, transferId);
  });

  await test('GET /transactions searches by note', async () => {
    const { json } = await api('GET', '/transactions?search=Lunch');
    assert.equal(json.data.transactions.length, 1);
    assert.equal(json.data.transactions[0].note, 'Lunch');
  });

  await test('GET /transactions filters by date range', async () => {
    const { json } = await api('GET', `/transactions?from=${month}-05&to=${month}-05`);
    assert.ok(json.data.transactions.every((item) => item.date === `${month}-05`));
  });

  // ---------------------------------------------------------------- budgets
  section('Budgets');
  let budgetId = null;

  await test('POST /budgets creates a category budget', async () => {
    const { status, json } = await api('POST', '/budgets', {
      month,
      categoryId: foodCategory.id,
      limit: 100_000,
    });
    assert.equal(status, 201);
    assert.equal(json.data.limit, 100_000);
    assert.ok(json.data.spent > 0);
    assert.equal(json.data.status, 'normal');
    budgetId = json.data.id;
  });

  await test('budget progress reflects real spending', async () => {
    const { json } = await api('GET', `/budgets?month=${month}`);
    const budget = json.data.budgets.find((item) => item.id === budgetId);
    assert.equal(budget.spent, 20_000);
    assert.equal(budget.remaining, 80_000);
    assert.equal(budget.progress, 0.2);
    assert.equal(budget.status, 'normal');
  });

  await test('a duplicate budget for the same month is rejected', async () => {
    const { status } = await api('POST', '/budgets', {
      month,
      categoryId: foodCategory.id,
      limit: 50_000,
    });
    assert.equal(status, 409);
  });

  await test('crossing 100% returns an overspend alert on the transaction', async () => {
    const { json } = await api('POST', '/transactions', {
      type: 'expense',
      amount: 95_000,
      accountId: bankId,
      categoryId: foodCategory.id,
      date: `${month}-10`,
    });
    assert.ok(
      json.data.alerts.length >= 1,
      `expected an overspend alert, got ${JSON.stringify(json.data.alerts)}`,
    );
    assert.equal(json.data.alerts[0].severity, 'danger');
    assert.equal(json.data.alerts[0].budget.status, 'overspent');
  });

  await test('crossing 80% returns a warning alert on the transaction', async () => {
    const { json } = await api('POST', '/transactions', {
      type: 'expense',
      amount: 5_000,
      accountId: bankId,
      categoryId: foodCategory.id,
      date: `${month}-11`,
    });
    assert.ok(json.data.alerts.length >= 1);
  });

  await test('GET /budgets summarises warning and overspent counts', async () => {
    const { json } = await api('GET', `/budgets?month=${month}`);
    assert.equal(json.data.summary.overspent, 1);
    assert.ok(json.data.summary.totalSpent > 0);
  });

  await test('PATCH /budgets changes the limit', async () => {
    const { status, json } = await api('PATCH', `/budgets/${budgetId}`, { limit: 250_000 });
    assert.equal(status, 200);
    assert.equal(json.data.limit, 250_000);
  });

  await test('DELETE /budgets removes the budget', async () => {
    const { status } = await api('DELETE', `/budgets/${budgetId}`);
    assert.equal(status, 200);
  });

  await test('an account with transactions cannot be deleted', async () => {
    const { status, json } = await api('DELETE', `/accounts/${bankId}`);
    assert.equal(status, 409);
    assert.match(json.message, /Archive/);
  });

  await test('POST /accounts/:id/archive hides the account', async () => {
    const { status, json } = await api('POST', `/accounts/${cashId}/archive`, { isArchived: true });
    assert.equal(status, 200);
    assert.equal(json.data.isArchived, true);

    const list = await api('GET', '/accounts');
    assert.equal(
      list.json.data.accounts.some((item) => item.id === cashId),
      false,
    );

    const withArchived = await api('GET', '/accounts?includeArchived=true');
    assert.equal(
      withArchived.json.data.accounts.some((item) => item.id === cashId),
      true,
    );
  });

  // ------------------------------------------------- dashboard and analytics
  section('Dashboard, analytics and insights');
  await test('GET /dashboard returns a complete payload', async () => {
    const { status, json } = await api('GET', '/dashboard?range=7');
    assert.equal(status, 200);
    const data = json.data;
    assert.equal(typeof data.totalBalance, 'number');
    assert.equal(data.weekly.days.length, 7);
    assert.equal(data.trend.points.length, 7);
    assert.ok(Array.isArray(data.categories));
    assert.ok(data.recentTransactions.length >= 1);
    assert.ok(data.monthSummary.income > 0);
    assert.ok(data.accounts.length >= 1);
  });

  await test('GET /dashboard range=30 returns 30 points', async () => {
    const { json } = await api('GET', '/dashboard?range=30');
    assert.equal(json.data.trend.points.length, 30);
  });

  await test('GET /analytics/monthly returns totals, comparison and a daily series', async () => {
    const { status, json } = await api('GET', `/analytics/monthly?month=${month}`);
    assert.equal(status, 200);
    assert.equal(json.data.month, month);
    assert.ok(json.data.totals.expense > 0);
    assert.ok(json.data.daily.length >= 28);
    assert.ok(Array.isArray(json.data.categories));
    assert.ok('expenseChange' in json.data.comparison);
  });

  await test('GET /analytics/categories/:id returns the category detail', async () => {
    const { status, json } = await api(
      'GET',
      `/analytics/categories/${foodCategory.id}?month=${month}`,
    );
    assert.equal(status, 200);
    assert.equal(json.data.category.id, foodCategory.id);
    assert.ok(json.data.expense > 0);
  });

  await test('GET /analytics/months lists months that contain data', async () => {
    const { json } = await api('GET', '/analytics/months');
    assert.ok(json.data.some((item) => item.month === month));
  });

  await test('GET /insights returns savings rate, averages and tips', async () => {
    const { status, json } = await api('GET', `/insights?month=${month}`);
    assert.equal(status, 200);
    const ids = json.data.insights.map((item) => item.id);
    assert.ok(ids.includes('savings-rate'));
    assert.ok(ids.includes('average-daily-spend'));
    assert.ok(ids.includes('top-category'));
    assert.ok(ids.includes('projected-month'));
    assert.ok(json.data.tips.length >= 1);
    assert.equal(typeof json.data.summary.savingsRate, 'number');
  });

  // ---------------------------------------------------------------- premium
  section('Premium');
  await test('GET /premium/plans is public', async () => {
    const saved = token;
    token = null;
    const { status, json } = await api('GET', '/premium/plans');
    token = saved;
    assert.equal(status, 200);
    assert.equal(json.data.plans.length, 2);
    assert.ok(json.data.benefits.length >= 6);
  });

  await test('GET /premium/status reports the free tier', async () => {
    const { json } = await api('GET', '/premium/status');
    assert.equal(json.data.isPremium, false);
    assert.equal(json.data.limits.maxAccounts, 3);
  });

  await test('free tier limits block a 4th account', async () => {
    const created = await api('POST', '/accounts', { name: 'Savings', type: 'bank' });
    assert.equal(created.status, 201);
    const blocked = await api('POST', '/accounts', { name: 'Extra', type: 'bank' });
    assert.equal(blocked.status, 402);
    assert.match(blocked.json.message, /Premium/);
  });

  await test('POST /premium/purchase upgrades the account', async () => {
    const { status, json } = await api('POST', '/premium/purchase', {
      productId: 'premium_yearly',
      purchaseToken: 'fake-token-for-testing',
    });
    assert.equal(status, 200);
    assert.equal(json.data.isPremium, true);
    assert.equal(json.data.premium.planId, 'premium_yearly');
  });

  await test('premium removes the account limit', async () => {
    const { status } = await api('POST', '/accounts', { name: 'Extra', type: 'bank' });
    assert.equal(status, 201);
  });

  await test('POST /premium/cancel returns to the free tier', async () => {
    const { status, json } = await api('POST', '/premium/cancel');
    assert.equal(status, 200);
    assert.equal(json.data.isPremium, false);
  });

  // ------------------------------------------------------- user isolation
  section('Data isolation between users');
  await test('a second user cannot read the first user transactions', async () => {
    const savedToken = token;
    const login = await api('POST', '/auth/register', {
      name: 'Other User',
      email: otherEmail,
      password: 'password123',
    });
    token = login.json.data.token;

    const list = await api('GET', '/transactions');
    assert.equal(list.json.data.transactions.length, 0);

    const budgets = await api('GET', `/budgets?month=${month}`);
    assert.equal(budgets.json.data.budgets.length, 0);

    const accounts = await api('GET', '/accounts');
    assert.equal(accounts.json.data.totalBalance, 0);

    const read = await api('GET', `/transactions/${transferId}`);
    assert.equal(read.status, 404);

    const write = await api('PATCH', `/transactions/${transferId}`, { amount: 1 });
    assert.equal(write.status, 404);

    token = savedToken;
  });

  // -------------------------------------------------------------- profile
  section('Profile');
  await test('PATCH /users/me updates the name', async () => {
    const { status, json } = await api('PATCH', '/users/me', { name: 'Renamed User' });
    assert.equal(status, 200);
    assert.equal(json.data.name, 'Renamed User');
  });

  await test('PATCH /users/me rejects an invalid colour', async () => {
    const { status } = await api('PATCH', '/users/me', { avatarColor: 'red' });
    assert.equal(status, 400);
  });

  await test('POST /auth/change-password requires the current password', async () => {
    const wrong = await api('POST', '/auth/change-password', {
      currentPassword: 'nope',
      newPassword: 'newpassword123',
    });
    assert.equal(wrong.status, 400);

    const right = await api('POST', '/auth/change-password', {
      currentPassword: 'password123',
      newPassword: 'newpassword123',
    });
    assert.equal(right.status, 200);

    const relogin = await api('POST', '/auth/login', { email, password: 'newpassword123' });
    assert.equal(relogin.status, 200);
    token = relogin.json.data.token;
  });

  await test('DELETE /users/me removes the account and all its data', async () => {
    const { status } = await api('DELETE', '/users/me');
    assert.equal(status, 200);
    assert.equal(await collections.users.countDocuments({ email }), 0);
    assert.equal(await collections.transactions.countDocuments({ userId }), 0);
    assert.equal(await collections.accounts.countDocuments({ userId }), 0);
    assert.equal(await collections.categories.countDocuments({ userId }), 0);
  });

  await test('a deleted user token no longer authenticates', async () => {
    const { status } = await api('GET', '/users/me');
    assert.equal(status, 401);
  });

  await test('404 responses use the standard error shape', async () => {
    const saved = token;
    token = 'not-a-real-token';
    const { status, json } = await api('GET', '/users/me');
    token = saved;
    assert.equal(status, 401);
    assert.equal(json.success, false);
  });

  await test('unknown routes return a JSON 404', async () => {
    const { status, json } = await api('GET', '/does-not-exist');
    assert.equal(status, 404);
    assert.equal(json.success, false);
    assert.match(json.message, /Route not found/);
  });

  // ------------------------------------------------------------- teardown
  server.close();
  const { closeDatabase } = require('../src/config/db');
  await closeDatabase();
  if (memoryServer) await memoryServer.stop();
  await collections.db?.dropDatabase?.().catch(() => {});

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error('[test] crashed:', error);
  if (memoryServer) await memoryServer.stop();
  process.exit(1);
});
