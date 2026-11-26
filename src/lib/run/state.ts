import type { Container, Contract, DeliveryPoint, Ship, StopStatus } from '@/constants/types'
import { HaulingMode } from '@/utils/calculateContainers'
import type { OptimizedRoute } from '@/utils/routeOptimizer'

export type RouteType = 'loop' | 'path'
export type PlanStatus = 'none' | 'ready' | 'outdated'
export type DeliveryDraft = Omit<DeliveryPoint, 'id' | 'cargo'> & {
	cargo: Array<DeliveryPoint['cargo'][number] & { id?: string }>
}
export interface CrewMember {
	id: string
	name: string
	share: number
}

export interface RunState {
	selectedShip: Ship | null
	haulingMode: HaulingMode
	routeType: RouteType
	startLocation: string | null
	endLocation: string | null
	contracts: Contract[]
	currentContract: Partial<Contract>
	deliveryDraft: DeliveryDraft
	containers: Container[]
	optimizedRoute: OptimizedRoute | null
	planStatus: PlanStatus
	stopStatuses: Record<string, StopStatus>
	crewMembers: CrewMember[]
	manualPayout: number
}

export function createInitialContractState(): Partial<Contract> {
	return { maxContainerSize: 4, origin: '', deliveryPoints: [], payout: 0, contractType: 'delivery' }
}

export function createInitialDeliveryDraft(): DeliveryDraft {
	return { location: '', cargo: [], quantity: 0 }
}

export function createInitialRun(): RunState {
	return {
		selectedShip: null,
		haulingMode: HaulingMode.CONTRACT,
		routeType: 'loop',
		startLocation: null,
		endLocation: null,
		contracts: [],
		currentContract: createInitialContractState(),
		deliveryDraft: createInitialDeliveryDraft(),
		containers: [],
		optimizedRoute: null,
		planStatus: 'none',
		stopStatuses: {},
		crewMembers: [],
		manualPayout: 0,
	}
}

export function getNextStatus(current: StopStatus): StopStatus {
	switch (current) {
		case 'idle': return 'in-progress'
		case 'in-progress': return 'completed'
		case 'completed': return 'idle'
	}
}

export function markPlanOutdated(run: RunState): RunState {
	return run.optimizedRoute ? { ...run, planStatus: 'outdated' } : run
}

export function createId(): string {
	return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function identifyContract(contract: Contract): Contract {
	return {
		...contract,
		id: contract.id || createId(),
		deliveryPoints: contract.deliveryPoints.map((point) => ({ ...point, id: point.id || createId() })),
	}
}

// Compare values rather than object identity, including drafts copied into the editor.
export function contractsEqual(a: Partial<Contract>, b: Partial<Contract>): boolean {
	function fields(contract: Partial<Contract>) {
		return {
			id: contract.id, origin: contract.origin ?? '', maxContainerSize: contract.maxContainerSize ?? 4,
			payout: contract.payout ?? 0, contractType: contract.contractType ?? 'delivery', pickupLocation: contract.pickupLocation ?? '',
			deliveryPoints: (contract.deliveryPoints ?? []).map((point) => ({
				location: point.location, quantity: point.quantity,
				cargo: point.cargo.map((entry) => ({ cargoType: entry.cargoType, quantity: entry.quantity })),
			})),
		}
	}
	return JSON.stringify(fields(a)) === JSON.stringify(fields(b))
}
