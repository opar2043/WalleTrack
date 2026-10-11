'use strict';

/**
 * Vercel serverless entry.
 *
 * `@vercel/node` turns this module into a lambda. The Express app from
 * `src/app.js` is a `(req, res) => void` handler, so it can be exported
 * directly; the MongoDB connection is lazy so cold starts connect on the
 * first request and warm instances reuse the cached client.
 */

const app = require('../src/app');
const { connectDatabase } = require('../src/config/db');

async function handle(req, res) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('[api] failed to connect to database:', error.message);
    res.status(500).json({ success: false, message: 'Database unavailable.' });
    return;
  }
  app(req, res);
}

module.exports = handle;