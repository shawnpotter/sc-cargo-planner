// @/utils/routeOptimizer.ts
import { Contract, RouteAlgorithm } from '@/constants/types'
import { RouteGraph } from '@/utils/graph'
import { locations } from '@/data/locations'
import { NearestNeighborStrategy } from '@/utils/routingStrategies/NearestNeighborStrategy'
import { AStarStrategy } from '@/utils/routingStrategies/AStarStrategy'

export interface OptimizedRoute {
	route: string[]
	manifest: Array<{
		location: string
		type: 'pickup' | 'delivery'
		contractIndices: number[]
		cargo: Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
		}>
	}>
	loadingOrder: Array<{
		location: string
		contractIndices: number[]
		cargo: Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
		}>
	}>
	totalDistance?: number
}

export interface RouteOptions {
	algorithm?: RouteAlgorithm
	endLocation?: string
}

/**
 * Optimize delivery routes for a list of contracts using global optimization.
 *
 * This function consolidates all contracts into a single optimized route that
 * visits each unique destination exactly once, solving a Traveling Salesperson
 * Problem (TSP) variant.
 *
 * Behavior:
 * - Validates that all contracts share the same origin (throws if not)
 * - Collects all unique destinations across all contracts
 * - Uses the selected routing strategy to find the optimal path
 * - Returns a closed loop (returns to origin) by default
 * - If endLocation is specified, returns an open path ending at that location
 * - If endLocation equals origin, behaves as explicit closed loop
 * - Generates a manifest showing cargo operations at each stop (excludes waypoints)
 * - Generates FILO loading order for optimal container placement (excludes waypoints)
 * - Calculates total route distance
 * - Route includes planetary waypoints for navigation; manifest/loadingOrder do not
 *
 * @param contracts - Array of contracts to optimize. All must have the same origin.
 * @param optionsOrAlgorithm - Either a RouteAlgorithm enum value (backward compatible)
 *                             or a RouteOptions object with algorithm and endLocation.
 *
 * @returns An OptimizedRoute object containing:
 *   - route: Ordered location names starting at origin, ending at origin (closed loop)
 *            or endLocation (open path). Includes waypoints.
 *   - manifest: Cargo operations at each delivery stop (excludes waypoints)
 *   - loadingOrder: FILO order for loading containers (excludes waypoints)
 *   - totalDistance: Sum of distances between consecutive stops
 *
 * @throws Error if contracts have different origins
 *
 * @example
 * // Closed loop (default)
 * const result = optimizeRoute(contracts, RouteAlgorithm.A_STAR);
 *
 * @example
 * // Open path with end location
 * const result = optimizeRoute(contracts, {
 *   algorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
 *   endLocation: 'Everus Harbor'
 * });
 */
export const optimizeRoute = (
	contracts: Contract[],
	optionsOrAlgorithm:
		| RouteAlgorithm
		| RouteOptions = RouteAlgorithm.NEAREST_NEIGHBOR,
): OptimizedRoute => {
	// Parse options - support both old API (algorithm enum) and new API (options object)
	let algorithm: RouteAlgorithm
	let endLocation: string | undefined

	if (typeof optionsOrAlgorithm === 'object') {
		algorithm = optionsOrAlgorithm.algorithm ?? RouteAlgorithm.NEAREST_NEIGHBOR
		endLocation = optionsOrAlgorithm.endLocation
	} else {
		algorithm = optionsOrAlgorithm
		endLocation = undefined
	}

	// Handle empty contracts
	if (contracts.length === 0) {
		return {
			route: [],
			manifest: [],
			loadingOrder: [],
			totalDistance: 0,
		}
	}

	// Validate all contracts have the same origin
	const origin = contracts[0].origin
	const invalidContract = contracts.find((c) => c.origin !== origin)
	if (invalidContract) {
		throw new Error(
			`All contracts must have the same origin. Expected "${origin}" but found "${invalidContract.origin}"`,
		)
	}

	// Determine if this is a closed loop or open path
	const isClosedLoop = !endLocation || endLocation === origin

	// Build the graph
	const graph = new RouteGraph()

	locations.forEach((location) => {
		graph.addNode(location)
	})

	locations.forEach((from) => {
		locations.forEach((to) => {
			if (from.name !== to.name) {
				try {
					graph.addEdge(from.name, to.name)
				} catch (error) {
					console.error(
						`Failed to add edge between ${from.name} and ${to.name}:`,
						error,
					)
				}
			}
		})
	})

	// Collect all unique destinations and build cargo/contract mappings
	const destinationCargoMap = new Map<
		string,
		Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
		}>
	>()

	const destinationContractsMap = new Map<string, Set<number>>()

	contracts.forEach((contract, contractIndex) => {
		contract.deliveryPoints.forEach((dp, deliveryPointIndex) => {
			const location = dp.location

			if (!destinationCargoMap.has(location)) {
				destinationCargoMap.set(location, [])
				destinationContractsMap.set(location, new Set())
			}

			destinationContractsMap.get(location)!.add(contractIndex)

			dp.cargo.forEach((cargoItem) => {
				destinationCargoMap.get(location)!.push({
					cargoType: cargoItem.cargoType,
					quantity: cargoItem.quantity,
					contractIndex,
					deliveryPointIndex,
				})
			})
		})
	})

	const uniqueDestinations = Array.from(destinationCargoMap.keys())

	// Select routing strategy
	const strategy =
		algorithm === RouteAlgorithm.A_STAR
			? new AStarStrategy()
			: new NearestNeighborStrategy()

	// Find optimal route through all unique destinations
	let route: string[]
	try {
		if (isClosedLoop) {
			// Closed loop: visit all destinations and return to origin
			route = strategy.findRoute(origin, uniqueDestinations, graph)
		} else {
			// Open path: visit all destinations, ending at endLocation
			// If endLocation is one of the destinations, we need to ensure it's visited last
			// If endLocation is NOT a destination, we need to add it as a final stop

			const isEndLocationADestination = uniqueDestinations.includes(
				endLocation!,
			)

			if (isEndLocationADestination) {
				// Remove endLocation from destinations, route to remaining, then add endLocation
				const intermediateDestinations = uniqueDestinations.filter(
					(d) => d !== endLocation,
				)
				route = strategy.findRoute(origin, intermediateDestinations, graph)
				// Now add path to endLocation
				const pathToEnd = strategy.findRoute(
					route.at(-1)!,
					[endLocation!],
					graph,
				)
				// Append without duplicating the current position
				route.push(...pathToEnd.slice(1))
			} else {
				// endLocation is not a delivery destination
				// Route through all destinations, then to endLocation
				route = strategy.findRoute(origin, uniqueDestinations, graph)
				// Add path to endLocation
				const pathToEnd = strategy.findRoute(
					route.at(-1)!,
					[endLocation!],
					graph,
				)
				route.push(...pathToEnd.slice(1))
			}
		}
	} catch (error) {
		console.error('Failed to find optimal route:', error)
		// Fallback: origin -> all destinations in order -> endLocation or origin
		route = [origin, ...uniqueDestinations]
		if (!isClosedLoop) {
			if (!route.includes(endLocation!)) {
				route.push(endLocation!)
			}
		}
	}

	// Ensure proper ending
	if (isClosedLoop) {
		// Closed loop - add origin at end if not already there
		if (route.at(-1) !== origin) {
			route.push(origin)
		}
	}
	// For open path, route should already end at endLocation

	// Helper function to check if a location is a waypoint (not a delivery destination)
	const isWaypoint = (locationName: string): boolean => {
		return !destinationCargoMap.has(locationName)
	}

	// Build manifest (excluding waypoints)
	const manifest: OptimizedRoute['manifest'] = []

	// Track pickup contracts for the final delivery
	const pickupContractIndices = contracts
		.map((c, i) => (c.contractType === 'pickup' ? i : -1))
		.filter((i) => i !== -1)

	// Determine where pickup cargo gets delivered
	// In closed loop: origin
	// In open path: endLocation
	const pickupDeliveryLocation = isClosedLoop ? origin : endLocation!

	// Process each stop in the route (excluding start origin)
	for (let i = 1; i < route.length; i++) {
		const location = route[i]

		// Skip waypoints - they have no cargo (unless it's the final stop for pickup delivery)
		const isFinalStop = i === route.length - 1
		const isPickupDeliveryStop =
			isFinalStop &&
			pickupContractIndices.length > 0 &&
			location === pickupDeliveryLocation

		if (isWaypoint(location) && !isPickupDeliveryStop) {
			continue
		}

		// Check if this is the final stop (origin for closed loop, endLocation for open path)
		if (isFinalStop && (location === origin || location === endLocation)) {
			// For pickup contracts, this is where all picked-up cargo is delivered
			if (
				pickupContractIndices.length > 0 &&
				location === pickupDeliveryLocation
			) {
				const allPickupCargo: OptimizedRoute['manifest'][0]['cargo'] = []

				contracts.forEach((contract, contractIndex) => {
					if (contract.contractType === 'pickup') {
						contract.deliveryPoints.forEach((dp, deliveryPointIndex) => {
							dp.cargo.forEach((cargoItem) => {
								allPickupCargo.push({
									cargoType: cargoItem.cargoType,
									quantity: cargoItem.quantity,
									contractIndex,
									deliveryPointIndex,
								})
							})
						})
					}
				})

				if (allPickupCargo.length > 0) {
					manifest.push({
						location: pickupDeliveryLocation,
						type: 'delivery',
						contractIndices: pickupContractIndices,
						cargo: allPickupCargo,
					})
				}
			}

			// If the final stop is also a regular delivery destination, add it too
			if (!isWaypoint(location) && location !== origin) {
				const cargo = destinationCargoMap.get(location) || []
				const contractIndices = Array.from(
					destinationContractsMap.get(location) || [],
				)
				const isPickup = contractIndices.some(
					(idx) => contracts[idx].contractType === 'pickup',
				)

				// Check if we already added this location (as pickup delivery)
				const alreadyAdded = manifest.some(
					(m) =>
						m.location === location &&
						m.type === (isPickup ? 'pickup' : 'delivery'),
				)

				if (!alreadyAdded) {
					manifest.push({
						location,
						type: isPickup ? 'pickup' : 'delivery',
						contractIndices,
						cargo,
					})
				}
			}

			continue
		}

		// Regular destination stop
		const cargo = destinationCargoMap.get(location) || []
		const contractIndices = Array.from(
			destinationContractsMap.get(location) || [],
		)

		// Determine type based on the contracts that use this location
		const isPickup = contractIndices.some(
			(idx) => contracts[idx].contractType === 'pickup',
		)

		manifest.push({
			location,
			type: isPickup ? 'pickup' : 'delivery',
			contractIndices,
			cargo,
		})
	}

	// Build FILO loading order (excluding waypoints)
	// Get delivery stops from manifest (which already excludes waypoints)
	const deliveryStops = manifest
		.filter((m) => m.type === 'delivery' || m.type === 'pickup')
		.map((m) => m.location)
		// Exclude the final pickup delivery location (origin or endLocation) since
		// that's where we DROP OFF pickup cargo, not where we need to load for delivery
		.filter((loc) => {
			// For pickup contracts in closed loop, origin is where cargo is delivered, not loaded
			// For delivery contracts, we need to load cargo for all delivery destinations
			const manifestEntry = manifest.find((m) => m.location === loc)
			if (!manifestEntry) return false

			// If this is a delivery of pickup cargo (at origin or endLocation), exclude from loading
			if (
				manifestEntry.type === 'delivery' &&
				(loc === origin || loc === endLocation) &&
				manifestEntry.contractIndices.every(
					(idx) => contracts[idx].contractType === 'pickup',
				)
			) {
				return false
			}

			return true
		})

	// For FILO: first loaded = last delivered, so reverse the delivery order
	const loadingOrder: OptimizedRoute['loadingOrder'] = deliveryStops
		.slice()
		.reverse()
		.map((location) => ({
			location,
			contractIndices: Array.from(destinationContractsMap.get(location) || []),
			cargo: destinationCargoMap.get(location) || [],
		}))

	// Calculate total distance
	let totalDistance = 0
	for (let i = 0; i < route.length - 1; i++) {
		try {
			totalDistance += graph.getEdgeWeight(route[i], route[i + 1])
		} catch {
			// Fallback to direct distance if edge weight fails
			try {
				totalDistance += graph.getDirectDistance(route[i], route[i + 1])
			} catch {
				// If all else fails, use a large default
				totalDistance += 1000
			}
		}
	}

	return {
		route,
		manifest,
		loadingOrder,
		totalDistance,
	}
}
