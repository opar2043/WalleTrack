'use strict';

/**
 * Opaque session tokens.
 *
 * There is no JWT here. A session is a random token handed to the client and
 * stored by it; the server keeps only its SHA-256 hash alongside the user id
 * and an expiry. Consequences that matter:
 *   - a leaked database cannot be replayed as a live session,
 *   - a session can be revoked server side instantly (logout, password change),
 *   - nothing about the user is encoded in the token, so nothing can be forged.
 *
 * Token shape: `wt_` followed by 64 hex characters from 32 random bytes.
 */

const crypto = require('crypto');
const env = require('../config/env');

const TOKEN_PREFIX = 'wt_';

function generateSessionToken() {
  return TOKEN_PREFIX + crypto.randomBytes(32).toString('hex');
}

/** Sessions are stored hashed, never in plain text. */
function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Converts '30d' / '12h' / '3600' into milliseconds. */
function durationToMs(value) {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(String(value).trim());
  if (!match) return 0;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2] || 'ms';
  const multipliers = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
}

function sessionExpiryDate() {
  return new Date(Date.now() + durationToMs(env.SESSION_EXPIRES));
}

function isValidTokenFormat(token) {
  return (
    typeof token === 'string' &&
    token.startsWith(TOKEN_PREFIX) &&
    token.length === TOKEN_PREFIX.length + 64
  );
}

module.exports = {
  TOKEN_PREFIX,
  generateSessionToken,
  hashSessionToken,
  durationToMs,
  sessionExpiryDate,
  isValidTokenFormat,
};
