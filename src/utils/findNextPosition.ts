// @/utils/findNextPosition
import { Ship, Container, CargoGrid } from '@/constants/types'
import { voxelDimensionsMap } from '@/constants/dimensions'

/**
 * Represents a cell in the cargo grid.
 */
interface GridCell {
	occupied: boolean
	height: number
	containerRef?: Container
}

/**
 * Represents a grid with metadata including its position and rotation.
 */
interface GridWithMeta {
	grid: GridCell[][]
	gridIndex: number
	position: { x: number; y: number; z: number }
	rotation: { x: number; y: number; z: number }
}

/**
 * Represents the dimensions of a container.
 */
interface ContainerDimensions {
	width: number
	height: number
	depth: number
}

/**
 * Represents the result of a container placement attempt.
 */
interface PlacementResult {
	position: { x: number; y: number; z: number }
	rotated: boolean
	gridIndex: number
}

/**
 * Creates an empty grid with the specified length and width.
 *
 * @param {number} length - The length of the grid.
 * @param {number} width - The width of the grid.
 * @returns {GridCell[][]} - The created empty grid.
 */
const createEmptyGrid = (length: number, width: number): GridCell[][] => {
	return Array(length)
		.fill(null)
		.map(() =>
			Array(width)
				.fill(null)
				.map(() => ({ occupied: false, height: 0 }))
		)
}

/**
 * Initializes grids with metadata for the given ship.
 *
 * @param {Ship} ship - The ship containing cargo grids.
 * @returns {GridWithMeta[]} - The initialized grids with metadata.
 */
const initializeGridsWithMeta = (ship: Ship): GridWithMeta[] => {
	return ship.cargoGrids.map((cargoGrid, index) => ({
		grid: createEmptyGrid(cargoGrid.length, cargoGrid.width),
		gridIndex: index,
		position: cargoGrid.position || { x: 0, y: 0, z: 0 },
		rotation: cargoGrid.rotation || { x: 0, y: 0, z: 0 },
	}))
}

/**
 * Marks the occupied spaces in the grids based on the existing containers.
 *
 * @param {GridWithMeta[]} gridsWithMeta - The grids with metadata.
 * @param {Container[]} containers - The existing containers.
 */
const markOccupiedSpaces = (
	gridsWithMeta: GridWithMeta[],
	containers: Container[]
) => {
	containers.forEach((container) => {
		const [containerWidth, containerHeight, containerDepth] =
			voxelDimensionsMap[container.size]
		const width = container.rotated ? containerDepth : containerWidth
		const depth = container.rotated ? containerWidth : containerDepth
		const gridIndex = container.gridIndex ?? 0
		const gridWithMeta = gridsWithMeta[gridIndex]

		if (!gridWithMeta) return

		const { grid } = gridWithMeta
		const relX = container.position.x
		const relZ = container.position.z
		const containerTop = container.position.y + containerHeight

		for (let z = relZ; z < relZ + depth; z++) {
			for (let x = relX; x < relX + width; x++) {
				if (z < grid.length && x < grid[0].length) {
					grid[z][x].occupied = true
					grid[z][x].height = containerTop
					grid[z][x].containerRef = container
				}
			}
		}
	})
}

/**
 * Checks if the container dimensions can fit in the cargo grid.
 *
 * @param {ContainerDimensions} dimensions - The dimensions of the container.
 * @param {CargoGrid} cargoGrid - The cargo grid.
 * @returns {boolean} - True if the container can fit, otherwise false.
 */
const canFitInGrid = (
	dimensions: ContainerDimensions,
	cargoGrid: CargoGrid
): boolean => {
	return (
		dimensions.width <= cargoGrid.width &&
		dimensions.depth <= cargoGrid.length &&
		dimensions.height <= cargoGrid.height
	)
}

/**
 * Tries to place a container at the specified position in the grid.
 *
 * @param {GridCell[][]} grid - The grid.
 * @param {number} x - The x-coordinate of the position.
 * @param {number} y - The y-coordinate of the position.
 * @param {number} z - The z-coordinate of the position.
 * @param {ContainerDimensions} dimensions - The dimensions of the container.
 * @returns {boolean} - True if the container can be placed, otherwise false.
 */
const tryPlacementAtPosition = (
	grid: GridCell[][],
	x: number,
	y: number,
	z: number,
	dimensions: ContainerDimensions
): boolean => {
	// Check if area is clear
	for (let dz = 0; dz < dimensions.depth; dz++) {
		for (let dx = 0; dx < dimensions.width; dx++) {
			const cell = grid[z + dz][x + dx]

			// Check if cell is occupied above our target position
			if (cell.height > y) {
				return false
			}
		}
	}

	// Ground level always has support
	if (y === 0) {
		return true
	}

	// Ensure full support underneath the entire container
	let hasFullSupport = true
	for (let dz = 0; dz < dimensions.depth; dz++) {
		for (let dx = 0; dx < dimensions.width; dx++) {
			const cellBelow = grid[z + dz][x + dx]
			if (cellBelow.height !== y) {
				hasFullSupport = false
				break
			}
		}
		if (!hasFullSupport) break
	}

	return hasFullSupport
}

/**
 * Finds a placement for the container in the grid.
 *
 * @param {GridCell[][]} grid - The grid.
 * @param {CargoGrid} cargoGrid - The cargo grid.
 * @param {ContainerDimensions} dimensions - The dimensions of the container.
 * @param {boolean} rotated - Whether the container is rotated.
 * @param {number} gridIndex - The index of the grid.
 * @returns {PlacementResult | null} - The placement result or null if no placement is found.
 */
const findPlacementInGrid = (
	grid: GridCell[][],
	cargoGrid: CargoGrid,
	dimensions: ContainerDimensions,
	rotated: boolean,
	gridIndex: number
): PlacementResult | null => {
	if (!canFitInGrid(dimensions, cargoGrid)) {
		return null
	}

	// Search from top to bottom for each position
	for (let y = cargoGrid.height - dimensions.height; y >= 0; y--) {
		for (let z = 0; z < cargoGrid.length - dimensions.depth + 1; z++) {
			for (let x = 0; x < cargoGrid.width - dimensions.width + 1; x++) {
				if (tryPlacementAtPosition(grid, x, y, z, dimensions)) {
					return {
						position: { x, y, z },
						rotated,
						gridIndex,
					}
				}
			}
		}
	}

	return null
}

/**
 * Finds the next position for a container in the ship.
 *
 * @param {number} size - The size of the container.
 * @param {Ship} ship - The ship containing cargo grids.
 * @param {Container[]} existingContainers - The existing containers.
 * @returns {PlacementResult | null} - The placement result or null if no placement is found.
 */
export const findNextPosition = (
	size: number,
	ship: Ship,
	existingContainers: Container[]
): PlacementResult | null => {
	// Check if the size exists in voxelDimensionsMap
	if (!voxelDimensionsMap[size]) {
		console.error(
			`Invalid container size: ${size}. Available sizes: ${Object.keys(
				voxelDimensionsMap
			).join(', ')}`
		)
		return null
	}
	const [originalWidth, height, originalDepth] = voxelDimensionsMap[size]
	const gridsWithMeta = initializeGridsWithMeta(ship)
	markOccupiedSpaces(gridsWithMeta, existingContainers)

	for (const { grid, gridIndex } of gridsWithMeta) {
		const cargoGrid = ship.cargoGrids[gridIndex]

		// Try normal orientation
		const normalDimensions = {
			width: originalWidth,
			height,
			depth: originalDepth,
		}
		const rotatedDimensions = {
			width: originalDepth,
			height,
			depth: originalWidth,
		}

		const normalResult = findPlacementInGrid(
			grid,
			cargoGrid,
			normalDimensions,
			false,
			gridIndex
		)
		if (normalResult) return normalResult

		const rotatedResult = findPlacementInGrid(
			grid,
			cargoGrid,
			rotatedDimensions,
			true,
			gridIndex
		)
		if (rotatedResult) return rotatedResult
	}

	return null
}
