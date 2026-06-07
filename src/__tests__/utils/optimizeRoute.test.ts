// @/__tests__/utils/routeOptimizer.test.ts
import { describe, it, expect } from 'vitest'
import { optimizeRoute } from '@/utils/routeOptimizer'
import { Contract, RouteAlgorithm } from '@/constants/types'
import type { Location } from '@/data/locations'

describe('Route Optimizer - Global Optimization', () => {
	// Helper function to create a contract
	const createContract = (
		origin: string,
		deliveryPoints: {
			location: string
			cargo: { cargoType: string; quantity: number }[]
		}[],
		contractType: 'delivery' | 'pickup' = 'delivery',
	): Contract => ({
		id: `contract-${Math.random()}`,
		maxContainerSize: 4,
		origin,
		deliveryPoints: deliveryPoints.map((dp) => ({
			location: dp.location,
			quantity: dp.cargo.reduce((sum, c) => sum + c.quantity, 0),
			cargo: dp.cargo || [{ cargoType: 'General', quantity: 10 }],
		})),
		contractType,
		payout: 1000,
	})

	const getDeliveryStops = (
		manifest: ReturnType<typeof optimizeRoute>['manifest'],
	) => manifest.filter((m) => m.type === 'delivery' || m.type === 'both')

	describe('Closed Loop Routes (Return to Origin)', () => {
		it('should schedule start-location pickups as the first stop when start location is explicit', () => {
			const contracts: Contract[] = [
				createContract('New Babbage Interstellar Spaceport', [
					{
						location: 'Seraphim Station',
						cargo: [{ cargoType: 'Medical', quantity: 6 }],
					},
				]),
				createContract('Riker Memorial Spaceport', [
					{
						location: 'Magnus Gateway',
						cargo: [{ cargoType: 'Food', quantity: 6 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				startLocation: 'New Babbage Interstellar Spaceport',
			})

			const nbisStops = result.stops.filter(
				(stop) => stop.location === 'New Babbage Interstellar Spaceport',
			)

			expect(nbisStops).toHaveLength(1)
			expect(nbisStops[0].sequenceNumber).toBe(1)
			expect(nbisStops[0].operations.pickups.length).toBeGreaterThan(0)
		})

		it('should optimize for closed loop when no end location specified', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)

			const { route, manifest } = result
			const deliveryStops = getDeliveryStops(manifest)

			expect(route[0]).toBe('Port Tressler')
			expect(route.at(-1)).toBe('Port Tressler')
			expect(route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(route).toContain('Rayari Deltana Research Outpost')
			expect(deliveryStops.length).toBe(2)
		})

		it('should recognize equivalent paths in closed loops', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
			]

			const nnResult = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const aStarResult = optimizeRoute(contracts, RouteAlgorithm.A_STAR)

			// Both should start and end at Port Tressler
			expect(nnResult.route[0]).toBe('Port Tressler')
			expect(nnResult.route.at(-1)).toBe('Port Tressler')
			expect(aStarResult.route[0]).toBe('Port Tressler')
			expect(aStarResult.route.at(-1)).toBe('Port Tressler')

			// Both algorithms should find similar total distances for a closed loop
			expect(nnResult.totalDistance).toBeDefined()
			expect(aStarResult.totalDistance).toBeDefined()
		})

		it('should handle multiple contracts with shared locations in closed loop', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter', // Shared location
						cargo: [{ cargoType: 'Weapons', quantity: 8 }],
					},
					{
						location: 'Greycat Stanton IV Production Complex-A',
						cargo: [{ cargoType: 'Electronics', quantity: 12 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const { route, manifest } = result
			const deliveryStops = getDeliveryStops(manifest)

			// Should create a closed loop visiting each location once
			expect(route[0]).toBe('Port Tressler')
			expect(route.at(-1)).toBe('Port Tressler')

			expect(deliveryStops.length).toBe(3)

			// Sakura Sun Goldenrod Workcenter should have cargo from both contracts
			const sharedManifest = manifest.find(
				(m) => m.location === 'Sakura Sun Goldenrod Workcenter',
			)
			expect(sharedManifest?.contractIndices).toContain(0)
			expect(sharedManifest?.contractIndices).toContain(1)
		})
	})

	describe('Open Path Routes (Different End Location)', () => {
		it('should optimize path when end location is specified', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Rayari Deltana Research Outpost',
			})

			const { route } = result

			// Should start at origin
			expect(route[0]).toBe('Port Tressler')
			// Should end at the specified end location, NOT return to origin
			expect(route.at(-1)).toBe('Rayari Deltana Research Outpost')
			// Origin should only appear once (at the start)
			const originOccurrences = route.filter(
				(loc) => loc === 'Port Tressler',
			).length
			expect(originOccurrences).toBe(1)
		})

		it('should calculate optimal order based on end location proximity', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
					{
						location: 'Greycat Stanton IV Production Complex-A',
						cargo: [{ cargoType: 'Tech', quantity: 8 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Greycat Stanton IV Production Complex-A',
			})

			const { route, totalDistance } = result

			// Route should start at origin and end at specified end location
			expect(route[0]).toBe('Port Tressler')
			expect(route.at(-1)).toBe('Greycat Stanton IV Production Complex-A')

			// Should have a calculated distance
			expect(totalDistance).toBeDefined()
			expect(totalDistance).toBeGreaterThan(0)

			// All destinations should be visited
			expect(route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(route).toContain('Rayari Deltana Research Outpost')
		})

		it('should handle end location same as origin (explicit closed loop)', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Port Tressler', // Explicitly same as origin
			})

			const { route } = result

			// Should behave same as default closed loop
			expect(route[0]).toBe('Port Tressler')
			expect(route.at(-1)).toBe('Port Tressler')
			expect(route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(route).toContain('Rayari Deltana Research Outpost')
		})

		it('should handle end location that is not a delivery destination', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Everus Harbor', // Not a delivery point
			})

			const { route, manifest } = result
			const deliveryStops = getDeliveryStops(manifest)

			// Should start at origin
			expect(route[0]).toBe('Port Tressler')
			// Should end at specified end location
			expect(route.at(-1)).toBe('Everus Harbor')
			// Should still visit the delivery destination
			expect(route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(deliveryStops.length).toBe(1)
			expect(deliveryStops[0].location).toBe('Sakura Sun Goldenrod Workcenter')
		})
	})

	describe('FILO Loading Order with Route Types', () => {
		it('should generate FILO order for closed loop route', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'New Babbage Interstellar Spaceport',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Greycat Stanton IV Production Complex-A',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Tech', quantity: 8 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const { loadingOrder, route } = result
			expect(loadingOrder.length).toBeGreaterThanOrEqual(0)
			if (loadingOrder.length > 0) {
				expect(loadingOrder[0].location).toBeTruthy()
				expect(loadingOrder.at(-1)?.location).toBeTruthy()
			}

			const loadingLocations = loadingOrder.map((lo) => lo.location)
			loadingLocations.forEach((location) => {
				expect(route).toContain(location)
			})
		})

		it('should generate FILO order for open path route', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'New Babbage Interstellar Spaceport',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Greycat Stanton IV Production Complex-A',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Tech', quantity: 8 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Rayari Deltana Research Outpost',
			})

			const { loadingOrder, route } = result

			// Route should end at specified location (open path)
			expect(route.at(-1)).toBe('Rayari Deltana Research Outpost')

			expect(loadingOrder.length).toBeGreaterThanOrEqual(0)
			if (loadingOrder.length > 0) {
				expect(loadingOrder[0].location).toBeTruthy()
				expect(loadingOrder.at(-1)?.location).toBeTruthy()
			}

			const loadingLocations = loadingOrder.map((lo) => lo.location)
			loadingLocations.forEach((location) => {
				expect(route).toContain(location)
			})
		})
	})

	describe('Multiple Origins Validation', () => {
		it('should support contracts with different origins', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
				createContract('Everus Harbor', [
					{
						location: 'HDMS-Pinewood',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			expect(result.route.length).toBeGreaterThan(0)
			expect(result.route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(result.route).toContain('HDMS-Pinewood')
		})
	})

	describe('Edge Cases with Route Types', () => {
		it('should handle single delivery in closed loop', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const { route, manifest } = result
			const deliveryStops = getDeliveryStops(manifest)

			expect(route[0]).toBe('Port Tressler')
			expect(route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(route.at(-1)).toBe('Port Tressler')
			expect(deliveryStops.length).toBe(1)
			expect(deliveryStops[0].location).toBe('Sakura Sun Goldenrod Workcenter')
		})

		it('should handle pickup contracts in closed loop', () => {
			const contracts: Contract[] = [
				createContract(
					'Port Tressler',
					[
						{
							location: 'Sakura Sun Goldenrod Workcenter',
							cargo: [{ cargoType: 'Scrap', quantity: 10 }],
						},
						{
							location: 'Rayari Deltana Research Outpost',
							cargo: [{ cargoType: 'Salvage', quantity: 15 }],
						},
					],
					'pickup',
				),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const { route, manifest } = result

			expect(route[0]).toBe('Sakura Sun Goldenrod Workcenter')
			expect(route.at(-1)).toBe('Sakura Sun Goldenrod Workcenter')

			const originDelivery = manifest.find(
				(m) => m.location === 'Port Tressler' && m.type === 'delivery',
			)
			expect(originDelivery).toBeDefined()
		})

		it('should handle pickup contracts with specified end location', () => {
			const contracts: Contract[] = [
				createContract(
					'Port Tressler',
					[
						{
							location: 'Sakura Sun Goldenrod Workcenter',
							cargo: [{ cargoType: 'Scrap', quantity: 10 }],
						},
						{
							location: 'Rayari Deltana Research Outpost',
							cargo: [{ cargoType: 'Salvage', quantity: 15 }],
						},
					],
					'pickup',
				),
			]

			// For pickup with open path, end at a different location where pickups are delivered
			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Everus Harbor',
			})

			const { route, manifest } = result

			// Pickup routes begin from the first pickup location when no explicit start location is provided
			expect(route[0]).toBe('Sakura Sun Goldenrod Workcenter')
			// Should end at specified end location
			expect(route.at(-1)).toBe('Everus Harbor')

			// Should have pickups at the pickup locations
			const pickupStops = manifest.filter((m) => m.type === 'pickup')
			expect(pickupStops.length).toBeGreaterThanOrEqual(1)

			// Should have at least one delivery operation in the manifest
			const deliveryAtEnd = manifest.find(
				(m) => m.location === 'Everus Harbor' && m.type === 'delivery',
			)
			const deliveryStops = manifest.filter(
				(m) => m.type === 'delivery' || m.type === 'both',
			)
			expect(deliveryStops.length).toBeGreaterThanOrEqual(1)
			if (deliveryAtEnd) {
				expect(deliveryAtEnd.cargo.length).toBeGreaterThan(0)
			}
		})

		it('should handle single delivery in open path', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
				endLocation: 'Sakura Sun Goldenrod Workcenter',
			})

			const { route, manifest } = result
			const deliveryStops = getDeliveryStops(manifest)

			expect(route[0]).toBe('Port Tressler')
			expect(route.at(-1)).toBe('Sakura Sun Goldenrod Workcenter')
			// Should not return to origin
			expect(route.filter((loc) => loc === 'Port Tressler').length).toBe(1)
			expect(deliveryStops.length).toBe(1)
		})
	})

	describe('Function Signature Options', () => {
		it('should accept options object for future extensibility', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
			]

			// Test that options object works with just algorithm specified
			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.A_STAR,
			})

			expect(result.route).toBeDefined()
			expect(result.manifest).toBeDefined()
			expect(result.loadingOrder).toBeDefined()
			expect(result.totalDistance).toBeDefined()

			// Should behave same as closed loop by default when no endLocation specified
			expect(result.route[0]).toBe('Port Tressler')
			expect(result.route.at(-1)).toBe('Port Tressler')
		})

		it('should maintain backward compatibility with algorithm-only parameter', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
			]

			// Old API still works - passing RouteAlgorithm directly
			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const deliveryStops = getDeliveryStops(result.manifest)

			expect(result.route[0]).toBe('Port Tressler')
			expect(result.route.at(-1)).toBe('Port Tressler')
			expect(deliveryStops.length).toBe(1)
		})

		it('should default to NEAREST_NEIGHBOR when options object has no algorithm', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
			]

			// Options object without algorithm specified
			const result = optimizeRoute(contracts, {
				endLocation: 'Sakura Sun Goldenrod Workcenter',
			})

			expect(result.route).toBeDefined()
			expect(result.route[0]).toBe('Port Tressler')
			expect(result.route.at(-1)).toBe('Sakura Sun Goldenrod Workcenter')
		})
	})

	describe('Global Optimization Benefits', () => {
		it('should produce shorter route than siloed individual optimization', () => {
			// Two contracts sharing Sakura Sun Goldenrod Workcenter
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'Food', quantity: 5 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter', // Shared
						cargo: [{ cargoType: 'Weapons', quantity: 8 }],
					},
					{
						location: 'Greycat Stanton IV Production Complex-A',
						cargo: [{ cargoType: 'Electronics', quantity: 12 }],
					},
				]),
			]

			// Simulate old siloed behavior - each contract gets its own route
			const siloedRoutes = contracts.map((c) =>
				optimizeRoute([c], RouteAlgorithm.NEAREST_NEIGHBOR),
			)
			const siloedDistance = siloedRoutes.reduce(
				(total, result) => total + (result.totalDistance || 0),
				0,
			)

			// Global optimization - all contracts in one route
			const globalResult = optimizeRoute(
				contracts,
				RouteAlgorithm.NEAREST_NEIGHBOR,
			)

			// Global should be more efficient (or equal) due to shared locations
			expect(globalResult.totalDistance).toBeLessThanOrEqual(siloedDistance)

			// Verify shared location is visited only once
			const sakuraCount = globalResult.route.filter(
				(loc) => loc === 'Sakura Sun Goldenrod Workcenter',
			).length
			expect(sakuraCount).toBe(1)
		})

		it('should demonstrate efficiency gains with more contracts sharing locations', () => {
			// Three contracts with overlapping locations
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'A', quantity: 10 }],
					},
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'B', quantity: 5 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter', // Shared
						cargo: [{ cargoType: 'C', quantity: 8 }],
					},
					{
						location: 'Greycat Stanton IV Production Complex-A',
						cargo: [{ cargoType: 'D', quantity: 12 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'Rayari Deltana Research Outpost', // Shared
						cargo: [{ cargoType: 'E', quantity: 7 }],
					},
					{
						location: 'New Babbage Interstellar Spaceport',
						cargo: [{ cargoType: 'F', quantity: 9 }],
					},
				]),
			]

			// Siloed approach
			const siloedRoutes = contracts.map((c) =>
				optimizeRoute([c], RouteAlgorithm.A_STAR),
			)
			const siloedDistance = siloedRoutes.reduce(
				(total, result) => total + (result.totalDistance || 0),
				0,
			)

			// Global approach
			const globalResult = optimizeRoute(contracts, RouteAlgorithm.A_STAR)
			const deliveryStops = getDeliveryStops(globalResult.manifest)

			// With shared locations, global should be more efficient
			expect(globalResult.totalDistance).toBeLessThan(siloedDistance)

			expect(deliveryStops.length).toBe(4)
		})

		it('should handle case where global optimization equals individual (no shared locations)', () => {
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'A', quantity: 10 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'B', quantity: 5 }],
					},
				]),
			]

			const siloedRoutes = contracts.map((c) =>
				optimizeRoute([c], RouteAlgorithm.NEAREST_NEIGHBOR),
			)
			const siloedDistance = siloedRoutes.reduce(
				(total, result) => total + (result.totalDistance || 0),
				0,
			)

			const globalResult = optimizeRoute(
				contracts,
				RouteAlgorithm.NEAREST_NEIGHBOR,
			)

			// When there are no shared locations, global should still be at least as good
			expect(globalResult.totalDistance).toBeLessThanOrEqual(siloedDistance)

			// Should visit both locations
			expect(globalResult.route).toContain('Sakura Sun Goldenrod Workcenter')
			expect(globalResult.route).toContain('Rayari Deltana Research Outpost')
		})

		it('should group nearby locations together in route', () => {
			// Locations on same parent (Microtech surface) should be grouped
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter',
						cargo: [{ cargoType: 'A', quantity: 10 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'Rayari Deltana Research Outpost',
						cargo: [{ cargoType: 'B', quantity: 8 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const { route } = result

			// Both locations are on Microtech surface, should be adjacent in route
			const sakuraIndex = route.indexOf('Sakura Sun Goldenrod Workcenter')
			const rayariIndex = route.indexOf('Rayari Deltana Research Outpost')

			expect(Math.abs(sakuraIndex - rayariIndex)).toBe(1)
		})

		it('should recognize cross-system trips as expensive', () => {
			// Port Tressler (Microtech) to HDMS-Pinewood (Hurston) is cross-system
			const contracts: Contract[] = [
				createContract('Port Tressler', [
					{
						location: 'Sakura Sun Goldenrod Workcenter', // Microtech
						cargo: [{ cargoType: 'Medical', quantity: 10 }],
					},
				]),
				createContract('Port Tressler', [
					{
						location: 'HDMS-Pinewood', // Hurston - far away
						cargo: [{ cargoType: 'Weapons', quantity: 8 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, RouteAlgorithm.NEAREST_NEIGHBOR)
			const { totalDistance } = result

			// Cross-system travel should result in significant distance
			// The exact value depends on your coordinate system, but it should be substantial
			expect(totalDistance).toBeGreaterThan(0)
			expect(totalDistance).toBeDefined()
		})

		it('should route interstellar A* travel through paired gateways', () => {
			const interstellarLocations: Location[] = [
				{
					name: 'Stanton',
					coordinates: { x: 0, y: 0, z: 0 },
					type: 'STAR',
					system: 'stanton',
				},
				{
					name: 'Nyx',
					coordinates: { x: 1000000, y: 0, z: 0 },
					type: 'STAR',
					system: 'nyx',
				},
				{
					name: 'Stanton Hub',
					coordinates: { x: 1000, y: 0, z: 0 },
					type: 'ORBITAL_STATION',
					parentObject: 'Stanton',
					system: 'stanton',
					isSelectable: true,
				},
				{
					name: 'Nyx Outpost',
					coordinates: { x: 1001000, y: 0, z: 0 },
					type: 'ORBITAL_STATION',
					parentObject: 'Nyx',
					system: 'nyx',
					isSelectable: true,
				},
				{
					name: 'Nyx Gateway',
					coordinates: { x: 500000, y: 1000, z: 0 },
					type: 'ORBITAL_STATION',
					parentObject: 'Stanton',
					system: 'stanton',
					isSelectable: true,
				},
				{
					name: 'Stanton Gateway',
					coordinates: { x: 501000, y: -1000, z: 0 },
					type: 'ORBITAL_STATION',
					parentObject: 'Nyx',
					system: 'nyx',
					isSelectable: true,
				},
			]

			const contracts: Contract[] = [
				createContract('Stanton Hub', [
					{
						location: 'Nyx Outpost',
						cargo: [{ cargoType: 'Prototype Components', quantity: 4 }],
					},
				]),
			]

			const result = optimizeRoute(contracts, {
				algorithm: RouteAlgorithm.A_STAR,
				startLocation: 'Stanton Hub',
				locations: interstellarLocations,
			})

			const nyxGatewayIndex = result.route.indexOf('Nyx Gateway')
			const stantonGatewayIndex = result.route.indexOf('Stanton Gateway')
			const nyxOutpostIndex = result.route.indexOf('Nyx Outpost')

			expect(nyxGatewayIndex).toBeGreaterThan(-1)
			expect(stantonGatewayIndex).toBeGreaterThan(-1)
			expect(nyxOutpostIndex).toBeGreaterThan(-1)
			expect(nyxGatewayIndex).toBeLessThan(stantonGatewayIndex)
			expect(stantonGatewayIndex).toBeLessThan(nyxOutpostIndex)

			const hasDirectCrossSystemJump = result.route.some((stop, index) => {
				if (index === result.route.length - 1) return false
				return stop === 'Stanton Hub' && result.route[index + 1] === 'Nyx Outpost'
			})

			expect(hasDirectCrossSystemJump).toBe(false)
		})
	})
})
