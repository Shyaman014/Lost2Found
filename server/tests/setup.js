/**
 * tests/setup.js
 *
 * Runs before every test file (Vitest setupFiles).
 * - Loads .env.test then .env (non-overriding) so env vars are set
 *   before any app module is evaluated.
 * - Connects to the test database in beforeAll.
 * - Drops the database and disconnects in afterAll.
 *
 * Because singleFork:true is set in vitest.config.js, all test files
 * share one process. Each file still gets its own beforeAll/afterAll
 * from this setup, giving it a clean database.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { beforeAll, afterAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env.test first, then fall back to .env for anything not overridden
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

// ── Derive a test-safe DB URI ────────────────────────────────────────────────
const deriveTestUri = (uri) => {
  if (!uri) return 'mongodb://127.0.0.1:27017/l2f_test';
  // Replace the database name segment with l2f_test
  // Handles: mongodb://host/dbname and mongodb+srv://user:pw@host/dbname?opts
  return uri.replace(/\/([^/?]+)(\?|$)/, '/l2f_test$2');
};

const TEST_URI = process.env.MONGO_URI_TEST || deriveTestUri(process.env.MONGO_URI);

// ── Lifecycle hooks ──────────────────────────────────────────────────────────
beforeAll(async () => {
  // Reconnect if previously disconnected (between test files)
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(TEST_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }
});

afterAll(async () => {
  // Wipe the test database so the next test file gets a clean slate
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
