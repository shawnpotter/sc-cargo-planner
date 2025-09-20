// @/app/components/ContainerVoxel.tsx
import { Container, Ship, Contract } from '@/constants/types'
import { useRef, useMemo } from 'react'
import { voxelDimensionsMap } from '@/constants/dimensions'
import * as THREE from 'three'
import { BoxGeometry } from 'three'

// Define a mapping from cargoType to color scheme
const cargoTypeColorMap: Record<string, { main: string; accent: string }> = {
	AGRICIUM: { main: '#FF8A00', accent: '#FFB300' },
	'AGRICULTURAL SUPPLIES': { main: '#FF8A00', accent: '#FFB300' },
	ALUMINUM: { main: '#9b59b6', accent: '#8e44ad' },
	AMMONIA: { main: '#3498db', accent: '#2980b9' },
	BERYL: { main: '#f1c40f', accent: '#f39c12' },
	BEXALITE: { main: '#e67e22', accent: '#d35400' },
	CARBON: { main: '#e67e22', accent: '#d35400' },
	CHLORINE: { main: '#1abc9c', accent: '#16a085' },
	COBALT: { main: '#34495e', accent: '#2c3e50' },
	COPPER: { main: '#f39c12', accent: '#e67e22' },
	CORUNDUM: { main: '#2ecc71', accent: '#27ae60' },
	FLUORINE: { main: '#9b59b6', accent: '#8e44ad' },
	GOLD: { main: '#f1c40f', accent: '#f39c12' },
	HELIUM: { main: '#3498db', accent: '#2980b9' },
	HEPHAESTANITE: { main: '#e67e22', accent: '#d35400' },
	'HYDROGEN FUEL': { main: '#1abc9c', accent: '#16a085' },
	HYDROGEN: { main: '#2ecc71', accent: '#27ae60' },
	IODINE: { main: '#34495e', accent: '#2c3e50' },
	IRON: { main: '#e67e22', accent: '#d35400' },
	LARANITE: { main: '#9b59b6', accent: '#8e44ad' },
	'MEDICAL SUPPLIES': { main: '#f1c40f', accent: '#f39c12' },
	MERCURY: { main: '#3498db', accent: '#2980b9' },
	METHANE: { main: '#e67e22', accent: '#d35400' },
	NITROGEN: { main: '#2ecc71', accent: '#27ae60' },
	'PROCESSED FOOD': { main: '#34495e', accent: '#2c3e50' },
	'PRESSURIZED ICE': { main: '#f1c40f', accent: '#f39c12' },
	POTASSIUM: { main: '#9b59b6', accent: '#8e44ad' },
	STEEL: { main: '#e67e22', accent: '#d35400' },
	STIMS: { main: '#1abc9c', accent: '#16a085' },
	TARANITE: { main: '#2ecc71', accent: '#27ae60' },
	TIN: { main: '#34495e', accent: '#2c3e50' },
	TITANIUM: { main: '#f1c40f', accent: '#f39c12' },
	TUNGSTEN: { main: '#9b59b6', accent: '#8e44ad' },
	WASTE: { main: '#e67e22', accent: '#d35400' },
	SCRAP: { main: '#1abc9c', accent: '#16a085' },

	// Add more cargo types as needed
}

interface ContainerVoxelProps {
	readonly container: Container
	readonly onClick: (container: Container) => void
	readonly isHighlighted: boolean
	readonly ship: Ship
	readonly contracts: Contract[]
}

/**
 * Renders a 3D voxel representation of a cargo container within a ship's cargo grid.
 *
 * The container's position, rotation, color, and texture are dynamically determined based on its properties,
 * highlighting state, and associated contract/cargo type. When highlighted, the container displays its contract index.
 *
 * @param container - The container data, including position, size, rotation, and contract indices.
 * @param onClick - Callback invoked when the container mesh is clicked.
 * @param isHighlighted - Whether the container is currently highlighted.
 * @param ship - The ship object containing cargo grids and their positions/rotations.
 * @param contracts - Array of contract objects, used to determine cargo type and delivery points.
 *
 * @returns A React Three Fiber group containing the container mesh, texture, and outline.
 */
function ContainerVoxel({
	container,
	onClick,
	isHighlighted,
	ship,
	contracts,
}: ContainerVoxelProps) {
	const mesh = useRef<THREE.Mesh>(null)

	const [originalWidth, height, originalDepth] =
		voxelDimensionsMap[container.size]
	const width = container.rotated ? originalDepth : originalWidth
	const depth = container.rotated ? originalWidth : originalDepth

	const xOffset = width / 2 - 0.5
	const yOffset = height / 2
	const zOffset = depth / 2 - 0.5

	// Get the grid this container belongs to
	const gridIndex = container.gridIndex ?? 0
	const grid = ship.cargoGrids[gridIndex]
	const gridPos = grid?.position || { x: 0, y: 0, z: 0 }
	const gridRot = grid?.rotation || { x: 0, y: 0, z: 0 }

	// Calculate the global position considering the grid's position and rotation
	const localPosition = [
		container.position.x + xOffset,
		container.position.y + yOffset,
		container.position.z + zOffset,
	]

	const contract = contracts[container.contractIndex]
	const deliveryPoint = contract?.deliveryPoints[container.deliveryIndex]
	const rawCargoType = deliveryPoint?.cargo[0]?.cargoType ?? 'Unknown'
	const cargoType = rawCargoType.toUpperCase()

	// Use the color scheme for the cargo type, or a default if not found
	const colorScheme = useMemo(
		() =>
			cargoTypeColorMap[cargoType] ?? { main: '#16a085', accent: '#1abc9c' },
		[cargoType]
	)

	// Create a simpler texture that will render properly
	const containerTexture = useMemo(() => {
		const canvas = document.createElement('canvas')
		canvas.width = 256
		canvas.height = 256
		const ctx = canvas.getContext('2d')

		if (!ctx) {
			console.error('Failed to get 2D context')
			return null
		}

		// Base background
		ctx.fillStyle = isHighlighted ? '#FF8A00' : colorScheme.main
		ctx.fillRect(0, 0, 256, 256)

		// Add grid pattern
		ctx.strokeStyle = isHighlighted ? '#FFD700' : colorScheme.accent
		ctx.lineWidth = 2

		// Grid lines
		const gridSize = 32
		for (let i = 0; i < 256; i += gridSize) {
			// Horizontal lines
			ctx.beginPath()
			ctx.moveTo(0, i)
			ctx.lineTo(256, i)
			ctx.stroke()

			// Vertical lines
			ctx.beginPath()
			ctx.moveTo(i, 0)
			ctx.lineTo(i, 256)
			ctx.stroke()
		}

		// Add container ID if highlighted
		if (isHighlighted) {
			ctx.fillStyle = '#000000'
			ctx.globalAlpha = 0.7
			ctx.fillRect(0, 0, 256, 40)
			ctx.globalAlpha = 1

			ctx.fillStyle = '#FFFFFF'
			ctx.font = 'bold 24px monospace'
			ctx.textAlign = 'center'
			ctx.fillText(`CARGO ${container.contractIndex}`, 128, 28)
		}

		const texture = new THREE.CanvasTexture(canvas)
		texture.needsUpdate = true
		return texture
	}, [isHighlighted, container.contractIndex, colorScheme])

	// Simple material colors for better visibility
	const mainColor = isHighlighted
		? new THREE.Color('#FF8A00')
		: new THREE.Color(colorScheme.main)

	const emissiveColor = isHighlighted
		? new THREE.Color('#FF8A00')
		: new THREE.Color(colorScheme.accent)

	return (
		<group
			position={[gridPos.x, gridPos.y, gridPos.z]}
			rotation={[gridRot.x, gridRot.y, gridRot.z]}
		>
			<group
				position={[localPosition[0], localPosition[1], localPosition[2]]}
				rotation={[0, container.rotated ? Math.PI / 2 : 0, 0]}
			>
				<mesh
					ref={mesh}
					onClick={(event) => {
						event.stopPropagation()
						onClick(container)
					}}
				>
					<boxGeometry args={[originalWidth, height, originalDepth]} />
					<meshStandardMaterial
						color={mainColor}
						map={containerTexture}
						emissive={emissiveColor}
						emissiveIntensity={isHighlighted ? 0.5 : 0.2}
						roughness={0.7}
						metalness={0.3}
					/>
				</mesh>

				{/* Outline for better visibility */}
				<lineSegments>
					<edgesGeometry
						args={[
							new BoxGeometry(
								originalWidth * 1.01,
								height * 1.01,
								originalDepth * 1.01
							),
						]}
					/>
					<lineBasicMaterial
						color={isHighlighted ? '#FFFFFF' : '#333333'}
						linewidth={2}
					/>
				</lineSegments>
			</group>
		</group>
	)
}

export { ContainerVoxel }
