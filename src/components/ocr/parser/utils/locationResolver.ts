import { getKnownLocationNames } from '@/lib/map/runtime'
import { LOCATION_PATTERNS } from '../constants/patterns'
import { HUR_L_STATIONS } from '../constants/locations'

function getKnownLocations(): string[] {
	return getKnownLocationNames()
}

const OCR_FALSE_POSITIVE_NUMBER = /\b\d{1,2}\b/g

const normalizeForComparison = (value: string): string => {
	return value
		.toLowerCase()
		// Normalize punctuation separators into spaces.
		.replaceAll(/[^a-z0-9\s-]/g, ' ')
		// Normalize common OCR family errors around Hurston station prefixes.
		.replaceAll(/\bho(?=(ms|pc)-)/g, 'hd')
		.replaceAll(/\bhdo(?=pc-)/g, 'hd')
		// Remove short standalone numbers often injected by OCR (e.g. "Magnolia 1 Workcenter").
		.replaceAll(OCR_FALSE_POSITIVE_NUMBER, ' ')
		.replaceAll(/-/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim()
}

const tokenize = (value: string): string[] => {
	return normalizeForComparison(value)
		.split(' ')
		.filter((token) => token.length > 1)
}

const levenshteinDistance = (a: string, b: string): number => {
	if (a === b) {
		return 0
	}

	if (!a.length) {
		return b.length
	}

	if (!b.length) {
		return a.length
	}

	const previousRow = new Array<number>(b.length + 1)
	const currentRow = new Array<number>(b.length + 1)

	for (let j = 0; j <= b.length; j += 1) {
		previousRow[j] = j
	}

	for (let i = 1; i <= a.length; i += 1) {
		currentRow[0] = i
		for (let j = 1; j <= b.length; j += 1) {
			const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
			currentRow[j] = Math.min(
				currentRow[j - 1] + 1,
				previousRow[j] + 1,
				previousRow[j - 1] + substitutionCost,
			)
		}

		for (let j = 0; j <= b.length; j += 1) {
			previousRow[j] = currentRow[j]
		}
	}

	return previousRow[b.length]
}

const calculateLocationScore = (ocrText: string, candidate: string): number => {
	const normalizedOCR = normalizeForComparison(ocrText)
	const normalizedCandidate = normalizeForComparison(candidate)

	if (!normalizedOCR || !normalizedCandidate) {
		return 0
	}

	if (normalizedOCR === normalizedCandidate) {
		return 1
	}

	if (
		normalizedOCR.includes(normalizedCandidate) ||
		normalizedCandidate.includes(normalizedOCR)
	) {
		return 0.95
	}

	const ocrTokens = tokenize(ocrText)
	const candidateTokens = tokenize(candidate)
	const tokenSet = new Set(candidateTokens)
	const sharedTokens = ocrTokens.filter((token) => tokenSet.has(token)).length
	const tokenScore =
		ocrTokens.length > 0 ? sharedTokens / Math.max(ocrTokens.length, 1) : 0

	const distance = levenshteinDistance(normalizedOCR, normalizedCandidate)
	const maxLength = Math.max(normalizedOCR.length, normalizedCandidate.length)
	const distanceScore = maxLength > 0 ? 1 - distance / maxLength : 0

	return distanceScore * 0.65 + tokenScore * 0.35
}

const getMinimumConfidence = (normalizedInput: string): number => {
	if (normalizedInput.length < 8) {
		return 0.9
	}

	if (normalizedInput.length < 14) {
		return 0.85
	}

	return 0.78
}

const LOCATION_ALIASES: Record<string, string> = {
	area18: 'Riker Memorial Spaceport',
	'area 18': 'Riker Memorial Spaceport',
	'area l8': 'Riker Memorial Spaceport',
	areal8: 'Riker Memorial Spaceport',
	'nb int spaceport': 'New Babbage Interstellar Spaceport',
	'nb intl spaceport': 'New Babbage Interstellar Spaceport',
	'nb interstellar spaceport': 'New Babbage Interstellar Spaceport',
}

const normalizeForAliasLookup = (value: string): string => {
	return value
		.toLowerCase()
		.replaceAll(/[^a-z0-9\s]/g, ' ')
		.replaceAll(/\barea\s*l8\b/g, 'area 18')
		.replaceAll(/\bareal8\b/g, 'area18')
		.replaceAll(/\s+/g, ' ')
		.trim()
}

const resolveLocationAlias = (value: string): string | null => {
	const normalizedValue = normalizeForAliasLookup(value)
	if (!normalizedValue) {
		return null
	}

	if (LOCATION_ALIASES[normalizedValue]) {
		return LOCATION_ALIASES[normalizedValue]
	}

	const padded = ` ${normalizedValue} `
	for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
		if (padded.includes(` ${alias} `)) {
			return canonical
		}
	}

	return null
}

/**
 * Parse a destination string and resolve to the best match
 */
export function parseDestinationName(destinationRaw: string): string {
	// Clean up the raw destination
	let cleaned = destinationRaw.trim()

	// Remove trailing periods, spaces, pipes
	cleaned = cleaned.replace(/[.\s|]+$/, '')

	const aliasMatch = resolveLocationAlias(cleaned)
	if (aliasMatch) {
		return aliasMatch
	}

	// First check if it matches known patterns (HDMS-X, HOMS-X, etc.)
	// Fix common OCR issues where HDMS is read as HOMS
	cleaned = cleaned.replaceAll(/HOMS-/gi, 'HDMS-')
	cleaned = cleaned.replaceAll(/HDOPC-/gi, 'HDPC-')

	// Handle HDMS- or HDPC- patterns with or without space after the dash
	const miningStationMatch = /HD(MS|PC)-\s*([A-Z]+)/i.exec(cleaned)
	if (miningStationMatch) {
		const type = miningStationMatch[1].toUpperCase()
		const name =
			miningStationMatch[2].charAt(0).toUpperCase() +
			miningStationMatch[2].slice(1).toLowerCase()
		return `HD${type}-${name}`
	}

	for (const pattern of LOCATION_PATTERNS) {
		const match = pattern.exec(cleaned)
		if (match) {
			return match[0]
		}
	}

	// Handle depot names (S4LD01, etc.)
	if (/S\dLD\d{2}/i.test(cleaned)) {
		const depotMatch = /S\dLD\d{2}/i.exec(cleaned)
		if (depotMatch) {
			// Fix common OCR issue S4LD00 -> S4LD01
			const depot = depotMatch[0].toUpperCase()
			if (depot === 'S4LD00') {
				return 'S4LD01'
			}
			return depot
		}
	}

	// Handle full depot names
	if (/logistics\s+depot/i.test(cleaned)) {
		const depotMatch = /(S\dLD\d{2})/i.exec(cleaned)
		if (depotMatch) {
			const depot = depotMatch[1].toUpperCase()
			if (depot === 'S4LD00') {
				return 'S4LD01'
			}
			return depot
		}
	}

	// Check for L-point references
	const lPointMatch = /at\s+Hurston'?s\s+L(\d)\s+Lagrange\s+point/i.exec(
		cleaned,
	)
	if (lPointMatch) {
		const lPoint = lPointMatch[1]

		// Extract the station name before the L-point reference
		const stationNameMatch = /^(.*?)\s+(?:Station\s+)?at\s+Hurston/i.exec(
			cleaned,
		)
		if (stationNameMatch) {
			const stationName = stationNameMatch[1].toLowerCase().trim()

			// Based on the L-point number and station name, return the correct station
			if (lPoint === '1' && stationName.includes('green glade')) {
				return 'HUR-L1 Green Glade Station'
			}
			if (
				lPoint === '2' &&
				(stationName.includes('faithful') || stationName.includes('dream'))
			) {
				return 'HUR-L2 Faithful Dream Station'
			}
			if (lPoint === '3' && stationName.includes('thundering')) {
				return 'HUR-L3 Thundering Express Station'
			}
			if (lPoint === '4' && stationName.includes('melodic')) {
				return 'HUR-L4 Melodic Fields Station'
			}
			if (
				lPoint === '5' &&
				(stationName.includes('high') || stationName.includes('course'))
			) {
				return 'HUR-L5 High Course Station'
			}

			// Special handling for LS which might be L5
			if (cleaned.includes('LS') && stationName.includes('high')) {
				return 'HUR-L5 High Course Station'
			}
		}
	}

	// Check for station names without full L-point reference
	const stationLower = cleaned.toLowerCase()
	for (const [key, value] of Object.entries(HUR_L_STATIONS)) {
		if (stationLower.includes(key)) {
			return value
		}
	}

	// Try standard location matching
	const knownLocation = findBestLocationMatch(cleaned)
	if (knownLocation) {
		return knownLocation
	}

	// If nothing matches, return the cleaned string (but not if it's just "Hurston")
	if (cleaned.toLowerCase() === 'hurston') {
		return cleaned // This shouldn't happen but sometimes does with bad OCR
	}

	return cleaned.split(' on ')[0].trim()
}

/**
 * Attempt to resolve a free-form location string to a canonical known location
 * Only returns locations that are valid contract destinations (isSelectable !== false)
 */
export function findBestLocationMatch(text: string): string | null {
	if (!text || text.length < 3) return null // Don't match very short strings

	const cleanText = text.trim().replaceAll(/\.$/g, '')
	const normalizedText = normalizeForComparison(cleanText)
	if (!normalizedText || normalizedText.length < 3) {
		return null
	}

	const aliasMatch = resolveLocationAlias(cleanText)
	if (aliasMatch) {
		return aliasMatch
	}

	const knownLocations = getKnownLocations()

	// First try exact match
	const exactMatch = knownLocations.find(
		(loc) => normalizeForComparison(loc) === normalizedText,
	)
	if (exactMatch) {
		return exactMatch
	}

	// Cross-reference OCR text against cached runtime map names using fuzzy scoring.
	let bestMatch: string | null = null
	let bestScore = 0
	for (const location of knownLocations) {
		const score = calculateLocationScore(cleanText, location)
		if (score > bestScore) {
			bestScore = score
			bestMatch = location
		}
	}

	if (bestMatch && bestScore >= getMinimumConfidence(normalizedText)) {
		return bestMatch
	}

	// Try partial matches only if the input is substantial enough
	if (normalizedText.length >= 5) {
		// Minimum length for partial matching
		for (const location of knownLocations) {
			const locLower = normalizeForComparison(location)

			// Only match if it's a significant portion of the location name
			if (
				normalizedText.includes(locLower) ||
				locLower.includes(normalizedText)
			) {
				// Avoid matching very generic terms
				if (
					normalizedText.split(' ').length === 1 &&
					locLower.split(' ').length > 2
				) {
					continue // Skip single word matches for multi-word locations
				}

				return location
			}
		}
	}

	return null
}
