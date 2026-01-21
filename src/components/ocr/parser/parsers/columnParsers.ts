import { ParsedContract } from '../types'
import {
	RANK_PATTERNS,
	CONTAINER_PATTERNS,
	ORIGIN_PATTERNS,
	LOCATION_PATTERNS,
	PAYOUT_PATTERNS,
	COLLECT_PATTERNS,
	DELIVERY_PATTERN,
	COLLECT_PATTERN,
	STANDARD_CONTAINER_SIZES,
} from '../constants/patterns'
import {
	findBestLocationMatch,
	parseDestinationName,
} from '../utils/locationResolver'
import { normalizeCollectOrigin } from '../utils/cleaners'
import { parseDeliveryObjectives } from './objectives'

/**
 * Parse information found in the left column of the contract.
 */
export function parseLeftColumn(text: string, result: ParsedContract) {
	// Parse rank - handle "X Rank" or "X - " patterns
	// Also handle leading dashes/symbols from OCR artifacts
	for (const pattern of RANK_PATTERNS) {
		const rankMatch = pattern.exec(text)
		if (rankMatch) {
			result.rank = rankMatch[1].trim()
			console.log('Found rank:', result.rank)
			break
		}
	}

	// Parse max container size - look for variations
	for (const pattern of CONTAINER_PATTERNS) {
		const containerMatch = pattern.exec(text)
		if (containerMatch) {
			let size = Number.parseInt(containerMatch[1])

			// Common OCR errors: sometimes single digits get an extra digit prefixed
			// e.g., "8" reads as "68", "4" reads as "24" or "14"
			if (!STANDARD_CONTAINER_SIZES.has(size) && size > 10) {
				// Try removing the first digit (e.g., 68 -> 8, 14 -> 4)
				const lastDigit = size % 10
				if (STANDARD_CONTAINER_SIZES.has(lastDigit)) {
					console.log(`Correcting likely OCR error: ${size} -> ${lastDigit}`)
					size = lastDigit
				}
			}

			// Validate that the size is reasonable (not 0, and is a standard size)
			if (size > 0 && size <= 96) {
				result.maxContainerSize = size
				console.log('Found max container size:', result.maxContainerSize)
				break
			}
		}
	}

	// Look for origin in the description text - BEFORE the DROP OFF LOCATIONS section
	// Extract only the DETAILS section to avoid matching destinations
	const detailsMatch =
		/DETAILS\s*([\s\S]*?)(?:DROP OFF LOCATIONS|PRIMARY OBJECTIVES|$)/i.exec(
			text
		)

	if (detailsMatch) {
		const detailsText = detailsMatch[1]
		console.log('Searching for origin in DETAILS section only')

		for (const pattern of ORIGIN_PATTERNS) {
			const match = pattern.exec(detailsText) // Search only in DETAILS section
			if (match) {
				const location = match[1].trim()

				// Skip if the captured text is too short or garbled
				if (location.length < 3 || /^[A-Z]{2,3}\s+[a-z]{1,2}/.test(location)) {
					console.log('Skipping garbled location:', location)
					continue
				}

				// Check if it matches a known pattern first
				for (const locPattern of LOCATION_PATTERNS) {
					if (locPattern.test(location)) {
						result.origin = location
						console.log('Matched origin pattern:', location)
						return
					}
				}

				// Then check known locations
				const knownLocation = findBestLocationMatch(location)
				if (knownLocation) {
					result.origin = knownLocation
					console.log('Matched origin to known location:', knownLocation)
					break
				}
			}
		}
	}

	// Don't look for origin in the DROP OFF LOCATIONS section
	// Let parseRightColumn handle origin detection from objectives if needed
}

/**
 * Parse information found in the right column of the contract.
 */
export function parseRightColumn(text: string, result: ParsedContract) {
	// Parse payout - handle various formats including missing commas and currency symbols
	for (const pattern of PAYOUT_PATTERNS) {
		const payoutMatch = pattern.exec(text)
		if (payoutMatch) {
			// Handle numbers without commas (e.g., "72500" or "72 500")
			const payoutStr = payoutMatch[1].replaceAll(/[,\s]/g, '')
			const payout = Number.parseInt(payoutStr)
			// Only accept payouts that are reasonable (at least 1000)
			if (payout >= 1000) {
				result.payout = payout
				console.log('Found payout:', result.payout)
				break
			}
		}
	}

	// Parse contracted by
	const contractedByMatch = /Contracted\s+By\s+(.+?)(?:\n|$)/i.exec(text)
	if (contractedByMatch) {
		result.contractedBy = contractedByMatch[1].trim()
		console.log('Found contractor:', result.contractedBy)
	}

	// Parse Primary Objectives section
	const objectivesMatch =
		/PRIMARY\s+OBJECTIVES[:\s]*([\s\S]*?)(?=\n\n|$)/i.exec(text)
	if (objectivesMatch) {
		const objectives = objectivesMatch[1]
		console.log('Found objectives section')

		// Normalize the objectives text for analysis
		const normalizedObjectives = objectives.replaceAll(
			/\n(?!\s*(?:Collect|Deliver|◇))/g,
			' '
		)

		// Check if this is a pickup contract FIRST
		// A pickup contract has: Multiple "Collect X from Y" + all "Deliver X to [same place]"
		const deliveryMatches = [...normalizedObjectives.matchAll(DELIVERY_PATTERN)]
		const collectMatches = [...normalizedObjectives.matchAll(COLLECT_PATTERN)]

		let isPickupContract = false
		if (deliveryMatches.length > 0 && collectMatches.length > 0) {
			// Check if all deliveries are to the same location
			const deliveryDestinations = deliveryMatches.map((m) => {
				const destRaw = m[3].trim()
				return parseDestinationName(destRaw)
			})

			const uniqueDeliveryDests = new Set(deliveryDestinations)

			// If all deliveries go to the same place, this is a pickup contract
			if (uniqueDeliveryDests.size === 1) {
				const commonDeliveryDest = Array.from(uniqueDeliveryDests)[0]
				isPickupContract = true
				result.origin = commonDeliveryDest
				console.log(
					`Detected pickup contract - origin is common delivery destination: ${commonDeliveryDest}`
				)
			}
		}

		// If not a pickup contract, try to find origin from Collect patterns (delivery contract)
		if (!isPickupContract && !result.origin) {
			for (const pattern of COLLECT_PATTERNS) {
				let collectMatch
				pattern.lastIndex = 0 // Reset regex

				while ((collectMatch = pattern.exec(objectives)) !== null) {
					let location = normalizeCollectOrigin(collectMatch[1])

					// Remove trailing short words like "gL" if OCR injects them
					location = location.replace(/\s+[a-z]{1,2}\s*$/i, '').trim()

					console.log(`Attempting to match origin from: "${location}"`)

					// Check pattern-based locations first
					for (const locPattern of LOCATION_PATTERNS) {
						if (locPattern.test(location)) {
							if (!result.origin) {
								result.origin = location
								console.log('Set origin from pattern:', location)
								break
							}
						}
					}

					// Then check known selectable locations
					if (!result.origin) {
						const knownLocation = findBestLocationMatch(location)
						if (knownLocation) {
							result.origin = knownLocation
							console.log('Set origin from collect pattern:', knownLocation)
							break
						}
					}
				}

				if (result.origin) break
			}
		}

		// Parse all delivery and pickup objectives
		parseDeliveryObjectives(objectives, result)
	} else {
		console.log('No PRIMARY OBJECTIVES section found')
	}
}
