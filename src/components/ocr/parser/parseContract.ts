// app/components/OCRScanner/utils/contractParser.ts
import { ParsedContract } from '@/components/ocr/parser/types'
import { locations } from '@/data/locations'

// Get all location names from the locations file
/**
 * Sorted list of known location names used for fuzzy matching.
 *
 * The array is sorted by descending length to prefer longer (more specific)
 * location names when doing substring matches (e.g. "Area 18" vs "Area").
 * Used by {@link findBestLocationMatch}.
 */
const KNOWN_LOCATIONS = locations
	.map((loc) => loc.name)
	.sort((a, b) => b.length - a.length)

/**
 * Clean OCR output text by applying a set of heuristic replacements.
 *
 * This function attempts to fix common OCR misreads that show up in
 * contract scans (for example confusing "O" with "0" or "l" with "1").
 * It is intentionally permissive and performs only deterministic string
 * replacements; callers should still validate important parsed fields.
 *
 * @param text - Raw OCR-extracted text
 * @returns A cleaned string with common OCR mistakes corrected
 */
const cleanOCRText = (text: string): string => {
	return (
		text
			// Fix common OCR mistakes with depot names
			.replace(/S4LDO1/gi, 'S4LD01')
			.replace(/S4LD0I/gi, 'S4LD01')
			.replace(/S4LDOI/gi, 'S4LD01')
			.replace(/O(?=\d)/g, '0') // Replace O with 0 when followed by a digit
			.replace(/(?<=\d)O/g, '0') // Replace O with 0 when preceded by a digit
			.replace(/(?<=S\d)O(?=\d)/g, '0') // Fix S4O1 type patterns
			.replace(/\bl\b/g, '1') // Replace standalone lowercase L with 1
			.replace(/\bI\b/g, '1') // Replace standalone uppercase i with 1
			.replace(/©/g, '') // Remove bullet points
			.replace(/</g, '') // Remove < characters
			.replace(/\|/g, '')
	) // Remove pipe characters
}

/**
 * Main entry point for parsing a contract's OCR text.
 *
 * Performs a cleaning pass on each column, then extracts information from
 * the left and right columns. Returns a {@link ParsedContract} object which
 * may include rank, maxContainerSize, origin, payout, contractedBy and
 * destinations.
 *
 * @param leftText - OCR text from the left column
 * @param rightText - OCR text from the right column
 * @returns ParsedContract - parsed representation (may be partial)
 */
export function parseContractText(
	leftText: string,
	rightText: string
): ParsedContract {
	console.log('=== Starting Contract Parse ===')

	const result: ParsedContract = {}

	// Clean the text first
	const cleanedLeft = cleanOCRText(leftText)
	const cleanedRight = cleanOCRText(rightText)

	// Parse LEFT column
	parseLeftColumn(cleanedLeft, result)

	// Parse RIGHT column
	parseRightColumn(cleanedRight, result)

	console.log('Final parsed result:', JSON.stringify(result, null, 2))
	console.log('=== Parse Complete ===')

	return result
}

/**
 * Parse information found in the left column of the contract.
 *
 * Looks for rank, max container size and attempts to infer the origin
 * from a set of heuristic patterns.
 *
 * @param text - Cleaned text from the left column
 * @param result - Mutable ParsedContract to populate
 */
function parseLeftColumn(text: string, result: ParsedContract) {
	// Parse rank
	const rankMatch = RegExp(/^(.*?)\s*[-—]\s*Direct\s+Planetary/i).exec(text)
	if (rankMatch) {
		result.rank = rankMatch[1].trim()
		console.log('Found rank:', result.rank)
	}

	// Parse max container size
	const containerMatch = RegExp(/(\d+)\s*SCU\s*in\s*size/i).exec(text)
	if (containerMatch) {
		result.maxContainerSize = parseInt(containerMatch[1])
		console.log('Found max container size:', result.maxContainerSize)
	}

	// Look for origin in the description text
	const originPatterns = [
		/from\s+a?\s*freight\s+elevator\s+at\s+([^.]+?)(?:\s+above|\s+on|\.|$)/i,
		/going\s+from\s+a?\s*freight\s+elevator\s+at\s+([^.]+?)(?:\s+above|\s+on|\.|$)/i,
		/going\s+from\s+([^.]+?)(?:\s+to|\.|$)/i,
		/haul.*?from\s+([^.]+?)(?:\s+to|\.|$)/i,
		/at\s+([A-Z][^.]+?)(?:\.|on|above)/i,
	]

	for (const pattern of originPatterns) {
		const match = RegExp(pattern).exec(text)
		if (match) {
			const location = match[1].trim()
			const knownLocation = findBestLocationMatch(location)
			if (knownLocation) {
				result.origin = knownLocation
				console.log('Matched origin to known location:', knownLocation)
				break
			}
		}
	}
}

/**
 * Parse information found in the right column of the contract.
 *
 * Extracts payout, contracted-by, and the PRIMARY OBJECTIVES block. The
 * function will also try to infer origin locations and delegate delivery
 * parsing to {@link parseDeliveryObjectives}.
 *
 * @param text - Cleaned text from the right column
 * @param result - Mutable ParsedContract to populate
 */
function parseRightColumn(text: string, result: ParsedContract) {
	// Parse payout
	const payoutMatch = RegExp(/Reward\s*[x\s]*(\d{1,3}(?:[,\s]\d{3})*)/i).exec(
		text
	)
	if (payoutMatch) {
		result.payout = parseInt(payoutMatch[1].replace(/[,\s]/g, ''))
		console.log('Found payout:', result.payout)
	}

	// Parse contracted by
	const contractedByMatch = RegExp(/Contracted\s+By\s+(.+?)(?:\n|$)/i).exec(
		text
	)
	if (contractedByMatch) {
		result.contractedBy = contractedByMatch[1].trim()
		console.log('Found contractor:', result.contractedBy)
	}

	// Parse Primary Objectives section
	const objectivesMatch = RegExp(
		/PRIMARY\s+OBJECTIVES[:\s]*([\s\S]*?)(?=\n\n|$)/i
	).exec(text)
	if (objectivesMatch) {
		const objectives = objectivesMatch[1]
		console.log('Found objectives section')

		// First pass: Find origin from Collect patterns
		const collectPattern = /Collect\s+([^from]+?)\s+from\s+([^\n.]+)/gi
		let collectMatch

		while ((collectMatch = collectPattern.exec(objectives)) !== null) {
			const location = collectMatch[2].trim().replace(/\.$/, '')
			const knownLocation = findBestLocationMatch(location)
			if (knownLocation && !result.origin) {
				result.origin = knownLocation
				console.log('Set origin from collect pattern:', knownLocation)
				break
			}
		}

		// Second pass: Parse all delivery objectives
		parseDeliveryObjectives(objectives, result)
	} else {
		console.log('No PRIMARY OBJECTIVES section found')
	}
}

/**
 * Parse delivery objective statements from the PRIMARY OBJECTIVES block.
 *
 * Matches lines such as: "Deliver 2/3 SCU of Medical Supplies to Area 18 on ArcCorp."
 * Aggregates cargo quantities per destination and normalizes simple "on"
 * parent-body suffixes.
 *
 * @param text - Objectives text block
 * @param result - Mutable ParsedContract to populate destinations
 */
function parseDeliveryObjectives(text: string, result: ParsedContract) {
	const destinations: ParsedContract['destinations'] = []
	const destinationMap = new Map<string, (typeof destinations)[0]>()

	// Normalize the text by removing extra line breaks within delivery statements
	// The pattern is: Deliver text can span multiple lines until it hits a period or next bullet
	const normalizedText = text.replace(/\n(?!\s*(?:Collect|Deliver))/g, ' ')
	console.log('Normalized objectives text:', normalizedText)

	// Pattern to match delivery with possible line breaks handled
	// Now matching everything until we hit a period followed by a space/newline or end
	const deliveryPattern =
		/Deliver\s+\d+\/(\d+)\s+SCU\s+of\s+([^.]+?)\s+to\s+([^.]+?)\.(?:\s|$)/gi

	let match
	let matchCount = 0

	while ((match = deliveryPattern.exec(normalizedText)) !== null) {
		matchCount++
		const quantity = parseInt(match[1])
		let cargoType = match[2].trim()
		const destinationRaw = match[3].trim()

		console.log(
			`Match ${matchCount}: Qty=${quantity}, Cargo="${cargoType}", Dest="${destinationRaw}"`
		)

		// Clean up cargo type
		cargoType = cargoType.replace(/\s+/g, ' ').trim()

		// Split destination into location and optional parent body
		let destination = destinationRaw
		let parentBody = null
		const onMatch = RegExp(/^(.+?)\s+on\s+(.+)$/i).exec(destinationRaw)
		if (onMatch) {
			destination = onMatch[1].trim()
			parentBody = onMatch[2].trim()
			console.log(`  Split destination: "${destination}" on "${parentBody}"`)
		}

		// Build full destination string for matching
		const fullDestination = parentBody
			? `${destination} on ${parentBody}`
			: destination

		// Try to find best matching location
		const knownLocation =
			findBestLocationMatch(destination) ||
			findBestLocationMatch(fullDestination) ||
			destination

		console.log(`  Matched to location: ${knownLocation}`)

		if (!destinationMap.has(knownLocation)) {
			destinationMap.set(knownLocation, {
				location: knownLocation,
				cargo: [],
			})
		}

		const destEntry = destinationMap.get(knownLocation)!

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

	if (destinationMap.size > 0) {
		result.destinations = Array.from(destinationMap.values())
		console.log('Total unique destinations:', result.destinations.length)
		console.log('Destinations:', result.destinations)
	} else {
		console.log('No destinations were parsed')
	}
}

/**
 * Attempt to resolve a free-form location string to a canonical known
 * location name from the `locations` dataset.
 *
 * Strategy: exact case-insensitive match, then substring matches, then
 * containment checks (preferring longer known names via sorting).
 *
 * @param text - Free-form location string
 * @returns Canonical location name or null if none found
 */
// Fuzzy location matching helper with improved accuracy
function findBestLocationMatch(text: string): string | null {
	if (!text) return null

	const cleanText = text
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ') // Normalize whitespace
		.replace(/\.$/, '') // Remove trailing period

	// First try exact match (case insensitive)
	const exactMatch = KNOWN_LOCATIONS.find(
		(loc) => loc.toLowerCase() === cleanText
	)
	if (exactMatch) {
		return exactMatch
	}

	// Try partial matches
	for (const location of KNOWN_LOCATIONS) {
		const locLower = location.toLowerCase()

		// Check for substring matches
		if (cleanText.includes(locLower)) {
			return location
		}

		if (locLower.includes(cleanText) && cleanText.length >= 4) {
			return location
		}
	}

	return null
}
