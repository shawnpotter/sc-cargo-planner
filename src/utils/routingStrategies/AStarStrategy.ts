// @/utils/routingStrategies/AStarStrategy.ts
import { IRoutingStrategy } from '@/utils/routingStrategies/IRoutingStrategy'
import { RouteGraph } from '@/utils/graph'

/**
 * AStarStrategy implements an A* based routing strategy for constructing a route
 * through a graph of nodes (e.g., waypoints, stations, planets).
 *
 * The strategy repeatedly plans a shortest path (A* search) from the current
 * position to the next required destination. It respects planetary constraints
 * by routing to a parent planet first when a destination requires a visit to
 * that planet before visiting the destination node itself. As segments are
 * discovered they are appended to a global route while avoiding duplicate
 * consecutive nodes.
 *
 * Behavior summary:
 * - Uses A* search (findPathToDestination) with a heuristic based on direct
 *   distance provided by the graph.
 * - Honors visitability constraints via graph.canVisit when expanding neighbors.
 * - Ensures required planetary visits occur before visiting child nodes that
 *   require them.
 * - Appends segments to the constructed route while preventing duplicated
 *   consecutive nodes.
 *
 * Public API:
 * - findRoute(start, destinations, graph): Computes and returns an ordered list
 *   of node identifiers representing the full route that visits all provided
 *   destinations (and any required planetary waypoints) starting from `start`.
 *
 * Error handling:
 * - If A* cannot find a path between the requested start and goal for any
 *   segment, the underlying search throws an Error describing the failed
 *   start/goal pair. The caller should handle or propagate this error.
 *
 * Implementation notes (internal helpers):
 * - findPathToDestination(start, goal, graph, currentRoute): Performs the A*
 *   search to produce a shortest path from start to goal. It tracks g-/f-
 *   scores, reconstructs the discovered path, and respects graph-specific
 *   visitation rules. This method throws when no path exists.
 * - heuristic(from, to, graph): Supplies the admissible heuristic value for A*
 *   based on direct distance between nodes as reported by the graph.
 * - getLowestFScore(openSet, fScore): Returns the node in the open set with
 *   the lowest f-score.
 * - reconstructPath(cameFrom, current): Reconstructs a path from the cameFrom
 *   map produced by the search.
 *
 * Threading / determinism:
 * - The algorithm is deterministic with respect to the graph and input
 *   destination ordering. It processes destinations in the order supplied by
 *   the caller, subject to any inserted planetary visits required by node
 *   constraints.
 *
 * @example
 * Typical usage:
 * const strategy = new AStarStrategy();
 * const route = strategy.findRoute("startNode", ["destA", "destB"], graph);
 *
 * @public
 */
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
