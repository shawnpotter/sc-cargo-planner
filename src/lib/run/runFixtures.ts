import type { Container, Contract, RouteStop } from '@/constants/types'
import { ships } from '@/data/ships'
import type { OptimizedRoute } from '@/utils/routeOptimizer'
import { createInitialRun, type RunState } from './state'

export function fixtureContract(): Contract {
	return { id: 'contract-1', origin: 'A', maxContainerSize: 4, payout: 1200, contractType: 'delivery', deliveryPoints: [
		{ id: 'delivery-1', location: 'B', quantity: 2, cargo: [{ cargoType: 'Ore', quantity: 2 }] },
	] }
}
export function fixtureContainer(): Container {
	return { id: 'cargo-1', pickupStopId: '1:A', deliveryStopId: '2:B', size: 2, contractIndex: 0, deliveryIndex: 0,
		cargoTypeIndex: 0, gridIndex: 0, position: { x: 1, y: 0, z: 2 }, rotated: false, isPending: true, pickupLocation: 'A' }
}
export function fixtureRoute(): OptimizedRoute {
	const container = fixtureContainer()
	const empty = () => ({ containers: [], totalSCU: 0, byDestination: new Map<string, number>() })
	const loaded = () => ({ containers: [container], totalSCU: 2, byDestination: new Map([['B', 2]]) })
	const stops: RouteStop[] = [
		{ location: 'A', sequenceNumber: 1, type: 'pickup', contractIndices: [0], operations: {
			pickups: [{ cargoType: 'Ore', quantity: 2, contractIndex: 0, deliveryPointIndex: 0, cargoTypeIndex: 0, destinedFor: 'B' }], deliveries: [],
		}, cargoStateBefore: empty(), cargoStateAfter: loaded() },
		{ location: 'B', sequenceNumber: 2, type: 'delivery', contractIndices: [0], operations: {
			pickups: [], deliveries: [{ cargoType: 'Ore', quantity: 2, contractIndex: 0, deliveryPointIndex: 0, cargoTypeIndex: 0, pickedUpFrom: 'A' }],
		}, cargoStateBefore: loaded(), cargoStateAfter: empty() },
		{ location: 'A', sequenceNumber: 3, type: 'pickup', contractIndices: [], operations: { pickups: [], deliveries: [] }, cargoStateBefore: empty(), cargoStateAfter: empty() },
	]
	return { route: ['A', 'B', 'A'], stops, totalDistance: 25,
		manifest: [{ location: 'A', sequenceNumber: 1, type: 'pickup', contractIndices: [0], cargo: [
			{ cargoType: 'Ore', quantity: 2, contractIndex: 0, deliveryPointIndex: 0, cargoTypeIndex: 0, action: 'pickup', relatedLocation: 'B' },
		] }], loadingOrder: [{ location: 'A', sequenceNumber: 1, contractIndices: [0], cargo: [
			{ cargoType: 'Ore', quantity: 2, contractIndex: 0, deliveryPointIndex: 0, cargoTypeIndex: 0, isPending: true, pickupLocation: 'A', deliveryLocation: 'B' },
		] }],
	}
}
export function fixtureRun(): RunState {
	return { ...createInitialRun(), selectedShip: ships[0], contracts: [fixtureContract()], currentContract: { ...fixtureContract(), payout: 1800 },
		deliveryDraft: { location: 'C', quantity: 5, cargo: [{ id: 'unfinished-cargo', cargoType: 'Medical Supplies', quantity: 5 }] },
		containers: [fixtureContainer()], optimizedRoute: fixtureRoute(), planStatus: 'ready',
		stopStatuses: { '1:A': 'completed', '2:B': 'in-progress', '3:A': 'idle' },
		crewMembers: [{ id: 'pilot', name: 'Pilot', share: 60 }, { id: 'loader', name: 'Loader', share: 40 }], manualPayout: 2200,
		startLocation: 'A', endLocation: 'B', routeType: 'path' }
}
