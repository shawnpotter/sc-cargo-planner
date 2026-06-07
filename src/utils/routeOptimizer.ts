// @/utils/routeOptimizer.ts

import {
	Contract,
	RouteAlgorithm,
	RouteStop,
	CargoSnapshot,
} from '@/constants/types'
import { RouteGraph } from '@/utils/graph'
import { locations as fallbackLocations, type Location } from '@/data/locations'
import { NearestNeighborStrategy } from '@/utils/routingStrategies/NearestNeighborStrategy'
import { AStarStrategy } from '@/utils/routingStrategies/AStarStrategy'

export interface OptimizedRoute {
	route: string[] // Full route including waypoints (TRAVEL order)
	stops: RouteStop[] // Detailed stop information in TRAVEL order
	manifest: Array<{
		location: string
		sequenceNumber: number
		type: 'pickup' | 'delivery' | 'both'
		contractIndices: number[]
		cargo: Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
			action: 'pickup' | 'delivery'
			relatedLocation?: string
		}>
	}>
	loadingOrder: Array<{
		location: string
		sequenceNumber: number
		contractIndices: number[]
		cargo: Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
			isPending: boolean
			pickupLocation: string
			deliveryLocation: string
		}>
	}>
	totalDistance: number
}

export interface RouteOptions {
	algorithm?: RouteAlgorithm
	startLocation?: string
	endLocation?: string // null/undefined = return to start (closed loop)
	locations?: Location[]
}

interface LocationOperation {
	location: string
	type: 'pickup' | 'delivery'
	contractIndex: number
	deliveryPointIndex: number
	cargo: Array<{
		cargoType: string
		quantity: number
	}>
	relatedLocation: string
}

/**
 * Build a map of all location operations from contracts
 */
function buildLocationOperations(
	contracts: Contract[],
): Map<string, LocationOperation[]> {
	const operationsMap = new Map<string, LocationOperation[]>()

	contracts.forEach((contract, contractIndex) => {
		if (contract.contractType === 'delivery') {
			const pickupLocation = contract.origin
			if (!operationsMap.has(pickupLocation)) {
				operationsMap.set(pickupLocation, [])
			}

			contract.deliveryPoints.forEach((dp, deliveryPointIndex) => {
				operationsMap.get(pickupLocation)!.push({
					location: pickupLocation,
					type: 'pickup',
					contractIndex,
					deliveryPointIndex,
					cargo: dp.cargo.map((c) => ({
						cargoType: c.cargoType,
						quantity: c.quantity,
					})),
					relatedLocation: dp.location,
				})

				const deliveryLocation = dp.location
				if (!operationsMap.has(deliveryLocation)) {
					operationsMap.set(deliveryLocation, [])
				}

				operationsMap.get(deliveryLocation)!.push({
					location: deliveryLocation,
					type: 'delivery',
					contractIndex,
					deliveryPointIndex,
					cargo: dp.cargo.map((c) => ({
						cargoType: c.cargoType,
						quantity: c.quantity,
					})),
					relatedLocation: pickupLocation,
				})
			})
		} else if (contract.contractType === 'pickup') {
			const deliveryLocation = contract.origin

			contract.deliveryPoints.forEach((dp, deliveryPointIndex) => {
				const pickupLocation = contract.pickupLocation || dp.location

				if (!operationsMap.has(pickupLocation)) {
					operationsMap.set(pickupLocation, [])
				}

				operationsMap.get(pickupLocation)!.push({
					location: pickupLocation,
					type: 'pickup',
					contractIndex,
					deliveryPointIndex,
					cargo: dp.cargo.map((c) => ({
						cargoType: c.cargoType,
						quantity: c.quantity,
					})),
					relatedLocation: deliveryLocation,
				})

				if (!operationsMap.has(deliveryLocation)) {
					operationsMap.set(deliveryLocation, [])
				}

				operationsMap.get(deliveryLocation)!.push({
					location: deliveryLocation,
					type: 'delivery',
					contractIndex,
					deliveryPointIndex,
					cargo: dp.cargo.map((c) => ({
						cargoType: c.cargoType,
						quantity: c.quantity,
					})),
					relatedLocation: pickupLocation,
				})
			})
		}
	})

	return operationsMap
}

/**
 * Determine start location from contracts or user preference
 */
function determineStartLocation(
	contracts: Contract[],
	userStartLocation?: string,
): string {
	if (userStartLocation) {
		return userStartLocation
	}

	const firstDelivery = contracts.find((c) => c.contractType === 'delivery')
	if (firstDelivery) {
		return firstDelivery.origin
	}

	const firstPickup = contracts.find((c) => c.contractType === 'pickup')
	if (firstPickup) {
		return (
			firstPickup.pickupLocation ||
			firstPickup.deliveryPoints[0]?.location ||
			''
		)
	}

	return ''
}

interface ParsedRouteOptions {
	algorithm: RouteAlgorithm
	startLocation: string | undefined
	endLocation: string | undefined
	locations: Location[] | undefined
}

function parseRouteOptions(
	optionsOrAlgorithm: RouteAlgorithm | RouteOptions,
): ParsedRouteOptions {
	if (typeof optionsOrAlgorithm === 'object') {
		return {
			algorithm:
				optionsOrAlgorithm.algorithm ?? RouteAlgorithm.NEAREST_NEIGHBOR,
			startLocation: optionsOrAlgorithm.startLocation,
			endLocation: optionsOrAlgorithm.endLocation,
			locations: optionsOrAlgorithm.locations,
		}
	}

	return {
		algorithm: optionsOrAlgorithm,
		startLocation: undefined,
		endLocation: undefined,
		locations: undefined,
	}
}

function normalizeSystemName(value?: string): string | undefined {
	if (!value) return undefined
	const trimmed = value.trim()
	if (!trimmed) return undefined
	return trimmed.toLowerCase()
}

function isGatewayLocation(location: Location): boolean {
	return location.type === 'GATEWAY' || /gateway/i.test(location.name)
}

function getGatewayTargetSystem(locationName: string): string | undefined {
	const match = locationName.match(/([A-Za-z]+)\s+Gateway/i)
	return normalizeSystemName(match?.[1])
}

function resolveLocationSystem(
	location: Location,
	locationByName: Map<string, Location>,
	memo: Map<string, string | undefined>,
): string | undefined {
	if (memo.has(location.name)) {
		return memo.get(location.name)
	}

	const explicitSystem = normalizeSystemName(location.system)
	if (explicitSystem) {
		memo.set(location.name, explicitSystem)
		return explicitSystem
	}

	if (location.type === 'STAR') {
		const starSystem = normalizeSystemName(location.name)
		memo.set(location.name, starSystem)
		return starSystem
	}

	if (location.parentObject) {
		const parent = locationByName.get(location.parentObject)
		if (parent) {
			const parentSystem = resolveLocationSystem(parent, locationByName, memo)
			memo.set(location.name, parentSystem)
			return parentSystem
		}
	}

	memo.set(location.name, undefined)
	return undefined
}

function canConnectLocations(
	from: Location,
	to: Location,
	locationByName: Map<string, Location>,
	systemMemo: Map<string, string | undefined>,
): boolean {
	const fromSystem = resolveLocationSystem(from, locationByName, systemMemo)
	const toSystem = resolveLocationSystem(to, locationByName, systemMemo)

	// Preserve existing behavior when systems are not known.
	if (!fromSystem || !toSystem) {
		return true
	}

	if (fromSystem === toSystem) {
		return true
	}

	if (!isGatewayLocation(from) || !isGatewayLocation(to)) {
		return false
	}

	// Interstellar edges are only valid between paired gateways,
	// e.g. "Nyx Gateway" in Stanton <-> "Stanton Gateway" in Nyx.
	const fromTargetSystem = getGatewayTargetSystem(from.name)
	const toTargetSystem = getGatewayTargetSystem(to.name)

	return fromTargetSystem === toSystem && toTargetSystem === fromSystem
}

function buildGraph(graphLocations: Location[]): RouteGraph {
	const graph = new RouteGraph(graphLocations)
	const locationByName = new Map(graphLocations.map((location) => [location.name, location]))
	const systemMemo = new Map<string, string | undefined>()

	graphLocations.forEach((location) => {
		graph.addNode(location)
	})

	graphLocations.forEach((from) => {
		graphLocations.forEach((to) => {
			if (
				from.name !== to.name &&
				canConnectLocations(from, to, locationByName, systemMemo)
			) {
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

	return graph
}

function findRouteWithFallback(
	origin: string,
	uniqueLocations: string[],
	isClosedLoop: boolean,
	endLocation: string | undefined,
	strategy: AStarStrategy | NearestNeighborStrategy,
	graph: RouteGraph,
): string[] {
	let route: string[]

	try {
		if (isClosedLoop) {
			route = strategy.findRoute(origin, uniqueLocations, graph)
			if (route.at(-1) !== origin) {
				route.push(origin)
			}
			return route
		}

		const isEndLocationInRoute = uniqueLocations.includes(endLocation!)
		if (isEndLocationInRoute) {
			const otherLocations = uniqueLocations.filter((l) => l !== endLocation)
			route = strategy.findRoute(origin, otherLocations, graph)

			const pathToEnd = strategy.findRoute(route.at(-1)!, [endLocation!], graph)
			route.push(...pathToEnd.slice(1))
			return route
		}

		route = strategy.findRoute(origin, uniqueLocations, graph)
		const pathToEnd = strategy.findRoute(route.at(-1)!, [endLocation!], graph)
		route.push(...pathToEnd.slice(1))
		return route
	} catch (error) {
		console.error('Failed to find optimal route:', error)
		route = [origin, ...uniqueLocations]
		if (isClosedLoop) {
			if (route.at(-1) !== origin) {
				route.push(origin)
			}
		} else if (!route.includes(endLocation!)) {
			route.push(endLocation!)
		}
		return route
	}
}

function cloneCargoState(cargoState: CargoSnapshot): CargoSnapshot {
	return {
		containers: [...cargoState.containers],
		totalSCU: cargoState.totalSCU,
		byDestination: new Map(cargoState.byDestination),
	}
}

/**
 * Builds stops and manifest by walking the route in travel order.
 * Assigns sequenceNumber in ascending travel order (1, 2, 3, …).
 */
function buildStopsAndManifest(
	route: string[],
	operationsMap: Map<string, LocationOperation[]>,
): {
	stops: RouteStop[]
	manifest: OptimizedRoute['manifest']
	sequenceNumber: number
} {
	const stops: RouteStop[] = []
	const manifest: OptimizedRoute['manifest'] = []
	const actionableRoute = route.filter((loc) => operationsMap.has(loc))
	const totalVisitsByLocation = new Map<string, number>()
	actionableRoute.forEach((loc) => {
		totalVisitsByLocation.set(loc, (totalVisitsByLocation.get(loc) ?? 0) + 1)
	})
	const currentVisitByLocation = new Map<string, number>()
	const currentCargoState: CargoSnapshot = {
		containers: [],
		totalSCU: 0,
		byDestination: new Map(),
	}

	let sequenceNumber = 0
	const isWaypoint = (loc: string) => !operationsMap.has(loc)

	for (const location of route) {
		if (isWaypoint(location)) {
			continue
		}

		const totalVisits = totalVisitsByLocation.get(location) ?? 1
		const currentVisit = (currentVisitByLocation.get(location) ?? 0) + 1
		currentVisitByLocation.set(location, currentVisit)

		const operations = operationsMap.get(location) || []
		const includePickups = totalVisits === 1 || currentVisit === 1
		const includeDeliveries = totalVisits === 1 || currentVisit === totalVisits

		const pickupOps = includePickups
			? operations.filter((op) => op.type === 'pickup')
			: []
		const deliveryOps = includeDeliveries
			? operations.filter((op) => op.type === 'delivery')
			: []

		if (pickupOps.length === 0 && deliveryOps.length === 0) {
			continue
		}

		sequenceNumber++

		let stopType: 'pickup' | 'delivery' | 'both' = 'delivery'
		if (pickupOps.length > 0 && deliveryOps.length > 0) {
			stopType = 'both'
		} else if (pickupOps.length > 0) {
			stopType = 'pickup'
		}

		const contractIndices = Array.from(
			new Set(operations.map((op) => op.contractIndex)),
		)

		const pickups = pickupOps.flatMap((op) =>
			op.cargo.map((c) => ({
				cargoType: c.cargoType,
				quantity: c.quantity,
				contractIndex: op.contractIndex,
				deliveryPointIndex: op.deliveryPointIndex,
				destinedFor: op.relatedLocation,
			})),
		)

		const deliveries = deliveryOps.flatMap((op) =>
			op.cargo.map((c) => ({
				cargoType: c.cargoType,
				quantity: c.quantity,
				contractIndex: op.contractIndex,
				deliveryPointIndex: op.deliveryPointIndex,
				pickedUpFrom: op.relatedLocation,
			})),
		)

		const cargoStateBefore = cloneCargoState(currentCargoState)

		let newTotalSCU = currentCargoState.totalSCU
		deliveries.forEach((d) => {
			newTotalSCU -= d.quantity
		})

		pickups.forEach((p) => {
			newTotalSCU += p.quantity
			const dest = p.destinedFor
			currentCargoState.byDestination.set(
				dest,
				(currentCargoState.byDestination.get(dest) || 0) + p.quantity,
			)
		})

		currentCargoState.totalSCU = newTotalSCU
		const cargoStateAfter = cloneCargoState(currentCargoState)

		stops.push({
			location,
			sequenceNumber,
			type: stopType,
			contractIndices,
			operations: {
				pickups,
				deliveries,
			},
			cargoStateBefore,
			cargoStateAfter,
		})

		const manifestCargo = [
			...pickups.map((p) => ({
				cargoType: p.cargoType,
				quantity: p.quantity,
				contractIndex: p.contractIndex,
				deliveryPointIndex: p.deliveryPointIndex,
				action: 'pickup' as const,
				relatedLocation: p.destinedFor,
			})),
			...deliveries.map((d) => ({
				cargoType: d.cargoType,
				quantity: d.quantity,
				contractIndex: d.contractIndex,
				deliveryPointIndex: d.deliveryPointIndex,
				action: 'delivery' as const,
				relatedLocation: d.pickedUpFrom,
			})),
		]

		manifest.push({
			location,
			sequenceNumber,
			type: stopType,
			contractIndices,
			cargo: manifestCargo,
		})
	}

	return { stops, manifest, sequenceNumber }
}

/**
 * Gets the delivery sequence number for a specific cargo item.
 * Used by FILO sorting to determine physical container placement order.
 */
function getDeliverySequence(
	stops: RouteStop[],
	contractIndex: number,
	deliveryPointIndex: number,
): number {
	const deliveryStop = stops.find((s) =>
		s.operations.deliveries.some(
			(d) =>
				d.contractIndex === contractIndex &&
				d.deliveryPointIndex === deliveryPointIndex,
		),
	)

	return deliveryStop?.sequenceNumber || 0
}

/**
 * Builds the loading order for physical container placement.
 *
 * This uses FILO (First In, Last Out) sorting: containers that will be
 * delivered LAST are placed FIRST (deepest in the hold), so containers
 * delivered FIRST are on top / at the front for easy access.
 *
 * This ordering only affects grid placement — the RouteChecklist uses
 * the stops array (travel order) for display.
 */
function buildLoadingOrder(stops: RouteStop[]): OptimizedRoute['loadingOrder'] {
	const loadingOrder: OptimizedRoute['loadingOrder'] = []

	stops.forEach((stop) => {
		if (stop.operations.pickups.length === 0) {
			return
		}

		const pickupSequence = stop.sequenceNumber

		stop.operations.pickups.forEach((pickup) => {
			const existingEntry = loadingOrder.find(
				(lo) =>
					lo.location === stop.location && lo.sequenceNumber === pickupSequence,
			)

			const cargoEntry = {
				cargoType: pickup.cargoType,
				quantity: pickup.quantity,
				contractIndex: pickup.contractIndex,
				deliveryPointIndex: pickup.deliveryPointIndex,
				isPending: false,
				pickupLocation: stop.location,
				deliveryLocation: pickup.destinedFor,
			}

			if (existingEntry) {
				existingEntry.cargo.push(cargoEntry)
				if (!existingEntry.contractIndices.includes(pickup.contractIndex)) {
					existingEntry.contractIndices.push(pickup.contractIndex)
				}
			} else {
				loadingOrder.push({
					location: stop.location,
					sequenceNumber: pickupSequence,
					contractIndices: [pickup.contractIndex],
					cargo: [cargoEntry],
				})
			}
		})
	})

	// FILO sort: cargo delivered LAST gets placed FIRST (back/bottom of hold)
	// so cargo delivered FIRST is accessible at front/top.
	loadingOrder.sort((a, b) => {
		const aMaxDelivery = Math.max(
			...a.cargo.map((c) =>
				getDeliverySequence(stops, c.contractIndex, c.deliveryPointIndex),
			),
		)

		const bMaxDelivery = Math.max(
			...b.cargo.map((c) =>
				getDeliverySequence(stops, c.contractIndex, c.deliveryPointIndex),
			),
		)

		return bMaxDelivery - aMaxDelivery
	})

	// Within each loading stop, sort individual cargo items so that
	// later-delivered cargo is placed first (deeper in the hold)
	loadingOrder.forEach((entry) => {
		entry.cargo.sort((a, b) => {
			const aDeliverySeq = getDeliverySequence(
				stops,
				a.contractIndex,
				a.deliveryPointIndex,
			)
			const bDeliverySeq = getDeliverySequence(
				stops,
				b.contractIndex,
				b.deliveryPointIndex,
			)
			return bDeliverySeq - aDeliverySeq
		})
	})

	return loadingOrder
}

function calculateTotalDistance(route: string[], graph: RouteGraph): number {
	let totalDistance = 0

	for (let i = 0; i < route.length - 1; i++) {
		try {
			totalDistance += graph.getEdgeWeight(route[i], route[i + 1])
		} catch {
			try {
				totalDistance += graph.getDirectDistance(route[i], route[i + 1])
			} catch {
				totalDistance += 1000
			}
		}
	}

	return totalDistance
}

/**
 * Optimize delivery routes for contracts with support for multiple origins.
 *
 * The returned `stops` array is always in TRAVEL order (the order the user
 * should visit each location). The `loadingOrder` array is separately sorted
 * in FILO order for optimal physical container placement on the cargo grid.
 *
 * @param contracts - Array of contracts (can have different origins)
 * @param optionsOrAlgorithm - RouteOptions or legacy RouteAlgorithm enum
 * @returns OptimizedRoute with detailed stop information and cargo states
 */
export const optimizeRoute = (
	contracts: Contract[],
	optionsOrAlgorithm:
		| RouteAlgorithm
		| RouteOptions = RouteAlgorithm.NEAREST_NEIGHBOR,
): OptimizedRoute => {
	const { algorithm, startLocation, endLocation, locations } =
		parseRouteOptions(optionsOrAlgorithm)

	if (contracts.length === 0) {
		return {
			route: [],
			stops: [],
			manifest: [],
			loadingOrder: [],
			totalDistance: 0,
		}
	}

	const origin = determineStartLocation(contracts, startLocation)
	if (!origin) {
		throw new Error('Cannot determine start location from contracts')
	}

	const isClosedLoop = !endLocation || endLocation === origin

	const operationsMap = buildLocationOperations(contracts)
	const uniqueLocations = Array.from(operationsMap.keys()).filter(
		(loc) => loc !== origin,
	)

	const graph = buildGraph(locations ?? fallbackLocations)

	const strategy =
		algorithm === RouteAlgorithm.A_STAR
			? new AStarStrategy()
			: new NearestNeighborStrategy()

	// This route is in TRAVEL order — the efficient path through all locations
	const route = findRouteWithFallback(
		origin,
		uniqueLocations,
		isClosedLoop,
		endLocation,
		strategy,
		graph,
	)

	// Stops are built by walking the route in travel order,
	// sequenceNumber is assigned 1, 2, 3, … in travel order
	const { stops, manifest } = buildStopsAndManifest(route, operationsMap)

	// Loading order is FILO-sorted separately for container grid placement
	const loadingOrder = buildLoadingOrder(stops)

	const totalDistance = calculateTotalDistance(route, graph)

	return {
		route,
		stops,
		manifest,
		loadingOrder,
		totalDistance,
	}
}
