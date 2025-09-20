// @/utils/routeOptimizer.ts
import { Contract, RouteAlgorithm } from '@/constants/types'
import { RouteGraph } from '@/utils/graph'
import { locations } from '@/data/locations'
import { NearestNeighborStrategy } from '@/utils/routingStrategies/NearestNeighborStrategy'
import { AStarStrategy } from '@/utils/routingStrategies/AStarStrategy'

/**
 * Optimizes the route for the given contracts using the specified algorithm.
 *
 * This function creates a route graph, adds all locations and edges between them,
 * and then uses the selected routing strategy to find the optimal route for each contract.
 *
 * @param {Contract[]} contracts - The contracts to optimize routes for.
 * @param {RouteAlgorithm} [algorithm=RouteAlgorithm.NEAREST_NEIGHBOR] - The routing algorithm to use.
 * @returns {string[][]} - An array of optimized routes for each contract.
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
