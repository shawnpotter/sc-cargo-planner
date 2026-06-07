// @/providers/CargoProvider.tsx
'use client'

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
	useEffect,
} from 'react'
import { Ship, Container, StopStatus } from '@/constants/types'
import { HaulingMode } from '@/utils/calculateContainers'
import { ships } from '@/data/ships'
import { OptimizedRoute } from '@/utils/routeOptimizer'

export type RouteType = 'loop' | 'path'

interface CargoProviderType {
	selectedShip: Ship | null
	containers: Container[]
	haulingMode: HaulingMode
	routeType: RouteType
	endLocation: string | null
	startLocation: string | null
	optimizedRoute: OptimizedRoute | null
	stopStatuses: Record<string, StopStatus>

	// Ship management
	setSelectedShip: (ship: Ship | null) => void

	// Container management
	setContainers: (containers: Container[]) => void
	clearContainers: () => void

	// Hauling mode management
	setHaulingMode: (mode: HaulingMode) => void

	// Route type management
	setRouteType: (type: RouteType) => void
	setEndLocation: (location: string | null) => void
	setStartLocation: (location: string | null) => void
	setOptimizedRoute: (route: OptimizedRoute | null) => void

	// Stop status management
	setStopStatus: (location: string, status: StopStatus) => void
	cycleStopStatus: (location: string) => void
	resetStopStatuses: () => void

	// Reset all cargo data
	resetCargo: () => void
}

const CargoContext = createContext<CargoProviderType | undefined>(undefined)

/**
 * Cycles through stop statuses: idle → in-progress → completed → idle
 */
function getNextStatus(current: StopStatus): StopStatus {
	switch (current) {
		case 'idle':
			return 'in-progress'
		case 'in-progress':
			return 'completed'
		case 'completed':
			return 'idle'
	}
}

function CargoProvider({ children }: Readonly<{ children: React.ReactNode }>) {
	const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
	const [containers, setContainers] = useState<Container[]>([])
	const [haulingMode, setHaulingMode] = useState<HaulingMode>(
		HaulingMode.CONTRACT,
	)
	const [routeType, setRouteType] = useState<RouteType>('loop')
	const [endLocation, setEndLocation] = useState<string | null>(null)
	const [startLocation, setStartLocation] = useState<string | null>(null)
	const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(
		null,
	)
	const [stopStatuses, setStopStatuses] = useState<Record<string, StopStatus>>(
		{},
	)

	useEffect(() => {
		if (typeof window === 'undefined') return
		try {
			const saved = localStorage.getItem('cargo-selected-ship')
			if (saved) {
				const shipName = JSON.parse(saved)
				const ship = ships.find((s) => s.name === shipName)
				if (ship) {
					setSelectedShip(ship)
				}
			}
		} catch (error) {
			console.warn('Failed to load selected ship from localStorage:', error)
		}
	}, [])

	const handleSetSelectedShip = useCallback((ship: Ship | null) => {
		setSelectedShip(ship)
		try {
			if (ship) {
				localStorage.setItem('cargo-selected-ship', JSON.stringify(ship.name))
			} else {
				localStorage.removeItem('cargo-selected-ship')
			}
		} catch (error) {
			console.warn('Failed to save selected ship to localStorage:', error)
		}
	}, [])

	const clearContainers = useCallback(() => {
		setContainers([])
	}, [])

	const handleSetRouteType = useCallback((type: RouteType) => {
		setRouteType(type)
		if (type === 'loop') {
			setEndLocation(null)
		}
	}, [])

	const setStopStatus = useCallback((location: string, status: StopStatus) => {
		setStopStatuses((prev) => ({
			...prev,
			[location]: status,
		}))
	}, [])

	const cycleStopStatus = useCallback((location: string) => {
		setStopStatuses((prev) => {
			const currentStatus = prev[location] || 'idle'
			return {
				...prev,
				[location]: getNextStatus(currentStatus),
			}
		})
	}, [])

	const resetStopStatuses = useCallback(() => {
		setStopStatuses({})
	}, [])

	const resetCargo = useCallback(() => {
		handleSetSelectedShip(null)
		setContainers([])
		setHaulingMode(HaulingMode.CONTRACT)
		setRouteType('loop')
		setEndLocation(null)
		setStartLocation(null)
		setOptimizedRoute(null)
		setStopStatuses({})
	}, [handleSetSelectedShip])

	// Reset stop statuses whenever a new route is generated
	useEffect(() => {
		setStopStatuses({})
	}, [optimizedRoute])

	// Reset stop statuses whenever a new route is generated
	useEffect(() => {
		setStopStatuses({})
	}, [optimizedRoute])

	useEffect(() => {
		if (
			selectedShip &&
			!ships.some((ship) => ship.name === selectedShip.name)
		) {
			console.warn(
				`Selected ship "${selectedShip.name}" no longer exists, clearing selection`,
			)
			handleSetSelectedShip(null)
		}
	}, [selectedShip, handleSetSelectedShip])

	useEffect(() => {
		if (!selectedShip) return

		const latestShip = ships.find((ship) => ship.name === selectedShip.name)
		if (latestShip && latestShip !== selectedShip) {
			setSelectedShip(latestShip)
		}
	}, [selectedShip])

	const value: CargoProviderType = useMemo(
		() => ({
			selectedShip,
			containers,
			haulingMode,
			routeType,
			endLocation,
			startLocation,
			optimizedRoute,
			stopStatuses,
			setSelectedShip: handleSetSelectedShip,
			setContainers,
			clearContainers,
			setHaulingMode,
			setRouteType: handleSetRouteType,
			setEndLocation,
			setStartLocation,
			setOptimizedRoute,
			setStopStatus,
			cycleStopStatus,
			resetStopStatuses,
			resetCargo,
		}),
		[
			selectedShip,
			containers,
			haulingMode,
			routeType,
			endLocation,
			startLocation,
			optimizedRoute,
			stopStatuses,
			handleSetSelectedShip,
			clearContainers,
			handleSetRouteType,
			setStopStatus,
			cycleStopStatus,
			resetStopStatuses,
			resetCargo,
		],
	)

	return <CargoContext.Provider value={value}>{children}</CargoContext.Provider>
}

function useCargo() {
	const context = useContext(CargoContext)
	if (!context) {
		throw new Error('useCargo must be used within a CargoProvider')
	}
	return context
}

export { CargoProvider, useCargo, getNextStatus }
