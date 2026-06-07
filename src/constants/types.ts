// @/constants/types.ts

export interface CargoGrid {
	width: number
	length: number
	height: number
	position?: {
		x: number
		y: number
		z: number
	}
	rotation?: {
		x: number
		y: number
		z: number
	}
}

export interface Ship {
	name: string
	cargoGrids: CargoGrid[]
	totalCapacity: number
	modelPath?: string // Optional path to 3D model file (e.g., .glb)
	modelScale?: number
	modelPosition?: {
		x: number
		y: number
		z: number
	}
	modelRotation?: {
		x: number
		y: number
		z: number
	}
}

export interface DeliveryPoint {
	id?: string
	location: string
	quantity: number
	cargo: {
		cargoType: string
		quantity: number
	}[]
}

// Contract model supporting delivery and pickup workflows.
export interface Contract {
	id?: string
	maxContainerSize: number
	origin: string // Can now vary between contracts
	deliveryPoints: DeliveryPoint[]
	payout?: number
	contractType: 'delivery' | 'pickup' // Now required
	pickupLocation?: string // For pickup contracts - where cargo is collected
}

export interface Container {
	size: number
	contractIndex: number
	deliveryIndex: number
	position: {
		x: number
		y: number
		z: number
	}
	rotated: boolean
	gridIndex?: number
	cargoTypeIndex?: number
	isPending?: boolean // True when cargo has not yet been picked up.
	pickupLocation?: string // Pickup source location for this cargo.
}

export enum RouteAlgorithm {
	NEAREST_NEIGHBOR = 'NEAREST_NEIGHBOR',
	A_STAR = 'A_STAR',
}

// Journey configuration used by route optimization.
export interface JourneyConfig {
	startLocation: string
	endLocation: string | null // null = return to start (closed loop)
	contracts: Contract[]
}

// Snapshot of cargo state at a specific point in the route.
export interface CargoSnapshot {
	containers: Container[]
	totalSCU: number
	byDestination: Map<string, number>
}

// Route stop details including operations and cargo state transitions.
export interface RouteStop {
	location: string
	sequenceNumber: number // 1, 2, 3, etc.
	type: 'pickup' | 'delivery' | 'both' // Can pickup AND deliver at same stop
	contractIndices: number[]
	operations: {
		pickups: Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
			destinedFor: string // Where this cargo will be delivered
		}>
		deliveries: Array<{
			cargoType: string
			quantity: number
			contractIndex: number
			deliveryPointIndex: number
			pickedUpFrom: string // Where this cargo was picked up
		}>
	}
	// State before and after this stop
	cargoStateBefore: CargoSnapshot
	cargoStateAfter: CargoSnapshot
}

export type StopStatus = 'idle' | 'in-progress' | 'completed'
