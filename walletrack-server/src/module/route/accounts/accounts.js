'use strict';

/**
 * Account logic.
 *
 * BALANCE MODEL
 * `balance` is a stored integer (smallest currency unit) on every account and
 * is maintained transactionally by the transactions module:
 *   income   -> balance += amount
 *   expense  -> balance -= amount
 *   transfer -> fromAccount.balance -= amount, toAccount.balance += amount
 * Starting balance is the balance before any transaction existed, so the
 * invariant `balance === startingBalance + sum(signed transaction amounts)`
 * always holds and can be rebuilt at any time.
 *
 * Deleting an account is destructive to history, so accounts with transactions
 * can only be archived (hidden from pickers, excluded from totals). Accounts
 * with no transactions are deleted outright.
 */

const { collections } = require('../../../config/db');
const { limitsFor } = require('../../../config/limits');
const { ApiError, sendSuccess, sendCreated } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { toObjectId } = require('../../../utils/ids');

const ACCOUNT_TYPES = ['cash', 'bank', 'card'];

function toPublicAccount(account) {
  return {
    id: String(account._id),
    name: account.name,
    type: account.type,
    startingBalance: account.startingBalance,
    balance: account.balance,
    color: account.color,
    icon: account.icon,
    note: account.note || null,
    isArchived: Boolean(account.isArchived),
    order: account.order ?? 0,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

/** Finds an account owned by the caller or throws. */
async function requireOwnedAccount(accountId, userId) {
  const account = await collections.accounts.findOne({ _id: toObjectId(accountId), userId });
  if (!account) throw ApiError.notFound('Account not found.');
  return account;
}

const listAccounts = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.includeArchived !== 'true') filter.isArchived = false;

  const accounts = await collections.accounts
    .find(filter)
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  const totalBalance = accounts
    .filter((account) => !account.isArchived)
    .reduce((sum, account) => sum + account.balance, 0);

  return sendSuccess(res, {
    data: {
      accounts: accounts.map(toPublicAccount),
      totalBalance,
      counts: {
        total: accounts.length,
        active: accounts.filter((account) => !account.isArchived).length,
      },
    },
  });
});

const getAccount = asyncHandler(async (req, res) => {
  const account = await requireOwnedAccount(req.params.id, req.user._id);
  return sendSuccess(res, { data: toPublicAccount(account) });
});

const createAccount = asyncHandler(async (req, res) => {
  const { name, type, startingBalance, color, icon, note } = req.body;

  const limits = limitsFor(Boolean(req.user.isPremium));
  if (limits.maxAccounts !== null) {
    const activeCount = await collections.accounts.countDocuments({
      userId: req.user._id,
      isArchived: false,
    });
    if (activeCount >= limits.maxAccounts) {
      throw new ApiError(
        402,
        `The free plan includes up to ${limits.maxAccounts} accounts. Upgrade to Premium for unlimited accounts.`,
      );
    }
  }

  const duplicate = await collections.accounts.findOne({
    userId: req.user._id,
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });
  if (duplicate) throw ApiError.conflict(`You already have an account called "${name}".`);

  const highest = await collections.accounts
    .find({ userId: req.user._id })
    .sort({ order: -1 })
    .limit(1)
    .toArray();

  const now = new Date();
  const doc = {
    userId: req.user._id,
    name: name.trim(),
    type,
    startingBalance,
    balance: startingBalance,
    color: color || '#4F46E5',
    icon: icon || (type === 'cash' ? 'wallet' : type === 'card' ? 'credit-card' : 'landmark'),
    note: note || null,
    isArchived: false,
    order: (highest[0]?.order ?? 0) + 1,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collections.accounts.insertOne(doc);
  doc._id = result.insertedId;

  return sendCreated(res, toPublicAccount(doc));
});

const updateAccount = asyncHandler(async (req, res) => {
  const account = await requireOwnedAccount(req.params.id, req.user._id);
  const { name, color, icon, note, isArchived, order } = req.body;

  const updates = { updatedAt: new Date() };

  if (name !== undefined && name.trim() !== account.name) {
    const duplicate = await collections.accounts.findOne({
      userId: req.user._id,
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      _id: { $ne: account._id },
    });
    if (duplicate) throw ApiError.conflict(`You already have an account called "${name}".`);
    updates.name = name.trim();
  }

  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;
  if (note !== undefined) updates.note = note || null;
  if (isArchived !== undefined) updates.isArchived = Boolean(isArchived);
  if (order !== undefined) updates.order = order;

  // Changing the starting balance shifts the current balance by the same amount,
  // so previously recorded transactions keep their effect.
  if (
    req.body.startingBalance !== undefined &&
    req.body.startingBalance !== account.startingBalance
  ) {
    const delta = req.body.startingBalance - account.startingBalance;
    updates.startingBalance = req.body.startingBalance;
    updates.balance = account.balance + delta;
  }

  await collections.accounts.updateOne({ _id: account._id }, { $set: updates });

  const updated = await collections.accounts.findOne({ _id: account._id });
  return sendSuccess(res, { message: 'Account updated.', data: toPublicAccount(updated) });
});

const archiveAccount = asyncHandler(async (req, res) => {
  const account = await requireOwnedAccount(req.params.id, req.user._id);
  const isArchived = req.body?.isArchived !== false;

  await collections.accounts.updateOne(
    { _id: account._id },
    { $set: { isArchived, updatedAt: new Date() } },
  );

  const updated = await collections.accounts.findOne({ _id: account._id });
  return sendSuccess(res, {
    message: isArchived ? 'Account archived.' : 'Account restored.',
    data: toPublicAccount(updated),
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const account = await requireOwnedAccount(req.params.id, req.user._id);

  const transactionCount = await collections.transactions.countDocuments({
    userId: req.user._id,
    $or: [{ accountId: account._id }, { toAccountId: account._id }],
  });

  if (transactionCount > 0) {
    throw ApiError.conflict(
      `This account has ${transactionCount} transaction${transactionCount === 1 ? '' : 's'}. Archive it instead to keep your history.`,
    );
  }

  await collections.accounts.deleteOne({ _id: account._id });
  return sendSuccess(res, { message: 'Account deleted.' });
});

module.exports = {
  ACCOUNT_TYPES,
  toPublicAccount,
  requireOwnedAccount,
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
  deleteAccount,
};
