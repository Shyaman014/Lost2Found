import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,

    // Use the forks pool (best ESM compatibility)
    pool: 'forks',

    // Run test files sequentially — critical for shared MongoDB.
    // Without this, concurrent files race on clearCollections/dropDatabase,
    // causing 401s when users are wiped mid-test.
    fileParallelism: false,

    // Setup runs before every test file
    setupFiles: ['./tests/setup.js'],

    include: ['tests/**/*.test.js'],

    reporters: ['verbose'],

    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: [
        'controllers/**/*.js',
        'middleware/authMiddleware.js',
        'services/ai/chatService.js',
      ],
    },
  },
});
