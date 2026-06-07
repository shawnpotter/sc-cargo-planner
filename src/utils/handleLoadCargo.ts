// @/utils/handleLoadCargo.ts
import { Ship, Container, Contract, RouteAlgorithm } from '@/constants/types'
import { findNextPosition } from '@/utils/findNextPosition'
import { optimizeRoute, OptimizedRoute } from '@/utils/routeOptimizer'
import type { Location } from '@/data/locations'
import {
	calculateOptimalContainerSize,
	HaulingMode,
} from '@/utils/calculateContainers'

interface HandleLoadCargoProps {
	contracts: Contract[]
	selectedShip: Ship
	setContainers: (containers: Container[]) => void
	setOptimizedRoute?: (route: OptimizedRoute | null) => void
	routeAlgorithm?: RouteAlgorithm
	haulingMode?: HaulingMode
	startLocation?: string
	endLocation?: string
	locations?: Location[]
}

export const handleLoadCargo = ({
	contracts,
	selectedShip,
	setContainers,
	setOptimizedRoute,
	routeAlgorithm = RouteAlgorithm.NEAREST_NEIGHBOR,
	haulingMode = HaulingMode.CONTRACT,
	startLocation,
	endLocation,
	locations,
}: HandleLoadCargoProps) => {
	setContainers([])
	setOptimizedRoute?.(null)

	if (contracts.length === 0) {
		return
	}

	const optimizedRoute = optimizeRoute(contracts, {
		algorithm: routeAlgorithm,
		startLocation,
		endLocation,
		locations,
	})

	// Store optimized route for UI components that render journey details.
	setOptimizedRoute?.(optimizedRoute)

	const newContainers: Container[] = []

	optimizedRoute.loadingOrder.forEach((loadStop) => {
		loadStop.cargo.forEach((cargoItem) => {
			const contract = contracts[cargoItem.contractIndex]
			let remainingUnits = cargoItem.quantity
			const isPending = cargoItem.isPending

			while (remainingUnits > 0) {
				const containerSize = calculateOptimalContainerSize(
					contract.maxContainerSize,
					remainingUnits,
					haulingMode,
				)

				const result = findNextPosition(
					containerSize,
					selectedShip,
					newContainers,
				)

				if (!result) {
					console.warn(
						`Unable to fit remaining ${remainingUnits} units for ` +
						`Contract ${cargoItem.contractIndex + 1}, ` +
						`${isPending ? 'will pickup at' : 'picked up at'} ${cargoItem.pickupLocation}, ` +
						`delivering to ${cargoItem.deliveryLocation}, ` +
						`Cargo: ${cargoItem.cargoType}`,
					)
					break
				}

				const newContainer: Container = {
					size: containerSize,
					contractIndex: cargoItem.contractIndex,
					deliveryIndex: cargoItem.deliveryPointIndex,
					position: result.position,
					rotated: result.rotated,
					gridIndex: result.gridIndex,
					isPending,
					pickupLocation: cargoItem.pickupLocation,
				}

				newContainers.push(newContainer)
				remainingUnits -= containerSize
			}
		})
	})

	setContainers(newContainers)
}
