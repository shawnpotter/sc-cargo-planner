// @/utils/routeOptimizer.ts
import { Contract, RouteAlgorithm } from '@/constants/types'
import { RouteGraph } from '@/utils/graph'
import { locations } from '@/data/locations'
import { NearestNeighborStrategy } from '@/utils/routingStrategies/NearestNeighborStrategy'
import { AStarStrategy } from '@/utils/routingStrategies/AStarStrategy'

/**
 * Optimize delivery routes for a list of contracts.
 *
 * This function builds a RouteGraph from the available locations, connects every
 * distinct pair of locations by adding edges, selects a route-finding strategy
 * (A* or Nearest Neighbor) based on the provided algorithm parameter, and then
 * computes an ordered route for each contract.
 *
 * Behavior:
 * - For each known location a node is added to the internal graph.
 * - For every pair of distinct locations an edge is added (errors while adding
 *   edges are caught and logged).
 * - The selected strategy's findRoute method is invoked for each contract with
 *   the contract origin and the contract's delivery point locations as
 *   destinations.
 * - If strategy.findRoute throws, the error is caught and logged and a fallback
 *   route consisting of the origin followed by all destinations in their
 *   original order is returned for that contract.
 *
 * Side effects:
 * - Console error messages may be emitted when node/edge additions or route
 *   computation fail.
 *
 * @param contracts - Array of contracts to optimize routes for. Each contract's
 *   origin and deliveryPoints (their locations) will be used to compute a route.
 * @param algorithm - Optional algorithm selector; defaults to
 *   RouteAlgorithm.NEAREST_NEIGHBOR. If RouteAlgorithm.A_STAR is provided, the
 *   A* strategy is used; otherwise, the nearest-neighbor strategy is used.
 *
 * @returns An array of routes (one per contract). Each route is an array of
 *   location names (strings) representing the visiting order, starting from the
 *   contract origin. If route computation fails for a contract, a fallback
 *   route of [origin, ...destinations] is returned for that contract.
 *
 * @remarks
 * - The function assumes a globally available collection of locations is used
 *   when constructing the graph (nodes and edges).
 * - Route computation is delegated to RouteGraph, AStarStrategy, and
 *   NearestNeighborStrategy implementations.
 *
 * @example
 * // returns an array of routes, one per contract
 * const routes = optimizeRoute(contracts, RouteAlgorithm.A_STAR);
 */
export const optimizeRoute = (
	contracts: Contract[],
	algorithm: RouteAlgorithm = RouteAlgorithm.NEAREST_NEIGHBOR
): string[][] => {
	const graph = new RouteGraph()

	// Add all locations to the graph
	locations.forEach((location) => {
		graph.addNode(location)
	})

	// Add edges between all locations
	locations.forEach((from) => {
		locations.forEach((to) => {
			if (from.name !== to.name) {
				try {
					graph.addEdge(from.name, to.name)
				} catch (error) {
					console.error(
						`Failed to add edge between ${from.name} and ${to.name}:`,
						error
					)
				}
			}
		})
	})

	const strategy =
		algorithm === RouteAlgorithm.A_STAR
			? new AStarStrategy()
			: new NearestNeighborStrategy()

	return contracts.map((contract) => {
		const destinations = contract.deliveryPoints.map((point) => point.location)
		try {
			return strategy.findRoute(contract.origin, destinations, graph)
		} catch (error) {
			console.error('Failed to find optimal route:', error)
			return [contract.origin, ...destinations]
		}
	})
}
