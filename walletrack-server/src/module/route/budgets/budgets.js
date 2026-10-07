'use strict';

/**
 * Budget logic.
 *
 * A budget targets one month (`YYYY-MM`) and is either:
 *   - category scoped (`categoryId` set), or
 *   - overall (no `categoryId`), where spending is summed across all categories.
 *
 * `spent` is recomputed on read from the transactions collection rather than
 * stored, so it can never drift out of sync. The stored `limit` is the only
 * user-editable value plus the month/category keys.
 *
 * Status thresholds (also mirrored in the client for optimistic UI):
 *   normal   spent <  80% of limit
 *   warning  spent >= 80% and < 100%
 *   overspent spent >= 100%
 */

const { ObjectId } = require('mongodb');
const { collections } = require('../../../config/db');
const { limitsFor } = require('../../../config/limits');
const { ApiError, sendSuccess, sendCreated } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { monthRange, shiftMonth } = require('../../../utils/dates');
const { toPublicCategory } = require('../categories/categories');

const WARNING_RATIO = 0.8;
const OVERSPENT_RATIO = 1;

function statusFor(spent, limit) {
  if (limit <= 0) return 'normal';
  const ratio = spent / limit;
  if (ratio >= OVERSPENT_RATIO) return 'overspent';
  if (ratio >= WARNING_RATIO) return 'warning';
  return 'normal';
}

function toPublicBudget(budget, spent, category) {
  const limit = budget.limit;
  const ratio = limit > 0 ? spent / limit : 0;
  const status = statusFor(spent, limit);

  return {
    id: String(budget._id),
    month: budget.month,
    categoryId: budget.categoryId ? String(budget.categoryId) : null,
    category: category ? toPublicCategory(category) : null,
    limit,
    spent,
    remaining: limit - spent,
    ratio: Math.round(ratio * 1000) / 1000,
    progress: Math.max(0, Math.min(1, ratio)),
    status,
    isOverall: !budget.categoryId,
    note: budget.note || null,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

/**
 * Sums spending for the given budgets in one aggregation.
 * The returned Map is keyed by **budget id**, so callers never have to know
 * whether a budget is category scoped or overall.
 * @param {Array} budgets budget documents for a single month
 */
async function computeSpentForMonth(userId, budgets, month) {
  const range = monthRange(month);
  if (!range || budgets.length === 0) return new Map();

  const categoryBudgets = budgets.filter((budget) => budget.categoryId);
  const overallBudgets = budgets.filter((budget) => !budget.categoryId);

  const result = new Map();

  const expenseMatch = {
    userId,
    type: 'expense',
    date: { $gte: range.start, $lt: range.end },
  };

  if (categoryBudgets.length > 0) {
    const categoryIds = [...new Set(categoryBudgets.map((budget) => String(budget.categoryId)))];

    const byCategory = await collections.transactions
      .aggregate([
        {
          $match: {
            ...expenseMatch,
            categoryId: { $in: categoryIds.map((id) => new ObjectId(id)) },
          },
        },
        { $group: { _id: '$categoryId', spent: { $sum: '$amount' } } },
      ])
      .toArray();

    const spentByCategory = new Map(byCategory.map((row) => [String(row._id), row.spent]));
    for (const budget of categoryBudgets) {
      result.set(String(budget._id), spentByCategory.get(String(budget.categoryId)) ?? 0);
    }
  }

  if (overallBudgets.length > 0) {
    const overall = await collections.transactions
      .aggregate([{ $match: expenseMatch }, { $group: { _id: null, spent: { $sum: '$amount' } } }])
      .toArray();
    const total = overall[0]?.spent ?? 0;
    for (const budget of overallBudgets) result.set(String(budget._id), total);
  }

  return result;
}

/** Full budget list with live spend for a month. Shared with dashboard. */
async function listBudgetsWithProgress(userId, month) {
  const budgets = await collections.budgets
    .find({ userId, month })
    .sort({ categoryId: 1, createdAt: 1 })
    .toArray();

  if (budgets.length === 0) return [];

  const spentMap = await computeSpentForMonth(userId, budgets, month);
  const categoryIds = budgets.map((budget) => budget.categoryId).filter(Boolean);
  const categories = categoryIds.length
    ? await collections.categories.find({ _id: { $in: categoryIds } }).toArray()
    : [];
  const categoryMap = new Map(categories.map((category) => [String(category._id), category]));

  return budgets.map((budget) =>
    toPublicBudget(
      budget,
      spentMap.get(String(budget._id)) ?? 0,
      categoryMap.get(String(budget.categoryId)),
    ),
  );
}

/**
 * Budget alerts for the transactions module to toast immediately after a save.
 * Only budgets belonging to the transaction's category and month are checked.
 */
async function alertsForTransaction(userId, transaction) {
  if (transaction.type !== 'expense' || !transaction.categoryId) return [];

  const budgets = await collections.budgets
    .find({ userId, month: transaction.monthKey, categoryId: transaction.categoryId })
    .toArray();
  if (budgets.length === 0) return [];

  const spentMap = await computeSpentForMonth(userId, budgets, transaction.monthKey);
  const categories = await collections.categories
    .find({ _id: { $in: [transaction.categoryId] } })
    .toArray();
  const category = categories[0];

  return budgets.map((budget) => {
    const view = toPublicBudget(budget, spentMap.get(String(budget._id)) ?? 0, category);
    let severity = 'info';
    let message = `${category?.name || 'Category'} budget is ${Math.round(view.progress * 100)}% used.`;
    if (view.status === 'overspent') {
      severity = 'danger';
      message = `You are over the ${category?.name || 'category'} budget for ${transaction.monthKey}.`;
    } else if (view.status === 'warning') {
      severity = 'warning';
      message = `${category?.name || 'Category'} budget is ${Math.round(view.progress * 100)}% used.`;
    }
    return { severity, message, budget: view };
  });
}

const listBudgets = asyncHandler(async (req, res) => {
  const month = req.query.month;
  const budgets = await listBudgetsWithProgress(req.user._id, month);

  const summary = budgets.reduce(
    (acc, budget) => {
      acc.totalLimit += budget.limit;
      acc.totalSpent += budget.spent;
      if (budget.status === 'overspent') acc.overspent += 1;
      else if (budget.status === 'warning') acc.warning += 1;
      return acc;
    },
    { totalLimit: 0, totalSpent: 0, warning: 0, overspent: 0 },
  );

  return sendSuccess(res, {
    data: { month, budgets, summary, warningRatio: WARNING_RATIO },
  });
});

const createBudget = asyncHandler(async (req, res) => {
  const { month, categoryId, limit, note } = req.body;

  const limits = limitsFor(Boolean(req.user.isPremium));
  if (limits.maxBudgets !== null) {
    const count = await collections.budgets.countDocuments({ userId: req.user._id });
    if (count >= limits.maxBudgets) {
      throw new ApiError(
        402,
        `The free plan includes up to ${limits.maxBudgets} budgets. Upgrade to Premium for unlimited budgets.`,
      );
    }
  }

  if (categoryId) {
    const category = await collections.categories.findOne({
      _id: categoryId,
      userId: req.user._id,
    });
    if (!category) throw ApiError.notFound('Category not found.');
  }

  const existing = await collections.budgets.findOne({
    userId: req.user._id,
    month,
    categoryId: categoryId || null,
  });
  if (existing) {
    throw ApiError.conflict('A budget for that category and month already exists.');
  }

  const now = new Date();
  const doc = {
    userId: req.user._id,
    month,
    categoryId: categoryId || null,
    limit,
    note: note || null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collections.budgets.insertOne(doc);
  doc._id = result.insertedId;

  const budgets = await listBudgetsWithProgress(req.user._id, month);
  const created = budgets.find((budget) => String(budget.id) === String(result.insertedId));

  return sendCreated(res, created);
});

const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit, month, categoryId, note } = req.body;

  const budget = await collections.budgets.findOne({ _id: id, userId: req.user._id });
  if (!budget) throw ApiError.notFound('Budget not found.');

  const updates = { updatedAt: new Date() };
  if (limit !== undefined) updates.limit = limit;
  if (note !== undefined) updates.note = note || null;

  const nextMonth = month ?? budget.month;
  const nextCategoryId = categoryId === undefined ? budget.categoryId : categoryId || null;
  updates.month = nextMonth;
  updates.categoryId = nextCategoryId;

  if (nextMonth !== budget.month || String(nextCategoryId) !== String(budget.categoryId)) {
    const clash = await collections.budgets.findOne({
      userId: req.user._id,
      month: nextMonth,
      categoryId: nextCategoryId,
      _id: { $ne: id },
    });
    if (clash) throw ApiError.conflict('A budget for that category and month already exists.');
  }

  await collections.budgets.updateOne({ _id: id, userId: req.user._id }, { $set: updates });

  const budgets = await listBudgetsWithProgress(req.user._id, nextMonth);
  const updated = budgets.find((item) => String(item.id) === String(id));

  return sendSuccess(res, { message: 'Budget updated.', data: updated });
});

const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const budget = await collections.budgets.findOne({ _id: id, userId: req.user._id });
  if (!budget) throw ApiError.notFound('Budget not found.');

  await collections.budgets.deleteOne({ _id: id, userId: req.user._id });
  return sendSuccess(res, { message: 'Budget deleted.' });
});

/** Copies every budget from one month into another, for "same as last month". */
const copyBudgets = asyncHandler(async (req, res) => {
  const { fromMonth, toMonth } = req.body;

  const source = await collections.budgets
    .find({ userId: req.user._id, month: fromMonth })
    .toArray();
  if (source.length === 0) throw ApiError.badRequest('There are no budgets in that month to copy.');

  const now = new Date();
  const docs = source
    .filter((budget) => !budget.categoryId)
    .map((budget) => ({
      userId: req.user._id,
      month: toMonth || shiftMonth(fromMonth, 1),
      categoryId: null,
      limit: budget.limit,
      note: budget.note || null,
      createdAt: now,
      updatedAt: now,
    }));

  if (docs.length === 0) throw ApiError.badRequest('Only overall budgets can be copied in bulk.');

  await collections.budgets.insertMany(docs, { ordered: false });
  const budgets = await listBudgetsWithProgress(req.user._id, docs[0].month);

  return sendCreated(res, budgets, 'Budgets copied.');
});

module.exports = {
  WARNING_RATIO,
  statusFor,
  toPublicBudget,
  listBudgetsWithProgress,
  alertsForTransaction,
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  copyBudgets,
};
