import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    globals: false,
    globalSetup: 'tests/setup.ts',
    testTimeout: 15_000,
  },
})
