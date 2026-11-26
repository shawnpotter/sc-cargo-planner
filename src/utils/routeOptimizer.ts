import { Contract, Container, RouteAlgorithm, RouteStop, CargoSnapshot } from '@/constants/types'
import { RouteGraph } from '@/utils/graph'
import { locations as fallbackLocations, type Location } from '@/data/locations'
import { calculateOptimalContainerSize, HaulingMode } from '@/utils/calculateContainers'
import { getStopId } from '@/utils/stopIdentity'

export interface OptimizedRoute {
	route: string[]
	stops: RouteStop[]
	manifest: Array<{
		location: string
		sequenceNumber: number
		type: RouteStop['type']
		contractIndices: number[]
		cargo: Array<{
			cargoType: string
			cargoTypeIndex?: number
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
			cargoTypeIndex?: number
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
	endLocation?: string
	locations?: Location[]
	/** Optional ship bound used to choose deliveries before otherwise overfull pickups. */
	cargoCapacity?: number
}

interface CargoTask {
	contractIndex: number
	deliveryPointIndex: number
	cargoTypeIndex: number
	cargoType: string
	quantity: number
	pickup: string
	delivery: string
	state: 'waiting' | 'onboard' | 'delivered'
}

/** Project solver tasks into public cargo fields before building a persisted plan. */
function cargoOperation(task: Pick<CargoTask, 'contractIndex' | 'deliveryPointIndex' | 'cargoTypeIndex' | 'cargoType' | 'quantity'>) {
	return {
		contractIndex: task.contractIndex,
		deliveryPointIndex: task.deliveryPointIndex,
		cargoTypeIndex: task.cargoTypeIndex,
		cargoType: task.cargoType,
		quantity: task.quantity,
	}
}

export function createCargoSnapshot(containers: Container[], contracts: Contract[]): CargoSnapshot {
	const byDestination = new Map<string, number>()
	for (const container of containers) {
		const contract = contracts[container.contractIndex]
		const destination = contract.contractType === 'pickup'
			? contract.origin : contract.deliveryPoints[container.deliveryIndex].location
		byDestination.set(destination, (byDestination.get(destination) ?? 0) + container.size)
	}
	return {
		containers: containers.map((container) => ({ ...container, position: { ...container.position } })),
		totalSCU: containers.reduce((sum, container) => sum + container.size, 0),
		byDestination,
	}
}

function createTasks(contracts: Contract[]): CargoTask[] {
	return contracts.flatMap((contract, contractIndex) =>
		contract.deliveryPoints.flatMap((point, deliveryPointIndex) =>
			point.cargo.map((cargo, cargoTypeIndex) => ({
				contractIndex, deliveryPointIndex, cargoTypeIndex,
				cargoType: cargo.cargoType, quantity: cargo.quantity,
				pickup: contract.contractType === 'pickup' ? contract.pickupLocation || point.location : contract.origin,
				delivery: contract.contractType === 'pickup' ? contract.origin : point.location,
				state: 'waiting' as const,
			})),
		),
	)
}
function normalizeSystemName(value?: string): string | undefined {
	if (!value) return undefined
	const trimmed = value.trim()
	if (!trimmed) return undefined
	return trimmed.toLowerCase()
}

function isGatewayLocation(location: Location): boolean {
	return location.type === 'GATEWAY' || /gateway|jump\s+point/i.test(location.name)
}

function getGatewayTargetSystem(locationName: string, owningSystem: string): string | undefined {
	const match = locationName.match(/([A-Za-z]+)\s+Gateway/i)
	if (match) return normalizeSystemName(match[1])
	const jump = locationName.match(/^\s*([A-Za-z]+)\s*-\s*([A-Za-z]+)\s+Jump\s+Point\s*$/i)
	if (!jump) return undefined
	const first = normalizeSystemName(jump[1])
	const second = normalizeSystemName(jump[2])
	return owningSystem === first ? second : owningSystem === second ? first : undefined
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
	const fromTargetSystem = getGatewayTargetSystem(from.name, fromSystem)
	const toTargetSystem = getGatewayTargetSystem(to.name, toSystem)

	return fromTargetSystem === toSystem && toTargetSystem === fromSystem
}

/**
 * Same-system travel has direct metric edges, so unrelated POIs cannot shorten
 * a leg. Keep required visits, gateway transitions, and their parent constraints.
 */
function selectGraphLocations(locations: Location[], requiredLocations: Set<string>): Location[] {
	const locationByName = new Map(locations.map((location) => [location.name, location]))
	const retained = new Set(requiredLocations)
	for (const location of locations) {
		if (isGatewayLocation(location)) retained.add(location.name)
	}
	// Set iteration also visits newly added ancestors, once each, including cycles.
	for (const name of retained) {
		const parent = locationByName.get(name)?.parentObject
		if (parent && locationByName.has(parent)) retained.add(parent)
	}
	return locations.filter((location) => retained.has(location.name))
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

/** Shortest graph path with explicit failure; never invents a direct connection. */
function findPath(from: string, to: string, graph: RouteGraph, travel: string[], algorithm?: RouteAlgorithm): string[] | null {
	if (from === to) return [from]
	const distances = new Map([[from, 0]])
	const paths = new Map<string, string[]>([[from, [from]]])
	const open = new Set([from])
	const closed = new Set<string>()
	while (open.size) {
		const score = (node: string) => (distances.get(node) ?? Infinity) +
			(algorithm === RouteAlgorithm.A_STAR ? graph.getDirectDistance(node, to) : 0)
		const current = [...open].reduce((best, node) =>
			score(node) < score(best) ? node : best,
		)
		const path = paths.get(current) ?? [current]
		if (current === to) return path
		open.delete(current)
		closed.add(current)
		for (const neighbor of graph.getNeighbors(current)) {
			if (closed.has(neighbor) || !graph.canVisit(current, neighbor, [...travel, ...path])) continue
			const distance = (distances.get(current) ?? Infinity) + graph.getEdgeWeight(current, neighbor)
			if (distance < (distances.get(neighbor) ?? Infinity)) {
				distances.set(neighbor, distance)
				paths.set(neighbor, [...path, neighbor])
				open.add(neighbor)
			}
		}
	}
	return null
}

function pathDistance(path: string[], graph: RouteGraph): number {
	return path.slice(1).reduce((sum, location, index) => sum + (path[index] === location ? 0 : graph.getEdgeWeight(path[index], location)), 0)
}

/** The greedy visit choice is bounded by the number of cargo operations. */
export const optimizeRoute = (
	contracts: Contract[],
	optionsOrAlgorithm: RouteAlgorithm | RouteOptions = RouteAlgorithm.NEAREST_NEIGHBOR,
): OptimizedRoute => {
	const options = typeof optionsOrAlgorithm === 'object' ? optionsOrAlgorithm : { algorithm: optionsOrAlgorithm }
	if (!contracts.length) return { route: [], stops: [], manifest: [], loadingOrder: [], totalDistance: 0 }
	for (const [contractIndex, contract] of contracts.entries()) {
		if (!contract.deliveryPoints.length || contract.deliveryPoints.some((point) => !point.cargo.length || point.quantity !== point.cargo.reduce((sum, cargo) => sum + cargo.quantity, 0))) {
			throw new Error(`Contract ${contractIndex + 1}: add cargo and make the destination quantity match its cargo total.`)
		}
	}
	const tasks = createTasks(contracts)
	if (!tasks.length) throw new Error('Add cargo to at least one contract before planning.')
	for (const task of tasks) {
		if (!task.cargoType.trim() || !Number.isSafeInteger(task.quantity) || task.quantity <= 0) {
			throw new Error(`Contract ${task.contractIndex + 1}: cargo must have a name and a positive whole SCU quantity.`)
		}
		if (contracts[task.contractIndex].maxContainerSize < 1 || !Number.isFinite(contracts[task.contractIndex].maxContainerSize)) {
			throw new Error(`Contract ${task.contractIndex + 1}: choose a container limit of at least 1 SCU.`)
		}
	}
	const origin = options.startLocation || contracts.find((contract) => contract.contractType === 'delivery')?.origin || tasks[0].pickup
	const endpoint = options.endLocation || origin
	const graphLocations = options.locations ?? fallbackLocations
	const names = new Set(graphLocations.map((location) => location.name))
	const seenNames = new Set<string>()
	const ambiguousNames = new Set<string>()
	for (const location of graphLocations) {
		if (seenNames.has(location.name)) ambiguousNames.add(location.name)
		seenNames.add(location.name)
	}
	// A child cannot safely resolve its system or planetary constraints through an ambiguous parent.
	let addedAmbiguity = ambiguousNames.size > 0
	while (addedAmbiguity) {
		addedAmbiguity = false
		for (const location of graphLocations) {
			if (location.parentObject && ambiguousNames.has(location.parentObject) && !ambiguousNames.has(location.name)) {
				ambiguousNames.add(location.name)
				addedAmbiguity = true
			}
		}
	}
	const requiredLocations = new Set([origin, endpoint, ...tasks.flatMap((task) => [task.pickup, task.delivery])])
	for (const location of requiredLocations) {
		if (!names.has(location)) throw new Error(`Location "${location || '(empty)'}" is missing from map data. Correct the location or reload map data.`)
		if (ambiguousNames.has(location)) throw new Error(`Location "${location}" is ambiguous in map data: its name or a parent name is shared by multiple locations. Choose a uniquely named location or reload map data.`)
	}
	const graph = buildGraph(selectGraphLocations(graphLocations.filter((location) => !ambiguousNames.has(location.name)), requiredLocations))
	const route = [origin]
	const stops: RouteStop[] = []
	const manifest: OptimizedRoute['manifest'] = []
	const loadingOrder: OptimizedRoute['loadingOrder'] = []
	let onboard: Container[] = []

	const visit = (location: string) => {
		const delivering = tasks.filter((task) => task.state === 'onboard' && task.delivery === location)
		const pickingUp = tasks.filter((task) => task.state === 'waiting' && task.pickup === location)
		if (!delivering.length && !pickingUp.length) return
		const sequenceNumber = stops.length + 1
		const stopId = getStopId({ location, sequenceNumber })
		const cargoStateBefore = createCargoSnapshot(onboard, contracts)
		for (const task of delivering) task.state = 'delivered'
		onboard = onboard.filter((container) => !delivering.some((task) =>
			task.contractIndex === container.contractIndex && task.deliveryPointIndex === container.deliveryIndex && task.cargoTypeIndex === container.cargoTypeIndex,
		))
		const pickups = pickingUp.map((task) => ({ ...cargoOperation(task), destinedFor: task.delivery }))
		for (const task of pickingUp) {
			task.state = 'onboard'
			let remaining = task.quantity
			let index = 0
			while (remaining > 0) {
				const size = calculateOptimalContainerSize(contracts[task.contractIndex].maxContainerSize, remaining, HaulingMode.CONTRACT)
				if (!size) throw new Error(`Cannot select a supported container for ${task.cargoType}.`)
				onboard.push({
					id: `${task.contractIndex}:${task.deliveryPointIndex}:${task.cargoTypeIndex}:${index++}`,
					size, contractIndex: task.contractIndex, deliveryIndex: task.deliveryPointIndex,
					cargoTypeIndex: task.cargoTypeIndex, pickupStopId: stopId,
					pickupLocation: location, isPending: sequenceNumber !== 1,
					position: { x: 0, y: 0, z: 0 }, rotated: false,
				})
				remaining -= size
			}
		}
		const deliveries = delivering.map((task) => ({ ...cargoOperation(task), pickedUpFrom: task.pickup }))
		const type = pickups.length && deliveries.length ? 'both' : pickups.length ? 'pickup' : 'delivery'
		const contractIndices = [...new Set([...pickingUp, ...delivering].map((task) => task.contractIndex))]
		const stop: RouteStop = { location, sequenceNumber, type, contractIndices,
			operations: { pickups, deliveries }, cargoStateBefore, cargoStateAfter: createCargoSnapshot(onboard, contracts) }
		stops.push(stop)
		manifest.push({ location, sequenceNumber, type, contractIndices,
			cargo: [
				...pickups.map((pickup) => ({ ...cargoOperation(pickup), action: 'pickup' as const, relatedLocation: pickup.destinedFor })),
				...deliveries.map((delivery) => ({ ...cargoOperation(delivery), action: 'delivery' as const, relatedLocation: delivery.pickedUpFrom })),
			] })
		if (pickups.length) loadingOrder.push({ location, sequenceNumber, contractIndices: [...new Set(pickups.map((pickup) => pickup.contractIndex))],
			cargo: pickups.map((pickup) => ({ ...cargoOperation(pickup), isPending: sequenceNumber !== 1, pickupLocation: location, deliveryLocation: pickup.destinedFor })) })
	}

	visit(origin)
	while (tasks.some((task) => task.state !== 'delivered')) {
		const current = route[route.length - 1]
		const eligible = [...new Set(tasks.flatMap((task) =>
			task.state === 'waiting' ? [task.pickup] : task.state === 'onboard' ? [task.delivery] : [],
		))]
		const onboardSCU = tasks.filter((task) => task.state === 'onboard').reduce((sum, task) => sum + task.quantity, 0)
		const withinCapacity = eligible.filter((location) => options.cargoCapacity === undefined ||
			onboardSCU - tasks.filter((task) => task.state === 'onboard' && task.delivery === location).reduce((sum, task) => sum + task.quantity, 0) +
			tasks.filter((task) => task.state === 'waiting' && task.pickup === location).reduce((sum, task) => sum + task.quantity, 0) <= options.cargoCapacity)
		if (!withinCapacity.length) throw new Error(`The remaining pickups (${tasks.filter((task) => task.state === 'waiting').map((task) => task.cargoType).join(', ')}) exceed ship capacity. Choose a larger ship or change the contracts.`)
		const candidates = withinCapacity.map((location) => ({ location, path: findPath(current, location, graph, route, options.algorithm) }))
			.filter((candidate): candidate is { location: string; path: string[] } => candidate.path !== null)
		if (!candidates.length) throw new Error(`No connected travel path from "${current}" to ${eligible.map((name) => `"${name}"`).join(', ')}. Check map data and gateway connections.`)
		// Keep a specified endpoint for the final visit when dependencies allow it.
		const intermediate = candidates.filter((candidate) => candidate.location !== endpoint)
		const choices = intermediate.length ? intermediate : candidates
		choices.sort((a, b) => pathDistance(a.path, graph) - pathDistance(b.path, graph))
		const next = choices[0]
		if (next.path.length === 1) { route.push(current); visit(current) }
		else for (const location of next.path.slice(1)) { route.push(location); visit(location) }
	}
	const finalPath = findPath(route[route.length - 1], endpoint, graph, route, options.algorithm)
	if (!finalPath) throw new Error(`No connected travel path to endpoint "${endpoint}". Check map data and gateway connections.`)
	route.push(...finalPath.slice(1))

	// Bind delivery visits and keep logical snapshots exact for route-only callers.
	const deliverySequence = (contractIndex: number, deliveryIndex: number, cargoTypeIndex?: number) =>
		stops.find((stop) => stop.operations.deliveries.some((delivery) => delivery.contractIndex === contractIndex && delivery.deliveryPointIndex === deliveryIndex && delivery.cargoTypeIndex === cargoTypeIndex))
	for (const stop of stops) for (const snapshot of [stop.cargoStateBefore, stop.cargoStateAfter]) {
		for (const container of snapshot.containers) {
			const delivery = deliverySequence(container.contractIndex, container.deliveryIndex, container.cargoTypeIndex)
			if (delivery) container.deliveryStopId = getStopId(delivery)
		}
	}
	for (const load of loadingOrder) load.cargo.sort((a, b) =>
		(deliverySequence(b.contractIndex, b.deliveryPointIndex, b.cargoTypeIndex)?.sequenceNumber ?? 0) - (deliverySequence(a.contractIndex, a.deliveryPointIndex, a.cargoTypeIndex)?.sequenceNumber ?? 0))
	loadingOrder.sort((a, b) => Math.max(...b.cargo.map((cargo) => deliverySequence(cargo.contractIndex, cargo.deliveryPointIndex, cargo.cargoTypeIndex)?.sequenceNumber ?? 0)) - Math.max(...a.cargo.map((cargo) => deliverySequence(cargo.contractIndex, cargo.deliveryPointIndex, cargo.cargoTypeIndex)?.sequenceNumber ?? 0)))
	return { route, stops, manifest, loadingOrder, totalDistance: pathDistance(route, graph) }
}
