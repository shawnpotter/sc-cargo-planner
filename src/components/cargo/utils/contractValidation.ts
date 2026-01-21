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

	const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

	if (isMobile) {
		return {
			available: false,
			reason: 'Scanner not available on mobile',
		}
	}

	return { available: true }
}
