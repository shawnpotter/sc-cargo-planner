import { CargoEntry } from '@/components/cargo/types'

/**
 * Generate a unique ID for entities
 */
export function generateId(): string {
	return `id-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Calculate total quantity from cargo entries
 */
export function calculateTotalQuantity(cargo: CargoEntry[]): number {
	return cargo.reduce((acc, curr) => acc + curr.quantity, 0)
}

/**
 * Check if a contract form has valid content
 */
export function hasValidContractContent(
	origin?: string,
	deliveryPointsLength?: number
): boolean {
	return !!(origin && deliveryPointsLength && deliveryPointsLength > 0)
}
