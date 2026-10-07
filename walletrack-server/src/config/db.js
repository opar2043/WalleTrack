'use strict';

/**
 * MongoDB connection using the official native driver (no Mongoose).
 *
 * Exposes `connectDatabase()` for startup plus a `collections` object with a
 * getter per collection so no module ever builds a collection name by hand.
 * Set `MONGODB_URI=memory` to run against a local mongod instead of Atlas.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const env = require('./env');

/**
 * `MONGODB_URI=memory` (or `local`) boots a mongod on this machine instead of
 * dialling out to Atlas — handy when the Atlas credentials are unavailable.
 * Data lives in `.mongo-data/` so it survives restarts.
 */
const LOCAL_URI_ALIASES = new Set(['memory', 'local']);
const LOCAL_DB_PATH = path.join(__dirname, '..', '..', '.mongo-data');

let client = null;
let database = null;
let memoryServer = null;

const COLLECTION_NAMES = ['users', 'accounts', 'categories', 'transactions', 'budgets', 'sessions'];

/** Indexes required for correct behaviour and acceptable query performance. */
const INDEXES = [
  {
    collection: 'users',
    name: 'users_email_unique',
    keys: { email: 1 },
    options: { unique: true },
  },
  {
    collection: 'accounts',
    name: 'accounts_user_active',
    keys: { userId: 1, isArchived: 1 },
  },
  {
    collection: 'categories',
    name: 'categories_user_key',
    keys: { userId: 1, key: 1 },
  },
  {
    collection: 'categories',
    name: 'categories_user_type',
    keys: { userId: 1, type: 1 },
  },
  {
    collection: 'transactions',
    name: 'transactions_user_date',
    keys: { userId: 1, date: -1 },
  },
  {
    collection: 'transactions',
    name: 'transactions_user_account',
    keys: { userId: 1, accountId: 1 },
  },
  {
    collection: 'transactions',
    name: 'transactions_user_category',
    keys: { userId: 1, categoryId: 1 },
  },
  {
    collection: 'transactions',
    name: 'transactions_user_type_date',
    keys: { userId: 1, type: 1, date: -1 },
  },
  {
    collection: 'budgets',
    name: 'budgets_user_month',
    keys: { userId: 1, month: 1 },
  },
  {
    collection: 'budgets',
    name: 'budgets_user_category_month',
    keys: { userId: 1, categoryId: 1, month: 1 },
    options: { unique: true },
  },
  {
    collection: 'sessions',
    name: 'sessions_user',
    keys: { userId: 1 },
  },
  {
    collection: 'sessions',
    name: 'sessions_expires',
    keys: { expiresAt: 1 },
    options: { expireAfterSeconds: 0 },
  },
];

async function ensureIndexes(db) {
  for (const index of INDEXES) {
    await db.collection(index.collection).createIndex(index.keys, {
      name: index.name,
      ...index.options,
    });
  }
}

/** Starts a local mongod with a persistent data directory. */
async function startLocalDatabase() {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch {
    throw new Error(
      'MONGODB_URI is set to a local mode but mongodb-memory-server is not installed. ' +
        'Run: npm install --save-dev mongodb-memory-server',
    );
  }

  fs.mkdirSync(LOCAL_DB_PATH, { recursive: true });
  memoryServer = await MongoMemoryServer.create({ instance: { dbPath: LOCAL_DB_PATH } });
  console.log(
    `[db] using local MongoDB, data kept in ${path.relative(process.cwd(), LOCAL_DB_PATH)}/`,
  );
  return memoryServer.getUri();
}

async function connectDatabase() {
  if (database) return database;

  const configured = env.MONGODB_URI.trim();
  const uri = LOCAL_URI_ALIASES.has(configured.toLowerCase())
    ? await startLocalDatabase()
    : configured;

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
  });

  await client.connect();
  database = client.db(env.DB_NAME);
  await ensureIndexes(database);

  return database;
}

function getDb() {
  if (!database) {
    throw new Error('Database not connected. Call connectDatabase() during startup.');
  }
  return database;
}

async function closeDatabase() {
  if (client) await client.close();
  client = null;
  database = null;

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

/** Lazily built map of collection name -> collection. */
const collections = new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name !== 'string' || !COLLECTION_NAMES.includes(name)) return undefined;
      return getDb().collection(name);
    },
  },
);

module.exports = { connectDatabase, closeDatabase, getDb, collections };
