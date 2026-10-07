'use strict';

/** Boots the HTTP server and the MongoDB connection, and shuts both down cleanly. */

const app = require('./app');
const env = require('./config/env');
const { connectDatabase, closeDatabase } = require('./config/db');

let server;

async function start() {
  await connectDatabase();
  console.log(`[db] connected to database "${env.DB_NAME}"`);

  server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[api] Walletrack listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`[api] health check: http://localhost:${env.PORT}/api/v1/health`);
  });
}

async function shutdown(signal) {
  console.log(`\n[api] ${signal} received, shutting down.`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[api] unhandled rejection:', reason);
  shutdown('unhandledRejection');
});

start().catch((error) => {
  console.error('[api] failed to start:', error.message);
  process.exit(1);
});
