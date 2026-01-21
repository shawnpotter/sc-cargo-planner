// @/utils/handleLoadCargo.ts
import { Ship, Container, Contract, RouteAlgorithm } from '@/constants/types'
import { findNextPosition } from '@/utils/findNextPosition'
import { optimizeRoute } from '@/utils/routeOptimizer'
import {
	calculateOptimalContainerSize,
	HaulingMode,
} from '@/utils/calculateContainers'

interface HandleLoadCargoProps {
	contracts: Contract[]
	selectedShip: Ship
	setContainers: (containers: Container[]) => void
	routeAlgorithm?: RouteAlgorithm
	haulingMode?: HaulingMode
	endLocation?: string
}

/**
 * Loads cargo containers onto a ship based on provided contracts and selected ship configuration.
 * Uses global route optimization and FILO loading order for optimal container placement.
 *
 * @param contracts - Array of contract objects, each containing delivery points and cargo details.
 * @param selectedShip - The ship object onto which containers will be loaded.
 * @param setContainers - State setter function to update the list of loaded containers.
 * @param routeAlgorithm - Algorithm used to optimize delivery routes. Defaults to NEAREST_NEIGHBOR.
 * @param haulingMode - Mode determining how cargo is hauled. Defaults to HaulingMode.CONTRACT.
 * @param endLocation - Optional end location for open path routes. If not specified, route returns to origin (closed loop).
 *
 * @remarks
 * - Clears existing containers before loading new ones.
 * - Uses global route optimization to determine a single optimal route for all contracts.
 * - Supports both closed loop (return to origin) and open path (end at specified location) routes.
 * - Loads containers in FILO order (first loaded = last delivered) for efficient unloading.
 * - Logs a warning if cargo cannot be fully loaded due to space constraints.
 */
export const handleLoadCargo = ({
	contracts,
	selectedShip,
	setContainers,
	routeAlgorithm = RouteAlgorithm.NEAREST_NEIGHBOR,
	haulingMode = HaulingMode.CONTRACT,
	endLocation,
}: HandleLoadCargoProps) => {
	// Reset container state
	setContainers([])

	if (contracts.length === 0) {
		return
	}

	// Get optimized route with FILO loading order
	const optimizedRoute = optimizeRoute(contracts, {
		algorithm: routeAlgorithm,
		endLocation,
	})

	// Accumulator for placed containers
	const newContainers: Container[] = []

	// Load cargo according to FILO order (first loaded = last delivered)
	optimizedRoute.loadingOrder.forEach((loadStop) => {
		loadStop.cargo.forEach((cargoItem) => {
			const contract = contracts[cargoItem.contractIndex]
			let remainingUnits = cargoItem.quantity

			while (remainingUnits > 0) {
				// Pick next container size
				const containerSize = calculateOptimalContainerSize(
					contract.maxContainerSize,
					remainingUnits,
					haulingMode
				)

				// Find placement on the ship
				const result = findNextPosition(
					containerSize,
					selectedShip,
					newContainers
				)

				// Stop if no space left
				if (!result) {
					console.warn(
						`Unable to fit remaining ${remainingUnits} units for ` +
							`Contract ${cargoItem.contractIndex + 1}, ` +
							`Delivery to ${loadStop.location}, ` +
							`Cargo: ${cargoItem.cargoType}`
					)
					break
				}

				// Create container record
				const newContainer: Container = {
					size: containerSize,
					contractIndex: cargoItem.contractIndex,
					deliveryIndex: cargoItem.deliveryPointIndex,
					position: result.position,
					rotated: result.rotated,
					gridIndex: result.gridIndex,
				}

				newContainers.push(newContainer)
				remainingUnits -= containerSize
			}
		})
	})

	setContainers(newContainers)
}
