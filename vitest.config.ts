try { process.loadEnvFile?.('.env'); } catch {}
import { defineConfig, defaultExclude } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    exclude: [
      ...defaultExclude,
      '**/node_modules/**',
      ...(process.env.DATABASE_URL ? [] : ['**/*.integration.test.ts']),
    ],
    testTimeout: 25000,
  },
});