import { Contract } from '@/constants/types'
import { RouteType } from '@/components/cargo/types'

export interface ValidationResult {
	isValid: boolean
	title?: string
	description?: string
}

/**
 * Validate contracts before submission
 */
export function validateContractsForSubmission(
	contracts: Contract[],
	currentContractHasContent: boolean,
	routeType: RouteType,
	endLocation: string | null
): ValidationResult {
	// Check if there are no contracts (both saved and current)
	// When current contract has content, it will be saved before this check,
	// so we need to check the contracts array after that save
	if (contracts.length === 0) {
		return {
			isValid: false,
			title: 'No valid contracts',
			description: 'Please add at least one valid contract',
		}
	}

	for (const contract of contracts) {
		if (!contract.origin?.trim() || ![1, 2, 4, 8, 16, 24, 32].includes(contract.maxContainerSize) ||
			!contract.deliveryPoints.length || (contract.payout !== undefined && (!Number.isFinite(contract.payout) || contract.payout < 0)) ||
			contract.deliveryPoints.some(point => !point.location?.trim() || !point.cargo.length ||
				point.cargo.some(cargo => !cargo.cargoType.trim() || !Number.isInteger(cargo.quantity) || cargo.quantity <= 0))) {
			return { isValid: false, title: 'Invalid contract', description: 'Check the origin, destinations, cargo names, positive whole SCU quantities, container limit, and payout.' }
		}
	}

	// Validate end location for open path routes
	if (routeType === 'path' && !endLocation) {
		return {
			isValid: false,
			title: 'End location required',
			description:
				'Please select an end location for open path routes, or switch to loop mode.',
		}
	}

	return { isValid: true }
}

/**
 * Validate delivery point before adding
 */
export function validateDeliveryPoint(
	location: string,
	cargoLength: number
): boolean {
	return !!(location && cargoLength > 0)
}

/**
 * Check if scanner is available on current device
 */
export function isScannerAvailable(): { available: boolean; reason?: string } {
	if (typeof navigator === 'undefined') {
		return { available: true } // SSR, assume available
	}

	if (typeof FileReader === 'undefined' || typeof Worker === 'undefined') {
		return { available: false, reason: 'This browser does not support image scanning. Try a current browser with file and worker support.' }
	}
	return { available: true }
}
