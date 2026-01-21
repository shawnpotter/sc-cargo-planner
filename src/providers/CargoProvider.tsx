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
import { Ship, Container } from '@/constants/types'
import { HaulingMode } from '@/utils/calculateContainers'
import { ships } from '@/data/ships'

export type RouteType = 'loop' | 'path'

interface CargoProviderType {
	selectedShip: Ship | null
	containers: Container[]
	haulingMode: HaulingMode
	routeType: RouteType
	endLocation: string | null

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

	// Reset all cargo data
	resetCargo: () => void
}

const CargoContext = createContext<CargoProviderType | undefined>(undefined)

/**
 * Provides cargo management functionality for the application.
 *
 * The `CargoProvider` component manages the selected ship, container layout,
 * hauling mode, and route configuration across different cargo-related pages.
 * It provides a centralized state management solution for cargo operations
 * with localStorage persistence.
 *
 * @param children - React children to be rendered within the provider.
 *
 * @context
 * Provides the following context value:
 * - `selectedShip`: Currently selected ship for cargo operations (persisted in localStorage)
 * - `containers`: Array of containers currently loaded in the cargo hold
 * - `haulingMode`: Current hauling mode (CONTRACT, MULTI_TOOL, etc.)
 * - `routeType`: Current route type ('loop' for closed loop, 'path' for open path)
 * - `endLocation`: End location for open path routes (null for closed loop)
 * - `setSelectedShip(ship)`: Sets the currently selected ship and saves to localStorage
 * - `setContainers(containers)`: Sets the container layout
 * - `clearContainers()`: Clears all containers from the cargo hold
 * - `setHaulingMode(mode)`: Sets the hauling mode
 * - `setRouteType(type)`: Sets the route type (loop or path)
 * - `setEndLocation(location)`: Sets the end location for open path routes
 * - `resetCargo()`: Resets all cargo-related state
 */
function CargoProvider({ children }: Readonly<{ children: React.ReactNode }>) {
	// State management
	const [selectedShip, setSelectedShipState] = useState<Ship | null>(null)
	const [containers, setContainers] = useState<Container[]>([])
	const [haulingMode, setHaulingMode] = useState<HaulingMode>(
		HaulingMode.CONTRACT,
	)
	const [routeType, setRouteType] = useState<RouteType>('loop')
	const [endLocation, setEndLocation] = useState<string | null>(null)

	// Load selected ship from localStorage on mount
	useEffect(() => {
		if (typeof window === 'undefined') return
		try {
			const saved = localStorage.getItem('cargo-selected-ship')
			if (saved) {
				const shipName = JSON.parse(saved)
				// Find the ship by name from the ships array
				const ship = ships.find((s) => s.name === shipName)
				if (ship) {
					setSelectedShipState(ship)
				}
			}
		} catch (error) {
			console.warn('Failed to load selected ship from localStorage:', error)
		}
	}, [setSelectedShipState])

	// Custom setter that also saves to localStorage
	const setSelectedShip = useCallback(
		(ship: Ship | null) => {
			setSelectedShipState(ship)
			try {
				if (ship) {
					localStorage.setItem('cargo-selected-ship', JSON.stringify(ship.name))
				} else {
					localStorage.removeItem('cargo-selected-ship')
				}
			} catch (error) {
				console.warn('Failed to save selected ship to localStorage:', error)
			}
		},
		[setSelectedShipState],
	)

	const clearContainers = useCallback(() => {
		setContainers([])
	}, [])

	// When route type changes to loop, clear end location
	const handleSetRouteType = useCallback((type: RouteType) => {
		setRouteType(type)
		if (type === 'loop') {
			setEndLocation(null)
		}
	}, [])

	const resetCargo = useCallback(() => {
		setSelectedShip(null)
		setContainers([])
		setHaulingMode(HaulingMode.CONTRACT)
		setRouteType('loop')
		setEndLocation(null)
	}, [setSelectedShip])

	// Effect to sync localStorage when ships data might change (for development)
	useEffect(() => {
		if (
			selectedShip &&
			!ships.find((ship) => ship.name === selectedShip.name)
		) {
			// Selected ship no longer exists in ships data, clear it
			console.warn(
				`Selected ship "${selectedShip.name}" no longer exists, clearing selection`,
			)
			setSelectedShip(null)
		}
	}, [selectedShip, setSelectedShip])

	const value: CargoProviderType = useMemo(
		() => ({
			selectedShip,
			containers,
			haulingMode,
			routeType,
			endLocation,
			setSelectedShip,
			setContainers,
			clearContainers,
			setHaulingMode,
			setRouteType: handleSetRouteType,
			setEndLocation,
			resetCargo,
		}),
		[
			selectedShip,
			containers,
			haulingMode,
			routeType,
			endLocation,
			setSelectedShip,
			clearContainers,
			handleSetRouteType,
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

export { CargoProvider, useCargo }
