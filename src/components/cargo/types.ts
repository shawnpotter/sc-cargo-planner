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
