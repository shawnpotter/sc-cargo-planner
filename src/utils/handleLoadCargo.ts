import { Ship, Container, Contract, RouteAlgorithm, RouteStop } from '@/constants/types'
import { voxelDimensionsMap } from '@/constants/dimensions'
import { findNextPosition } from '@/utils/findNextPosition'
import { optimizeRoute, createCargoSnapshot, type OptimizedRoute } from '@/utils/routeOptimizer'
import { getStopId } from '@/utils/stopIdentity'
import type { Location } from '@/data/locations'
import { STANDARD_CONTAINER_SIZES, HaulingMode } from '@/utils/calculateContainers'

export interface BuildCargoPlanInput {
	contracts: Contract[]
	selectedShip: Ship
	routeAlgorithm?: RouteAlgorithm
	haulingMode?: HaulingMode
	startLocation?: string
	endLocation?: string
	locations?: Location[]
}

export type CargoPlanResult =
	| { success: true; containers: Container[]; optimizedRoute: OptimizedRoute }
	| { success: false; error: string }

interface HandleLoadCargoProps extends BuildCargoPlanInput {
	setContainers: (containers: Container[]) => void
	setOptimizedRoute?: (route: OptimizedRoute | null) => void
}

const matchesCargo = (container: Container, operation: RouteStop['operations']['pickups'][number]) =>
	container.contractIndex === operation.contractIndex &&
	container.deliveryIndex === operation.deliveryPointIndex &&
	container.cargoTypeIndex === operation.cargoTypeIndex

/** Build every visit and placement locally. Failed generation exposes no partial plan. */
export function buildCargoPlan({ contracts, selectedShip, routeAlgorithm = RouteAlgorithm.NEAREST_NEIGHBOR,
	startLocation, endLocation, locations }: BuildCargoPlanInput): CargoPlanResult {
	try {
		if (!contracts.length) return { success: false, error: 'Add a contract before generating a plan.' }
		if (!Number.isFinite(selectedShip.totalCapacity) || selectedShip.totalCapacity <= 0 || !selectedShip.cargoGrids.length || selectedShip.cargoGrids.some((grid) =>
			![grid.width, grid.length, grid.height].every((dimension) => Number.isSafeInteger(dimension) && dimension > 0))) {
			return { success: false, error: 'Select a ship with valid cargo grids and capacity.' }
		}
		for (const [contractIndex, contract] of contracts.entries()) for (const point of contract.deliveryPoints) for (const cargo of point.cargo) {
			if (cargo.quantity > selectedShip.totalCapacity) return { success: false,
				error: `Contract ${contractIndex + 1}: ${cargo.cargoType} (${cargo.quantity} SCU) exceeds ${selectedShip.name}'s ${selectedShip.totalCapacity} SCU capacity. Choose a larger ship or change the contract.` }
		}
		const optimizedRoute = optimizeRoute(contracts, { algorithm: routeAlgorithm, startLocation, endLocation, locations, cargoCapacity: selectedShip.totalCapacity })
		const containers: Container[] = []
		let onboard: Container[] = []
		const deliveryStopFor = (pickup: RouteStop['operations']['pickups'][number]) =>
			optimizedRoute.stops.find((stop) => stop.operations.deliveries.some((delivery) =>
				delivery.contractIndex === pickup.contractIndex && delivery.deliveryPointIndex === pickup.deliveryPointIndex && delivery.cargoTypeIndex === pickup.cargoTypeIndex))
		const deliverySequence = new Map(optimizedRoute.stops.map((stop) => [getStopId(stop), stop.sequenceNumber]))

		for (const stop of optimizedRoute.stops) {
			const stopId = getStopId(stop)
			stop.cargoStateBefore = createCargoSnapshot(onboard, contracts)
			onboard = onboard.filter((container) => container.deliveryStopId !== stopId)
			const pickups = [...stop.operations.pickups].sort((a, b) =>
				(deliveryStopFor(b)?.sequenceNumber ?? 0) - (deliveryStopFor(a)?.sequenceNumber ?? 0))
			for (const pickup of pickups) {
				const deliveryStop = deliveryStopFor(pickup)
				if (!deliveryStop || deliveryStop.sequenceNumber <= stop.sequenceNumber) throw new Error(`Cannot deliver ${pickup.cargoType} before pickup. Correct its pickup and delivery locations.`)
				const contract = contracts[pickup.contractIndex]
				const currentSCU = onboard.reduce((sum, container) => sum + container.size, 0)
				if (currentSCU + pickup.quantity > selectedShip.totalCapacity) throw new Error(
					`Contract ${pickup.contractIndex + 1}: ${pickup.cargoType} at ${stop.location} would exceed ${selectedShip.name}'s ${selectedShip.totalCapacity} SCU capacity. Choose a larger ship or change the contracts.`)
				let remaining = pickup.quantity
				let index = 0
				while (remaining > 0) {
					let placed: Container | undefined
					for (const size of STANDARD_CONTAINER_SIZES) {
						if (size > contract.maxContainerSize || size > remaining) continue
						const result = findNextPosition(size, selectedShip, onboard, (candidate) => {
							if (candidate.position.y === 0) return true
							const [width, , depth] = voxelDimensionsMap[size]
							const candidateWidth = candidate.rotated ? depth : width
							const candidateDepth = candidate.rotated ? width : depth
							// A supporting box must stay onboard at least as long as the new box.
							return onboard.every((support) => {
								if ((support.gridIndex ?? 0) !== candidate.gridIndex) return true
								const [sw, sh, sd] = voxelDimensionsMap[support.size]
								if (support.position.y + sh !== candidate.position.y) return true
								const overlaps = candidate.position.x < support.position.x + (support.rotated ? sd : sw) && candidate.position.x + candidateWidth > support.position.x &&
									candidate.position.z < support.position.z + (support.rotated ? sw : sd) && candidate.position.z + candidateDepth > support.position.z
								return !overlaps || (deliverySequence.get(support.deliveryStopId ?? '') ?? 0) >= deliveryStop.sequenceNumber
							})
						})
						if (!result) continue
						placed = { id: `${pickup.contractIndex}:${pickup.deliveryPointIndex}:${pickup.cargoTypeIndex}:${index++}`,
							size, contractIndex: pickup.contractIndex, deliveryIndex: pickup.deliveryPointIndex,
							cargoTypeIndex: pickup.cargoTypeIndex, ...result, pickupStopId: stopId,
							deliveryStopId: getStopId(deliveryStop), pickupLocation: stop.location, isPending: stop.sequenceNumber !== 1 }
						break
					}
					if (!placed) throw new Error(`Unable to fit remaining ${remaining} SCU of ${pickup.cargoType} (Contract ${pickup.contractIndex + 1}, pickup ${stop.location}, delivery ${pickup.destinedFor}) on ${selectedShip.name}'s cargo grids. Choose a larger ship or change the contracts.`)
					containers.push(placed)
					onboard.push(placed)
					remaining -= placed.size
				}
				const packed = containers.filter((container) => matchesCargo(container, pickup)).reduce((sum, container) => sum + container.size, 0)
				if (packed !== pickup.quantity) throw new Error(`Cargo quantity mismatch for ${pickup.cargoType}. Regenerate the plan.`)
			}
			stop.cargoStateAfter = createCargoSnapshot(onboard, contracts)
		}
		if (onboard.length) throw new Error('The route leaves cargo undelivered. Correct the journey settings.')
		return { success: true, containers, optimizedRoute }
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'Unable to generate cargo plan.' }
	}
}

/** Compatibility adapter: callbacks receive a complete successful result only. */
export const handleLoadCargo = ({ setContainers, setOptimizedRoute, ...input }: HandleLoadCargoProps): CargoPlanResult => {
	const result = buildCargoPlan(input)
	if (result.success) {
		setContainers(result.containers)
		setOptimizedRoute?.(result.optimizedRoute)
	}
	return result
}
