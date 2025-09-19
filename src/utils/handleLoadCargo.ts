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
}
/**
 * Loads cargo containers onto a ship based on provided contracts and selected ship configuration.
 * Optimizes the delivery route and distributes cargo into containers according to the specified hauling mode and route algorithm.
 *
 * @param contracts - Array of contract objects, each containing delivery points and cargo details.
 * @param selectedShip - The ship object onto which containers will be loaded.
 * @param setContainers - State setter function to update the list of loaded containers.
 * @param routeAlgorithm - (Optional) Algorithm used to optimize delivery routes. Defaults to `RouteAlgorithm.NEAREST_NEIGHBOR`.
 * @param haulingMode - (Optional) Mode determining how cargo is hauled (e.g., by contract or other criteria). Defaults to `HaulingMode.CONTRACT`.
 *
 * @remarks
 * - Clears existing containers before loading new ones.
 * - Uses route optimization to determine the order of deliveries.
 * - Attempts to fit cargo into containers based on optimal sizing and ship capacity.
 * - Logs a warning if cargo cannot be fully loaded due to space constraints.
 * - Updates the container state with the newly loaded containers.
 */
export const handleLoadCargo = ({
	contracts,
	selectedShip,
	setContainers,
	routeAlgorithm = RouteAlgorithm.NEAREST_NEIGHBOR,
	haulingMode = HaulingMode.CONTRACT,
}: HandleLoadCargoProps) => {
	// reset container state
	setContainers([])

	// accumulator for placed containers
	const newContainers: Container[] = []

	// get optimized routes
	const optimizedRoutes = optimizeRoute(contracts, routeAlgorithm)

	optimizedRoutes.forEach((route, contractIndex) => {
		route.forEach((destination) => {
			const contract = contracts[contractIndex]
			const deliveryPoint = contract.deliveryPoints.find(
				(dp) => dp.location === destination
			)

			if (deliveryPoint) {
				// allocate each cargo type at this delivery point
				deliveryPoint.cargo.forEach((cargoItem, cargoTypeIndex) => {
					let remainingUnits = cargoItem.quantity

					while (remainingUnits > 0) {
						// pick next container size
						const containerSize = calculateOptimalContainerSize(
							contract.maxContainerSize,
							remainingUnits,
							haulingMode
						)

						// find placement on the ship
						const result = findNextPosition(
							containerSize,
							selectedShip,
							newContainers
						)

						// stop if no space left
						if (!result) {
							console.warn(
								`Unable to fit remaining ${remainingUnits} units for Contract ${
									contractIndex + 1
								}, Delivery to ${deliveryPoint.location}, Cargo: ${
									cargoItem.cargoType
								}`
							)
							break
						}

						// create container record
						const newContainer: Container = {
							size: containerSize,
							contractIndex,
							deliveryIndex: contract.deliveryPoints.indexOf(deliveryPoint),
							position: result.position,
							rotated: result.rotated,
							gridIndex: result.gridIndex,
							cargoTypeIndex,
						}

						newContainers.push(newContainer)
						remainingUnits -= containerSize
					}
				})
			}
		})
	})

	setContainers(newContainers)
}
