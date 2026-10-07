'use strict';

/**
 * Auth middleware.
 *
 * The client sends the opaque session token it stored after login:
 *     Authorization: Bearer wt_<64 hex chars>
 *
 * The token is hashed and looked up in the `sessions` collection. A missing,
 * malformed, unknown or expired token is a 401.
 */

const { collections } = require('../config/db');
const { hashSessionToken, isValidTokenFormat } = require('../utils/sessions');
const { ApiError } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);

  if (!isValidTokenFormat(token)) {
    throw ApiError.unauthorized('Missing or malformed session token.');
  }

  const session = await collections.sessions.findOne({ tokenHash: hashSessionToken(token) });

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await collections.users.findOne(
    { _id: session.userId },
    { projection: { password: 0 } },
  );

  if (!user) throw ApiError.unauthorized('Account no longer exists.');

  req.user = user;
  req.session = session;
  next();
});

module.exports = { requireAuth, readBearerToken };
