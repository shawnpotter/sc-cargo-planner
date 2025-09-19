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

export interface Contract {
	id?: string
	maxContainerSize: number
	origin: string
	deliveryPoints: DeliveryPoint[]
	payout?: number
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
}

export enum RouteAlgorithm {
	NEAREST_NEIGHBOR = 'NEAREST_NEIGHBOR',
	A_STAR = 'A_STAR',
}
