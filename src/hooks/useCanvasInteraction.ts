// @/hooks/useCanvasInteraction.ts
import { useState, useCallback } from 'react'
import { GraphNode } from '@/hooks/useGraphData'

export interface Transform {
	scale: number
	offsetX: number
	offsetY: number
}

/**
 * Custom React hook for managing interactive canvas transformations and node selection.
 *
 * This hook provides state and handlers for zooming, panning, hovering, and selecting nodes
 * on a canvas, supporting features such as:
 * - Zooming in/out with mouse wheel, with scale and offset calculations to keep the mouse position stable.
 * - Panning the canvas by dragging.
 * - Hit detection for hovering and selecting nodes, with zoom-based visibility and selectable logic.
 * - Utility for converting actual zoom to display zoom.
 * - Resetting the view to the default state.
 *
 * @returns An object containing:
 * - `transform`: The current canvas transformation (scale, offsetX, offsetY).
 * - `isDragging`: Whether the canvas is currently being dragged.
 * - `hoveredNode`: The ID of the currently hovered node, or `null`.
 * - `selectedNode`: The ID of the currently selected node, or `null`.
 * - `transformPoint(x, y)`: Function to transform a point according to the current canvas transformation.
 * - `handleWheel(e)`: Handler for mouse wheel events to zoom the canvas.
 * - `handleMouseDown(e)`: Handler for mouse down events to start panning.
 * - `handleMouseMove(e, nodes)`: Handler for mouse move events to pan or hover nodes.
 * - `handleMouseUp()`: Handler for mouse up events to stop panning.
 * - `handleCanvasClick(e, nodes)`: Handler for mouse click events to select nodes.
 * - `resetView()`: Function to reset the canvas view to its default state.
 * - `setIsDragging`: Setter for the dragging state.
 * - `setHoveredNode`: Setter for the hovered node.
 * - `getDisplayZoom(actualZoom)`: Utility to convert actual zoom to display zoom.
 *
 * @example
 * const canvasInteraction = useCanvasInteraction();
 * // Use handlers in your canvas component:
 * <canvas
 *   onWheel={canvasInteraction.handleWheel}
 *   onMouseDown={canvasInteraction.handleMouseDown}
 *   onMouseMove={(e) => canvasInteraction.handleMouseMove(e, nodes)}
 *   onMouseUp={canvasInteraction.handleMouseUp}
 *   onClick={(e) => canvasInteraction.handleCanvasClick(e, nodes)}
 * />
 */
export function useCanvasInteraction() {
	const [transform, setTransform] = useState<Transform>({
		scale: 0.6, // Start at 60% zoom (will display as 20%)
		offsetX: 0,
		offsetY: 0,
	})
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
	const [hoveredNode, setHoveredNode] = useState<string | null>(null)
	const [selectedNode, setSelectedNode] = useState<string | null>(null)

	// Helper to convert actual zoom to display zoom (0.4 = 0%, 1.0 = 60%, etc.)
	const getDisplayZoom = (actualZoom: number) => {
		return Math.max(0, (actualZoom - 0.4) / 0.6) // Maps 0.4-1.0 to 0-1
	}

	const transformPoint = useCallback(
		(x: number, y: number) => {
			return {
				x: (x - 600) * transform.scale + 600 + transform.offsetX,
				y: (y - 400) * transform.scale + 400 + transform.offsetY,
			}
		},
		[transform]
	)

	const handleWheel = useCallback(
		(e: React.WheelEvent<HTMLCanvasElement>) => {
			e.preventDefault()

			const canvas = e.currentTarget
			const rect = canvas.getBoundingClientRect()

			// Get mouse position relative to canvas
			const mouseX = e.clientX - rect.left
			const mouseY = e.clientY - rect.top

			// Calculate world coordinates of mouse position before zoom
			const worldX = (mouseX - 600 - transform.offsetX) / transform.scale + 600
			const worldY = (mouseY - 400 - transform.offsetY) / transform.scale + 400

			// Calculate new scale with minimum of 0.4 (40%)
			const delta = e.deltaY > 0 ? 0.9 : 1.1
			const newScale = Math.max(0.4, Math.min(5, transform.scale * delta))

			// Calculate new offset to keep mouse position stable
			const newOffsetX = mouseX - 600 - (worldX - 600) * newScale
			const newOffsetY = mouseY - 400 - (worldY - 400) * newScale

			setTransform({
				scale: newScale,
				offsetX: newOffsetX,
				offsetY: newOffsetY,
			})
		},
		[transform]
	)

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			setIsDragging(true)
			setDragStart({
				x: e.clientX - transform.offsetX,
				y: e.clientY - transform.offsetY,
			})
		},
		[transform.offsetX, transform.offsetY]
	)

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>, nodes: GraphNode[]) => {
			const canvas = e.currentTarget
			if (!canvas) return

			if (isDragging) {
				setTransform((prev) => ({
					...prev,
					offsetX: e.clientX - dragStart.x,
					offsetY: e.clientY - dragStart.y,
				}))
				return
			}

			const rect = canvas.getBoundingClientRect()
			const x = e.clientX - rect.left
			const y = e.clientY - rect.top

			const hoveredNode = nodes.find((node) => {
				// Check zoom-based visibility
				if (node.location.type === 'MOON' && transform.scale < 0.8) return false
				if (node.location.type === 'SURFACE_LOCATION' && transform.scale < 1.4)
					return false
				if (node.location.type === 'ORBITAL_STATION' && transform.scale < 0.6)
					return false

				if (
					!node.location.isSelectable &&
					node.location.type !== 'STAR' &&
					node.location.type !== 'PLANET'
				)
					// Allow hovering on planets
					return false

				const transformed = transformPoint(node.distortedX, node.distortedY)
				const distance = Math.sqrt(
					Math.pow(transformed.x - x, 2) + Math.pow(transformed.y - y, 2)
				)

				// Adjust hit detection based on node size
				let hitRadius = 8
				if (node.location.type === 'STAR') hitRadius = 12
				else if (node.location.type === 'PLANET') hitRadius = 6
				else if (node.location.type === 'MOON') hitRadius = 4
				else if (node.location.type === 'SURFACE_LOCATION') hitRadius = 2
				else if (node.location.type === 'ORBITAL_STATION') hitRadius = 4
				else if (node.location.type === 'LAGRANGE_POINT_STATION') hitRadius = 4

				return distance <= hitRadius * transform.scale
			})

			setHoveredNode(hoveredNode?.id || null)
			canvas.style.cursor = hoveredNode
				? 'pointer'
				: isDragging
				? 'grabbing'
				: 'grab'
		},
		[isDragging, dragStart, transform.scale, transformPoint]
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	const handleCanvasClick = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>, nodes: GraphNode[]) => {
			const canvas = e.currentTarget
			if (!canvas) return

			const rect = canvas.getBoundingClientRect()
			const x = e.clientX - rect.left
			const y = e.clientY - rect.top

			const clickedNode = nodes.find((node) => {
				// Check zoom-based visibility
				if (node.location.type === 'MOON' && transform.scale < 0.8) return false
				if (node.location.type === 'SURFACE_LOCATION' && transform.scale < 1.4)
					return false
				if (node.location.type === 'ORBITAL_STATION' && transform.scale < 0.6)
					return false

				if (
					!node.location.isSelectable &&
					node.location.type !== 'STAR' &&
					node.location.type !== 'PLANET'
				)
					// Allow clicking on planets
					return false

				const transformed = transformPoint(node.distortedX, node.distortedY)
				const distance = Math.sqrt(
					Math.pow(transformed.x - x, 2) + Math.pow(transformed.y - y, 2)
				)

				// Adjust hit detection based on node size
				let hitRadius = 8
				if (node.location.type === 'STAR') hitRadius = 12
				else if (node.location.type === 'PLANET') hitRadius = 6
				else if (node.location.type === 'MOON') hitRadius = 4
				else if (node.location.type === 'SURFACE_LOCATION') hitRadius = 2
				else if (node.location.type === 'ORBITAL_STATION') hitRadius = 4
				else if (node.location.type === 'LAGRANGE_POINT_STATION') hitRadius = 4

				return distance <= hitRadius * transform.scale
			})

			setSelectedNode(clickedNode?.id || null)
		},
		[transform.scale, transformPoint]
	)

	const resetView = useCallback(() => {
		setTransform({ scale: 0.6, offsetX: 0, offsetY: 0 })
	}, [])

	return {
		transform,
		isDragging,
		hoveredNode,
		selectedNode,
		transformPoint,
		handleWheel,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleCanvasClick,
		resetView,
		setIsDragging,
		setHoveredNode,
		getDisplayZoom,
	}
}
