// @/providers/CargoProvider.tsx
'use client'

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
} from 'react'
import { Ship, Container } from '@/constants/types'
import { HaulingMode } from '@/utils/calculateContainers'

interface CargoProviderType {
	selectedShip: Ship | null
	containers: Container[]
	haulingMode: HaulingMode

	// Ship management
	setSelectedShip: (ship: Ship | null) => void

	// Container management
	setContainers: (containers: Container[]) => void
	clearContainers: () => void

	// Hauling mode management
	setHaulingMode: (mode: HaulingMode) => void

	// Reset all cargo data
	resetCargo: () => void
}

const CargoContext = createContext<CargoProviderType | undefined>(undefined)

/**
 * Provides cargo management functionality for the application.
 *
 * The `CargoProvider` component manages the selected ship, container layout,
 * and hauling mode across different cargo-related pages. It provides a centralized
 * state management solution for cargo operations.
 *
 * @param children - React children to be rendered within the provider.
 *
 * @context
 * Provides the following context value:
 * - `selectedShip`: Currently selected ship for cargo operations
 * - `containers`: Array of containers currently loaded in the cargo hold
 * - `haulingMode`: Current hauling mode (CONTRACT, MULTI_TOOL, etc.)
 * - `setSelectedShip(ship)`: Sets the currently selected ship
 * - `setContainers(containers)`: Sets the container layout
 * - `clearContainers()`: Clears all containers from the cargo hold
 * - `setHaulingMode(mode)`: Sets the hauling mode
 * - `resetCargo()`: Resets all cargo-related state
 */
function CargoProvider({ children }: Readonly<{ children: React.ReactNode }>) {
	const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
	const [containers, setContainers] = useState<Container[]>([])
	const [haulingMode, setHaulingMode] = useState<HaulingMode>(
		HaulingMode.CONTRACT
	)

	const clearContainers = useCallback(() => {
		setContainers([])
	}, [])

	const resetCargo = useCallback(() => {
		setSelectedShip(null)
		setContainers([])
		setHaulingMode(HaulingMode.CONTRACT)
	}, [])

	const value: CargoProviderType = useMemo(
		() => ({
			selectedShip,
			containers,
			haulingMode,
			setSelectedShip,
			setContainers,
			clearContainers,
			setHaulingMode,
			resetCargo,
		}),
		[selectedShip, containers, haulingMode, clearContainers, resetCargo]
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
