import { Contract } from '@/constants/types'
import { ParsedContract } from '../parser/types'

export interface TransformResult {
	contracts: Contract[]
	error?: string
}

/**
 * Transform parsed OCR data into Contract format
 * @param parsedData - The parsed contract data from OCR
 * @returns Transformed contracts and any validation errors
 */
export function transformParsedContract(
	parsedData: ParsedContract | null
): TransformResult {
	if (!parsedData) {
		return { contracts: [], error: 'No parsed data available' }
	}

	// Check if this is a pickup contract
	if (parsedData.contractType === 'pickup') {
		return {
			contracts: [],
			error:
				'Pickup contracts are not currently supported. This contract requires collecting cargo from multiple locations and delivering it all to the origin. Please use a delivery contract instead.',
		}
	}

	// Validate required fields
	if (
		!parsedData.origin ||
		!parsedData.destinations ||
		parsedData.destinations.length === 0
	) {
		return {
			contracts: [],
			error: 'Missing required contract information (origin or destinations)',
		}
	}

	// Transform to Contract format
	const contract: Contract = {
		id: `ocr-${Date.now()}`,
		maxContainerSize: parsedData.maxContainerSize || 16, // Default to 16 SCU if not specified
		origin: parsedData.origin,
		payout: parsedData.payout,
		contractType: parsedData.contractType,
		deliveryPoints: parsedData.destinations.map((dest, idx) => ({
			id: `dp-${idx}-${Date.now()}`,
			location: dest.location,
			quantity: dest.cargo.reduce((sum, c) => sum + c.quantity, 0),
			cargo: dest.cargo.map((c) => ({
				cargoType: c.type,
				quantity: c.quantity,
			})),
		})),
	}

	return { contracts: [contract] }
}

/**
 * Validate if a contract has all required fields
 */
export function validateContract(contract: Contract): string | null {
	if (!contract.origin) {
		return 'Origin is required'
	}

	if (!contract.deliveryPoints || contract.deliveryPoints.length === 0) {
		return 'At least one delivery point is required'
	}

	if (contract.maxContainerSize <= 0) {
		return 'Invalid container size'
	}

	// Check each delivery point
	for (const dp of contract.deliveryPoints) {
		if (!dp.location) {
			return 'All delivery points must have a location'
		}

		if (!dp.cargo || dp.cargo.length === 0) {
			return `Delivery point ${dp.location} has no cargo`
		}

		if (dp.quantity <= 0) {
			return `Invalid quantity for delivery point ${dp.location}`
		}
	}

	return null
}
