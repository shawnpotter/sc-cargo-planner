import type { RouteStop } from '@/constants/types'
import type { Location } from '@/data/locations'

export interface MapVisit {
	index: number
	location: Location
	stop: RouteStop | null
}

export function getLocationSystem(location: Location): string {
	// The bundled location catalog predates the system field and contains Stanton.
	return location.system?.toLowerCase() || 'stanton'
}

export function buildMapVisits(locations: Location[], route: string[], stops: RouteStop[]): { visits: MapVisit[]; missing: string[] } {
	const byName = new Map(locations.map((location) => [location.name, location]))
	const ambiguous = new Set<string>()
	for (const location of locations) {
		const other = byName.get(location.name)
		if (other && getLocationSystem(other) !== getLocationSystem(location)) ambiguous.add(location.name)
	}
	const missing: string[] = []
	const visits: MapVisit[] = []
	let stopIndex = 0
	for (const [index, name] of route.entries()) {
		const location = byName.get(name)
		const stop = stops[stopIndex]?.location === name ? stops[stopIndex++] : null
		if (!location || ambiguous.has(name) || !Object.values(location.coordinates).every(Number.isFinite)) {
			missing.push(name)
			continue
		}
		visits.push({ index, location, stop })
	}
	return { visits, missing: [...new Set(missing)] }
}

/** Follow the supplied hierarchy only; local views never combine system coordinates. */
export function getParentBody(location: Location, locations: Location[]): string | null {
	if (location.type === 'PLANET' || location.type === 'MOON') return location.name
	const seen = new Set<string>()
	let parent = location.parentObject
	while (parent && !seen.has(parent)) {
		seen.add(parent)
		const body = locations.find((candidate) => candidate.name === parent && getLocationSystem(candidate) === getLocationSystem(location))
		if (!body) return null
		if (body.type === 'PLANET' || body.type === 'MOON') return body.name
		if (body.type === 'STAR') return null
		parent = body.parentObject
	}
	return null
}

/** Project x/y, then spread close markers with leader lines to keep every visit selectable. */
export function layoutMapVisits(visits: MapVisit[]) {
	const xs = visits.map((visit) => visit.location.coordinates.x)
	const ys = visits.map((visit) => visit.location.coordinates.y)
	const minX = Math.min(...xs, 0)
	const minY = Math.min(...ys, 0)
	// Do not force the system origin into local bounds.
	const left = visits.length ? Math.min(...xs) : minX
	const bottom = visits.length ? Math.min(...ys) : minY
	const span = Math.max(Math.max(...xs) - left, Math.max(...ys) - bottom, 1)
	const points: Array<MapVisit & { x: number; y: number; anchorX: number; anchorY: number }> = []
	for (const visit of visits) {
		const anchorX = 100 + ((visit.location.coordinates.x - left) / span) * 580
		const anchorY = 340 - ((visit.location.coordinates.y - bottom) / span) * 260
		let x = anchorX
		let y = anchorY
		for (let attempt = 0; points.some((point) => Math.hypot(point.x - x, point.y - y) < 56); attempt++) {
			const angle = attempt * 2.399963
			const radius = 58 * Math.sqrt(attempt + 1)
			x = Math.min(755, Math.max(45, anchorX + Math.cos(angle) * radius))
			y = Math.min(395, Math.max(45, anchorY + Math.sin(angle) * radius))
			if (attempt > 2000) break
		}
		points.push({ ...visit, x, y, anchorX, anchorY })
	}
	return points
}
