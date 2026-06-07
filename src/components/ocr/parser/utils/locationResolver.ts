import { getKnownLocationNames } from '@/lib/map/runtime'
import { LOCATION_PATTERNS } from '../constants/patterns'
import { HUR_L_STATIONS } from '../constants/locations'

function getKnownLocations(): string[] {
	return getKnownLocationNames()
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

	const cleanText = text
		.toLowerCase()
		.trim()
		.replaceAll(/\s+/g, ' ')
		.replaceAll(/\.$/g, '')

	const aliasMatch = resolveLocationAlias(cleanText)
	if (aliasMatch) {
		return aliasMatch
	}

	const knownLocations = getKnownLocations()

	// First try exact match
	const exactMatch = knownLocations.find(
		(loc) => loc.toLowerCase() === cleanText,
	)
	if (exactMatch) {
		return exactMatch
	}

	// Try partial matches only if the input is substantial enough
	if (cleanText.length >= 5) {
		// Minimum length for partial matching
		for (const location of knownLocations) {
			const locLower = location.toLowerCase()

			// Only match if it's a significant portion of the location name
			if (cleanText.includes(locLower) || locLower.includes(cleanText)) {
				// Avoid matching very generic terms
				if (
					cleanText.split(' ').length === 1 &&
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
