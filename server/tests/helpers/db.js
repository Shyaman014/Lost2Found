/**
 * tests/helpers/db.js
 * Database utilities shared across test suites.
 */
import mongoose from 'mongoose';

/**
 * Delete all documents from the given collection names.
 * If no names are provided, clears every collection in the test DB.
 */
export const clearCollections = async (...names) => {
  const all = mongoose.connection.collections;
  const targets = names.length > 0
    ? names.map((n) => all[n]).filter(Boolean)
    : Object.values(all);
  await Promise.all(targets.map((col) => col.deleteMany({})));
};
