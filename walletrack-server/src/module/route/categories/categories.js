'use strict';

/**
 * Categories logic. Every user gets a personal copy of the default set on
 * registration; users may then add their own and edit/delete only the custom
 * ones. Defaults are copied (not shared) so a later change to the defaults
 * never rewrites history for existing users.
 */

const { collections } = require('../../../config/db');
const { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } = require('../../../config/defaults');
const { ApiError, sendSuccess, sendCreated } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');

function toPublicCategory(category) {
  return {
    id: String(category._id),
    key: category.key,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    isCustom: Boolean(category.isCustom),
    order: category.order ?? 0,
  };
}

async function seedCategoriesForUser(userId) {
  const now = new Date();
  const docs = DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    userId,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  }));
  if (docs.length === 0) return;
  await collections.categories.insertMany(docs);
}

/** Starter Cash + Bank accounts so a brand new user sees a working dashboard. */
async function seedAccountsForUser(userId) {
  const now = new Date();
  const docs = DEFAULT_ACCOUNTS.map((account) => ({
    ...account,
    userId,
    startingBalance: 0,
    balance: 0,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  }));
  if (docs.length === 0) return;
  await collections.accounts.insertMany(docs);
}

const listCategories = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const docs = await collections.categories
    .find(filter)
    .sort({ type: 1, order: 1, name: 1 })
    .toArray();

  return sendSuccess(res, { data: docs.map(toPublicCategory) });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;

  const normalisedName = name.trim().toLowerCase();
  const duplicate = await collections.categories.findOne({
    userId: req.user._id,
    type,
    name: normalisedName,
  });
  if (duplicate) throw ApiError.conflict(`You already have a ${type} category called "${name}".`);

  const highest = await collections.categories
    .find({ userId: req.user._id, type })
    .sort({ order: -1 })
    .limit(1)
    .toArray();

  const now = new Date();
  const doc = {
    userId: req.user._id,
    key: `custom-${normalisedName.replace(/[^a-z0-9]+/g, '-')}`,
    name: name.trim(),
    type,
    icon: icon || 'tag',
    color: color || '#64748B',
    isCustom: true,
    order: (highest[0]?.order ?? 0) + 1,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collections.categories.insertOne(doc);
  doc._id = result.insertedId;

  return sendCreated(res, toPublicCategory(doc));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, icon, color } = req.body;

  const category = await collections.categories.findOne({ _id: id, userId: req.user._id });
  if (!category) throw ApiError.notFound('Category not found.');

  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const duplicate = await collections.categories.findOne({
      userId: req.user._id,
      type: category.type,
      name: name.trim().toLowerCase(),
      _id: { $ne: id },
    });
    if (duplicate) throw ApiError.conflict(`You already have a category called "${name}".`);
  }

  const updates = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name.trim();
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;

  await collections.categories.updateOne({ _id: id, userId: req.user._id }, { $set: updates });

  const updated = await collections.categories.findOne({ _id: id, userId: req.user._id });
  return sendSuccess(res, { message: 'Category updated.', data: toPublicCategory(updated) });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await collections.categories.findOne({ _id: id, userId: req.user._id });
  if (!category) throw ApiError.notFound('Category not found.');
  if (!category.isCustom) {
    throw ApiError.badRequest('Default categories cannot be deleted.');
  }

  const linked = await collections.transactions.countDocuments({
    userId: req.user._id,
    categoryId: id,
  });

  if (linked > 0) {
    throw ApiError.conflict(
      `This category is used by ${linked} transaction${linked === 1 ? '' : 's'}. Move them to another category first.`,
    );
  }

  await collections.categories.deleteOne({ _id: id, userId: req.user._id });
  await collections.budgets.deleteMany({ userId: req.user._id, categoryId: id });

  return sendSuccess(res, { message: 'Category deleted.' });
});

module.exports = {
  toPublicCategory,
  seedCategoriesForUser,
  seedAccountsForUser,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
