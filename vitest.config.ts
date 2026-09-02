import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    // Integration tests need Postgres; excluded until DATABASE_URL is set.
    exclude: process.env.DATABASE_URL ? [] : ['**/*.integration.test.ts', '**/node_modules/**'],
  },
});
