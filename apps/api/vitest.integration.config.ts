import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['src/test-utils/integration-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
