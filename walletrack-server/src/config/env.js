'use strict';

/**
 * Reads and validates environment variables once, at boot.
 * Any missing or malformed value throws immediately so the server never
 * starts in a half-configured state.
 */

require('dotenv').config();

const DEFAULTS = {
  PORT: '4000',
  MONGODB_URI: '',
  DB_NAME: 'walletrack',
  SESSION_EXPIRES: '30d',
  CLIENT_ORIGIN: '*',
  NODE_ENV: 'development',
};

function read(key) {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') return DEFAULTS[key];
  return value;
}

function readRequired(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${key}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

const env = {
  NODE_ENV: read('NODE_ENV'),
  PORT: Number.parseInt(read('PORT'), 10),
  MONGODB_URI: readRequired('MONGODB_URI'),
  DB_NAME: read('DB_NAME'),
  SESSION_EXPIRES: read('SESSION_EXPIRES'),
  CLIENT_ORIGIN: read('CLIENT_ORIGIN'),
};

if (Number.isNaN(env.PORT)) {
  throw new Error('PORT must be a number.');
}

env.isProduction = env.NODE_ENV === 'production';

/** Allows a comma separated CLIENT_ORIGIN list, or `*`. */
env.corsOrigins =
  env.CLIENT_ORIGIN === '*'
    ? '*'
    : env.CLIENT_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

module.exports = env;
