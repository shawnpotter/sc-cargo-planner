import type { CargoSnapshot, Container, Contract, DeliveryPoint, RouteStop, StopStatus } from '@/constants/types'
import { ships } from '@/data/ships'
import { HaulingMode } from '@/utils/calculateContainers'
import type { OptimizedRoute } from '@/utils/routeOptimizer'
import { getStopId } from '@/utils/stopIdentity'
import type { CrewMember, DeliveryDraft, RunState } from './state'

export const RUN_STORAGE_KEY = 'cargo-active-run'
export const LEGACY_SHIP_STORAGE_KEY = 'cargo-selected-ship'
export const RUN_SNAPSHOT_VERSION = 1

function invalid(): never { throw new Error('The saved run is unreadable. Reset the saved run to start again.') }
function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
	return value as Record<string, unknown>
}
function text(value: unknown): string { return typeof value === 'string' ? value : invalid() }
function number(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : invalid() }
function index(value: unknown): number {
	const result = number(value)
	return result >= 0 && Number.isInteger(result) ? result : invalid()
}
function nonnegative(value: unknown): number { const result = number(value); return result >= 0 ? result : invalid() }
function boolean(value: unknown): boolean { return typeof value === 'boolean' ? value : invalid() }
function array<T>(value: unknown, parse: (item: unknown) => T): T[] {
	return Array.isArray(value) ? value.map(parse) : invalid()
}
function optional<T>(value: unknown, parse: (item: unknown) => T): T | undefined {
	return value === undefined ? undefined : parse(value)
}
function nullableText(value: unknown): string | null { return value === null ? null : text(value) }
function kind(value: unknown): 'pickup' | 'delivery' | 'both' {
	return value === 'pickup' || value === 'delivery' || value === 'both' ? value : invalid()
}
function contractKind(value: unknown): Contract['contractType'] {
	return value === 'pickup' || value === 'delivery' ? value : invalid()
}
function status(value: unknown): StopStatus {
	return value === 'idle' || value === 'in-progress' || value === 'completed' ? value : invalid()
}
function parseDeliveryDraft(value: unknown): DeliveryDraft {
	const point = object(value)
	return {
		location: text(point.location), quantity: number(point.quantity),
		cargo: array(point.cargo, (value) => { const cargo = object(value); return { id: optional(cargo.id, text), cargoType: text(cargo.cargoType), quantity: number(cargo.quantity) } }),
	}
}
function parsePoint(value: unknown): DeliveryPoint {
	return { ...parseDeliveryDraft(value), id: optional(object(value).id, text) }
}
function parseDraft(value: unknown): Partial<Contract> {
	const draft = object(value)
	return {
		id: optional(draft.id, text), origin: optional(draft.origin, text),
		maxContainerSize: optional(draft.maxContainerSize, number), payout: optional(draft.payout, number),
		contractType: optional(draft.contractType, contractKind), pickupLocation: optional(draft.pickupLocation, text),
		deliveryPoints: optional(draft.deliveryPoints, (value) => array(value, parsePoint)),
	}
}
function parseContract(value: unknown): Contract {
	const contract = object(value)
	return {
		id: text(contract.id), origin: text(contract.origin), maxContainerSize: number(contract.maxContainerSize),
		payout: optional(contract.payout, number), contractType: contractKind(contract.contractType),
		pickupLocation: optional(contract.pickupLocation, text), deliveryPoints: array(contract.deliveryPoints, parsePoint),
	}
}
function parseContainer(value: unknown): Container {
	const container = object(value)
	const position = object(container.position)
	const size = number(container.size)
	if (![1, 2, 4, 8, 16, 24, 32].includes(size)) return invalid()
	return {
		id: optional(container.id, text), pickupStopId: optional(container.pickupStopId, text), deliveryStopId: optional(container.deliveryStopId, text),
		size, contractIndex: index(container.contractIndex), deliveryIndex: index(container.deliveryIndex),
		position: { x: number(position.x), y: number(position.y), z: number(position.z) }, rotated: boolean(container.rotated),
		gridIndex: optional(container.gridIndex, index), cargoTypeIndex: optional(container.cargoTypeIndex, index),
		isPending: optional(container.isPending, boolean), pickupLocation: optional(container.pickupLocation, text),
	}
}
function parseCargoSnapshot(value: unknown): CargoSnapshot {
	const snapshot = object(value)
	const entries = array(snapshot.byDestination, (value): [string, number] => {
		if (!Array.isArray(value) || value.length !== 2) return invalid()
		return [text(value[0]), nonnegative(value[1])]
	})
	const byDestination = new Map(entries)
	if (byDestination.size !== entries.length) return invalid()
	return { containers: array(snapshot.containers, parseContainer), totalSCU: nonnegative(snapshot.totalSCU), byDestination }
}
function parseOperation(value: unknown) {
	const operation = object(value)
	return {
		cargoType: text(operation.cargoType), quantity: nonnegative(operation.quantity),
		contractIndex: index(operation.contractIndex), deliveryPointIndex: index(operation.deliveryPointIndex),
		cargoTypeIndex: optional(operation.cargoTypeIndex, index),
	}
}
function parseStop(value: unknown): RouteStop {
	const stop = object(value)
	const operations = object(stop.operations)
	return {
		location: text(stop.location), sequenceNumber: index(stop.sequenceNumber), type: kind(stop.type),
		contractIndices: array(stop.contractIndices, index),
		operations: {
			pickups: array(operations.pickups, (value) => ({ ...parseOperation(value), destinedFor: text(object(value).destinedFor) })),
			deliveries: array(operations.deliveries, (value) => ({ ...parseOperation(value), pickedUpFrom: text(object(value).pickedUpFrom) })),
		},
		cargoStateBefore: parseCargoSnapshot(stop.cargoStateBefore), cargoStateAfter: parseCargoSnapshot(stop.cargoStateAfter),
	}
}
function parseRoute(value: unknown): OptimizedRoute {
	const route = object(value)
	return {
		route: array(route.route, text), stops: array(route.stops, parseStop), totalDistance: nonnegative(route.totalDistance),
		manifest: array(route.manifest, (value) => {
			const item = object(value)
			return { location: text(item.location), sequenceNumber: index(item.sequenceNumber), type: kind(item.type),
				contractIndices: array(item.contractIndices, index), cargo: array(item.cargo, (value) => ({ ...parseOperation(value),
					action: contractKind(object(value).action), relatedLocation: optional(object(value).relatedLocation, text) })) }
		}),
		loadingOrder: array(route.loadingOrder, (value) => {
			const item = object(value)
			return { location: text(item.location), sequenceNumber: index(item.sequenceNumber), contractIndices: array(item.contractIndices, index),
				cargo: array(item.cargo, (value) => ({ ...parseOperation(value), isPending: boolean(object(value).isPending),
					pickupLocation: text(object(value).pickupLocation), deliveryLocation: text(object(value).deliveryLocation) })) }
		}),
	}
}

function serializeCargo(snapshot: CargoSnapshot) {
	return { ...snapshot, byDestination: [...snapshot.byDestination.entries()] }
}

export function encodeRunSnapshot(run: RunState): string {
	return JSON.stringify({
		version: RUN_SNAPSHOT_VERSION,
		run: {
			...run, selectedShip: undefined, selectedShipName: run.selectedShip?.name ?? null,
			optimizedRoute: run.optimizedRoute ? { ...run.optimizedRoute, stops: run.optimizedRoute.stops.map((stop) => ({ ...stop,
				cargoStateBefore: serializeCargo(stop.cargoStateBefore), cargoStateAfter: serializeCargo(stop.cargoStateAfter),
			})) } : null,
		},
	}, (_, value: unknown) => {
		if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Cannot save a non-finite run value')
		return value
	})
}

export type DecodeRunResult = { success: true; run: RunState } | { success: false; error: string }

export function decodeRunSnapshot(raw: string): DecodeRunResult {
	try {
		const parsed: unknown = JSON.parse(raw)
		const envelope = object(parsed)
		if (envelope.version !== RUN_SNAPSHOT_VERSION) {
			return { success: false, error: 'This saved run uses an unsupported version. Reset the saved run to start again.' }
		}
		const run = object(envelope.run)
		const shipName = nullableText(run.selectedShipName)
		const selectedShip = shipName === null ? null : ships.find((ship) => ship.name === shipName)
		if (selectedShip === undefined) return invalid()
		const haulingMode = run.haulingMode === HaulingMode.CONTRACT || run.haulingMode === HaulingMode.COMMODITY ? run.haulingMode : invalid()
		const routeType = run.routeType === 'loop' || run.routeType === 'path' ? run.routeType : invalid()
		const planStatus = run.planStatus === 'none' || run.planStatus === 'ready' || run.planStatus === 'outdated' ? run.planStatus : invalid()
		const optimizedRoute = run.optimizedRoute === null ? null : parseRoute(run.optimizedRoute)
		const containers = array(run.containers, parseContainer)
		const contracts = array(run.contracts, parseContract)
		const crewMembers = array(run.crewMembers, (value): CrewMember => {
			const crew = object(value); return { id: text(crew.id), name: text(crew.name), share: nonnegative(crew.share) }
		})
		const stopStatuses = Object.fromEntries(Object.entries(object(run.stopStatuses)).map(([key, value]) => [key, status(value)]))
		if (planStatus === 'none' ? optimizedRoute !== null || containers.length > 0 || Object.keys(stopStatuses).length > 0 : !optimizedRoute) return invalid()
		if (planStatus === 'ready' && !selectedShip) return invalid()
		if (new Set(contracts.map((contract) => contract.id)).size !== contracts.length || new Set(crewMembers.map((crew) => crew.id)).size !== crewMembers.length) return invalid()
		if (optimizedRoute) {
			const ids = new Set(optimizedRoute.stops.map(getStopId))
			if (ids.size !== optimizedRoute.stops.length || Object.keys(stopStatuses).some((id) => !ids.has(id))) return invalid()
			let unfinishedVisit = false
			for (const stop of optimizedRoute.stops) {
				const progress = stopStatuses[getStopId(stop)] ?? 'idle'
				if (unfinishedVisit && progress !== 'idle') return invalid()
				if (progress !== 'completed') unfinishedVisit = true
			}
			const planContainers = [containers, ...optimizedRoute.stops.flatMap((stop) => [stop.cargoStateBefore.containers, stop.cargoStateAfter.containers])].flat()
			if (planContainers.some((container) => (planStatus === 'ready' && (container.contractIndex >= contracts.length || container.deliveryIndex >= contracts[container.contractIndex].deliveryPoints.length)) ||
				(container.pickupStopId !== undefined && !ids.has(container.pickupStopId)) || (container.deliveryStopId !== undefined && !ids.has(container.deliveryStopId)))) return invalid()
		}
		return { success: true, run: { selectedShip, haulingMode, routeType, planStatus, optimizedRoute, containers, contracts, crewMembers,
			currentContract: parseDraft(run.currentContract), deliveryDraft: parseDeliveryDraft(run.deliveryDraft), stopStatuses, manualPayout: nonnegative(run.manualPayout),
			startLocation: nullableText(run.startLocation), endLocation: nullableText(run.endLocation) } }
	} catch {
		return { success: false, error: 'The saved run is unreadable. Reset the saved run to start again.' }
	}
}
