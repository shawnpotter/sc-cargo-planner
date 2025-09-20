import { describe, it, expect } from 'vitest'
import { findNextPosition } from '@/utils/findNextPosition'
import { Ship } from '@/constants/types'

// Minimal ship fixture
const makeShip = (): Ship => ({
	name: 'Test Ship',
	totalCapacity: 64,
	cargoGrids: [
		{
			length: 4,
			width: 4,
			height: 4,
		},
	],
})

describe('findNextPosition', () => {
	it('finds a placement in an empty grid', () => {
		const ship = makeShip()
		const result = findNextPosition(4, ship, [])
		expect(result).not.toBeNull()
		expect(result?.gridIndex).toBe(0)
	})

	it('returns null when size unknown', () => {
		const ship = makeShip()
		const result = findNextPosition(999, ship, [])
		expect(result).toBeNull()
	})
})
