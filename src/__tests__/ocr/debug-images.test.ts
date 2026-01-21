// src/__tests__/ocr/debug-images.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createWorker, Worker } from 'tesseract.js'
import { parseContractText } from '@/components/ocr/parser/parseContract'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { splitAndProcessImageForTest } from './utils/imageProcessor'
import { DEFAULT_SETTINGS } from '@/components/ocr/parser/types'

describe('Debug Contract Images', () => {
	let worker: Worker | null = null

	beforeAll(async () => {
		console.log('Initializing Tesseract worker...')
		worker = await createWorker('eng', 1)
		console.log('Worker initialized')
	}, 60000)

	afterAll(async () => {
		if (worker) {
			await worker.terminate()
		}
	})

	it('should analyze all contract examples', async () => {
		if (!worker) {
			throw new Error('Worker not initialized')
		}

		const contractDir = join(process.cwd(), 'contract_examples')

		let files: string[] = []
		try {
			files = readdirSync(contractDir)
				.filter((f) => f.toLowerCase().endsWith('.png'))
				.sort((a, b) => a.localeCompare(b))
		} catch (error) {
			console.error('Error reading contract_examples directory:', error)
			console.error('Looking in:', contractDir)
			throw error
		}

		console.log(`\nFound ${files.length} contract images in ${contractDir}`)
		console.log('Files:', files)

		const results = []

		for (const file of files) {
			console.log(`\nProcessing ${file}...`)
			const imagePath = join(contractDir, file)

			try {
				// Split + process image (dev-parity)
				const { left, right } = await splitAndProcessImageForTest(
					imagePath,
					DEFAULT_SETTINGS
				)

				// OCR both halves
				const leftResult = await worker.recognize(left)
				const rightResult = await worker.recognize(right)

				const parsed = parseContractText(
					leftResult.data.text,
					rightResult.data.text
				)

				results.push({
					file,
					confidence: {
						left: leftResult.data.confidence,
						right: rightResult.data.confidence,
						avg: (leftResult.data.confidence + rightResult.data.confidence) / 2,
					},
					textLength: {
						left: leftResult.data.text.length,
						right: rightResult.data.text.length,
					},
					parsed,
					rawText: {
						left: leftResult.data.text,
						right: rightResult.data.text,
					},
				})
			} catch (error) {
				console.error(`Error processing ${file}:`, error)
				throw error
			}
		}

		// Output summary
		console.log('\n=== OCR Analysis Summary ===')
		for (const result of results) {
			console.log(`\n${result.file}:`)
			console.log(
				`  Confidence: L=${result.confidence.left.toFixed(
					2
				)}% R=${result.confidence.right.toFixed(
					2
				)}% Avg=${result.confidence.avg.toFixed(2)}%`
			)
			console.log(
				`  Text Length: L=${result.textLength.left} R=${result.textLength.right}`
			)
			console.log(
				`  Has Origin: ${
					result.parsed.origin ? '✓ ' + result.parsed.origin : '✗'
				}`
			)
			console.log(`  Destinations: ${result.parsed.destinations?.length || 0}`)
			console.log(
				`  Has Payout: ${
					result.parsed.payout
						? '✓ ' + result.parsed.payout.toLocaleString()
						: '✗'
				}`
			)
			console.log(
				`  Container Size: ${result.parsed.maxContainerSize || 'N/A'}`
			)
			console.log(`  Rank: ${result.parsed.rank || 'N/A'}`)
		}

		// Detailed output
		for (const result of results) {
			console.log(`\n\n${'='.repeat(80)}`)
			console.log(`${result.file}`)
			console.log('='.repeat(80))
			console.log('\n--- LEFT COLUMN ---')
			console.log(result.rawText.left)
			console.log('\n--- RIGHT COLUMN ---')
			console.log(result.rawText.right)
			console.log('\n--- PARSED DATA ---')
			console.log(JSON.stringify(result.parsed, null, 2))
		}

		expect(results.length).toBe(6)
	}, 300000) // 5 minutes
})
