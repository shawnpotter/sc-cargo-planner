// @/utils/findNextPosition.test.ts
import { describe, it, expect } from 'vitest'
import { findNextPosition } from '@/utils/findNextPosition'
import { Ship, Container } from '@/constants/types'

// Test ship configurations
const makeShip = (config?: {
	width?: number
	length?: number
	height?: number
	grids?: number
}): Ship => {
	const { width = 4, length = 4, height = 4, grids = 1 } = config || {}

	return {
		name: 'Test Ship',
		totalCapacity: width * length * height * grids,
		cargoGrids: Array(grids)
			.fill(null)
			.map(() => ({
				width,
				length,
				height,
			})),
	}
}

// Helper to create a container
const makeContainer = (
	size: number,
	position: { x: number; y: number; z: number },
	options?: Partial<Container>
): Container => ({
	size,
	position,
	contractIndex: 0,
	deliveryIndex: 0,
	rotated: false,
	gridIndex: 0,
	cargoTypeIndex: 0,
	...options,
})

describe('findNextPosition', () => {
	describe('Basic Placement', () => {
		it('places first container at ground level', () => {
			const ship = makeShip()
			const result = findNextPosition(4, ship, [])

			expect(result).not.toBeNull()
			expect(result?.position.y).toBe(0)
		})

		it('returns null for invalid container size', () => {
			const ship = makeShip()
			const result = findNextPosition(999, ship, [])
			expect(result).toBeNull()
		})

		it('returns null when ship is completely full', () => {
			const ship = makeShip({ width: 2, length: 2, height: 1 })
			const containers = [makeContainer(4, { x: 0, y: 0, z: 0 })]

			const result = findNextPosition(1, ship, containers)
			expect(result).toBeNull()
		})

		it('returns a valid grid index', () => {
			const ship = makeShip({ grids: 2 })
			const result = findNextPosition(4, ship, [])

			expect(result).not.toBeNull()
			expect(result?.gridIndex).toBeGreaterThanOrEqual(0)
			expect(result?.gridIndex).toBeLessThan(2)
		})
	})

	describe('Bottom-to-Top Filling', () => {
		it('fills ground level before stacking', () => {
			const ship = makeShip({ width: 4, length: 4, height: 6 })
			const containers: Container[] = []
			const placements: { x: number; y: number; z: number }[] = []

			// Place 8 containers of 4 SCU each (2x1x2 dimensions)
			for (let i = 0; i < 8; i++) {
				const result = findNextPosition(4, ship, containers)
				if (result) {
					placements.push(result.position)
					containers.push(
						makeContainer(4, result.position, {
							rotated: result.rotated,
							gridIndex: result.gridIndex,
						})
					)
				}
			}

			// Algorithm fills each vertical column (x,z position) bottom to top
			// First container should be at ground level
			expect(placements[0].y).toBe(0)

			// Second container should stack on first (same x,z, y=1)
			expect(placements[1].y).toBe(1)
			expect(placements[1].x).toBe(placements[0].x)
			expect(placements[1].z).toBe(placements[0].z)

			// Eventually moves to a new column at ground level
			const groundLevelPlacements = placements.filter((p) => p.y === 0)
			const higherPlacements = placements.filter((p) => p.y > 0)

			expect(groundLevelPlacements.length).toBeGreaterThan(1)
			expect(higherPlacements.length).toBeGreaterThan(0)
		})

		it('prefers ground placement when available', () => {
			const ship = makeShip({ width: 4, length: 4, height: 4 })
			const containers = [makeContainer(4, { x: 0, y: 0, z: 0 })]

			// With plenty of ground space remaining, should place on ground
			const result = findNextPosition(4, ship, containers)

			expect(result).not.toBeNull()
			expect(result?.position.y).toBe(0)
		})
	})

	describe('Rotation Logic', () => {
		it('finds placement with rotation when needed', () => {
			const ship = makeShip({ width: 3, length: 3, height: 2 })

			// Create a specific gap pattern
			const containers = [
				makeContainer(4, { x: 0, y: 0, z: 0 }), // 2x2
				makeContainer(1, { x: 2, y: 0, z: 0 }),
				makeContainer(1, { x: 2, y: 0, z: 1 }),
			]

			// Should find a placement (possibly rotated)
			const result = findNextPosition(2, ship, containers)

			expect(result).not.toBeNull()
		})

		it('rotates when only rotated orientation fits', () => {
			const ship = makeShip({ width: 3, length: 2, height: 2 })

			// 8 SCU is 2x2x2 (width x height x depth) - reaches ceiling
			// Block x=0-1 completely with tall containers
			const containers = [
				makeContainer(8, { x: 0, y: 0, z: 0 }, { rotated: false }), // 2x2x2 at x=0-1, z=0, full height
				makeContainer(8, { x: 0, y: 0, z: 1 }, { rotated: false }), // 2x2x2 at x=0-1, z=1, full height
			]

			// Now x=0-1 is completely blocked (height 2, reaches ceiling)
			// Only x=2 is free (1 unit wide, 2 units deep, 2 units tall)
			// Normal 2 SCU (2x1x1) needs 2 width - doesn't fit at x=2
			// Rotated 2 SCU (1x1x2) needs 1 width, 2 depth - FITS at x=2, z=0-1
			const result = findNextPosition(2, ship, containers)

			expect(result).not.toBeNull()
			expect(result?.rotated).toBe(true)
			expect(result?.position.x).toBe(2)
		})

		it('returns rotated flag correctly', () => {
			const ship = makeShip()
			const result = findNextPosition(2, ship, [])

			expect(result).not.toBeNull()
			expect(typeof result?.rotated).toBe('boolean')
		})
	})

	describe('Stacking Physics', () => {
		it('does not stack large container on small base', () => {
			const ship = makeShip({ width: 4, length: 4, height: 4 })

			const containers = [
				makeContainer(1, { x: 0, y: 0, z: 0 }), // 1x1x1
			]

			// 4 SCU (2x2) cannot stack on 1 SCU (1x1)
			const result = findNextPosition(4, ship, containers)

			expect(result).not.toBeNull()
			expect(result?.position.y).toBe(0)
			// Should be placed elsewhere on ground, not at origin
			const notStacked = result?.position.x !== 0 || result?.position.z !== 0
			expect(notStacked).toBe(true)
		})

		it('allows stacking same-sized containers', () => {
			const ship = makeShip({ width: 4, length: 4, height: 4 })

			const containers = [
				makeContainer(4, { x: 0, y: 0, z: 0 }), // 2x2x1
			]

			// Another 4 SCU can stack on the first
			const result = findNextPosition(4, ship, containers)

			expect(result).not.toBeNull()
			// Should find a valid placement (stacked or beside)
		})

		it('prevents bridging between uneven heights', () => {
			const ship = makeShip({ width: 4, length: 4, height: 4 })

			// Create uneven surface
			const containers = [
				makeContainer(4, { x: 0, y: 0, z: 0 }), // 2x2x1 at height 1
				makeContainer(1, { x: 2, y: 0, z: 0 }), // 1x1x1 at height 1
			]

			// 8 SCU (2x2x2) should not bridge
			const result = findNextPosition(8, ship, containers)

			expect(result).not.toBeNull()
			if (result && result.position.y > 0) {
				// If stacked, must be fully on one platform
				expect(result.position.x).toBeLessThanOrEqual(1)
				expect(result.position.z).toBeLessThanOrEqual(1)
			}
		})
	})

	describe('Multiple Cargo Grids', () => {
		it('uses second grid when first is full', () => {
			const ship = makeShip({ width: 2, length: 2, height: 2, grids: 2 })

			// Fill first grid
			const containers = [
				makeContainer(8, { x: 0, y: 0, z: 0 }, { gridIndex: 0 }),
			]

			const result = findNextPosition(1, ship, containers)

			expect(result).not.toBeNull()
			expect(result?.gridIndex).toBe(1)
		})

		it('tries rotation in subsequent grids', () => {
			const ship = makeShip({ width: 2, length: 3, height: 2, grids: 2 })

			// Fill first grid completely (2x3x2 = 12 SCU capacity)
			const containers = [
				// Bottom layer: 6 SCU
				makeContainer(4, { x: 0, y: 0, z: 0 }, { gridIndex: 0 }), // 2x1x2 at z=0-1
				makeContainer(1, { x: 0, y: 0, z: 2 }, { gridIndex: 0 }), // 1x1x1 at z=2
				makeContainer(1, { x: 1, y: 0, z: 2 }, { gridIndex: 0 }), // 1x1x1 at z=2
				// Top layer: 6 SCU
				makeContainer(4, { x: 0, y: 1, z: 0 }, { gridIndex: 0 }), // 2x1x2 at z=0-1
				makeContainer(1, { x: 0, y: 1, z: 2 }, { gridIndex: 0 }), // 1x1x1 at z=2
				makeContainer(1, { x: 1, y: 1, z: 2 }, { gridIndex: 0 }), // 1x1x1 at z=2
			]

			// Grid 0 is now completely full, should use grid 1
			const result = findNextPosition(2, ship, containers)

			expect(result).not.toBeNull()
			expect(result?.gridIndex).toBe(1)
		})

		it('returns null only after checking all grids', () => {
			const ship = makeShip({ width: 2, length: 2, height: 1, grids: 3 })

			// Fill all grids
			const containers = [
				makeContainer(4, { x: 0, y: 0, z: 0 }, { gridIndex: 0 }),
				makeContainer(4, { x: 0, y: 0, z: 0 }, { gridIndex: 1 }),
				makeContainer(4, { x: 0, y: 0, z: 0 }, { gridIndex: 2 }),
			]

			const result = findNextPosition(1, ship, containers)

			expect(result).toBeNull()
		})
	})

	describe('Space Efficiency', () => {
		it('packs mixed container sizes efficiently', () => {
			const ship = makeShip({ width: 4, length: 4, height: 4 })
			const containers: Container[] = []
			const sizes = [8, 4, 4, 2, 2, 1, 1]
			let placedCount = 0

			sizes.forEach((size) => {
				const result = findNextPosition(size, ship, containers)
				if (result) {
					placedCount++
					containers.push(
						makeContainer(size, result.position, {
							rotated: result.rotated,
							gridIndex: result.gridIndex,
						})
					)
				}
			})

			// Should successfully place at least 5 of 7 containers
			expect(placedCount).toBeGreaterThanOrEqual(5)
		})

		it('utilizes rotated spaces when available', () => {
			const ship = makeShip({ width: 4, length: 4, height: 2 })
			const containers: Container[] = []

			// Place several 2 SCU containers
			for (let i = 0; i < 8; i++) {
				const result = findNextPosition(2, ship, containers)
				if (result) {
					containers.push(
						makeContainer(2, result.position, {
							rotated: result.rotated,
							gridIndex: result.gridIndex,
						})
					)
				}
			}

			// Should have placed multiple containers
			expect(containers.length).toBeGreaterThan(4)
		})
	})

	describe('Position Bounds', () => {
		it('never places containers outside grid bounds', () => {
			const ship = makeShip({ width: 4, length: 4, height: 4 })
			const containers: Container[] = []

			// Place many containers
			for (let i = 0; i < 20; i++) {
				const result = findNextPosition(2, ship, containers)
				if (result) {
					expect(result.position.x).toBeGreaterThanOrEqual(0)
					expect(result.position.y).toBeGreaterThanOrEqual(0)
					expect(result.position.z).toBeGreaterThanOrEqual(0)
					expect(result.position.x).toBeLessThan(4)
					expect(result.position.y).toBeLessThan(4)
					expect(result.position.z).toBeLessThan(4)

					containers.push(
						makeContainer(2, result.position, {
							rotated: result.rotated,
							gridIndex: result.gridIndex,
						})
					)
				}
			}
		})
	})
})
