import type { RouteStop } from '@/constants/types'

/** A location can be visited more than once during a run. */
export function getStopId(stop: Pick<RouteStop, 'sequenceNumber' | 'location'>): string {
	return `${stop.sequenceNumber}:${stop.location}`
}
