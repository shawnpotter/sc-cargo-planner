// vitest.config.mts
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	test: {
		exclude: [...configDefaults.exclude, '.node_modules-before-beta/**'],
		environment: 'jsdom', // Keep jsdom as default
		setupFiles: './vitest.setup.ts',
		testTimeout: 60000, // Increase timeout for OCR tests
		hookTimeout: 60000,
	},
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
			'@contract-examples': path.resolve(import.meta.dirname, './contract_examples'),
		},
	},
})
