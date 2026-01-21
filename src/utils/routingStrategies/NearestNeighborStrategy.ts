// @/utils/routingStrategies/NearestNeighborStrategy.ts
import { IRoutingStrategy } from '@/utils/routingStrategies/IRoutingStrategy'
import { RouteGraph } from '@/utils/graph'

export class NearestNeighborStrategy implements IRoutingStrategy {
	findRoute(
		start: string,
		destinations: string[],
		graph: RouteGraph
	): string[] {
		const route: string[] = [start]
		let current = start
		const unvisited = new Set(destinations)

		while (unvisited.size > 0) {
			let nextStop: string | null = null
			let minDistance = Infinity

			unvisited.forEach((destination) => {
				if (!graph.hasValidEdge(current, destination)) {
					return
				}

				if (graph.canVisit(current, destination, route)) {
					const distance = graph.getEdgeWeight(current, destination)
					if (distance < minDistance) {
						minDistance = distance
						nextStop = destination
					}
				}
			})

			if (nextStop === null) {
				const firstUnvisited = Array.from(unvisited)[0]
				if (!firstUnvisited) {
					throw new Error('No remaining destinations')
				}
				const planetName = graph.getPlanetaryConstraint(firstUnvisited)
				if (!planetName) {
					throw new Error(`No planetary constraint for ${firstUnvisited}`)
				}
				if (!route.includes(planetName)) {
					route.push(planetName)
					current = planetName
				} else {
					throw new Error(
						'Unable to find valid route to remaining destinations'
					)
				}
			} else {
				route.push(nextStop)
				unvisited.delete(nextStop)
				current = nextStop
			}
		}

		return route
	}
}
