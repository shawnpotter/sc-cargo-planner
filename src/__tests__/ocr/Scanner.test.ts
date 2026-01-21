// src/__tests__/ocr/scanner.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { parseContractText } from '@/components/ocr/parser/parseContract'
import { cleanOCRText } from '@/components/ocr/parser/utils/cleaners'
import { createWorker, Worker } from 'tesseract.js'
import { join } from 'node:path'
import type { ParsedContract } from '@/components/ocr/parser/types'
import { DEFAULT_SETTINGS } from '@/components/ocr/parser/types'
import { splitAndProcessImageForTest } from './utils/imageProcessor'

interface ExpectedContract {
	origin: string
	contractType: 'delivery' | 'pickup'
	destinations: Array<{
		location: string
		cargo: Array<{
			type: string
			quantity: number
		}>
	}>
	maxContainerSize: number
	payout: number
	contractedBy: string
	rank: string
}

interface TestCase {
	name: string
	imagePath: string
	expected: ExpectedContract
}

const testCases: TestCase[] = [
	{
		name: 'Example 1 - Multi-cargo single destination',
		imagePath: join(process.cwd(), 'contract_examples', 'example1.png'),
		expected: {
			origin: 'Port Tressler',
			contractType: 'delivery',
			destinations: [
				{
					location: 'S4LD01',
					cargo: [
						{ type: 'Quantum Fuel', quantity: 121 },
						{ type: 'Hydrogen Fuel', quantity: 83 },
						{ type: 'Ship Ammunition', quantity: 117 },
					],
				},
			],
			maxContainerSize: 16,
			payout: 163250,
			contractedBy: 'Covalex Independent Contractors',
			rank: 'Experienced',
		},
	},
	{
		name: 'Example 2 - Multiple destinations with same cargo',
		imagePath: join(process.cwd(), 'contract_examples', 'example2.png'),
		expected: {
			origin: 'Everus Harbor',
			contractType: 'pickup',
			destinations: [
				{
					location: 'HUR-L4 Melodic Fields Station',
					cargo: [{ type: 'Waste', quantity: 2 }],
				},
				{
					location: 'HUR-L1 Green Glade Station',
					cargo: [{ type: 'Waste', quantity: 3 }],
				},
				{
					location: 'HUR-L3 Thundering Express Station',
					cargo: [{ type: 'Waste', quantity: 3 }],
				},
				{
					location: 'HUR-L5 High Course Station',
					cargo: [{ type: 'Waste', quantity: 2 }],
				},
			],
			maxContainerSize: 4,
			payout: 72500,
			contractedBy: 'Covalex Independent Contractors',
			rank: 'Junior',
		},
	},
	{
		name: 'Example 3 - Multiple destinations with varied cargo (KNOWN ISSUE)',
		imagePath: join(process.cwd(), 'contract_examples', 'example3.png'),
		expected: {
			origin: 'Everus Harbor',
			contractType: 'delivery',
			destinations: [
				{
					location: 'HUR-L3 Thundering Express Station',
					cargo: [{ type: 'Pressurized Ice', quantity: 6 }],
				},
				{
					location: 'HUR-L2 Faithful Dream Station',
					cargo: [{ type: 'Pressurized Ice', quantity: 7 }],
				},
				{
					location: 'HUR-L5 High Course Station',
					cargo: [{ type: 'Processed Food', quantity: 7 }],
				},
				{
					location: 'HUR-L4 Melodic Fields Station',
					cargo: [{ type: 'Processed Food', quantity: 7 }],
				},
			],
			maxContainerSize: 4,
			payout: 100500,
			contractedBy: 'Covalex Independent Contractors',
			rank: 'Member',
		},
	},
	{
		name: 'Example 4 - Mining station locations (KNOWN ISSUE)',
		imagePath: join(process.cwd(), 'contract_examples', 'example4.png'),
		expected: {
			origin: 'HDPC-Farnesway',
			contractType: 'delivery',
			destinations: [
				{
					location: 'HDMS-Hadley',
					cargo: [
						{ type: 'Quantum Fuel', quantity: 3 },
						{ type: 'Hydrogen Fuel', quantity: 2 },
					],
				},
				{
					location: 'HDMS-Thedus',
					cargo: [{ type: 'Hydrogen Fuel', quantity: 10 }],
				},
				{
					location: 'HDMS-Pinewood',
					cargo: [{ type: 'Ship Ammunition', quantity: 4 }],
				},
			],
			maxContainerSize: 4,
			payout: 160250,
			contractedBy: 'Covalex Independent Contractors',
			rank: 'Experienced',
		},
	},
	{
		name: 'Example 5 - Two destinations same cargo',
		imagePath: join(process.cwd(), 'contract_examples', 'example5.png'),
		expected: {
			origin: 'Everus Harbor',
			contractType: 'delivery',
			destinations: [
				{
					location: 'Port Tressler',
					cargo: [{ type: 'Tin', quantity: 46 }],
				},
				{
					location: 'Baijini Point',
					cargo: [{ type: 'Tin', quantity: 40 }],
				},
			],
			maxContainerSize: 8,
			payout: 69250,
			contractedBy: 'Covalex Independent Contractors',
			rank: 'Junior',
		},
	},
	{
		name: 'Example 6 - Extra test for testing why Greycat Stanton IV Production Complex-A is not read correctly',
		imagePath: join(process.cwd(), 'contract_examples', 'example6.png'),
		expected: {
			origin: 'Port Tressler',
			contractType: 'delivery',
			destinations: [
				{
					location: 'S4LD01',
					cargo: [{ type: 'Pressurized Ice', quantity: 6 }],
				},
				{
					location: 'Greycat Stanton IV Production Complex-A',
					cargo: [{ type: 'Pressurized Ice', quantity: 5 }],
				},
				{
					location: 'S4LD13',
					cargo: [{ type: 'Processed Food', quantity: 4 }],
				},
				{
					location: 'Sakura Sun Goldenrod Workcenter',
					cargo: [{ type: 'Processed Food', quantity: 4 }],
				},
			],
			maxContainerSize: 4,
			payout: 123500,
			contractedBy: 'Covalex Independent Contractors',
			rank: 'Experienced',
		},
	},
]

describe('OCR Contract Scanner - Full Integration', () => {
	let worker: Worker | null = null

	beforeAll(async () => {
		console.log('Initializing Tesseract worker...')
		try {
			worker = await createWorker('eng', 1, {
				logger: (m) => {
					if (m.status === 'loading tesseract core') {
						console.log('Loading Tesseract core...')
					}
					if (m.status === 'initializing tesseract') {
						console.log('Initializing Tesseract...')
					}
					if (m.status === 'initialized tesseract') {
						console.log('Tesseract initialized')
					}
				},
			})
			console.log('Worker ready')
		} catch (error) {
			console.error('Failed to initialize worker:', error)
			throw error
		}
	}, 60000) // 60 seconds for initialization

	afterAll(async () => {
		if (worker) {
			console.log('Terminating worker...')
			await worker.terminate()
		}
	})

	for (const testCase of testCases) {
		describe(testCase.name, () => {
			let ocrResult: {
				left: string
				right: string
				confidence: { left: number; right: number }
			}
			let cleanedOcrText: { left: string; right: string }
			let parsedContract: ParsedContract

			const formatOcrDebugText = () => {
				const cleanedLeft = cleanedOcrText?.left ?? ''
				const cleanedRight = cleanedOcrText?.right ?? ''
				const rawLeft = ocrResult?.left ?? ''
				const rawRight = ocrResult?.right ?? ''

				return [
					'Cleaned OCR text (what the parser consumes):',
					'\nLeft (cleaned):\n' + cleanedLeft,
					'\nRight (cleaned):\n' + cleanedRight,
					'\n\nRaw OCR text (Tesseract output):',
					'\nLeft (raw):\n' + rawLeft,
					'\nRight (raw):\n' + rawRight,
				].join('')
			}

			beforeAll(async () => {
				if (!worker) {
					throw new Error('Worker not initialized')
				}

				console.log(`\n=== Processing ${testCase.name} ===`)

				try {
					// Split the image
					console.log('Splitting image...')
					const { left, right } = await splitAndProcessImageForTest(
						testCase.imagePath,
						DEFAULT_SETTINGS
					)
					console.log('Image split complete')

					// Run OCR on left column
					console.log('Running OCR on left column...')
					const leftResult = await worker.recognize(left)
					console.log(
						`Left confidence: ${leftResult.data.confidence.toFixed(2)}%`
					)

					// Run OCR on right column
					console.log('Running OCR on right column...')
					const rightResult = await worker.recognize(right)
					console.log(
						`Right confidence: ${rightResult.data.confidence.toFixed(2)}%`
					)

					ocrResult = {
						left: leftResult.data.text,
						right: rightResult.data.text,
						confidence: {
							left: leftResult.data.confidence,
							right: rightResult.data.confidence,
						},
					}

					cleanedOcrText = {
						left: cleanOCRText(ocrResult.left),
						right: cleanOCRText(ocrResult.right),
					}

					console.log('\n--- Cleaned OCR text (used for parsing) ---')
					console.log('\nLeft (cleaned):\n' + cleanedOcrText.left)
					console.log('\nRight (cleaned):\n' + cleanedOcrText.right)

					// Parse the contract
					console.log('Parsing contract text...')
					parsedContract = parseContractText(ocrResult.left, ocrResult.right)

					console.log(
						'Parsed contract:',
						JSON.stringify(parsedContract, null, 2)
					)
				} catch (error) {
					console.error('Error in beforeAll:', error)
					throw error
				}
			}, 120000) // 2 minutes for OCR processing

			it('should extract text with reasonable confidence', () => {
				expect(ocrResult).toBeDefined()
				expect(ocrResult.left).toBeTruthy()
				expect(ocrResult.right).toBeTruthy()
				expect(ocrResult.left.length).toBeGreaterThan(10)
				expect(ocrResult.right.length).toBeGreaterThan(10)

				console.log(`\nConfidence scores:`)
				console.log(`  Left: ${ocrResult.confidence.left.toFixed(2)}%`)
				console.log(`  Right: ${ocrResult.confidence.right.toFixed(2)}%`)
			})

			it('should extract origin location', () => {
				expect(
					parsedContract.origin,
					`Expected origin "${testCase.expected.origin}" but got "${
						parsedContract.origin
					}"\n\n${formatOcrDebugText()}`
				).toBe(testCase.expected.origin)
			})

			it('should identify contract type', () => {
				expect(
					parsedContract.contractType,
					`Expected contract type "${testCase.expected.contractType}" but got "${parsedContract.contractType}"`
				).toBe(testCase.expected.contractType)
			})

			it('should extract correct number of destinations', () => {
				expect(parsedContract.destinations).toBeDefined()
				expect(
					parsedContract.destinations?.length,
					`Expected ${
						testCase.expected.destinations.length
					} destinations but got ${parsedContract.destinations?.length || 0}`
				).toBe(testCase.expected.destinations.length)
			})

			it('should extract all destination locations', () => {
				expect(parsedContract.destinations).toBeDefined()

				const extractedLocations = parsedContract
					.destinations!.map((d) => d.location)
					.sort((a, b) => a.localeCompare(b))
				const expectedLocations = testCase.expected.destinations
					.map((d) => d.location)
					.sort((a, b) => a.localeCompare(b))

				expect(
					extractedLocations,
					`Locations mismatch:\nExpected: ${expectedLocations.join(
						', '
					)}\nGot: ${extractedLocations.join(', ')}`
				).toEqual(expectedLocations)
				for (const expectedDest of testCase.expected.destinations) {
					const actualDest = parsedContract.destinations!.find(
						(d) => d.location === expectedDest.location
					)

					expect(
						actualDest,
						`Destination "${expectedDest.location}" not found`
					).toBeDefined()

					expect(
						actualDest!.cargo.length,
						`Expected ${expectedDest.cargo.length} cargo types for ${expectedDest.location}`
					).toBe(expectedDest.cargo.length)

					for (const expectedCargo of expectedDest.cargo) {
						const actualCargo = actualDest!.cargo.find(
							(c) =>
								c.type.toLowerCase().trim() ===
								expectedCargo.type.toLowerCase().trim()
						)

						expect(
							actualCargo,
							`Cargo type "${expectedCargo.type}" not found at ${expectedDest.location}`
						).toBeDefined()

						expect(
							actualCargo!.quantity,
							`Wrong quantity for ${expectedCargo.type} at ${
								expectedDest.location
							}: expected ${expectedCargo.quantity} but got ${
								actualCargo!.quantity
							}`
						).toBe(expectedCargo.quantity)
					}
				}
			})

			it('should extract max container size', () => {
				expect(
					parsedContract.maxContainerSize,
					`Expected max container ${testCase.expected.maxContainerSize} but got ${parsedContract.maxContainerSize}`
				).toBe(testCase.expected.maxContainerSize)
			})

			it('should extract payout amount', () => {
				expect(
					parsedContract.payout,
					`Expected payout ${testCase.expected.payout} but got ${
						parsedContract.payout
					}\n\n${formatOcrDebugText()}`
				).toBe(testCase.expected.payout)
			})

			it('should extract contractor name', () => {
				expect(
					parsedContract.contractedBy,
					`Expected contractor "${testCase.expected.contractedBy}" but got "${parsedContract.contractedBy}"`
				).toBe(testCase.expected.contractedBy)
			})

			it('should extract contract rank', () => {
				expect(
					parsedContract.rank,
					`Expected rank "${testCase.expected.rank}" but got "${
						parsedContract.rank
					}"\n\n${formatOcrDebugText()}`
				).toBe(testCase.expected.rank)
			})

			it('should calculate correct total cargo amount', () => {
				const expectedTotal = testCase.expected.destinations.reduce(
					(sum, dest) => sum + dest.cargo.reduce((s, c) => s + c.quantity, 0),
					0
				)

				const actualTotal =
					parsedContract.destinations?.reduce(
						(sum, dest) => sum + dest.cargo.reduce((s, c) => s + c.quantity, 0),
						0
					) || 0

				expect(
					actualTotal,
					`Expected total cargo ${expectedTotal} SCU but got ${actualTotal} SCU`
				).toBe(expectedTotal)
			})
		})
	}
})
