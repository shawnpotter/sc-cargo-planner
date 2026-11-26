import { Contract } from '@/constants/types'
import { ParsedContract } from '../parser/types'
import { generateId } from '@/components/cargo/utils/contractHelpers'

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
	parsedData: ParsedContract | null,
	availableLocations?: readonly string[],
): TransformResult {
	if (!parsedData) {
		return { contracts: [], error: 'No parsed data available' }
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

	if (availableLocations && [parsedData.origin, ...parsedData.destinations.map(destination => destination.location)].some(location => !availableLocations.includes(location))) {
		return { contracts: [], error: 'Choose a matched available location for the origin and every destination.' }
	}
	if (!parsedData.maxContainerSize || ![1, 2, 4, 8, 16, 24, 32].includes(parsedData.maxContainerSize)) {
		return { contracts: [], error: 'Choose a supported container limit.' }
	}
	if (parsedData.payout !== undefined && (!Number.isFinite(parsedData.payout) || parsedData.payout < 0)) {
		return { contracts: [], error: 'Payout must be zero or a positive number.' }
	}
	if (parsedData.destinations.some(destination => !destination.location.trim() || !destination.cargo.length || destination.cargo.some(cargo => !cargo.type.trim() || !Number.isInteger(cargo.quantity) || cargo.quantity <= 0))) {
		return { contracts: [], error: 'Every destination needs a location, cargo name, and positive whole SCU quantity.' }
	}

	// Transform to Contract format
	const contract: Contract = {
		id: generateId(),
		maxContainerSize: parsedData.maxContainerSize || 16, // Default to 16 SCU if not specified
		origin: parsedData.origin,
		payout: parsedData.payout,
		contractType: parsedData.contractType || 'delivery',
		deliveryPoints: parsedData.destinations.map((dest) => ({
			id: generateId(),
			location: dest.location,
			quantity: dest.cargo.reduce((sum, c) => sum + c.quantity, 0),
			cargo: dest.cargo.map((c) => ({
				id: generateId(),
				cargoType: c.type.trim(),
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
