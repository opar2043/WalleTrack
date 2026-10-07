'use strict';

/**
 * Transaction logic — the heart of the app.
 *
 * MONEY
 * All amounts are integers in the smallest currency unit (see utils/money.js).
 *
 * BALANCE EFFECTS (delta applied to each touched account)
 *   income:   accountId           += amount
 *   expense:  accountId           -= amount
 *   transfer: toAccountId         += amount
 *             accountId           -= amount
 *
 * CORRECTNESS ON EDIT / DELETE
 * Update = reverse(oldEffect) then apply(newEffect). Delete = reverse(oldEffect).
 * `applyDelta` is the single place that mutates a balance, so the reversal is
 * guaranteed to be the exact negative of the original effect. Within a single
 * request the steps are: reverse -> mutate document -> insert/update/delete.
 * Reversing first means a failure at any later point leaves the balance
 * consistent with the stored transaction set (never "money created").
 * A final reconciliation helper (`recalculateAccountBalance`) exists for
 * maintenance and the seed script.
 */

const { collections } = require('../../../config/db');
const { ApiError, sendSuccess, sendCreated } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { toUtcMidnight, monthKey: toMonthKey, dateKey } = require('../../../utils/dates');
const { toObjectId } = require('../../../utils/ids');
const { alertsForTransaction } = require('../budgets/budgets');
const { requireOwnedAccount } = require('../accounts/accounts');

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];

function toPublicTransaction(transaction, extras = {}, currency = 'USD') {
  return {
    id: String(transaction._id),
    type: transaction.type,
    amount: transaction.amount,
    currency,
    accountId: transaction.accountId ? String(transaction.accountId) : null,
    toAccountId: transaction.toAccountId ? String(transaction.toAccountId) : null,
    categoryId: transaction.categoryId ? String(transaction.categoryId) : null,
    date: dateKey(transaction.date),
    monthKey: transaction.monthKey,
    note: transaction.note || null,
    ...extras,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

/** Single place an account balance is mutated. */
async function applyDelta(accountId, delta) {
  if (delta === 0) return;
  await collections.accounts.updateOne(
    { _id: accountId },
    { $inc: { balance: delta }, $set: { updatedAt: new Date() } },
  );
}

/** Accounts touched by a transaction, with the signed effect on each. */
function balanceEffects(transaction) {
  if (transaction.type === 'income' || transaction.type === 'expense') {
    const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    return [{ accountId: transaction.accountId, delta }];
  }
  return [
    { accountId: transaction.accountId, delta: -transaction.amount },
    { accountId: transaction.toAccountId, delta: transaction.amount },
  ];
}

/** Applies (delta > 0) or reverses (delta < 0) a set of effects. */
/** Sequential on purpose: the ordering of balance writes stays explicit. */
async function applyEffects(effects, multiplier = 1) {
  for (const effect of effects) {
    await applyDelta(effect.accountId, effect.delta * multiplier);
  }
}

async function loadCategoriesFor(transactions) {
  const ids = [...new Set(transactions.map((item) => item.categoryId).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const categories = await collections.categories.find({ _id: { $in: ids } }).toArray();
  return new Map(categories.map((category) => [String(category._id), category]));
}

async function loadAccountsFor(transactions) {
  const ids = [
    ...new Set(transactions.flatMap((item) => [item.accountId, item.toAccountId]).filter(Boolean)),
  ];
  if (ids.length === 0) return new Map();
  const accounts = await collections.accounts.find({ _id: { $in: ids } }).toArray();
  return new Map(accounts.map((account) => [String(account._id), account]));
}

/** Flattens account + category names onto the row so the client renders without extra calls. */
async function decorate(transactions, currency = 'USD') {
  const [categoryMap, accountMap] = await Promise.all([
    loadCategoriesFor(transactions),
    loadAccountsFor(transactions),
  ]);

  return transactions.map((transaction) => {
    const category = transaction.categoryId
      ? categoryMap.get(String(transaction.categoryId))
      : null;
    const account = accountMap.get(String(transaction.accountId));
    const toAccount = transaction.toAccountId
      ? accountMap.get(String(transaction.toAccountId))
      : null;

    return toPublicTransaction(
      transaction,
      {
        accountName: account?.name ?? null,
        toAccountName: toAccount?.name ?? null,
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
        categoryIcon: category?.icon ?? null,
      },
      currency,
    );
  });
}

async function resolveCategory(userId, categoryId, type) {
  if (type === 'transfer') return null;
  if (!categoryId) throw ApiError.badRequest('Choose a category for this transaction.');

  const category = await collections.categories.findOne({ _id: categoryId, userId });
  if (!category) throw ApiError.notFound('Category not found.');
  if (category.type !== type) {
    throw ApiError.badRequest(`"${category.name}" is a ${category.type} category, not ${type}.`);
  }
  return category;
}

const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, type, accountId, categoryId, from, to, search, minAmount, maxAmount } =
    req.query;

  const filter = { userId: req.user._id };

  if (type) filter.type = type;
  if (categoryId) filter.categoryId = categoryId;
  if (accountId) filter.$or = [{ accountId }, { toAccountId: accountId }];
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = toUtcMidnight(from);
    if (to) filter.date.$lt = toUtcMidnight(to);
  }
  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = {};
    if (minAmount !== undefined) filter.amount.$gte = minAmount;
    if (maxAmount !== undefined) filter.amount.$lte = maxAmount;
  }
  if (search)
    filter.note = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const total = await collections.transactions.countDocuments(filter);
  const documents = await collections.transactions
    .find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return sendSuccess(res, {
    data: {
      items: await decorate(documents, req.user.currency || 'USD'),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page * limit < total,
      },
    },
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await collections.transactions.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!transaction) throw ApiError.notFound('Transaction not found.');

  const [decorated] = await decorate([transaction], req.user.currency || 'USD');
  return sendSuccess(res, { data: decorated });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, accountId, toAccountId, categoryId, date, note } = req.body;

  const when = toUtcMidnight(date) ?? new Date();
  const account = await requireOwnedAccount(accountId, req.user._id);

  let toAccount = null;
  if (type === 'transfer') {
    if (!toAccountId) throw ApiError.badRequest('Choose where the money is going.');
    if (String(toAccountId) === String(accountId)) {
      throw ApiError.badRequest('Choose two different accounts for a transfer.');
    }
    toAccount = await requireOwnedAccount(toAccountId, req.user._id);
  }

  const category = await resolveCategory(req.user._id, categoryId, type);

  const now = new Date();
  const doc = {
    userId: req.user._id,
    type,
    amount,
    accountId,
    toAccountId: type === 'transfer' ? toAccountId : null,
    categoryId: category ? category._id : null,
    date: when,
    monthKey: toMonthKey(when),
    note: note || null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collections.transactions.insertOne(doc);
  doc._id = result.insertedId;

  await applyEffects(balanceEffects(doc));

  // Budget alerts travel with the response so the client can toast right away.
  const alerts = await alertsForTransaction(req.user._id, doc);
  const balances = await loadAccountsFor([doc]);

  const [decorated] = await decorate([doc], req.user.currency || 'USD');
  decorated.balanceAfter = balances.get(String(doc.accountId))?.balance ?? account.balance;
  if (type === 'transfer') {
    decorated.toBalanceAfter = balances.get(String(doc.toAccountId))?.balance ?? toAccount.balance;
  }

  return sendCreated(res, { transaction: decorated, alerts }, 'Transaction saved.');
});

const updateTransaction = asyncHandler(async (req, res) => {
  const existing = await collections.transactions.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!existing) throw ApiError.notFound('Transaction not found.');

  const { type, amount, accountId, toAccountId, categoryId, date, note } = req.body;
  const nextType = type ?? existing.type;

  const nextAccountId = accountId ?? existing.accountId;
  await requireOwnedAccount(nextAccountId, req.user._id);

  let nextToAccountId = nextType === 'transfer' ? (toAccountId ?? existing.toAccountId) : null;
  if (nextType === 'transfer') {
    if (!nextToAccountId) throw ApiError.badRequest('Choose where the money is going.');
    if (String(nextToAccountId) === String(nextAccountId)) {
      throw ApiError.badRequest('Choose two different accounts for a transfer.');
    }
    await requireOwnedAccount(nextToAccountId, req.user._id);
  } else {
    nextToAccountId = null;
  }

  const category =
    nextType === 'transfer'
      ? null
      : await resolveCategory(
          req.user._id,
          categoryId === undefined ? existing.categoryId : categoryId,
          nextType,
        );

  const when = date !== undefined ? (toUtcMidnight(date) ?? existing.date) : existing.date;

  const updated = {
    ...existing,
    type: nextType,
    amount: amount ?? existing.amount,
    accountId: nextAccountId,
    toAccountId: nextToAccountId,
    categoryId: category ? category._id : null,
    date: when,
    monthKey: toMonthKey(when),
    note: note === undefined ? existing.note : note || null,
    updatedAt: new Date(),
  };

  // 1. reverse the old effect, 2. store the new transaction, 3. apply the new effect.
  const fields = { ...updated };
  delete fields._id;

  await applyEffects(balanceEffects(existing), -1);
  await collections.transactions.updateOne(
    { _id: existing._id, userId: req.user._id },
    { $set: fields },
  );
  await applyEffects(balanceEffects(updated));

  const alerts = await alertsForTransaction(req.user._id, updated);
  const [decorated] = await decorate([updated], req.user.currency || 'USD');

  return sendSuccess(res, {
    message: 'Transaction updated.',
    data: { transaction: decorated, alerts },
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await collections.transactions.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!transaction) throw ApiError.notFound('Transaction not found.');

  await applyEffects(balanceEffects(transaction), -1);
  await collections.transactions.deleteOne({ _id: transaction._id, userId: req.user._id });

  return sendSuccess(res, { message: 'Transaction deleted.' });
});

/**
 * Recomputes one account balance from scratch: starting balance plus the signed
 * sum of its transactions. Used by the seed script and available for repair.
 */
async function recalculateAccountBalance(userId, accountId) {
  const accountIdObjectId = toObjectId(accountId);
  if (!accountIdObjectId) return null;

  const account = await collections.accounts.findOne({ _id: accountIdObjectId, userId });
  if (!account) return null;

  const sumWhere = async (match) => {
    const rows = await collections.transactions
      .aggregate([
        { $match: { userId, ...match } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray();
    return rows[0]?.total ?? 0;
  };

  const [income, expense, sent, received] = await Promise.all([
    sumWhere({ accountId, type: 'income' }),
    sumWhere({ accountId, type: 'expense' }),
    sumWhere({ accountId, type: 'transfer' }),
    sumWhere({ toAccountId: accountId, type: 'transfer' }),
  ]);

  const balance = account.startingBalance + income - expense - sent + received;

  await collections.accounts.updateOne(
    { _id: accountIdObjectId },
    { $set: { balance, updatedAt: new Date() } },
  );

  return balance;
}

module.exports = {
  TRANSACTION_TYPES,
  toPublicTransaction,
  applyDelta,
  balanceEffects,
  decorate,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  recalculateAccountBalance,
};
