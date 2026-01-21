export type CargoEntry = {
	id?: string
	cargoType: string
	quantity: number
}

export type DeliveryPointValue = {
	location: string
	cargo: CargoEntry[]
	quantity: number
}

export interface DeliveryPointExtended {
	location: string
	cargo: CargoEntry[]
	quantity: number
}

export type RouteType = 'loop' | 'path'

// Local alias to represent cargo items that may or may not have an `id`.
export type CargoItem = {
	id?: string
	cargoType: string
	quantity: number
}
