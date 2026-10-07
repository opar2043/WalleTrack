'use strict';

/**
 * Dashboard logic.
 *
 * One request assembles everything the Home screen needs, so the dashboard
 * paints in a single round trip:
 *   - total balance across active accounts
 *   - this month's income / expense / net
 *   - last 7 days of income + expense per day (weekly bar chart)
 *   - balance/spending trend series for 7 or 30 days (line/area chart)
 *   - current month's top categories (donut)
 *   - budget alerts
 *   - 5 most recent transactions
 *
 * Every figure is an integer in the smallest currency unit.
 */

const { collections } = require('../../../config/db');
const { sendSuccess } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { monthKey, monthRange, lastDays, dateKey, addDays } = require('../../../utils/dates');
const { listBudgetsWithProgress } = require('../budgets/budgets');
const { decorate } = require('../transactions/transactions');
const { toPublicCategory } = require('../categories/categories');

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function sumForMonth(userId, month, type) {
  const range = monthRange(month);
  if (!range) return 0;
  const rows = await collections.transactions
    .aggregate([
      { $match: { userId, type, date: { $gte: range.start, $lt: range.end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    .toArray();
  return rows[0]?.total ?? 0;
}

/** Income + expense per day for the last `days` days, oldest first. */
async function dailySeries(userId, days, today = new Date()) {
  const dayList = lastDays(days, today);
  const start = dayList[0];
  const end = addDays(dayList[dayList.length - 1], 1);

  const rows = await collections.transactions
    .aggregate([
      { $match: { userId, type: { $in: ['income', 'expense'] }, date: { $gte: start, $lt: end } } },
      { $group: { _id: { date: '$date', type: '$type' }, total: { $sum: '$amount' } } },
    ])
    .toArray();

  const index = new Map();
  for (const row of rows) {
    const key = dateKey(row._id.date);
    const entry = index.get(key) ?? { income: 0, expense: 0 };
    entry[row._id.type] = row.total;
    index.set(key, entry);
  }

  return dayList.map((day, position) => {
    const key = dateKey(day);
    const entry = index.get(key) ?? { income: 0, expense: 0 };
    return {
      date: key,
      dayIndex: position,
      label: WEEKDAY_LABELS[day.getUTCDay()],
      dayOfMonth: day.getUTCDate(),
      income: entry.income,
      expense: entry.expense,
      net: entry.income - entry.expense,
    };
  });
}

/** Running balance across the window, plus cumulative spend for the trend chart. */
async function balanceSeries(userId, days, startingBalance, today = new Date()) {
  const dayList = lastDays(days, today);
  const start = dayList[0];

  const opening = await collections.accounts
    .aggregate([
      { $match: { userId, isArchived: false } },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ])
    .toArray();

  const currentTotal = opening[0]?.total ?? startingBalance;

  // Net movement per day across the window, so we can walk backwards.
  const rows = await collections.transactions
    .aggregate([
      { $match: { userId, date: { $gte: start } } },
      {
        $group: {
          _id: { date: '$date', type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ])
    .toArray();

  const movement = new Map();
  for (const row of rows) {
    const key = dateKey(row._id.date);
    const signed = row._id.type === 'income' ? row.total : -row.total;
    movement.set(key, (movement.get(key) ?? 0) + signed);
  }

  const series = [];
  let running = currentTotal;
  for (let index = dayList.length - 1; index >= 0; index -= 1) {
    const day = dayList[index];
    series[index] = {
      date: dateKey(day),
      label: days <= 7 ? WEEKDAY_LABELS[day.getUTCDay()] : String(day.getUTCDate()),
      balance: running,
    };
    running -= movement.get(dateKey(day)) ?? 0;
  }

  return series;
}

/** Top spending categories for a month, ordered by amount descending. */
async function topCategories(userId, month, limit = 6) {
  const range = monthRange(month);
  if (!range) return [];

  const rows = await collections.transactions
    .aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: range.start, $lt: range.end },
          categoryId: { $ne: null },
        },
      },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: limit },
    ])
    .toArray();

  if (rows.length === 0) return [];

  const categories = await collections.categories
    .find({ _id: { $in: rows.map((row) => row._id) } })
    .toArray();
  const categoryMap = new Map(categories.map((category) => [String(category._id), category]));

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => {
    const category = categoryMap.get(String(row._id));
    return {
      categoryId: String(row._id),
      name: category?.name ?? 'Uncategorised',
      icon: category?.icon ?? 'tag',
      color: category?.color ?? '#64748B',
      amount: row.total,
      count: row.count,
      share: total > 0 ? Math.round((row.total / total) * 1000) / 1000 : 0,
    };
  });
}

const getDashboard = asyncHandler(async (req, res) => {
  const today = req.query.date ? new Date(`${req.query.date}T00:00:00.000Z`) : new Date();
  const currentMonth = monthKey(today);
  const rangeDays = req.query.range === '30' ? 30 : 7;

  const accounts = await collections.accounts
    .find({ userId: req.user._id, isArchived: false })
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const [monthIncome, monthExpense, weekly, trend, categories, budgets, recentDocs, archivedCount] =
    await Promise.all([
      sumForMonth(req.user._id, currentMonth, 'income'),
      sumForMonth(req.user._id, currentMonth, 'expense'),
      dailySeries(req.user._id, 7, today),
      balanceSeries(req.user._id, rangeDays, totalBalance, today),
      topCategories(req.user._id, currentMonth),
      listBudgetsWithProgress(req.user._id, currentMonth),
      collections.transactions
        .find({ userId: req.user._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .toArray(),
      collections.accounts.countDocuments({ userId: req.user._id, isArchived: true }),
    ]);

  const weeklyIncome = weekly.reduce((sum, day) => sum + day.income, 0);
  const weeklyExpense = weekly.reduce((sum, day) => sum + day.expense, 0);

  const budgetAlerts = budgets
    .filter((budget) => budget.status !== 'normal')
    .map((budget) => ({
      id: budget.id,
      status: budget.status,
      name: budget.isOverall ? 'Overall budget' : (budget.category?.name ?? 'Budget'),
      color: budget.isOverall ? '#4F46E5' : (budget.category?.color ?? '#4F46E5'),
      progress: budget.progress,
      spent: budget.spent,
      limit: budget.limit,
      month: budget.month,
    }));

  return sendSuccess(res, {
    data: {
      currency: req.user.currency || 'USD',
      locale: req.user.locale || 'en-US',
      greetingName: req.user.name.split(' ')[0],
      totalBalance,
      month: currentMonth,
      monthSummary: {
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      },
      weekly: {
        days: weekly,
        income: weeklyIncome,
        expense: weeklyExpense,
        net: weeklyIncome - weeklyExpense,
      },
      trend: { range: String(rangeDays), points: trend },
      categories,
      accounts: accounts.map((account) => ({
        id: String(account._id),
        name: account.name,
        type: account.type,
        balance: account.balance,
        color: account.color,
        icon: account.icon,
      })),
      archivedAccountCount: archivedCount,
      budgetAlerts,
      budgets: budgets.map((budget) => ({
        id: budget.id,
        name: budget.isOverall ? 'Overall' : (budget.category?.name ?? 'Budget'),
        progress: budget.progress,
        status: budget.status,
        color: budget.isOverall ? '#4F46E5' : (budget.category?.color ?? '#4F46E5'),
      })),
      recentTransactions: await decorate(recentDocs),
      categoryColors: Object.fromEntries(
        categories.map((entry) => [entry.categoryId, entry.color]),
      ),
      categoryRefs: categories.map((entry) => ({
        id: entry.categoryId,
        name: entry.name,
        icon: entry.icon,
        color: entry.color,
        isDefault: categories.some((c) => c.categoryId === entry.categoryId),
      })),
    },
  });
});

module.exports = {
  getDashboard,
  dailySeries,
  balanceSeries,
  topCategories,
  sumForMonth,
  WEEKDAY_LABELS,
  toPublicCategory,
};
