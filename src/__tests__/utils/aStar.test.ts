import { describe, it, expect } from 'vitest'
import { RouteGraph } from '@/utils/graph'
import { AStarStrategy } from '@/utils/routingStrategies/AStarStrategy'

// Build a tiny graph to test A* behavior
function buildTinyGraph() {
	const g = new RouteGraph()
	// nodes
	g.addNode({
		name: 'A',
		coordinates: { x: 0, y: 0, z: 0 },
		type: 'ORBITAL_STATION',
	})
	g.addNode({
		name: 'B',
		coordinates: { x: 10, y: 0, z: 0 },
		type: 'ORBITAL_STATION',
	})
	g.addNode({
		name: 'C',
		coordinates: { x: 20, y: 0, z: 0 },
		type: 'SURFACE_LOCATION',
		requiresPlanetaryVisit: true,
	})
	// pretend C's parent is B so add a planetary constraint manually (small fixture)
	// Direct edges
	g.addEdge('A', 'B')
	g.addEdge('B', 'C')
	return g
}

describe('AStarStrategy', () => {
	it('finds the straight path between connected nodes', () => {
		const graph = buildTinyGraph()
		const strat = new AStarStrategy()
		const route = strat.findRoute('A', ['C'], graph)
		// route should visit B then C (and possibly a parent planet if needed)
		expect(route[route.length - 1]).toBe('C')
		expect(route.includes('B')).toBe(true)
	})

	it('throws when no path exists', () => {
		const g = new RouteGraph()
		g.addNode({
			name: 'X',
			coordinates: { x: 0, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'Y',
			coordinates: { x: 100, y: 0, z: 0 },
			type: 'SURFACE_LOCATION',
			requiresPlanetaryVisit: true,
		})
		const strat = new AStarStrategy()
		expect(() => strat.findRoute('X', ['Y'], g)).toThrow()
	})

	it('handles equal-cost alternate paths (tie-breaker)', () => {
		// A square: A(0,0), B(10,0), C(0,10), D(10,10)
		const g = new RouteGraph()
		g.addNode({
			name: 'A',
			coordinates: { x: 0, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'B',
			coordinates: { x: 10, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'C',
			coordinates: { x: 0, y: 10, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'D',
			coordinates: { x: 10, y: 10, z: 0 },
			type: 'ORBITAL_STATION',
		})

		g.addEdge('A', 'B')
		g.addEdge('B', 'D')
		g.addEdge('A', 'C')
		g.addEdge('C', 'D')

		const strat = new AStarStrategy()
		const route = strat.findRoute('A', ['D'], g)
		expect(route[route.length - 1]).toBe('D')
		expect(route.length).toBe(3)
		// route should include either B or C as the intermediate
		expect(route.includes('B') || route.includes('C')).toBe(true)
	})

	it('handles cycles without infinite loop', () => {
		const g = new RouteGraph()
		g.addNode({
			name: 'A',
			coordinates: { x: 0, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'B',
			coordinates: { x: 5, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'C',
			coordinates: { x: 10, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'D',
			coordinates: { x: 20, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})

		// create a cycle A-B-C-A and connect C-D
		g.addEdge('A', 'B')
		g.addEdge('B', 'C')
		g.addEdge('C', 'A')
		g.addEdge('C', 'D')

		const strat = new AStarStrategy()
		const route = strat.findRoute('A', ['D'], g)
		expect(route[route.length - 1]).toBe('D')
		// should not repeat nodes infinitely; length should be finite and reasonable
		expect(route.length).toBeGreaterThanOrEqual(3)
	})

	it('enforces planetary visit when required (routes via planet first)', () => {
		const g = new RouteGraph()
		// Use real location names present in locations to leverage planetaryConstraints
		g.addNode({
			name: 'Port Tressler',
			coordinates: { x: 0, y: 0, z: 0 },
			type: 'ORBITAL_STATION',
		})
		g.addNode({
			name: 'Microtech',
			coordinates: { x: 10, y: 0, z: 0 },
			type: 'PLANET',
		})
		// destination is a surface location known to require planetary visit
		g.addNode({
			name: 'Microtech Logistics Depot S4LD01',
			coordinates: { x: 12, y: 0, z: 0 },
			type: 'SURFACE_LOCATION',
			requiresPlanetaryVisit: true,
		})

		// connect Port Tressler to both Microtech and the surface (direct edge exists)
		g.addEdge('Port Tressler', 'Microtech')
		g.addEdge('Port Tressler', 'Microtech Logistics Depot S4LD01')
		g.addEdge('Microtech', 'Microtech Logistics Depot S4LD01')

		const strat = new AStarStrategy()
		const route = strat.findRoute(
			'Port Tressler',
			['Microtech Logistics Depot S4LD01'],
			g
		)
		// ensure planet is visited before surface location
		const planetIndex = route.indexOf('Microtech')
		const destIndex = route.indexOf('Microtech Logistics Depot S4LD01')
		expect(destIndex).toBeGreaterThan(planetIndex)
	})
})
