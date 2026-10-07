'use strict';

/**
 * Financial insights.
 *
 * Everything here is calculated on the backend so the numbers are identical in
 * the app, in tests and in any future client. Each insight carries a short
 * plain-language `tip` so the UI never has to invent copy for a raw number.
 */

const { collections } = require('../../../config/db');
const { sendSuccess } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { monthRange, shiftMonth, monthKey: toMonthKey } = require('../../../utils/dates');
const { monthTotals, categoryBreakdown, percentageChange } = require('../analytics/analytics');

const currentMonthKey = () => toMonthKey(new Date());

/** Biggest single expense in the month, with its category. */
async function biggestExpense(userId, month) {
  const range = monthRange(month);
  const doc = await collections.transactions
    .find({ userId, type: 'expense', date: { $gte: range.start, $lt: range.end } })
    .sort({ amount: -1 })
    .limit(1)
    .toArray();

  if (doc.length === 0) return null;

  const transaction = doc[0];
  const category = transaction.categoryId
    ? await collections.categories.findOne({ _id: transaction.categoryId })
    : null;

  return {
    amount: transaction.amount,
    date: transaction.date,
    note: transaction.note,
    categoryName: category?.name ?? 'Uncategorised',
    categoryColor: category?.color ?? '#64748B',
    categoryIcon: category?.icon ?? 'tag',
  };
}

/** Simple recurring-detection: same category, similar amount, 3+ months running. */
async function recurringSpending(userId, months = 3) {
  const month = currentMonthKey();
  const first = shiftMonth(month, -(months - 1));
  const range = monthRange(first);

  const rows = await collections.transactions
    .aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: range.start, $lt: monthRange(month).end },
          categoryId: { $ne: null },
        },
      },
      {
        $group: {
          _id: { categoryId: '$categoryId', month: '$monthKey' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ])
    .toArray();

  const byCategory = new Map();
  for (const row of rows) {
    const key = String(row._id.categoryId);
    const entry = byCategory.get(key) ?? { months: [], total: 0 };
    entry.months.push({ month: row._id.month, total: row.total });
    entry.total += row.total;
    byCategory.set(key, entry);
  }

  const candidates = [...byCategory.entries()].filter(([, entry]) => entry.months.length >= months);
  if (candidates.length === 0) return [];

  const ids = candidates.map(([key]) => key);
  const categories = await collections.categories.find({ _id: { $in: ids } }).toArray();
  const categoryMap = new Map(categories.map((category) => [String(category._id), category]));

  return candidates
    .map(([key, entry]) => {
      const amounts = entry.months.map((item) => item.total);
      const average = Math.round(amounts.reduce((sum, value) => sum + value, 0) / amounts.length);
      return {
        categoryId: key,
        name: categoryMap.get(key)?.name ?? 'Uncategorised',
        color: categoryMap.get(key)?.color ?? '#64748B',
        icon: categoryMap.get(key)?.icon ?? 'tag',
        monthsTracked: entry.months.length,
        monthlyAverage: average,
        total: entry.total,
      };
    })
    .sort((a, b) => b.monthlyAverage - a.monthlyAverage)
    .slice(0, 5);
}

const getInsights = asyncHandler(async (req, res) => {
  const month = req.query.month ?? currentMonthKey();
  const previousMonth = shiftMonth(month, -1);
  const range = monthRange(month);

  const [totals, previousTotals, categories, biggest, recurring] = await Promise.all([
    monthTotals(req.user._id, month),
    monthTotals(req.user._id, previousMonth),
    categoryBreakdown(req.user._id, month, 'expense'),
    biggestExpense(req.user._id, month),
    recurringSpending(req.user._id),
  ]);

  const daysElapsed = Math.min(range.end.getTime(), Date.now()) - range.start.getTime();
  const elapsedDays = Math.max(1, Math.round(daysElapsed / 86_400_000));

  const averageDailySpend = Math.round(totals.expense / elapsedDays);
  const projectedExpense =
    averageDailySpend *
    new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth() + 1, 0)).getUTCDate();

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

  const topCategory = categories[0] ?? null;
  const expenseChange = percentageChange(totals.expense, previousTotals.expense);
  const incomeChange = percentageChange(totals.income, previousTotals.income);

  const insights = [];

  insights.push({
    id: 'savings-rate',
    label: 'Savings rate',
    value: savingsRate,
    unit: 'percent',
    tone: savingsRate >= 20 ? 'positive' : savingsRate >= 0 ? 'neutral' : 'negative',
    caption:
      totals.income > 0
        ? `You kept ${savingsRate}% of your income this month.`
        : 'Add income to see your savings rate.',
    change: Math.round((savingsRate - previousSavingsRate) * 10) / 10,
  });

  insights.push({
    id: 'average-daily-spend',
    label: 'Average daily spend',
    value: averageDailySpend,
    unit: 'money',
    tone: 'neutral',
    caption: `Across ${elapsedDays} day${elapsedDays === 1 ? '' : 's'} so far in ${month}.`,
    change: expenseChange,
  });

  insights.push({
    id: 'top-category',
    label: 'Top spending category',
    value: topCategory ? topCategory.amount : 0,
    unit: 'money',
    tone: 'neutral',
    caption: topCategory
      ? `${topCategory.name} took ${Math.round(topCategory.share * 100)}% of your spending.`
      : 'No spending recorded yet.',
    meta: topCategory
      ? { name: topCategory.name, color: topCategory.color, icon: topCategory.icon }
      : null,
  });

  insights.push({
    id: 'projected-month',
    label: 'Projected month-end spend',
    value: projectedExpense,
    unit: 'money',
    tone: projectedExpense > totals.income && totals.income > 0 ? 'negative' : 'neutral',
    caption:
      totals.income > 0 && projectedExpense > totals.income
        ? 'At this pace you will spend more than you earn.'
        : 'Based on your current daily average.',
    change: expenseChange,
  });

  if (biggest) {
    insights.push({
      id: 'biggest-expense',
      label: 'Biggest expense',
      value: biggest.amount,
      unit: 'money',
      tone: 'neutral',
      caption: `${biggest.categoryName}${biggest.note ? ` · ${biggest.note}` : ''}`,
      meta: {
        name: biggest.categoryName,
        color: biggest.categoryColor,
        icon: biggest.categoryIcon,
      },
    });
  }

  const tips = [];
  if (expenseChange < 0) {
    tips.push(`You spent ${Math.abs(expenseChange)}% less than last month. Nice work.`);
  } else if (expenseChange > 0) {
    tips.push(
      `You spent ${expenseChange}% more than last month. Worth a look at ${topCategory?.name ?? 'your spending'}.`,
    );
  }
  if (incomeChange > 0) tips.push(`Income is up ${incomeChange}% compared with last month.`);
  if (savingsRate >= 20) tips.push('A savings rate above 20% is strong. Keep it going.');
  if (savingsRate < 0 && totals.income > 0) tips.push('You spent more than you earned this month.');
  if (topCategory && topCategory.share > 0.5) {
    tips.push(`${topCategory.name} is more than half your spending — the biggest place to cut.`);
  }
  if (tips.length === 0) tips.push('Keep logging transactions to unlock more insights.');

  return sendSuccess(res, {
    data: {
      month,
      previousMonth,
      currency: req.user.currency || 'USD',
      insights,
      tips,
      recurring,
      summary: {
        income: totals.income,
        expense: totals.expense,
        net: totals.net,
        savingsRate,
        averageDailySpend,
        projectedExpense,
        elapsedDays,
        topCategory: topCategory
          ? {
              name: topCategory.name,
              amount: topCategory.amount,
              share: topCategory.share,
              color: topCategory.color,
              icon: topCategory.icon,
            }
          : null,
      },
    },
  });
});

module.exports = { getInsights, biggestExpense, recurringSpending, currentMonthKey };
