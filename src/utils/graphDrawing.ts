// @/utils/graphDrawing.ts
import { GraphNode, GraphEdge } from '@/hooks/useGraphData'
import { Transform } from '@/hooks/useCanvasInteraction'

interface DrawGraphOptions {
	nodes: GraphNode[]
	edges: GraphEdge[]
	transform: Transform
	hoveredNode: string | null
	selectedNode: string | null
	showLabels: boolean
	showWeights: boolean
	showEdges: boolean
}

export function drawGraph(
	ctx: CanvasRenderingContext2D,
	options: DrawGraphOptions
) {
	const {
		nodes,
		edges,
		transform,
		hoveredNode,
		selectedNode,
		showLabels,
		showWeights,
		showEdges,
	} = options

	// Fill black background
	ctx.fillStyle = '#000000'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

	const transformPoint = (x: number, y: number) => ({
		x: (x - 600) * transform.scale + 600 + transform.offsetX,
		y: (y - 400) * transform.scale + 400 + transform.offsetY,
	})

	// Draw orbital paths first (so they appear behind everything else)
	drawOrbitalPaths(ctx, nodes, transformPoint, transform)

	// Draw surface location groups (spheres of influence)
	drawSurfaceLocationGroups(ctx, nodes, transformPoint, transform)

	// Draw edges only if showEdges is true
	if (showEdges) {
		drawEdges(
			ctx,
			edges,
			nodes,
			transformPoint,
			transform,
			selectedNode,
			showWeights
		)
	}

	// Draw nodes
	drawNodes(
		ctx,
		nodes,
		transformPoint,
		transform,
		hoveredNode,
		selectedNode,
		showLabels
	)

	// Draw legend
	drawLegend(ctx)
}

function drawOrbitalPaths(
	ctx: CanvasRenderingContext2D,
	nodes: GraphNode[],
	transformPoint: (x: number, y: number) => { x: number; y: number },
	transform: Transform
) {
	// Create a map of nodes by name for quick lookup
	const nodesByName = new Map<string, GraphNode>()
	nodes.forEach((node) => {
		nodesByName.set(node.location.name, node)
	})

	// Find the star (center of the system)
	const star = nodes.find((n) => n.location.type === 'STAR')
	if (!star) return

	// Draw planetary orbits around the star
	nodes.forEach((node) => {
		if (node.location.type === 'PLANET') {
			const distance = Math.sqrt(
				Math.pow(node.distortedX - star.distortedX, 2) +
					Math.pow(node.distortedY - star.distortedY, 2)
			)
			const center = transformPoint(star.distortedX, star.distortedY)

			ctx.beginPath()
			ctx.arc(center.x, center.y, distance * transform.scale, 0, 2 * Math.PI)
			ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)' // Blue with low opacity
			ctx.lineWidth = 1
			ctx.stroke()
		}
	})

	// Draw moon and orbital station orbits around their parent planets
	nodes.forEach((node) => {
		if (
			(node.location.type === 'MOON' ||
				node.location.type === 'ORBITAL_STATION') &&
			node.location.parentObject
		) {
			const parentNode = nodesByName.get(node.location.parentObject)
			if (!parentNode || parentNode.location.type !== 'PLANET') return

			// Skip drawing moon orbits if zoom is below threshold
			if (node.location.type === 'MOON' && transform.scale < 0.8) return

			// Skip drawing orbital station orbits if zoom is below threshold
			if (node.location.type === 'ORBITAL_STATION' && transform.scale < 0.6)
				return

			const distance = Math.sqrt(
				Math.pow(node.distortedX - parentNode.distortedX, 2) +
					Math.pow(node.distortedY - parentNode.distortedY, 2)
			)
			const center = transformPoint(
				parentNode.distortedX,
				parentNode.distortedY
			)

			ctx.beginPath()
			ctx.arc(center.x, center.y, distance * transform.scale, 0, 2 * Math.PI)

			// Different colors for moons vs orbital stations
			if (node.location.type === 'MOON') {
				ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)' // Amber with low opacity
			} else {
				ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)' // Light blue with low opacity
			}

			ctx.lineWidth = 1
			ctx.stroke()
		}
	})
}

function drawSurfaceLocationGroups(
	ctx: CanvasRenderingContext2D,
	nodes: GraphNode[],
	transformPoint: (x: number, y: number) => { x: number; y: number },
	transform: Transform
) {
	const surfaceLocationGroups = new Map<string, GraphNode[]>()

	// Create a map of all nodes by name for parent lookup
	const nodesByName = new Map<string, GraphNode>()
	nodes.forEach((node) => {
		nodesByName.set(node.location.name, node)
	})

	// Group surface locations by their immediate parent (including moons)
	nodes.forEach((node) => {
		if (
			node.location.type === 'SURFACE_LOCATION' &&
			node.location.parentObject
		) {
			// Check if surface locations should be visible based on zoom
			if (transform.scale < 1.4) return // 140% zoom threshold

			if (!surfaceLocationGroups.has(node.location.parentObject)) {
				surfaceLocationGroups.set(node.location.parentObject, [])
			}
			surfaceLocationGroups.get(node.location.parentObject)!.push(node)
		}
	})

	surfaceLocationGroups.forEach((group, parentName) => {
		if (group.length > 0) {
			// Find the actual parent node using the complete node map
			const parentNode = nodesByName.get(parentName)

			if (parentNode) {
				// Skip drawing sphere of influence for moons if zoom is below threshold
				if (parentNode.location.type === 'MOON' && transform.scale < 0.8) {
					return // 80% zoom threshold for moons
				}

				// Use the parent's distorted position as the center
				const centerX = parentNode.distortedX
				const centerY = parentNode.distortedY

				// Calculate radius based on the surface locations' distance from their parent
				let maxDistance = 0
				group.forEach((node) => {
					const distance = Math.sqrt(
						Math.pow(node.distortedX - centerX, 2) +
							Math.pow(node.distortedY - centerY, 2)
					)
					maxDistance = Math.max(maxDistance, distance)
				})

				// Adjust padding and scale factor based on parent type
				// Reduced scale factor for moons to prevent overlap at high distortion
				const padding = parentNode.location.type === 'MOON' ? 5 : 20
				const scaleFactor = parentNode.location.type === 'MOON' ? 0.3 : 1.0

				const transformed = transformPoint(centerX, centerY)
				const radius = (maxDistance * scaleFactor + padding) * transform.scale

				// Draw circle
				ctx.beginPath()
				ctx.arc(transformed.x, transformed.y, radius, 0, 2 * Math.PI)
				// Different opacity for moons vs planets
				ctx.strokeStyle =
					parentNode.location.type === 'MOON'
						? 'rgba(156, 163, 175, 0.3)' // Lighter for moons
						: 'rgba(156, 163, 175, 0.5)' // Standard for planets
				ctx.lineWidth = parentNode.location.type === 'MOON' ? 1.5 : 2
				ctx.setLineDash([5, 5])
				ctx.stroke()
				ctx.setLineDash([])

				// Draw label (smaller for moons)
				ctx.fillStyle = '#e5e7eb' // Light gray for black background
				ctx.font = `${
					(parentNode.location.type === 'MOON' ? 10 : 14) * transform.scale
				}px sans-serif`
				ctx.textAlign = 'center'
				ctx.fillText(parentName, transformed.x, transformed.y - radius - 10)
			}
		}
	})
}

function drawEdges(
	ctx: CanvasRenderingContext2D,
	edges: GraphEdge[],
	nodes: GraphNode[],
	transformPoint: (x: number, y: number) => { x: number; y: number },
	transform: Transform,
	selectedNode: string | null,
	showWeights: boolean
) {
	edges.forEach((edge) => {
		const sourceNode = nodes.find((n) => n.id === edge.source)
		const targetNode = nodes.find((n) => n.id === edge.target)

		if (!sourceNode || !targetNode) return

		// Skip drawing edges to/from moons if zoom is below threshold
		if (
			(sourceNode.location.type === 'MOON' ||
				targetNode.location.type === 'MOON') &&
			transform.scale < 0.8
		) {
			return
		}

		// Skip drawing edges to/from surface locations if zoom is below threshold
		if (
			(sourceNode.location.type === 'SURFACE_LOCATION' ||
				targetNode.location.type === 'SURFACE_LOCATION') &&
			transform.scale < 1.4
		) {
			return
		}

		// Skip drawing edges to/from orbital stations if zoom is below threshold
		if (
			(sourceNode.location.type === 'ORBITAL_STATION' ||
				targetNode.location.type === 'ORBITAL_STATION') &&
			transform.scale < 0.6
		) {
			return
		}

		const source = transformPoint(sourceNode.distortedX, sourceNode.distortedY)
		const target = transformPoint(targetNode.distortedX, targetNode.distortedY)

		ctx.beginPath()
		ctx.moveTo(source.x, source.y)
		ctx.lineTo(target.x, target.y)

		if (
			selectedNode &&
			(edge.source === selectedNode || edge.target === selectedNode)
		) {
			ctx.strokeStyle = '#60a5fa' // Lighter blue for black background
			ctx.lineWidth = 2 * transform.scale
		} else {
			ctx.strokeStyle = '#374151' // Darker gray for better visibility on black
			ctx.lineWidth = 1 * transform.scale
		}

		ctx.stroke()

		if (showWeights && transform.scale > 0.5) {
			const midX = (source.x + target.x) / 2
			const midY = (source.y + target.y) / 2

			ctx.fillStyle = '#9ca3af' // Light gray for black background
			ctx.font = `${10 * transform.scale}px sans-serif`
			ctx.textAlign = 'center'
			ctx.fillText(
				Math.round(edge.weight / 1000000).toString() + 'M',
				midX,
				midY
			)
		}
	})
}

function drawNodes(
	ctx: CanvasRenderingContext2D,
	nodes: GraphNode[],
	transformPoint: (x: number, y: number) => { x: number; y: number },
	transform: Transform,
	hoveredNode: string | null,
	selectedNode: string | null,
	showLabels: boolean
) {
	const nodeColors = {
		PLANET: '#34d399',
		STAR: '#fbbf24',
		PLANET: '#3b82f6', // Blue for planets
		ORBITAL_STATION: '#60a5fa', // Brighter blue for black background
		LAGRANGE_POINT_STATION: '#a78bfa', // Brighter purple
		SURFACE_LOCATION: '#34d399', // Brighter green
		MOON: '#fbbf24', // Brighter amber
	}

	nodes.forEach((node) => {
		// Skip moons if zoom is below 80%
		if (node.location.type === 'MOON' && transform.scale < 0.8) {
			return
		}

		// Skip surface locations if zoom is below 140%
		if (node.location.type === 'SURFACE_LOCATION' && transform.scale < 1.4) {
			return
		}

		// Skip orbital stations if zoom is below 60%
		if (node.location.type === 'ORBITAL_STATION' && transform.scale < 0.6) {
			return
		}

		// Include nodes based on type
		if (
			!node.location.isSelectable &&
			node.location.type !== 'STAR' &&
			node.location.type !== 'MOON' &&
			node.location.type !== 'PLANET' // Include planets even if not selectable
		)
			return

		const transformed = transformPoint(node.distortedX, node.distortedY)

		// Calculate node size with inverse scaling for planets and star
		let nodeSize = 8
		let useInverseScaling = false

		if (node.location.type === 'STAR') {
			nodeSize = 12
			useInverseScaling = true
		} else if (node.location.type === 'PLANET') {
			nodeSize = 6
			useInverseScaling = true
		} else if (node.location.type === 'MOON') {
			nodeSize = 4
		} else if (node.location.type === 'SURFACE_LOCATION') {
			nodeSize = 2
		} else if (node.location.type === 'ORBITAL_STATION') {
			nodeSize = 4
		} else if (node.location.type === 'LAGRANGE_POINT_STATION') {
			nodeSize = 4
		}

		// Apply inverse scaling for planets and star
		let finalNodeSize
		if (useInverseScaling) {
			// Inverse scaling: smaller zoom = larger nodes
			const zoomAdjustment = 1.5 / Math.sqrt(transform.scale)
			finalNodeSize = nodeSize * zoomAdjustment
		} else {
			// Regular scaling for other node types
			finalNodeSize = nodeSize * transform.scale
		}

		ctx.beginPath()
		ctx.arc(transformed.x, transformed.y, finalNodeSize, 0, 2 * Math.PI)

		ctx.fillStyle = nodeColors[node.location.type] || '#9ca3af'

		if (node.id === hoveredNode) {
			ctx.fillStyle = '#ef4444'
		}
		if (node.id === selectedNode) {
			ctx.lineWidth =
				3 *
				(useInverseScaling ? 1.5 / Math.sqrt(transform.scale) : transform.scale)
			ctx.strokeStyle = '#ef4444'
			ctx.stroke()
		}

		ctx.fill()

		if (showLabels) {
			// Calculate responsive font size (inverse relationship with zoom)
			// Increased base font sizes for better visibility when zoomed in
			const baseFontSize =
				node.location.type === 'STAR'
					? 20 // Increased from 16
					: node.location.type === 'PLANET'
					? 18 // Increased from 14
					: node.location.type === 'MOON'
					? 16 // Increased from 12
					: node.location.type === 'SURFACE_LOCATION'
					? 14 // Increased from 10
					: 16 // Increased from 12

			// Inverse scaling: smaller zoom = larger text
			const zoomAdjustment = 1.5 / Math.sqrt(transform.scale)
			const fontSize = baseFontSize * zoomAdjustment

			// Different label size thresholds based on node type
			const labelSizeThreshold =
				node.location.type === 'STAR'
					? 0.1
					: node.location.type === 'PLANET'
					? 0.2
					: node.location.type === 'MOON'
					? 0.8
					: node.location.type === 'SURFACE_LOCATION'
					? 1.4
					: node.location.type === 'ORBITAL_STATION'
					? 0.6
					: node.location.type === 'LAGRANGE_POINT_STATION'
					? 0.6 // Changed from 0.3 to 0.6 (40% displayed zoom)
					: 0.3

			if (transform.scale > labelSizeThreshold) {
				ctx.fillStyle = '#f3f4f6' // Very light gray for labels
				ctx.font = `${fontSize}px sans-serif`
				ctx.textAlign = 'center'
				ctx.fillText(
					node.id,
					transformed.x,
					transformed.y - 12 * zoomAdjustment
				)
			}
		}
	})
}

function drawLegend(ctx: CanvasRenderingContext2D) {
	// Draw semi-transparent background for legend
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
	ctx.fillRect(10, 10, 900, 40) // Increased width for new items

	const legendY = 30
	const legendItems = [
		{ color: '#fbbf24', label: 'Star' },
		{ color: '#3b82f6', label: 'Planet' },
		{ color: '#fbbf24', label: 'Moon' },
		{ color: '#60a5fa', label: 'Orbital Station' },
		{ color: '#a78bfa', label: 'Lagrange Point' },
		{ color: '#34d399', label: 'Surface Location' },
	]

	legendItems.forEach((item, index) => {
		const x = 20 + index * 145
		ctx.beginPath()
		ctx.arc(x, legendY, 6, 0, 2 * Math.PI)
		ctx.fillStyle = item.color
		ctx.fill()

		ctx.fillStyle = '#f3f4f6' // Light text for black background
		ctx.font = '12px sans-serif'
		ctx.textAlign = 'left'
		ctx.fillText(item.label, x + 12, legendY + 4)
	})
}
