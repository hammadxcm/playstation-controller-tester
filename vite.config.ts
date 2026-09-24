/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: '/playstation-controller-tester/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      include: [
        'src/core/**/*.ts',
        'src/state/**/*.ts',
        'src/lib/**/*.ts',
        'src/features/model/rig.ts',
        'src/features/model/geometry.ts',
        'src/features/model/artwork/prepare.ts',
        'src/features/model/artwork/specs.ts',
        'src/features/sticks/trace.ts',
        'src/features/wizard/steps.ts',
        'src/features/pro/triggerParams.ts',
        'src/features/landing/support.ts',
        'src/features/landing/demoFrame.ts', 'src/i18n/index.ts',
        'src/testing/**/*.ts',
      ],
      exclude: ['**/*.test.ts', 'src/state/hooks.ts', 'src/testing/mock.ts'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
})
