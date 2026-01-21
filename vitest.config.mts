// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		environment: 'jsdom', // Keep jsdom as default
		setupFiles: './vitest.setup.ts',
		testTimeout: 60000, // Increase timeout for OCR tests
		hookTimeout: 60000,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@contract-examples': path.resolve(__dirname, './contract_examples'),
		},
	},
})
