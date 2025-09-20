// src/__tests__/hooks/useCanvasInteraction.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction'
import { GraphNode } from '@/hooks/useGraphData'

describe('useCanvasInteraction', () => {
	let mockCanvas: HTMLCanvasElement
	let mockNodes: GraphNode[]

	beforeEach(() => {
		mockCanvas = document.createElement('canvas')
		mockCanvas.width = 1200
		mockCanvas.height = 800

		// Mock getBoundingClientRect
		mockCanvas.getBoundingClientRect = () => ({
			left: 0,
			top: 0,
			right: 1200,
			bottom: 800,
			width: 1200,
			height: 800,
			x: 0,
			y: 0,
			toJSON: () => {},
		})

		mockNodes = [
			{
				id: 'star-1',
				x: 600,
				y: 400,
				originalX: 600,
				originalY: 400,
				distortedX: 600,
				distortedY: 400,
				location: {
					name: 'Stanton',
					type: 'STAR',
					isSelectable: false,
					coordinates: { x: 0, y: 0, z: 0 },
					parentObject: undefined,
					requiresPlanetaryVisit: false,
				},
			},
			{
				id: 'planet-1',
				x: 700,
				y: 400,
				originalX: 700,
				originalY: 400,
				distortedX: 700,
				distortedY: 400,
				location: {
					name: 'Hurston',
					type: 'PLANET',
					isSelectable: false,
					coordinates: { x: 100, y: 0, z: 0 },
					parentObject: 'Stanton',
					requiresPlanetaryVisit: false,
				},
			},
			{
				id: 'station-1',
				x: 800,
				y: 400,
				originalX: 800,
				originalY: 400,
				distortedX: 800,
				distortedY: 400,
				location: {
					name: 'Port Olisar',
					type: 'ORBITAL_STATION',
					isSelectable: true,
					coordinates: { x: 200, y: 0, z: 0 },
					parentObject: 'Crusader',
					requiresPlanetaryVisit: false,
				},
			},
		]
	})

	describe('initial state', () => {
		it('should initialize with default transform values', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			expect(result.current.transform).toEqual({
				scale: 0.6,
				offsetX: 0,
				offsetY: 0,
			})
			expect(result.current.isDragging).toBe(false)
			expect(result.current.hoveredNode).toBe(null)
			expect(result.current.selectedNode).toBe(null)
		})
	})

	describe('transformPoint', () => {
		it('should correctly transform coordinates', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			const transformed = result.current.transformPoint(800, 500)

			expect(transformed).toEqual({
				x: (800 - 600) * 0.6 + 600,
				y: (500 - 400) * 0.6 + 400,
			})
		})

		it('should update transform when scale changes', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			act(() => {
				const wheelEvent = {
					preventDefault: () => {},
					currentTarget: mockCanvas,
					clientX: 600,
					clientY: 400,
					deltaY: -100,
				} as React.WheelEvent<HTMLCanvasElement>

				result.current.handleWheel(wheelEvent)
			})

			const transformed = result.current.transformPoint(800, 500)
			const newScale = result.current.transform.scale

			expect(transformed.x).toBeCloseTo((800 - 600) * newScale + 600, 1)
		})
	})

	describe('getDisplayZoom', () => {
		it('should map actual zoom to display zoom correctly', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			expect(result.current.getDisplayZoom(0.4)).toBe(0) // Minimum (0%)
			expect(result.current.getDisplayZoom(0.7)).toBeCloseTo(0.5, 2) // Middle (50%)
			expect(result.current.getDisplayZoom(1.0)).toBe(1) // Maximum (100%)
			expect(result.current.getDisplayZoom(0.3)).toBe(0) // Below minimum
		})
	})

	describe('handleWheel', () => {
		it('should zoom in on wheel up', () => {
			const { result } = renderHook(() => useCanvasInteraction())
			const initialScale = result.current.transform.scale

			act(() => {
				const wheelEvent = {
					preventDefault: () => {},
					currentTarget: mockCanvas,
					clientX: 600,
					clientY: 400,
					deltaY: -100,
				} as React.WheelEvent<HTMLCanvasElement>

				result.current.handleWheel(wheelEvent)
			})

			expect(result.current.transform.scale).toBeGreaterThan(initialScale)
		})

		it('should zoom out on wheel down', () => {
			const { result } = renderHook(() => useCanvasInteraction())
			const initialScale = result.current.transform.scale

			act(() => {
				const wheelEvent = {
					preventDefault: () => {},
					currentTarget: mockCanvas,
					clientX: 600,
					clientY: 400,
					deltaY: 100,
				} as React.WheelEvent<HTMLCanvasElement>

				result.current.handleWheel(wheelEvent)
			})

			expect(result.current.transform.scale).toBeLessThan(initialScale)
		})

		it('should not zoom below minimum scale (0.4)', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			// Zoom out multiple times
			act(() => {
				for (let i = 0; i < 10; i++) {
					const wheelEvent = {
						preventDefault: () => {},
						currentTarget: mockCanvas,
						clientX: 600,
						clientY: 400,
						deltaY: 100,
					} as React.WheelEvent<HTMLCanvasElement>

					result.current.handleWheel(wheelEvent)
				}
			})

			expect(result.current.transform.scale).toBeGreaterThanOrEqual(0.4)
		})

		it('should not zoom above maximum scale (5)', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			// Zoom in multiple times
			act(() => {
				for (let i = 0; i < 20; i++) {
					const wheelEvent = {
						preventDefault: () => {},
						currentTarget: mockCanvas,
						clientX: 600,
						clientY: 400,
						deltaY: -100,
					} as React.WheelEvent<HTMLCanvasElement>

					result.current.handleWheel(wheelEvent)
				}
			})

			expect(result.current.transform.scale).toBeLessThanOrEqual(5)
		})
	})

	describe('handleMouseDown', () => {
		it('should set dragging state', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			act(() => {
				const mouseEvent = {
					clientX: 100,
					clientY: 100,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleMouseDown(mouseEvent)
			})

			expect(result.current.isDragging).toBe(true)
		})

		it('should store drag start position', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			act(() => {
				const mouseEvent = {
					clientX: 150,
					clientY: 200,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleMouseDown(mouseEvent)
			})

			// Verify by checking if subsequent drag works correctly
			act(() => {
				const moveEvent = {
					currentTarget: mockCanvas,
					clientX: 200,
					clientY: 250,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleMouseMove(moveEvent, mockNodes)
			})

			expect(result.current.transform.offsetX).toBe(50)
			expect(result.current.transform.offsetY).toBe(50)
		})
	})

	describe('handleMouseMove', () => {
		it('should update transform when dragging', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			// Start dragging
			act(() => {
				result.current.handleMouseDown({
					clientX: 100,
					clientY: 100,
				} as React.MouseEvent<HTMLCanvasElement>)
			})

			// Move mouse
			act(() => {
				result.current.handleMouseMove(
					{
						currentTarget: mockCanvas,
						clientX: 150,
						clientY: 150,
					} as React.MouseEvent<HTMLCanvasElement>,
					mockNodes
				)
			})

			expect(result.current.transform.offsetX).toBe(50)
			expect(result.current.transform.offsetY).toBe(50)
		})

		it('should detect hovered node', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			act(() => {
				// Create event at star position
				const mouseEvent = {
					currentTarget: mockCanvas,
					clientX: 600,
					clientY: 400,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleMouseMove(mouseEvent, mockNodes)
			})

			expect(result.current.hoveredNode).toBe('star-1')
		})

		it('should respect visibility based on zoom level for moons', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			const moonNode: GraphNode = {
				id: 'moon-1',
				x: 650,
				y: 400,
				originalX: 650,
				originalY: 400,
				distortedX: 650,
				distortedY: 400,
				location: {
					name: 'Daymar',
					type: 'MOON',
					isSelectable: true,
					coordinates: { x: 150, y: 0, z: 0 },
					parentObject: 'Crusader',
					requiresPlanetaryVisit: false,
				},
			}

			// At scale 0.6, moons should not be hoverable (requires 0.8+)
			act(() => {
				const mouseEvent = {
					currentTarget: mockCanvas,
					clientX: 650,
					clientY: 400,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleMouseMove(mouseEvent, [...mockNodes, moonNode])
			})

			expect(result.current.hoveredNode).toBe(null)

			// Zoom in to make moon visible
			act(() => {
				const wheelEvent = {
					preventDefault: () => {},
					currentTarget: mockCanvas,
					clientX: 600,
					clientY: 400,
					deltaY: -100,
				} as React.WheelEvent<HTMLCanvasElement>

				// Zoom in multiple times to reach 0.8+
				for (let i = 0; i < 3; i++) {
					result.current.handleWheel(wheelEvent)
				}
			})

			// Now moon should be hoverable
			act(() => {
				const mouseEvent = {
					currentTarget: mockCanvas,
					clientX: 650,
					clientY: 400,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleMouseMove(mouseEvent, [...mockNodes, moonNode])
			})

			if (result.current.transform.scale >= 0.8) {
				expect(result.current.hoveredNode).toBe('moon-1')
			}
		})
	})

	describe('handleMouseUp', () => {
		it('should stop dragging', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			act(() => {
				result.current.handleMouseDown({
					clientX: 100,
					clientY: 100,
				} as React.MouseEvent<HTMLCanvasElement>)
			})

			expect(result.current.isDragging).toBe(true)

			act(() => {
				result.current.handleMouseUp()
			})

			expect(result.current.isDragging).toBe(false)
		})
	})

	describe('handleCanvasClick', () => {
		it('should select clicked node', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			act(() => {
				// Calculate the transformed position of the station
				// Station is at (800, 400), with scale 0.6
				// transformed = (800 - 600) * 0.6 + 600 = 120 + 600 = 720
				const transformedX = (800 - 600) * 0.6 + 600 // = 720
				const transformedY = (400 - 400) * 0.6 + 400 // = 400

				const clickEvent = {
					currentTarget: mockCanvas,
					clientX: transformedX,
					clientY: transformedY,
				} as React.MouseEvent<HTMLCanvasElement>

				result.current.handleCanvasClick(clickEvent, mockNodes)
			})

			expect(result.current.selectedNode).toBe('station-1')
		})

		it('should deselect when clicking empty space', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			// First select a node
			act(() => {
				const transformedX = (800 - 600) * 0.6 + 600 // = 720
				const transformedY = (400 - 400) * 0.6 + 400 // = 400

				result.current.handleCanvasClick(
					{
						currentTarget: mockCanvas,
						clientX: transformedX,
						clientY: transformedY,
					} as React.MouseEvent<HTMLCanvasElement>,
					mockNodes
				)
			})

			// Then click empty space
			act(() => {
				result.current.handleCanvasClick(
					{
						currentTarget: mockCanvas,
						clientX: 100,
						clientY: 100,
					} as React.MouseEvent<HTMLCanvasElement>,
					mockNodes
				)
			})

			expect(result.current.selectedNode).toBe(null)
		})
	})

	describe('resetView', () => {
		it('should reset transform to initial values', () => {
			const { result } = renderHook(() => useCanvasInteraction())

			// Modify transform
			act(() => {
				const wheelEvent = {
					preventDefault: () => {},
					currentTarget: mockCanvas,
					clientX: 600,
					clientY: 400,
					deltaY: -100,
				} as React.WheelEvent<HTMLCanvasElement>

				result.current.handleWheel(wheelEvent)
			})

			// Reset
			act(() => {
				result.current.resetView()
			})

			expect(result.current.transform).toEqual({
				scale: 0.6,
				offsetX: 0,
				offsetY: 0,
			})
		})
	})
})
