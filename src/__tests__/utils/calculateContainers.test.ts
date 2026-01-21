// tests/utils/calculateContainers.test.ts
import { describe, it, expect } from 'vitest'
import {
	calculateOptimalContainerSize,
	HaulingMode,
} from '@/utils/calculateContainers'

describe('calculateContainers', () => {
	describe('HaulingMode.CONTRACT', () => {
		it('should find largest container that fits remaining quantity exactly', () => {
			expect(calculateOptimalContainerSize(32, 32, HaulingMode.CONTRACT)).toBe(
				32
			)
			expect(calculateOptimalContainerSize(32, 16, HaulingMode.CONTRACT)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(32, 8, HaulingMode.CONTRACT)).toBe(8)
			expect(calculateOptimalContainerSize(32, 4, HaulingMode.CONTRACT)).toBe(4)
			expect(calculateOptimalContainerSize(32, 2, HaulingMode.CONTRACT)).toBe(2)
			expect(calculateOptimalContainerSize(32, 1, HaulingMode.CONTRACT)).toBe(1)
		})

		it('should handle quantities that are not powers of 2', () => {
			expect(calculateOptimalContainerSize(32, 20, HaulingMode.CONTRACT)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(32, 10, HaulingMode.CONTRACT)).toBe(
				8
			)
			expect(calculateOptimalContainerSize(32, 5, HaulingMode.CONTRACT)).toBe(4)
			expect(calculateOptimalContainerSize(32, 3, HaulingMode.CONTRACT)).toBe(2)
		})

		it('should respect max container size limit', () => {
			expect(calculateOptimalContainerSize(16, 32, HaulingMode.CONTRACT)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(8, 16, HaulingMode.CONTRACT)).toBe(8)
			expect(calculateOptimalContainerSize(4, 32, HaulingMode.CONTRACT)).toBe(4)
		})

		it('should handle edge cases', () => {
			expect(calculateOptimalContainerSize(32, 64, HaulingMode.CONTRACT)).toBe(
				32
			)
			expect(calculateOptimalContainerSize(32, 100, HaulingMode.CONTRACT)).toBe(
				32
			)
			expect(calculateOptimalContainerSize(1, 10, HaulingMode.CONTRACT)).toBe(1)
			expect(calculateOptimalContainerSize(2, 1, HaulingMode.CONTRACT)).toBe(1)
		})

		it('should halve container size until it fits', () => {
			// Starting with 32, should halve to 16, then 8 to fit 7
			expect(calculateOptimalContainerSize(32, 7, HaulingMode.CONTRACT)).toBe(4)

			// Starting with 32, should halve to 16, then 8, then 4, then 2 to fit 3
			expect(calculateOptimalContainerSize(32, 3, HaulingMode.CONTRACT)).toBe(2)

			// Starting with 24, should halve to 12, then 6, then 3 to fit 3
			expect(calculateOptimalContainerSize(24, 3, HaulingMode.CONTRACT)).toBe(3)
		})
	})

	describe('HaulingMode.COMMODITY', () => {
		it('should use largest standard container that fits', () => {
			expect(calculateOptimalContainerSize(32, 50, HaulingMode.COMMODITY)).toBe(
				32
			)
			expect(calculateOptimalContainerSize(32, 32, HaulingMode.COMMODITY)).toBe(
				32
			)
			expect(calculateOptimalContainerSize(32, 30, HaulingMode.COMMODITY)).toBe(
				24
			)
			expect(calculateOptimalContainerSize(32, 20, HaulingMode.COMMODITY)).toBe(
				16
			)
		})

		it('should respect both max container size and remaining quantity', () => {
			expect(calculateOptimalContainerSize(16, 50, HaulingMode.COMMODITY)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(24, 20, HaulingMode.COMMODITY)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(8, 10, HaulingMode.COMMODITY)).toBe(
				8
			)
		})

		it('should find appropriate container for small quantities', () => {
			expect(calculateOptimalContainerSize(32, 5, HaulingMode.COMMODITY)).toBe(
				4
			)
			expect(calculateOptimalContainerSize(32, 3, HaulingMode.COMMODITY)).toBe(
				2
			)
			expect(calculateOptimalContainerSize(32, 1, HaulingMode.COMMODITY)).toBe(
				1
			)
		})

		it('should handle standard container sizes correctly', () => {
			// Test all standard sizes: [32, 24, 16, 8, 4, 2, 1]
			expect(calculateOptimalContainerSize(32, 24, HaulingMode.COMMODITY)).toBe(
				24
			)
			expect(calculateOptimalContainerSize(32, 23, HaulingMode.COMMODITY)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(32, 16, HaulingMode.COMMODITY)).toBe(
				16
			)
			expect(calculateOptimalContainerSize(32, 15, HaulingMode.COMMODITY)).toBe(
				8
			)
			expect(calculateOptimalContainerSize(32, 8, HaulingMode.COMMODITY)).toBe(
				8
			)
			expect(calculateOptimalContainerSize(32, 7, HaulingMode.COMMODITY)).toBe(
				4
			)
			expect(calculateOptimalContainerSize(32, 4, HaulingMode.COMMODITY)).toBe(
				4
			)
			expect(calculateOptimalContainerSize(32, 2, HaulingMode.COMMODITY)).toBe(
				2
			)
		})

		it('should default to 1 when no valid size found', () => {
			expect(calculateOptimalContainerSize(32, 0, HaulingMode.COMMODITY)).toBe(
				1
			)
		})
	})

	describe('edge cases and boundary conditions', () => {
		it('should handle zero and negative quantities gracefully', () => {
			expect(calculateOptimalContainerSize(32, 0, HaulingMode.CONTRACT)).toBe(0)
			expect(calculateOptimalContainerSize(32, 0, HaulingMode.COMMODITY)).toBe(
				1
			) // defaults to 1
		})

		it('should handle very large quantities', () => {
			expect(
				calculateOptimalContainerSize(32, 1000, HaulingMode.CONTRACT)
			).toBe(32)
			expect(
				calculateOptimalContainerSize(32, 1000, HaulingMode.COMMODITY)
			).toBe(32)
		})

		it('should handle non-standard max container sizes', () => {
			expect(calculateOptimalContainerSize(10, 20, HaulingMode.CONTRACT)).toBe(
				10
			)
			expect(calculateOptimalContainerSize(10, 5, HaulingMode.COMMODITY)).toBe(
				4
			) // Next standard size below 10
			expect(calculateOptimalContainerSize(30, 30, HaulingMode.COMMODITY)).toBe(
				24
			) // Largest standard <= 30
		})

		it('should be consistent across modes for exact matches', () => {
			// When container size exactly matches standard sizes and quantity
			const exactCases = [
				{ max: 32, qty: 32 },
				{ max: 16, qty: 16 },
				{ max: 8, qty: 8 },
				{ max: 4, qty: 4 },
				{ max: 2, qty: 2 },
				{ max: 1, qty: 1 },
			]

			exactCases.forEach(({ max, qty }) => {
				expect(
					calculateOptimalContainerSize(max, qty, HaulingMode.CONTRACT)
				).toBe(calculateOptimalContainerSize(max, qty, HaulingMode.COMMODITY))
			})
		})
	})
})
