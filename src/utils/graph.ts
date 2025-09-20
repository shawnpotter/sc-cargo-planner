// @/utils/graph.ts
/**
 * Represents a location node in the route graph.
 */
import { locations } from '@/data/locations'

export interface LocationNode {
	name: string
	coordinates: {
		x: number
		y: number
		z: number
	}
	// Extend allowed types to match src/constants/locations.ts
	type:
		| 'PLANET'
		| 'MOON'
		| 'SURFACE_LOCATION'
		| 'ORBITAL_STATION'
		| 'LAGRANGE_POINT_STATION'
		| 'STAR'
	requiresPlanetaryVisit?: boolean
}

/**
 * Represents a graph structure for routing between locations, supporting planetary constraints and optimal route finding.
 *
 * The `RouteGraph` class manages a set of location nodes and weighted edges between them, allowing for the modeling of
 * planetary systems with surface locations, planets, and moons. It supports adding nodes and edges, calculating distances,
 * and finding optimal routes between a starting location and multiple destinations, considering planetary entry/exit penalties
 * and required planetary visits.
 *
 * Nodes are connected based on their parent planetary objects, and edges are weighted by Euclidean distance plus optional
 * penalties for entering or leaving planetary atmospheres. The graph supports querying for neighbors, edge weights, and
 * planetary constraints, as well as validating route feasibility.
 *
 * Typical usage involves building the graph from a canonical locations list, adding nodes and edges, and then using
 * `findOptimalRoute` to determine the best path between locations.
 */
export class RouteGraph {
	private readonly nodes: Map<string, LocationNode>
	private readonly edges: Map<string, Map<string, number>>
	private readonly planetaryConstraints: Map<string, string>

	constructor() {
		this.nodes = new Map()
		this.edges = new Map()
		this.planetaryConstraints = new Map()

		// Build planetary constraints from canonical locations list (uses parentObject)
		for (const loc of locations) {
			if (loc.parentObject) {
				this.planetaryConstraints.set(loc.name, loc.parentObject)
			}
		}
	}

	/**
	 * Adds a node to the graph.
	 *
	 * @param {LocationNode} node - The location node to add.
	 */
	addNode(node: LocationNode): void {
		this.nodes.set(node.name, node)
		if (!this.edges.has(node.name)) {
			this.edges.set(node.name, new Map())
		}

		// If this node maps to a parentObject (planet/moon/etc) and that parent already exists, connect them
		const parent = this.planetaryConstraints.get(node.name)
		if (parent && this.nodes.has(parent)) {
			// addEdge will validate both nodes exist and set bi-directional weight
			this.addEdge(node.name, parent)
		}

		// If this is a planet/moon node, connect it to any already-added child locations
		if (node.type === 'PLANET' || node.type === 'MOON') {
			for (const [
				childName,
				parentName,
			] of this.planetaryConstraints.entries()) {
				if (parentName === node.name && this.nodes.has(childName)) {
					this.addEdge(childName, node.name)
				}
			}
		}
	}

	/**
	 * Adds an edge between two nodes in the graph.
	 *
	 * @param {string} from - The name of the starting node.
	 * @param {string} to - The name of the ending node.
	 * @throws {Error} - If one or both nodes do not exist.
	 */
	addEdge(from: string, to: string): void {
		if (!this.nodes.has(from) || !this.nodes.has(to)) {
			throw new Error(
				`Cannot add edge between ${from} and ${to}: one or both nodes don't exist`
			)
		}

		const distance = this.calculateDistance(
			this.nodes.get(from)!,
			this.nodes.get(to)!
		)

		// Add additional weight for planetary entry/exit
		let weight = distance
		const fromNode = this.nodes.get(from)!
		const toNode = this.nodes.get(to)!

		if (
			fromNode.type === 'SURFACE_LOCATION' &&
			toNode.type !== 'SURFACE_LOCATION'
		) {
			weight += 500000 // Penalty for leaving atmosphere
		}
		if (
			fromNode.type !== 'SURFACE_LOCATION' &&
			toNode.type === 'SURFACE_LOCATION'
		) {
			weight += 500000 // Penalty for entering atmosphere
		}

		// Ensure both edge maps exist
		if (!this.edges.has(from)) {
			this.edges.set(from, new Map())
		}
		if (!this.edges.has(to)) {
			this.edges.set(to, new Map())
		}

		// Set bi-directional edges
		this.edges.get(from)!.set(to, weight)
		this.edges.get(to)!.set(from, weight)
	}

	/**
	 * Calculates the distance between two nodes.
	 *
	 * @param {LocationNode} from - The starting node.
	 * @param {LocationNode} to - The ending node.
	 * @returns {number} - The distance between the nodes.
	 */
	private calculateDistance(from: LocationNode, to: LocationNode): number {
		return Math.sqrt(
			Math.pow(to.coordinates.x - from.coordinates.x, 2) +
				Math.pow(to.coordinates.y - from.coordinates.y, 2) +
				Math.pow(to.coordinates.z - from.coordinates.z, 2)
		)
	}

	/**
	 * Finds the optimal route from a start location to multiple destinations.
	 *
	 * @param {string} start - The starting location.
	 * @param {string[]} destinations - The list of destination locations.
	 * @returns {string[]} - The optimal route as an array of location names.
	 * @throws {Error} - If the start location is not found in the graph.
	 */
	findOptimalRoute(start: string, destinations: string[]): string[] {
		if (!this.nodes.has(start)) {
			throw new Error(`Start location ${start} not found in graph`)
		}

		const route: string[] = [start]
		let current = start
		const unvisited = new Set(destinations)

		while (unvisited.size > 0) {
			let nextStop: string | null = null
			let minDistance = Infinity

			unvisited.forEach((destination) => {
				if (
					!this.edges.has(current) ||
					!this.edges.get(current)!.has(destination)
				) {
					return // Skip if there's no valid edge
				}

				// Check if we can visit this destination
				if (this.canVisit(current, destination, route)) {
					const distance = this.edges.get(current)!.get(destination)!
					if (distance < minDistance) {
						minDistance = distance
						nextStop = destination
					}
				}
			})

			if (nextStop === null) {
				// If we can't visit any remaining destination directly, visit its parent planet first
				const firstUnvisited = Array.from(unvisited)[0]
				const planetName = this.planetaryConstraints.get(firstUnvisited)
				if (!planetName) {
					throw new Error(
						`Unable to determine planetary hub for ${firstUnvisited}`
					)
				}
				if (!this.nodes.has(planetName)) {
					throw new Error(
						`Planet node ${planetName} (parent of ${firstUnvisited}) not present in graph`
					)
				}
				if (!route.includes(planetName)) {
					route.push(planetName)
					current = planetName
				} else {
					throw new Error(
						`Unable to find valid route to remaining destinations`
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

	/**
	 * Checks if there is a valid edge between two nodes.
	 *
	 * @param {string} from - The starting node.
	 * @param {string} to - The ending node.
	 * @returns {boolean} - True if there is a valid edge, otherwise false.
	 */
	hasValidEdge(from: string, to: string): boolean {
		return this.edges.has(from) && this.edges.get(from)!.has(to)
	}

	/**
	 * Gets the weight of the edge between two nodes.
	 *
	 * @param {string} from - The starting node.
	 * @param {string} to - The ending node.
	 * @returns {number} - The weight of the edge.
	 */
	getEdgeWeight(from: string, to: string): number {
		return this.edges.get(from)!.get(to)!
	}

	/**
	 * Gets the direct distance between two nodes.
	 *
	 * @param {string} from - The starting node.
	 * @param {string} to - The ending node.
	 * @returns {number} - The direct distance between the nodes.
	 */
	getDirectDistance(from: string, to: string): number {
		return this.calculateDistance(this.nodes.get(from)!, this.nodes.get(to)!)
	}

	/**
	 * Gets the planetary constraint for a location.
	 *
	 * @param {string} location - The location name.
	 * @returns {string} - The planetary constraint.
	 */
	getPlanetaryConstraint(location: string): string | undefined {
		return this.planetaryConstraints.get(location)
	}

	/**
	 * Gets the neighbors of a node.
	 *
	 * @param {string} node - The node name.
	 * @returns {string[]} - The neighbors of the node.
	 */
	getNeighbors(node: string): string[] {
		return Array.from(this.edges.get(node)?.keys() ?? [])
	}

	/**
	 * Checks if a node can be visited based on the current route.
	 *
	 * @param {string} from - The starting node.
	 * @param {string} to - The ending node.
	 * @param {string[]} currentRoute - The current route.
	 * @returns {boolean} - True if the node can be visited, otherwise false.
	 */
	canVisit(from: string, to: string, currentRoute: string[]): boolean {
		const toNode = this.nodes.get(to)!
		if (toNode.requiresPlanetaryVisit) {
			const planet = this.planetaryConstraints.get(to)
			return planet ? currentRoute.includes(planet) : true
		}
		return true
	}
}
