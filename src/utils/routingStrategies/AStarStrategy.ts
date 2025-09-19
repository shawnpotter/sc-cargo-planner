// @/utils/routingStrategies/AStarStrategy.ts
import { IRoutingStrategy } from '@/utils/routingStrategies/IRoutingStrategy'
import { RouteGraph } from '@/utils/graph'

export class AStarStrategy implements IRoutingStrategy {
	findRoute(
		start: string,
		destinations: string[],
		graph: RouteGraph
	): string[] {
		const route: string[] = []
		let current = start
		const remainingDestinations = [...destinations]

		while (remainingDestinations.length > 0) {
			const nextDestination = remainingDestinations[0]
			// If the destination requires a planetary visit and its parent planet
			// isn't in the current route yet, route to the planet first.
			const parentPlanet = graph.getPlanetaryConstraint(nextDestination)
			if (parentPlanet && !route.includes(parentPlanet)) {
				// find path to parent planet first
				const pathToPlanet = this.findPathToDestination(
					current,
					parentPlanet,
					graph,
					route
				)
				// Append path (avoid duplicating start)
				route.push(...pathToPlanet.slice(route.length ? 1 : 0))
				current = parentPlanet
				continue
			}

			const pathSegment = this.findPathToDestination(
				current,
				nextDestination,
				graph,
				route
			)

			// Remove the start point to avoid duplication
			route.push(...pathSegment.slice(route.length ? 1 : 0))
			current = nextDestination
			remainingDestinations.shift()
		}

		return route
	}

	private findPathToDestination(
		start: string,
		goal: string,
		graph: RouteGraph,
		currentRoute: string[]
	): string[] {
		const openSet = new Set([start])
		const cameFrom = new Map<string, string>()

		const gScore = new Map<string, number>()
		gScore.set(start, 0)

		const fScore = new Map<string, number>()
		fScore.set(start, this.heuristic(start, goal, graph))

		while (openSet.size > 0) {
			const current = this.getLowestFScore(openSet, fScore)

			if (current === goal) {
				return this.reconstructPath(cameFrom, current)
			}

			openSet.delete(current)

			for (const neighbor of graph.getNeighbors(current)) {
				if (!graph.canVisit(current, neighbor, currentRoute)) continue

				const tentativeGScore =
					gScore.get(current)! + graph.getEdgeWeight(current, neighbor)

				if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)!) {
					cameFrom.set(neighbor, current)
					gScore.set(neighbor, tentativeGScore)
					fScore.set(
						neighbor,
						tentativeGScore + this.heuristic(neighbor, goal, graph)
					)

					if (!openSet.has(neighbor)) {
						openSet.add(neighbor)
					}
				}
			}
		}

		throw new Error(`No path found from ${start} to ${goal}`)
	}

	private heuristic(from: string, to: string, graph: RouteGraph): number {
		return graph.getDirectDistance(from, to)
	}

	private getLowestFScore(
		openSet: Set<string>,
		fScore: Map<string, number>
	): string {
		let lowest = Infinity
		let lowestNode = ''

		openSet.forEach((node) => {
			const score = fScore.get(node) ?? Infinity
			if (score < lowest) {
				lowest = score
				lowestNode = node
			}
		})

		return lowestNode
	}

	private reconstructPath(
		cameFrom: Map<string, string>,
		current: string
	): string[] {
		const path = [current]
		while (cameFrom.has(current)) {
			current = cameFrom.get(current)!
			path.unshift(current)
		}
		return path
	}
}
