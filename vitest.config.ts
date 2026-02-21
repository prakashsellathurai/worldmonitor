import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/api/**',
      '**/*.test.mjs',
    ],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
