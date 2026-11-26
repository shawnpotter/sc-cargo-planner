import { describe, expect, it, vi } from 'vitest'
import { buildCargoPlan, handleLoadCargo } from '@/utils/handleLoadCargo'
import { optimizeRoute } from '@/utils/routeOptimizer'
import { STANDARD_CONTAINER_SIZES, calculateOptimalContainerSize, HaulingMode } from '@/utils/calculateContainers'
import { getStopId } from '@/utils/stopIdentity'
import { RouteGraph } from '@/utils/graph'
import { getVisibleContainers } from '@/hooks/useVisibleContainers'
import { voxelDimensionsMap } from '@/constants/dimensions'
import { type Contract, type Container, type Ship, RouteAlgorithm } from '@/constants/types'
import type { Location } from '@/data/locations'

const locations: Location[] = [
	{ name: 'A', type: 'ORBITAL_STATION', coordinates: { x: 0, y: 0, z: 0 } },
	{ name: 'B', type: 'ORBITAL_STATION', coordinates: { x: 10, y: 0, z: 0 } },
	{ name: 'C', type: 'ORBITAL_STATION', coordinates: { x: 1, y: 0, z: 0 } },
	{ name: 'D', type: 'ORBITAL_STATION', coordinates: { x: 20, y: 0, z: 0 } },
]
const ship: Ship = { name: 'Eight', totalCapacity: 8, cargoGrids: [{ width: 2, length: 4, height: 1 }] }
const contract = (origin: string, destination: string, quantity: number, cargoType = 'Ore'): Contract => ({
	id: `${origin}-${destination}`, origin, maxContainerSize: 4, contractType: 'delivery',
	deliveryPoints: [{ id: `${destination}-cargo`, location: destination, quantity, cargo: [{ cargoType, quantity }] }],
})

function expectValidPlacement(containers: Container[], selectedShip: Ship) {
	const cells = new Set<string>()
	for (const container of containers) {
		const gridIndex = container.gridIndex ?? 0
		const grid = selectedShip.cargoGrids[gridIndex]
		const [w, h, d] = voxelDimensionsMap[container.size]
		const width = container.rotated ? d : w
		const depth = container.rotated ? w : d
		expect(container.position.x).toBeGreaterThanOrEqual(0)
		expect(container.position.y).toBeGreaterThanOrEqual(0)
		expect(container.position.z).toBeGreaterThanOrEqual(0)
		expect(container.position.x + width).toBeLessThanOrEqual(grid.width)
		expect(container.position.y + h).toBeLessThanOrEqual(grid.height)
		expect(container.position.z + depth).toBeLessThanOrEqual(grid.length)
		for (let x = container.position.x; x < container.position.x + width; x++)
			for (let y = container.position.y; y < container.position.y + h; y++)
				for (let z = container.position.z; z < container.position.z + depth; z++) {
					const key = `${gridIndex}:${x}:${y}:${z}`
					expect(cells.has(key)).toBe(false)
					cells.add(key)
				}
	}
}

describe('Public beta cargo plan invariants', () => {
	it('conserves a 3 SCU remainder under a 24 SCU limit as 2 + 1', () => {
		const input = contract('A', 'B', 3)
		input.maxContainerSize = 24
		const result = buildCargoPlan({ contracts: [input], selectedShip: ship, locations })
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.containers.map((box) => box.size)).toEqual([2, 1])
		expect(result.containers.every((box) => box.cargoTypeIndex === 0)).toBe(true)
	})

	it('never selects an unsupported, oversized, or remainder-exceeding container', () => {
		for (const mode of Object.values(HaulingMode)) for (const maximum of [1, 2, 3, 4, 10, 16, 24, 30, 32]) for (let quantity = 1; quantity <= 65; quantity++) {
			const size = calculateOptimalContainerSize(maximum, quantity, mode)
			expect(STANDARD_CONTAINER_SIZES).toContain(size)
			expect(size).toBeLessThanOrEqual(maximum)
			expect(size).toBeLessThanOrEqual(quantity)
		}
	})

	it('retains mixed cargo identity even when two entries have the same name', () => {
		const input = contract('A', 'B', 8)
		input.deliveryPoints[0].cargo = [{ cargoType: 'Ore', quantity: 3 }, { cargoType: 'Ore', quantity: 5 }]
		const result = buildCargoPlan({ contracts: [input], selectedShip: ship, locations })
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.containers.filter((box) => box.cargoTypeIndex === 0).reduce((sum, box) => sum + box.size, 0)).toBe(3)
		expect(result.containers.filter((box) => box.cargoTypeIndex === 1).reduce((sum, box) => sum + box.size, 0)).toBe(5)
		expect(new Set(result.containers.map((box) => box.id)).size).toBe(result.containers.length)
	})

	it('unloads before a nearer later pickup and reuses freed grid space', () => {
		const result = buildCargoPlan({ contracts: [contract('A', 'B', 8), contract('C', 'D', 8, 'Food')], selectedShip: ship, locations })
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.optimizedRoute.stops.map((stop) => stop.location)).toEqual(['A', 'B', 'C', 'D'])
		expect(result.containers.reduce((sum, box) => sum + box.size, 0)).toBe(16)
		for (const stop of result.optimizedRoute.stops) {
			for (const snapshot of [stop.cargoStateBefore, stop.cargoStateAfter]) {
				expect(snapshot.totalSCU).toBeLessThanOrEqual(8)
				expect(snapshot.totalSCU).toBe(snapshot.containers.reduce((sum, box) => sum + box.size, 0))
				expect([...snapshot.byDestination.values()].reduce((sum, value) => sum + value, 0)).toBe(snapshot.totalSCU)
				expectValidPlacement(snapshot.containers, ship)
			}
		}
		expect(result.optimizedRoute.stops[1].cargoStateAfter.byDestination.size).toBe(0)
		expect(result.containers.filter((box) => box.contractIndex === 0).map((box) => box.position)).toEqual(result.containers.filter((box) => box.contractIndex === 1).map((box) => box.position))
	})

	it('keeps surviving positions unchanged through an unload and later pickup', () => {
		const biggerShip: Ship = { ...ship, totalCapacity: 12, cargoGrids: [{ width: 2, length: 6, height: 1 }] }
		const first = contract('A', 'B', 8)
		first.deliveryPoints.push({ location: 'D', quantity: 4, cargo: [{ cargoType: 'Keep', quantity: 4 }] })
		const result = buildCargoPlan({ contracts: [first, contract('C', 'D', 4)], selectedShip: biggerShip, locations })
		expect(result.success).toBe(true)
		if (!result.success) return
		const before = result.optimizedRoute.stops[0].cargoStateAfter.containers.find((box) => box.deliveryIndex === 1)
		const after = result.optimizedRoute.stops.find((stop) => stop.location === 'C')?.cargoStateAfter.containers.find((box) => box.id === before?.id)
		expect(after?.position).toEqual(before?.position)
	})

	it('rejects insufficient geometry without publishing a partial route or cargo', () => {
		const setContainers = vi.fn()
		const setOptimizedRoute = vi.fn()
		const result = handleLoadCargo({ contracts: [contract('A', 'B', 4, 'Medical')],
			selectedShip: { ...ship, cargoGrids: [{ width: 1, length: 1, height: 1 }] }, locations, setContainers, setOptimizedRoute })
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error).toMatch(/Medical.*Contract 1.*cargo grids/)
		expect(setContainers).not.toHaveBeenCalled()
		expect(setOptimizedRoute).not.toHaveBeenCalled()
	})

	it('splits a large container when smaller supported boxes fit the ship geometry', () => {
		const input = contract('A', 'B', 8)
		input.maxContainerSize = 8
		const result = buildCargoPlan({ contracts: [input], selectedShip: ship, locations })
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.containers.map((box) => box.size)).toEqual([4, 4])
	})

	it.each([RouteAlgorithm.NEAREST_NEIGHBOR, RouteAlgorithm.A_STAR])('enforces precedence for repeated locations with %s', (algorithm) => {
		const contracts = [contract('A', 'B', 4), contract('B', 'A', 4, 'Food')]
		const result = buildCargoPlan({ contracts, selectedShip: ship, locations, routeAlgorithm: algorithm })
		expect(result.success).toBe(true)
		if (!result.success) return
		const { stops } = result.optimizedRoute
		expect(stops.map((stop) => stop.location)).toEqual(['A', 'B', 'A'])
		expect(stops.map(getStopId)).toEqual(['1:A', '2:B', '3:A'])
		expect(stops[0].operations.deliveries).toEqual([])
		expect(stops[2].operations.pickups).toEqual([])
		expect(stops[2].cargoStateAfter.totalSCU).toBe(0)
		const statuses = { '1:A': 'completed', '2:B': 'completed' } satisfies Parameters<typeof getVisibleContainers>[1]
		const visible = getVisibleContainers(result.containers, statuses, stops)
		expect(visible.reduce((sum, box) => sum + box.size, 0)).toBe(4)
		expect(visible.every((box) => box.contractIndex === 1)).toBe(true)
		expect(getVisibleContainers(result.containers, { ...statuses, '3:A': 'completed' }, stops)).toEqual([])
	})

	it('keeps inputs untouched and returns actionable missing and disconnected location errors', () => {
		const input = contract('A', 'Missing', 4)
		const original = JSON.stringify(input)
		expect(() => optimizeRoute([input], { locations })).toThrow(/Missing.*missing from map data/)
		expect(JSON.stringify(input)).toBe(original)
		const isolated = locations.map((location) => ({ ...location, system: location.name === 'B' ? 'nyx' : 'stanton' }))
		const result = buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, locations: isolated })
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error).toMatch(/connected travel path.*gateway/)
	})

	it('rejects fractional cargo and invalid ship grids without looping or partial state', () => {
		const fractional = buildCargoPlan({ contracts: [contract('A', 'B', 1.5)], selectedShip: ship, locations })
		expect(fractional.success).toBe(false)
		const invalidGrid = buildCargoPlan({ contracts: [contract('A', 'B', 1)], selectedShip: { ...ship, cargoGrids: [{ width: 1.5, length: 2, height: 1 }] }, locations })
		expect(invalidGrid.success).toBe(false)
	})
})

// Interstellar travel must use the same gateway path for either strategy.
describe('Cargo plan gateway travel', () => {
	it.each([RouteAlgorithm.NEAREST_NEIGHBOR, RouteAlgorithm.A_STAR])('never collapses duplicate gateway names into a cross-system shortcut with %s', (routeAlgorithm) => {
		const ambiguousCatalog: Location[] = [
			{ name: 'A', type: 'ORBITAL_STATION', system: 'stanton', coordinates: { x: 0, y: 0, z: 0 } },
			{ name: 'Nyx Gateway', type: 'GATEWAY', system: 'stanton', coordinates: { x: 1, y: 0, z: 0 } },
			{ name: 'Nyx Gateway', type: 'GATEWAY', system: 'pyro', coordinates: { x: 50, y: 0, z: 0 } },
			{ name: 'B', type: 'ORBITAL_STATION', system: 'pyro', coordinates: { x: 60, y: 0, z: 0 } },
		]
		const disconnected = buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, locations: ambiguousCatalog, routeAlgorithm })
		expect(disconnected.success).toBe(false)
		if (!disconnected.success) expect(disconnected.error).toMatch(/connected travel path.*gateway/)
		const connected = buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, routeAlgorithm, locations: [
			...ambiguousCatalog,
			{ name: 'Pyro Gateway', type: 'GATEWAY', system: 'stanton', coordinates: { x: 2, y: 0, z: 0 } },
			{ name: 'Stanton Gateway', type: 'GATEWAY', system: 'pyro', coordinates: { x: 3, y: 0, z: 0 } },
		] })
		if (!connected.success) throw new Error(connected.error)
		expect(connected.optimizedRoute.route).toEqual(['A', 'Pyro Gateway', 'Stanton Gateway', 'B', 'Stanton Gateway', 'Pyro Gateway', 'A'])
	})

	it('rejects ambiguous cargo destinations and journey endpoints before building a plan', () => {
		const catalog: Location[] = [
			...locations,
			{ name: 'Shared', type: 'GATEWAY', system: 'stanton', coordinates: { x: 1, y: 0, z: 0 } },
			{ name: 'Shared', type: 'GATEWAY', system: 'pyro', coordinates: { x: 50, y: 0, z: 0 } },
			{ name: 'Shared child', type: 'ORBITAL_STATION', parentObject: 'Shared', coordinates: { x: 2, y: 0, z: 0 } },
		]
		for (const input of [
			{ contracts: [contract('A', 'Shared', 4)] },
			{ contracts: [contract('A', 'B', 4)], endLocation: 'Shared' },
			{ contracts: [contract('A', 'Shared child', 4)] },
		]) {
			const result = buildCargoPlan({ ...input, selectedShip: ship, locations: catalog })
			expect(result.success).toBe(false)
			if (!result.success) expect(result.error).toMatch(/Shared.*ambiguous.*uniquely named/)
		}
	})

	it.each([RouteAlgorithm.NEAREST_NEIGHBOR, RouteAlgorithm.A_STAR])('pairs explicit two-system jump-point names using their owning system with %s', (routeAlgorithm) => {
		const catalog: Location[] = [
			{ name: 'A', type: 'ORBITAL_STATION', system: 'pyro', coordinates: { x: 0, y: 0, z: 0 } },
			{ name: 'Nyx Gateway', type: 'GATEWAY', system: 'pyro', coordinates: { x: 1, y: 0, z: 0 } },
			{ name: 'Nyx - Pyro Jump Point', type: 'GATEWAY', system: 'nyx', coordinates: { x: 2, y: 0, z: 0 } },
			{ name: 'B', type: 'ORBITAL_STATION', system: 'nyx', coordinates: { x: 3, y: 0, z: 0 } },
		]
		const result = buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, locations: catalog, routeAlgorithm })
		if (!result.success) throw new Error(result.error)
		expect(result.optimizedRoute.route).toEqual(['A', 'Nyx Gateway', 'Nyx - Pyro Jump Point', 'B', 'Nyx - Pyro Jump Point', 'Nyx Gateway', 'A'])
		const inconsistentOwner = catalog.map(location => location.name === 'Nyx - Pyro Jump Point' ? { ...location, system: 'stanton' } : location)
		expect(buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, locations: inconsistentOwner, routeAlgorithm }).success).toBe(false)
	})

	it.each([RouteAlgorithm.NEAREST_NEIGHBOR, RouteAlgorithm.A_STAR])('retains paired gateway transitions with %s', (routeAlgorithm) => {
		const gatewayLocations: Location[] = [
			{ name: 'A', type: 'ORBITAL_STATION', system: 'stanton', coordinates: { x: 0, y: 0, z: 0 } },
			{ name: 'Nyx Gateway', type: 'GATEWAY', system: 'stanton', coordinates: { x: 1, y: 0, z: 0 } },
			{ name: 'Stanton Gateway', type: 'GATEWAY', system: 'nyx', coordinates: { x: 2, y: 0, z: 0 } },
			{ name: 'B', type: 'ORBITAL_STATION', system: 'nyx', coordinates: { x: 3, y: 0, z: 0 } },
		]
		const result = buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, locations: gatewayLocations, routeAlgorithm })
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.optimizedRoute.route).toEqual(['A', 'Nyx Gateway', 'Stanton Gateway', 'B', 'Stanton Gateway', 'Nyx Gateway', 'A'])
		expect(result.optimizedRoute.stops.map((stop) => stop.location)).toEqual(['A', 'B'])
		expect(result.optimizedRoute.stops[0].cargoStateAfter.byDestination.get('B')).toBe(4)
		expect(result.optimizedRoute.stops[1].cargoStateAfter.byDestination.size).toBe(0)
	})
})

describe('Large map catalog routing', () => {
	it.each([RouteAlgorithm.NEAREST_NEIGHBOR, RouteAlgorithm.A_STAR])('retains gateways and transitive parents without graphing unrelated POIs with %s', (routeAlgorithm) => {
		const needed: Location[] = [
			{ name: 'Stanton', type: 'STAR', coordinates: { x: -10, y: 0, z: 0 } },
			{ name: 'Nyx', type: 'STAR', coordinates: { x: 30, y: 0, z: 0 } },
			{ name: 'Stanton Planet', type: 'PLANET', parentObject: 'Stanton', coordinates: { x: 0, y: 0, z: 0 } },
			{ name: 'Nyx Planet', type: 'PLANET', parentObject: 'Nyx', coordinates: { x: 25, y: 0, z: 0 } },
			{ name: 'Nyx Moon', type: 'MOON', parentObject: 'Nyx Planet', coordinates: { x: 23, y: 0, z: 0 } },
			{ name: 'A', type: 'ORBITAL_STATION', parentObject: 'Stanton Planet', coordinates: { x: 1, y: 0, z: 0 } },
			{ name: 'Nyx Gateway', type: 'GATEWAY', parentObject: 'Stanton', coordinates: { x: 10, y: 0, z: 0 } },
			{ name: 'Stanton Gateway', type: 'GATEWAY', parentObject: 'Nyx', coordinates: { x: 20, y: 0, z: 0 } },
			{ name: 'B', type: 'SURFACE_LOCATION', parentObject: 'Nyx Moon', requiresPlanetaryVisit: true, coordinates: { x: 24, y: 0, z: 0 } },
		]
		const irrelevant: Location[] = Array.from({ length: 1500 }, (_, index) => ({
			name: `Unrelated outpost ${index}`, type: 'SURFACE_LOCATION', parentObject: 'Stanton Planet',
			coordinates: { x: index, y: 100, z: 100 },
		}))
		const catalog = [...needed, ...irrelevant]
		const before = JSON.stringify(catalog)
		const addNode = vi.spyOn(RouteGraph.prototype, 'addNode')
		const addEdge = vi.spyOn(RouteGraph.prototype, 'addEdge')
		try {
			const result = buildCargoPlan({ contracts: [contract('A', 'B', 4)], selectedShip: ship, locations: catalog, routeAlgorithm })
			expect(result.success).toBe(true)
			if (!result.success) return
			expect(addNode.mock.calls.map(([location]) => location.name)).toEqual(needed.map((location) => location.name))
			expect(addEdge.mock.calls.length).toBeLessThan(needed.length ** 2 + needed.length * 2)
			const route = result.optimizedRoute.route
			expect(route.indexOf('Nyx Gateway')).toBeLessThan(route.indexOf('Stanton Gateway'))
			expect(route.indexOf('Stanton Gateway')).toBeLessThan(route.indexOf('Nyx Moon'))
			expect(route.indexOf('Nyx Moon')).toBeLessThan(route.indexOf('B'))
			expect(route[0]).toBe('A')
			expect(route.at(-1)).toBe('A')
			expect(route.some((name) => name.startsWith('Unrelated'))).toBe(false)
			expect(JSON.stringify(catalog)).toBe(before)
		} finally {
			addNode.mockRestore()
			addEdge.mockRestore()
		}
	})
})
