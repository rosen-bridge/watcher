import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      reporter: ['cobertura', 'text', 'text-summary'],
      provider: 'istanbul',
    },
    passWithNoTests: true,
    singleThread: true,
  },
});
