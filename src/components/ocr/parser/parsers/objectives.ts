import { ParsedContract } from '../types'
import { parseDestinationName } from '../utils/locationResolver'
import { DELIVERY_PATTERN, COLLECT_PATTERN } from '../constants/patterns'

/**
 * Parse delivery objective statements from the PRIMARY OBJECTIVES block.
 */
export function parseDeliveryObjectives(text: string, result: ParsedContract) {
	const destinationMap = new Map<
		string,
		{ location: string; cargo: Array<{ type: string; quantity: number }> }
	>()

	// Normalize the text
	const normalizedText = text.replaceAll(/\n(?!\s*(?:Collect|Deliver|◇))/g, ' ')
	console.log('Normalized objectives text:', normalizedText)

	// Check if this is a pickup contract (already detected in parseRightColumn)
	const deliveryMatches = [...normalizedText.matchAll(DELIVERY_PATTERN)]
	const collectMatches = [...normalizedText.matchAll(COLLECT_PATTERN)]

	// Determine if this is a pickup contract
	let isPickupContract = false
	if (
		deliveryMatches.length > 0 &&
		collectMatches.length > 0 &&
		result.origin
	) {
		// Check if all deliveries go to the origin (already set in parseRightColumn)
		const deliveryDestinations = deliveryMatches.map((m) => {
			const destRaw = m[3].trim()
			return parseDestinationName(destRaw)
		})

		const uniqueDeliveryDests = new Set(deliveryDestinations)

		// If all deliveries go to the same place and it matches the origin, this is a pickup contract
		if (uniqueDeliveryDests.size === 1) {
			const singleDeliveryDest = Array.from(uniqueDeliveryDests)[0]
			if (singleDeliveryDest === result.origin) {
				isPickupContract = true
				console.log(
					'Confirmed pickup contract - using collect locations as destinations'
				)
			}
		}
	}

	if (isPickupContract) {
		// For pickup contracts, the "destinations" are actually the PICKUP locations
		result.contractType = 'pickup'

		// Track which delivery matches we've already used
		const usedDeliveryIndices = new Set<number>()

		for (const match of collectMatches) {
			const cargoType = match[1].trim().replaceAll(/\s+/g, ' ')
			const pickupLocationRaw = match[2].trim()
			const pickupLocation = parseDestinationName(pickupLocationRaw)

			console.log(`Pickup location: ${pickupLocation}, Cargo: ${cargoType}`)

			// Find the next unused corresponding delivery to get the quantity
			const deliveryIndex = deliveryMatches.findIndex((dm, idx) => {
				if (usedDeliveryIndices.has(idx)) return false
				const dCargoType = dm[2].trim().replaceAll(/\s+/g, ' ')
				return dCargoType.toLowerCase() === cargoType.toLowerCase()
			})

			if (deliveryIndex !== -1) {
				const deliveryMatch = deliveryMatches[deliveryIndex]
				usedDeliveryIndices.add(deliveryIndex)
				const quantity = Number.parseInt(deliveryMatch[1])

				if (!destinationMap.has(pickupLocation)) {
					destinationMap.set(pickupLocation, {
						location: pickupLocation,
						cargo: [],
					})
				}

				const destEntry = destinationMap.get(pickupLocation)!
				const existingCargo = destEntry.cargo.find(
					(c) => c.type.toLowerCase() === cargoType.toLowerCase()
				)

				if (existingCargo) {
					existingCargo.quantity += quantity
					console.log(
						`  Updated existing cargo "${cargoType}": ${existingCargo.quantity}`
					)
				} else {
					destEntry.cargo.push({
						type: cargoType,
						quantity: quantity,
					})
					console.log(`  Added new cargo "${cargoType}": ${quantity}`)
				}
			}
		}
	} else {
		// Standard delivery contract - use delivery destinations
		result.contractType = 'delivery'
		let matchCount = 0

		for (const match of deliveryMatches) {
			matchCount++
			const quantity = Number.parseInt(match[1])
			let cargoType = match[2].trim()
			const destinationRaw = match[3].trim()

			console.log(
				`Match ${matchCount}: Qty=${quantity}, Cargo="${cargoType}", Dest="${destinationRaw}"`
			)

			// Clean up cargo type
			cargoType = cargoType.replaceAll(/\s+/g, ' ').trim()

			// Parse destination - improved logic
			const destination = parseDestinationName(destinationRaw)

			console.log(`  Resolved destination: ${destination}`)

			// Skip if destination is the origin (sometimes OCR confuses this)
			if (result.origin && destination === result.origin) {
				console.log(
					`  Skipping destination that matches origin: ${destination}`
				)
				continue
			}

			if (!destinationMap.has(destination)) {
				destinationMap.set(destination, {
					location: destination,
					cargo: [],
				})
			}

			const destEntry = destinationMap.get(destination)!

			// Check if this cargo type already exists for this destination
			const existingCargo = destEntry.cargo.find(
				(c) => c.type.toLowerCase() === cargoType.toLowerCase()
			)

			if (existingCargo) {
				existingCargo.quantity += quantity
				console.log(
					`  Updated existing cargo "${cargoType}": ${existingCargo.quantity}`
				)
			} else {
				destEntry.cargo.push({
					type: cargoType,
					quantity: quantity,
				})
				console.log(`  Added new cargo "${cargoType}": ${quantity}`)
			}
		}

		console.log(`Total delivery matches found: ${matchCount}`)
	}

	if (destinationMap.size > 0) {
		result.destinations = Array.from(destinationMap.values())
		console.log('Total unique destinations:', result.destinations.length)
		console.log('Destinations:', result.destinations)
	} else {
		console.log('No destinations were parsed')
	}
}
