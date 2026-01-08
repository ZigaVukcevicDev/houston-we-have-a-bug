import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        '**/*.scss',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/test/**',
        '**/*.test.ts',
        'src/entrypoints/**', // Entry points are integration points, not unit-testable
        'src/styles/**',
        'src/types/**', // Type definitions don't need coverage
        'src/interfaces/**', // Interface definitions don't need coverage
      ],
    },
  },
});

