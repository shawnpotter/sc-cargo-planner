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

const KNOWN_SYSTEMS = ['stanton', 'nyx', 'pyro']

async function fetchSystemLocations(
	system: string,
): Promise<{ locations: Location[]; system: string; cached: boolean }> {
	const response = await fetch(
		`/api/map/locations?system=${encodeURIComponent(system)}`,
		{
			cache: 'no-store',
		},
	)
	const payload = (await response.json()) as {
		data?: Location[]
		meta?: { system?: string; cached?: boolean }
		error?: string
	}
	if (!response.ok) {
		throw new Error(payload.error || `Failed to load ${system} locations`)
	}
	return {
		locations: payload.data ?? [],
		system: payload.meta?.system ?? system,
		cached: payload.meta?.cached ?? false,
	}
}

async function loadLocations(): Promise<{
	locations: Location[]
	system: string
	cached: boolean
}> {
	const results = await Promise.allSettled(
		KNOWN_SYSTEMS.map((s) => fetchSystemLocations(s)),
	)

	const allLocations: Location[] = []
	let anyCached = false
	for (const result of results) {
		if (result.status === 'fulfilled') {
			allLocations.push(...result.value.locations)
			if (result.value.cached) anyCached = true
		}
	}

	if (allLocations.length === 0) {
		throw new Error('Failed to load locations for any system')
	}

	return {
		locations: allLocations,
		system: 'stanton',
		cached: anyCached,
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
			setRuntimeLocations(result.locations)
		} catch (refreshError) {
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
		refresh().catch((refreshError) => {
			console.error('Failed to initialize map locations:', refreshError)
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
