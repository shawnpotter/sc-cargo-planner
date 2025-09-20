// @/hooks/useGraphData.ts
import { useState, useEffect } from 'react'
import { locations, Location } from '@/data/locations'
import { RouteGraph } from '@/utils/graph'

export interface GraphNode {
	id: string
	x: number
	y: number
	originalX: number
	originalY: number
	distortedX: number
	distortedY: number
	location: Location
}

export interface GraphEdge {
	source: string
	target: string
	weight: number
}

export function useGraphData() {
	const [nodes, setNodes] = useState<GraphNode[]>([])
	const [edges, setEdges] = useState<GraphEdge[]>([])

	useEffect(() => {
		const graph = new RouteGraph()

		// Get all locations including Stanton, planets, and ALL moons
		const allLocations = locations.filter(
			(loc) =>
				loc.isSelectable ||
				loc.type === 'STAR' ||
				loc.type === 'PLANET' ||
				loc.type === 'MOON' // Include all moons regardless of isSelectable
		)

		// Log moon information
		console.log('=== Loading Graph Data ===')
		const allMoons = locations.filter((loc) => loc.type === 'MOON')
		console.log(`Total moons in locations data: ${allMoons.length}`)
		allMoons.forEach((moon) => {
			console.log(
				`Moon: ${moon.name}, Parent: ${moon.parentObject}, Selectable: ${moon.isSelectable}`
			)
		})

		console.log(
			`\nMoons included in graph: ${
				allLocations.filter((loc) => loc.type === 'MOON').length
			}`
		)

		// Add selectable locations as nodes for the route graph
		const selectableLocations = locations.filter((loc) => loc.isSelectable)
		selectableLocations.forEach((location) => {
			graph.addNode({
				name: location.name,
				coordinates: location.coordinates,
				type: location.type as any,
				requiresPlanetaryVisit: location.requiresPlanetaryVisit,
			})
		})

		// Create edges based on location types
		// Create edges based on location types
		createEdges(graph, selectableLocations, locations)

		// Project to 2D
		const scale = 1e-10
		const projectedNodes: GraphNode[] = allLocations.map((location) => {
			const projX = location.coordinates.x * scale
			const projY = location.coordinates.y * scale

			return {
				id: location.name,
				x: projX,
				y: projY,
				originalX: projX,
				originalY: projY,
				distortedX: projX,
				distortedY: projY,
				location: location,
			}
		})

		// Normalize to canvas coordinates
		const padding = 100
		const canvasWidth = 1200
		const canvasHeight = 800

		const minX = Math.min(...projectedNodes.map((n) => n.originalX))
		const maxX = Math.max(...projectedNodes.map((n) => n.originalX))
		const minY = Math.min(...projectedNodes.map((n) => n.originalY))
		const maxY = Math.max(...projectedNodes.map((n) => n.originalY))

		const normalizedNodes = projectedNodes.map((node) => {
			// Normalize coordinates
			let normX =
				padding +
				((node.originalX - minX) / (maxX - minX)) * (canvasWidth - 2 * padding)
			let normY =
				padding +
				((node.originalY - minY) / (maxY - minY)) * (canvasHeight - 2 * padding)

			// Flip vertically by inverting only Y coordinate
			normY = canvasHeight - normY

			return {
				...node,
				x: normX,
				y: normY,
				originalX: normX,
				originalY: normY,
				distortedX: normX,
				distortedY: normY,
			}
		})

		// Create edge list
		const edgeList: GraphEdge[] = []
		selectableLocations.forEach((loc1) => {
			const neighbors = graph.getNeighbors(loc1.name)
			neighbors.forEach((neighbor) => {
				if (loc1.name < neighbor) {
					edgeList.push({
						source: loc1.name,
						target: neighbor,
						weight: graph.getEdgeWeight(loc1.name, neighbor),
					})
				}
			})
		})

		console.log(`\nFinal node count: ${normalizedNodes.length}`)
		console.log(`Final edge count: ${edgeList.length}`)

		setNodes(normalizedNodes)
		setEdges(edgeList)
	}, [])

	return { nodes, edges, setNodes }
}

// Helper to create edges between selectable locations
function createEdges(
	graph: RouteGraph,
	selectableLocations: Location[],
	allLocations: Location[]
) {
	for (const loc1 of selectableLocations) {
		for (const loc2 of selectableLocations) {
			if (loc1.name === loc2.name) continue

			if (shouldConnectLocations(loc1, loc2, allLocations)) {
				// Only add the edge if it doesn't already exist
				if (!graph.hasValidEdge(loc1.name, loc2.name)) {
					graph.addEdge(loc1.name, loc2.name)
				}
			}
		}
	}
}

function shouldConnectLocations(
	loc1: Location,
	loc2: Location,
	allLocations: Location[]
) {
	// Connect orbital stations and lagrange points
	if (
		(loc1.type === 'ORBITAL_STATION' ||
			loc1.type === 'LAGRANGE_POINT_STATION') &&
		(loc2.type === 'ORBITAL_STATION' || loc2.type === 'LAGRANGE_POINT_STATION')
	) {
		return true
	}

	// Connect surface locations on same parent (including moon surfaces)
	if (
		loc1.type === 'SURFACE_LOCATION' &&
		loc2.type === 'SURFACE_LOCATION' &&
		loc1.parentObject === loc2.parentObject
	) {
		return true
	}

	// Connect orbital stations to surface locations on same parent
	if (
		loc1.type === 'ORBITAL_STATION' &&
		loc2.type === 'SURFACE_LOCATION' &&
		loc1.parentObject === loc2.parentObject
	) {
		return true
	}

	// Connect moons to their parent planet's orbital stations
	if (
		loc1.type === 'MOON' &&
		loc2.type === 'ORBITAL_STATION' &&
		allLocations.find((l) => l.name === loc1.parentObject)?.name ===
			loc2.parentObject
	) {
		return true
	}

	// Connect surface locations on moons to the moon
	if (
		loc1.type === 'SURFACE_LOCATION' &&
		loc2.type === 'MOON' &&
		loc1.parentObject === loc2.name
	) {
		return true
	}

	return false
}
