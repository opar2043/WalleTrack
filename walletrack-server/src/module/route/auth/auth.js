'use strict';

/**
 * Auth logic: register, login, logout, change password.
 *
 * There is no token refresh and no JWT. The session token handed out at login
 * lives until it is revoked (logout, logout everywhere, password change) or
 * until SESSION_EXPIRES passes. Passwords are hashed with bcrypt, 12 rounds.
 */

const bcrypt = require('bcryptjs');
const { collections } = require('../../../config/db');
const { ApiError, sendSuccess, sendCreated } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { toPublicUser } = require('../users/users');
const {
  generateSessionToken,
  hashSessionToken,
  sessionExpiryDate,
} = require('../../../utils/sessions');
const { seedCategoriesForUser, seedAccountsForUser } = require('../categories/categories');

const BCRYPT_ROUNDS = 12;

/** Creates the session document and returns the token + expiry the client stores. */
async function createSession(userId) {
  const token = generateSessionToken();
  const expiresAt = sessionExpiryDate();
  await collections.sessions.insertOne({
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: new Date(),
    lastSeenAt: new Date(),
    expiresAt,
  });
  return { token, expiresAt };
}

async function issueSession(user) {
  const { token, expiresAt } = await createSession(user._id);
  return { token, expiresAt: expiresAt.toISOString(), user: toPublicUser(user) };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await collections.users.findOne({ email });
  if (existing) throw ApiError.conflict('An account with that email already exists.');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = {
    name,
    email,
    password: passwordHash,
    country: null,
    currency: null,
    locale: null,
    avatarColor: '#4F46E5',
    themePreference: 'system',
    notificationsEnabled: true,
    hideBalances: false,
    onboardingCompleted: false,
    isPremium: false,
    premiumStatus: 'none',
    premiumPlanId: null,
    premiumExpiresAt: null,
    premiumPurchaseToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collections.users.insertOne(user);
  user._id = result.insertedId;

  await seedCategoriesForUser(user._id);
  await seedAccountsForUser(user._id);

  return sendCreated(res, await issueSession(user), 'Account created.');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await collections.users.findOne({ email });
  // Compare against a dummy hash when the user is missing so timing is similar.
  const hash = user
    ? user.password
    : '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const matches = await bcrypt.compare(password, hash);

  if (!user || !matches) {
    throw ApiError.unauthorized('Email or password is incorrect.');
  }

  return sendSuccess(res, { message: 'Signed in.', data: await issueSession(user) });
});

/** Revokes the session that made the request. */
const logout = asyncHandler(async (req, res) => {
  await collections.sessions.deleteOne({ _id: req.session._id });
  return sendSuccess(res, { message: 'Signed out.' });
});

/** Revokes every session for the user, on every device. */
const logoutAll = asyncHandler(async (req, res) => {
  await collections.sessions.deleteMany({ userId: req.user._id });
  return sendSuccess(res, { message: 'Signed out of all devices.' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await collections.users.findOne({ _id: req.user._id });
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw ApiError.badRequest('Your current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await collections.users.updateOne(
    { _id: user._id },
    { $set: { password: passwordHash, updatedAt: new Date() } },
  );

  // Changing a password signs out every device.
  await collections.sessions.deleteMany({ userId: user._id });

  return sendSuccess(res, { message: 'Password updated. Please sign in again.' });
});

module.exports = { register, login, logout, logoutAll, changePassword, createSession };
