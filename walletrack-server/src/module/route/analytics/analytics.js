'use strict';

/**
 * Monthly analytics.
 *
 *   GET /analytics/monthly?month=YYYY-MM
 *     - income / expense / net totals for the month
 *     - the same figures for the previous month, so the client can show deltas
 *     - ranked category breakdown (expense) with share of total
 *     - daily expense series across the month for a bar chart
 *     - income source breakdown
 */

const { collections } = require('../../../config/db');
const { sendSuccess } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const {
  monthRange,
  shiftMonth,
  dateKey,
  daysInMonth,
  isValidMonthKey,
} = require('../../../utils/dates');
const { toPublicCategory } = require('../categories/categories');

async function monthTotals(userId, month) {
  const range = monthRange(month);
  if (!range) return { income: 0, expense: 0, net: 0, transactionCount: 0 };

  const rows = await collections.transactions
    .aggregate([
      { $match: { userId, date: { $gte: range.start, $lt: range.end } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const byType = Object.fromEntries(rows.map((row) => [row._id, row]));
  const income = byType.income?.total ?? 0;
  const expense = byType.expense?.total ?? 0;
  const transfer = byType.transfer?.count ?? 0;

  return {
    income,
    expense,
    net: income - expense,
    transactionCount: (byType.income?.count ?? 0) + (byType.expense?.count ?? 0) + transfer,
  };
}

async function categoryBreakdown(userId, month, type = 'expense') {
  const range = monthRange(month);
  if (!range) return [];

  const rows = await collections.transactions
    .aggregate([
      {
        $match: {
          userId,
          type,
          date: { $gte: range.start, $lt: range.end },
          categoryId: { $ne: null },
        },
      },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
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
    const publicCategory = category ? toPublicCategory(category) : null;
    return {
      categoryId: String(row._id),
      name: publicCategory?.name ?? 'Uncategorised',
      icon: publicCategory?.icon ?? 'tag',
      color: publicCategory?.color ?? '#64748B',
      amount: row.total,
      count: row.count,
      share: total > 0 ? Math.round((row.total / total) * 1000) / 1000 : 0,
      average: row.count > 0 ? Math.round(row.total / row.count) : 0,
    };
  });
}

/** Zero filled expense/income series for every day of the month. */
async function dailySeriesForMonth(userId, month) {
  const range = monthRange(month);
  if (!range) return [];

  const rows = await collections.transactions
    .aggregate([
      {
        $match: {
          userId,
          type: { $in: ['income', 'expense'] },
          date: { $gte: range.start, $lt: range.end },
        },
      },
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

  const total = daysInMonth(month);
  const series = [];
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(range.start.getTime());
    date.setUTCDate(day);
    const key = dateKey(date);
    const entry = index.get(key) ?? { income: 0, expense: 0 };
    series.push({
      date: key,
      label: String(day),
      value: entry.expense,
      income: entry.income,
      expense: entry.expense,
      net: entry.income - entry.expense,
    });
  }

  return series;
}

function percentageChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const month = isValidMonthKey(req.query.month)
    ? req.query.month
    : new Date().toISOString().slice(0, 7);
  const previousMonth = shiftMonth(month, -1);

  const [totals, previousTotals, categories, incomeSources, daily] = await Promise.all([
    monthTotals(req.user._id, month),
    monthTotals(req.user._id, previousMonth),
    categoryBreakdown(req.user._id, month, 'expense'),
    categoryBreakdown(req.user._id, month, 'income'),
    dailySeriesForMonth(req.user._id, month),
  ]);

  const savingsRate =
    totals.income > 0
      ? Math.round(((totals.income - totals.expense) / totals.income) * 1000) / 10
      : 0;

  const previousSavingsRate =
    previousTotals.income > 0
      ? Math.round(
          ((previousTotals.income - previousTotals.expense) / previousTotals.income) * 1000,
        ) / 10
      : 0;

  return sendSuccess(res, {
    data: {
      month,
      previousMonth,
      currency: req.user.currency || 'USD',
      totals: {
        ...totals,
        savingsRate,
        averageDailyExpense: Math.round(totals.expense / Math.max(1, daily.length)),
      },
      comparison: {
        previous: previousTotals,
        incomeChange: percentageChange(totals.income, previousTotals.income),
        expenseChange: percentageChange(totals.expense, previousTotals.expense),
        savingsRateChange: Math.round((savingsRate - previousSavingsRate) * 10) / 10,
      },
      categories,
      incomeSources,
      daily,
    },
  });
});

/** Category detail for a month, used when tapping a category in analytics. */
const getCategoryDetail = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const month = isValidMonthKey(req.query.month)
    ? req.query.month
    : new Date().toISOString().slice(0, 7);
  const range = monthRange(month);

  const category = await collections.categories.findOne({
    _id: categoryId,
    userId: req.user._id,
  });
  if (!category) return sendSuccess(res, { status: 404, message: 'Category not found.' });

  const match = {
    userId: req.user._id,
    categoryId,
    date: { $gte: range.start, $lt: range.end },
  };

  const [summary, transactions] = await Promise.all([
    collections.transactions
      .aggregate([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ])
      .toArray(),
    collections.transactions.find(match).sort({ date: -1 }).limit(50).toArray(),
  ]);

  const byType = Object.fromEntries(summary.map((row) => [row._id, row]));

  return sendSuccess(res, {
    data: {
      month,
      category: toPublicCategory(category),
      expense: byType.expense?.total ?? 0,
      income: byType.income?.total ?? 0,
      count: (byType.expense?.count ?? 0) + (byType.income?.count ?? 0),
      average:
        (byType.expense?.count ?? 0) > 0
          ? Math.round((byType.expense?.total ?? 0) / byType.expense.count)
          : 0,
      transactions,
    },
  });
});

/** Months that actually contain data, newest first, for the month picker. */
const getAvailableMonths = asyncHandler(async (req, res) => {
  const rows = await collections.transactions
    .aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$monthKey', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 36 },
    ])
    .toArray();

  return sendSuccess(res, {
    data: rows.map((row) => ({ month: row._id, total: row.total, count: row.count })),
  });
});

module.exports = {
  getMonthlyAnalytics,
  getCategoryDetail,
  getAvailableMonths,
  monthTotals,
  categoryBreakdown,
  dailySeriesForMonth,
  percentageChange,
};
