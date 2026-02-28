import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate browser APIs (canvas, document, window, etc.)
    environment: 'jsdom',
    // Make describe/it/expect available in every test without importing them
    globals: true,
    // Load jest-dom matchers (toBeInTheDocument, etc.) before every test
    setupFiles: './src/setupTests.js',
    // Only pick up files ending in .test.js/.test.jsx
    include: ['src/**/*.test.{js,jsx}'],
    // vmThreads uses vm.Module — handles ESM-only transitive deps
    // like @csstools/css-calc (pulled in by @testing-library/jest-dom)
    pool: 'vmThreads',
  },
})
