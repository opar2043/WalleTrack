'use strict';

/**
 * User profile logic.
 * Every query is scoped by the caller's own id, so one account can never read
 * or modify another account's profile.
 */

const { collections } = require('../../../config/db');
const { ApiError, sendSuccess } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');

/** Public user shape. Never includes the password hash. */
function toPublicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor || '#4F46E5',
    country: user.country || null,
    currency: user.currency || 'USD',
    locale: user.locale || 'en-US',
    themePreference: user.themePreference || 'system',
    notificationsEnabled: user.notificationsEnabled ?? true,
    hideBalances: Boolean(user.hideBalances),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    isPremium: Boolean(user.isPremium),
    premium: {
      status: user.premiumStatus || 'none',
      planId: user.premiumPlanId || null,
      expiresAt: user.premiumExpiresAt || null,
      purchaseToken: user.premiumPurchaseToken || null,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const AVATAR_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444'];

function pickAvatarColor(seed) {
  let total = 0;
  for (const character of String(seed)) total += character.charCodeAt(0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

const getProfile = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: toPublicUser(req.user) }),
);

const updateProfile = asyncHandler(async (req, res) => {
  const { name: nextName, email: nextEmail, avatarColor } = req.body;

  const updates = { updatedAt: new Date() };

  if (nextName !== undefined) updates.name = nextName;
  if (nextEmail !== undefined && nextEmail !== req.user.email) {
    const existing = await collections.users.findOne({
      email: nextEmail,
      _id: { $ne: req.user._id },
    });
    if (existing) throw ApiError.conflict('An account with that email already exists.');
    updates.email = nextEmail;
  }
  if (avatarColor !== undefined) updates.avatarColor = avatarColor;

  if (updates.name || updates.email) {
    updates.avatarColor = updates.avatarColor || pickAvatarColor(updates.name || updates.email);
  }

  await collections.users.updateOne({ _id: req.user._id }, { $set: updates });

  const user = await collections.users.findOne(
    { _id: req.user._id },
    { projection: { password: 0 } },
  );
  return sendSuccess(res, { message: 'Profile updated.', data: toPublicUser(user) });
});

/** First-run country + currency step. Completing it flips onboardingCompleted. */
const completeOnboarding = asyncHandler(async (req, res) => {
  const { country, currency, locale } = req.body;

  await collections.users.updateOne(
    { _id: req.user._id },
    {
      $set: {
        country,
        currency,
        locale: locale || null,
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
    },
  );

  const user = await collections.users.findOne(
    { _id: req.user._id },
    { projection: { password: 0 } },
  );
  return sendSuccess(res, { message: 'Preferences saved.', data: toPublicUser(user) });
});

const setPreferences = asyncHandler(async (req, res) => {
  const { themePreference, notificationsEnabled, hideBalances, country, currency, locale } =
    req.body;

  const updates = { updatedAt: new Date() };
  if (themePreference !== undefined) updates.themePreference = themePreference;
  if (notificationsEnabled !== undefined) updates.notificationsEnabled = notificationsEnabled;
  if (hideBalances !== undefined) updates.hideBalances = hideBalances;
  if (country !== undefined) updates.country = country;
  if (currency !== undefined) updates.currency = currency;
  if (locale !== undefined) updates.locale = locale;

  await collections.users.updateOne({ _id: req.user._id }, { $set: updates });

  const user = await collections.users.findOne(
    { _id: req.user._id },
    { projection: { password: 0 } },
  );
  return sendSuccess(res, { message: 'Preferences updated.', data: toPublicUser(user) });
});

/** Permanently removes the account and everything scoped to it. */
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Promise.all([
    collections.accounts.deleteMany({ userId }),
    collections.categories.deleteMany({ userId }),
    collections.transactions.deleteMany({ userId }),
    collections.budgets.deleteMany({ userId }),
    collections.sessions.deleteMany({ userId }),
  ]);
  await collections.users.deleteOne({ _id: userId });

  return sendSuccess(res, { message: 'Your account has been deleted.' });
});

module.exports = { getProfile, updateProfile, completeOnboarding, setPreferences, deleteAccount };

module.exports = {
  toPublicUser,
  getProfile,
  updateProfile,
  completeOnboarding,
  setPreferences,
  deleteAccount,
};
