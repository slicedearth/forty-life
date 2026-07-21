import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/{game,security,scryfall,storage}.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 75,
        branches: 60,
        functions: 85,
        lines: 85,
      },
    },
  },
})
