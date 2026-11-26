'use client'

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import type { Location } from '@/data/locations'
import { locations as staticFallbackLocations } from '@/data/locations'
import { setRuntimeLocations } from '@/lib/map/runtime'

interface MapDataContextType {
	locations: Location[]
	loading: boolean
	error: string | null
	system: string | null
	cached: boolean
	availableSystems: string[]
	refresh: () => Promise<void>
}

const MapDataContext = createContext<MapDataContextType | undefined>(undefined)

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

function isLocation(value: unknown): value is Location {
	if (!isRecord(value)) return false
	const coordinates = value.coordinates
	const parent = value.parentObject
	const system = value.system
	if (!isRecord(coordinates)) return false
	return typeof value.name === 'string' && typeof value.type === 'string' &&
		['PLANET', 'MOON', 'SURFACE_LOCATION', 'ORBITAL_STATION', 'LAGRANGE_POINT_STATION', 'GATEWAY', 'STAR'].includes(value.type) &&
		['x', 'y', 'z'].every((key) => typeof coordinates[key] === 'number' && Number.isFinite(coordinates[key])) &&
		(parent === undefined || typeof parent === 'string') &&
		(system === undefined || typeof system === 'string') &&
		(value.requiresPlanetaryVisit === undefined || typeof value.requiresPlanetaryVisit === 'boolean') &&
		(value.isSelectable === undefined || typeof value.isSelectable === 'boolean')
}

async function fetchMapData(path: string): Promise<Record<string, unknown>> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 10_000)
	try {
		const response = await fetch(path, { cache: 'no-store', signal: controller.signal })
		const payload: unknown = await response.json()
		if (!isRecord(payload)) throw new Error('Invalid map data response')
		if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to load map data')
		return payload
	} catch (error) {
		if (controller.signal.aborted) throw new Error('Loading map data timed out')
		throw error
	} finally {
		clearTimeout(timeout)
	}
}

async function fetchAvailableSystems(): Promise<string[]> {
	const payload = await fetchMapData('/api/map/systems')
	if (!Array.isArray(payload.data)) throw new Error('Invalid map systems response')
	const systems: string[] = []
	for (const entry of payload.data) {
		if (!isRecord(entry) || typeof entry.id !== 'string' || !/^[a-z0-9_-]{1,40}$/i.test(entry.id)) {
			throw new Error('Invalid map system identifier')
		}
		systems.push(entry.id.toLowerCase())
	}
	if (!systems.length) throw new Error('No map systems are available')
	return [...new Set(systems)]
}

async function fetchSystemLocations(
	system: string,
): Promise<{ locations: Location[]; system: string; cached: boolean; contextIncomplete: boolean }> {
	const body = await fetchMapData(`/api/map/locations?system=${encodeURIComponent(system)}`)
	const meta = isRecord(body.meta) ? body.meta : undefined
	const data = body.data
	if (!Array.isArray(data) || !data.every(isLocation)) throw new Error(`Invalid ${system} locations data`)
	const locations: Location[] = data.map((location) => ({ ...location, system: location.system ?? system }))
	return {
		locations,
		system: typeof meta?.system === 'string' ? meta.system : system,
		cached: meta?.cached === true,
		contextIncomplete: meta?.contextIncomplete === true || (Array.isArray(meta?.contextWarnings) && meta.contextWarnings.length > 0),
	}
}

async function loadLocations(): Promise<{
	locations: Location[]
	system: string
	cached: boolean
	degraded: boolean
	failedSystems: string[]
	contextUnavailableSystems: string[]
}> {
	const systems = await fetchAvailableSystems()
	const results = await Promise.allSettled(
		systems.map((s) => fetchSystemLocations(s)),
	)

	const allLocations: Location[] = []
	let anyCached = false
	const failedSystems: string[] = []
	const contextUnavailableSystems: string[] = []
	for (const [index, result] of results.entries()) {
		if (result.status === 'fulfilled') {
			allLocations.push(...result.value.locations)
			if (result.value.cached) anyCached = true
			if (result.value.contextIncomplete) contextUnavailableSystems.push(systems[index])
		} else failedSystems.push(systems[index])
	}

	if (allLocations.length === 0) {
		throw new Error('Failed to load locations for any system')
	}

	return {
		locations: allLocations,
		system: allLocations[0].system ?? systems[0],
		cached: anyCached || failedSystems.length > 0,
		degraded: failedSystems.length > 0,
		failedSystems,
		contextUnavailableSystems,
	}
}

export function MapDataProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const [locations, setLocations] = useState<Location[]>(
		staticFallbackLocations,
	)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [system, setSystem] = useState<string | null>(null)
	const [cached, setCached] = useState(false)

	const refresh = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await loadLocations()
			setLocations(result.locations)
			setSystem(result.system)
			setCached(result.cached)
			const messages: string[] = []
			if (result.degraded) messages.unshift(`Some map systems are unavailable (${result.failedSystems.join(', ')}); showing available or cached locations.`)
			if (result.contextUnavailableSystems.length) {
				const names = result.contextUnavailableSystems.map((name) => name.charAt(0).toUpperCase() + name.slice(1))
				messages.push(`Local map detail is unavailable for parts of ${new Intl.ListFormat('en', { type: 'conjunction' }).format(names)}. Route coordinates are available.`)
			}
			setError(messages.length ? messages.join(' ') : null)
			setRuntimeLocations(result.locations)
		} catch (refreshError) {
			setCached(true)
			setError(
				refreshError instanceof Error
					? refreshError.message
					: 'Failed to load map locations',
			)
			// Keep existing locations (static fallback on first load, last good API data on refresh)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		queueMicrotask(() => {
			refresh().catch((refreshError) => {
				console.error('Failed to initialize map locations:', refreshError)
			})
		})
	}, [refresh])

	const availableSystems = useMemo(() => {
		const found = new Set<string>()
		for (const loc of locations) {
			if (loc.system) found.add(loc.system.toLowerCase())
		}
		return found.size > 0
			? Array.from(found).sort((a, b) => a.localeCompare(b))
			: ['stanton']
	}, [locations])

	const value = useMemo(
		() => ({
			locations,
			loading,
			error,
			system,
			cached,
			availableSystems,
			refresh,
		}),
		[locations, loading, error, system, cached, availableSystems, refresh],
	)

	return (
		<MapDataContext.Provider value={value}>{children}</MapDataContext.Provider>
	)
}

export function useMapData() {
	const context = useContext(MapDataContext)
	if (!context) {
		throw new Error('useMapData must be used within a MapDataProvider')
	}
	return context
}
