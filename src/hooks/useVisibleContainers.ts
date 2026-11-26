import { useMemo } from 'react'
import type { Container, StopStatus, RouteStop } from '@/constants/types'
import { getStopId } from '@/utils/stopIdentity'

const matchesOperation = (container: Container, operation: Pick<RouteStop['operations']['pickups'][number], 'contractIndex' | 'deliveryPointIndex' | 'cargoTypeIndex'>) =>
	container.contractIndex === operation.contractIndex && container.deliveryIndex === operation.deliveryPointIndex &&
	(operation.cargoTypeIndex === undefined || container.cargoTypeIndex === operation.cargoTypeIndex)

/** Visit identities keep a return to a pickup location independent of its first visit. */
export function getVisibleContainers(containers: Container[], stopStatuses: Record<string, StopStatus>, stops: RouteStop[]): Container[] {
	if (!stops.length) return containers
	return containers.filter((container) => {
		const pickupStop = stops.find((stop) => container.pickupStopId
			? getStopId(stop) === container.pickupStopId
			: stop.operations.pickups.some((operation) => matchesOperation(container, operation)))
		const deliveryStop = stops.find((stop) => container.deliveryStopId
			? getStopId(stop) === container.deliveryStopId
			: stop.operations.deliveries.some((operation) => matchesOperation(container, operation)))
		if (deliveryStop && stopStatuses[getStopId(deliveryStop)] === 'completed') return false
		if (!pickupStop) return true
		const status = stopStatuses[getStopId(pickupStop)] ?? 'idle'
		// At a combined visit, complete unloading before showing boxes using the freed space.
		if (pickupStop.operations.deliveries.length) return status === 'completed'
		return status === 'in-progress' || status === 'completed'
	})
}

export function useVisibleContainers(containers: Container[], stopStatuses: Record<string, StopStatus>, stops: RouteStop[]): Container[] {
	return useMemo(() => getVisibleContainers(containers, stopStatuses, stops), [containers, stopStatuses, stops])
}
