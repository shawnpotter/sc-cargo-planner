// @/app/components/canvas/CargoHold/CargoHold.tsx
import { useState, useRef } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { ContainerVoxel } from '@/components/canvas/ContainerVoxel'
import { ContainerInfo } from '@/components/canvas/ContainerInfo'
import { GridPlane } from '@/components/canvas/GridPlane'
import { Ship, Container, Contract } from '@/constants/types'
import * as THREE from 'three'

/**
 * 3D Coordinate System Helper - only shows in development
 * Displays X, Y, Z axes with labels and positive/negative indicators
 */
function CoordinateSystemHelper({
	visible = false,
}: Readonly<{ visible?: boolean }>) {
	if (process.env.NODE_ENV !== 'development' || !visible) return null

	const axisLength = 10

	return (
		<group>
			{/* X-axis (Red) */}
			<line>
				<bufferGeometry attach='geometry'>
					<bufferAttribute
						attach='attributes-position'
						args={[new Float32Array([-axisLength, 0, 0, axisLength, 0, 0]), 3]}
					/>
				</bufferGeometry>
				<lineBasicMaterial
					color='#ff0000'
					linewidth={2}
				/>
			</line>

			{/* Y-axis (Green) */}
			<line>
				<bufferGeometry attach='geometry'>
					<bufferAttribute
						attach='attributes-position'
						args={[new Float32Array([0, -axisLength, 0, 0, axisLength, 0]), 3]}
					/>
				</bufferGeometry>
				<lineBasicMaterial
					color='#00ff00'
					linewidth={2}
				/>
			</line>

			{/* Z-axis (Blue) */}
			<line>
				<bufferGeometry attach='geometry'>
					<bufferAttribute
						attach='attributes-position'
						args={[new Float32Array([0, 0, -axisLength, 0, 0, axisLength]), 3]}
					/>
				</bufferGeometry>
				<lineBasicMaterial
					color='#0000ff'
					linewidth={2}
				/>
			</line>

			{/* Axis labels using Text components */}
			{/* Positive X */}
			<Text
				position={[axisLength + 1, 0, 0]}
				fontSize={0.8}
				color='#ff0000'
				anchorX='center'
				anchorY='middle'
			>
				+X
			</Text>

			{/* Negative X */}
			<Text
				position={[-axisLength - 1, 0, 0]}
				fontSize={0.8}
				color='#ff0000'
				anchorX='center'
				anchorY='middle'
			>
				-X
			</Text>

			{/* Positive Y */}
			<Text
				position={[0, axisLength + 1, 0]}
				fontSize={0.8}
				color='#00ff00'
				anchorX='center'
				anchorY='middle'
			>
				+Y
			</Text>

			{/* Negative Y */}
			<Text
				position={[0, -axisLength - 1, 0]}
				fontSize={0.8}
				color='#00ff00'
				anchorX='center'
				anchorY='middle'
			>
				-Y
			</Text>

			{/* Positive Z */}
			<Text
				position={[0, 0, axisLength + 1]}
				fontSize={0.8}
				color='#0000ff'
				anchorX='center'
				anchorY='middle'
			>
				+Z
			</Text>

			{/* Negative Z */}
			<Text
				position={[0, 0, -axisLength - 1]}
				fontSize={0.8}
				color='#0000ff'
				anchorX='center'
				anchorY='middle'
			>
				-Z
			</Text>

			{/* Origin marker */}
			<mesh position={[0, 0, 0]}>
				<sphereGeometry args={[0.15]} />
				<meshBasicMaterial color='#ffffff' />
			</mesh>
		</group>
	)
}

interface CargoHoldProps {
	readonly ship: Ship
	readonly containers: Container[]
	readonly contracts: Contract[]
	readonly isInteractive?: boolean
}

/**
 * Renders the cargo hold visualization for a ship, displaying its containers and contracts.
 * Provides interactive selection and highlighting of containers within a 3D canvas.
 *
 * @param {CargoHoldProps} props - The properties for the CargoHold component.
 * @param {Ship} props.ship - The ship data, including cargo grids and capacity.
 * @param {Container[]} props.containers - The list of containers currently loaded in the ship.
 * @param {Contract[]} props.contracts - The active contracts associated with the containers.
 * @param {boolean} [props.isInteractive=true] - Whether the canvas and controls are interactive.
 *
 * @returns {JSX.Element} The rendered CargoHold component, including a 3D canvas and container info panel.
 */
function CargoHold({
	ship,
	containers,
	contracts,
	isInteractive = true,
}: CargoHoldProps) {
	const [selectedContainer, setSelectedContainer] = useState<Container | null>(
		null,
	)
	const [highlightedContainer, setHighlightedContainer] =
		useState<Container | null>(null)
	const [showCoordinateSystem, setShowCoordinateSystem] = useState(false)
	const containerClickedRef = useRef(false)

	// Calculate the center point and bounds of all cargo grids
	const calculateGridsData = () => {
		if (ship.cargoGrids.length === 0)
			return {
				center: { x: 0, y: 0, z: 0 },
				size: { width: 1, height: 1, depth: 1 },
			}

		let minX = Infinity,
			maxX = -Infinity
		let minY = Infinity,
			maxY = -Infinity
		let minZ = Infinity,
			maxZ = -Infinity

		ship.cargoGrids.forEach((grid) => {
			const pos = grid.position || { x: 0, y: 0, z: 0 }
			const width = grid.width
			const length = grid.length
			const height = grid.height

			// Account for the GridPlane's internal offset of [-0.5, 0, -0.5]
			// The grid is centered around its position, so we calculate actual bounds
			const gridMinX = pos.x - 0.5
			const gridMaxX = pos.x - 0.5 + width
			const gridMinY = pos.y
			const gridMaxY = pos.y + height
			const gridMinZ = pos.z - 0.5
			const gridMaxZ = pos.z - 0.5 + length

			// Update overall bounds
			minX = Math.min(minX, gridMinX)
			maxX = Math.max(maxX, gridMaxX)
			minY = Math.min(minY, gridMinY)
			maxY = Math.max(maxY, gridMaxY)
			minZ = Math.min(minZ, gridMinZ)
			maxZ = Math.max(maxZ, gridMaxZ)
		})

		const center = {
			x: (minX + maxX) / 2,
			y: (minY + maxY) / 2,
			z: (minZ + maxZ) / 2,
		}

		const size = {
			width: maxX - minX,
			height: maxY - minY,
			depth: maxZ - minZ,
		}

		return { center, size }
	}

	const { center: gridsCenter, size: gridsSize } = calculateGridsData()

	// Calculate optimal camera distance based on the size of the cargo grids
	const maxDimension = Math.max(
		gridsSize.width,
		gridsSize.height,
		gridsSize.depth,
	)
	const optimalDistance = Math.max(15, maxDimension * 1.5) // Ensure minimum distance of 15

	// Calculate camera position relative to the center
	const cameraPosition = [
		gridsCenter.x + optimalDistance,
		gridsCenter.y + optimalDistance,
		gridsCenter.z + optimalDistance,
	] as [number, number, number]

	/**
	 * Handles the click event on a container.
	 * @param {Container} container - The container that was clicked.
	 */
	const handleContainerClick = (container: Container) => {
		if (!isInteractive) return
		console.log('Container selected:', container)
		console.log('Current contracts:', contracts)
		setSelectedContainer(container)
		setHighlightedContainer(container)
		containerClickedRef.current = true
	}

	/**
	 * Handles the click event on the canvas.
	 * @param {ThreeEvent<MouseEvent>} event - The click event on the canvas.
	 */
	const handleCanvasClick = (event: ThreeEvent<MouseEvent>) => {
		if (!isInteractive) return
		// Only clear selection if clicking on the canvas background
		if (containerClickedRef.current) {
			containerClickedRef.current = false
			return
		}
		if (event.intersections && event.intersections.length > 0) return
		setTimeout(() => {
			setSelectedContainer(null)
			setHighlightedContainer(null)
		}, 0)
	}

	/**
	 * Wrapper function to convert React mouse event to ThreeEvent.
	 * @param {React.MouseEvent<HTMLDivElement>} reactEvent - The React mouse event.
	 */
	const canvasClickHandler: React.MouseEventHandler<HTMLDivElement> = (
		reactEvent,
	) => {
		if (!isInteractive) return
		const threeEvent = reactEvent as unknown as ThreeEvent<MouseEvent>
		handleCanvasClick(threeEvent)
	}

	return (
		<div className='w-full h-full flex flex-col min-h-[70vh]'>
			{/* Header with ship data */}
			<div className='bg-gradient-to-r from-background via-background/95 to-background border border-border/40 rounded-lg p-4 mb-4 shadow-lg backdrop-blur-sm'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
					<div className='flex items-center gap-3'>
						<div className='w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full'></div>
						<div>
							<h3 className='text-xl font-bold text-foreground'>{ship.name}</h3>
							<p className='text-sm text-muted-foreground'>
								CARGO CAPACITY: {ship.totalCapacity} SCU
							</p>
						</div>
						{/* Dev buttons - only show in development */}
						{process.env.NODE_ENV === 'development' && (
							<div className='flex items-center gap-2'>
								<button
									onClick={() => setShowCoordinateSystem(!showCoordinateSystem)}
									className={`px-2 py-1 text-xs border rounded transition-colors ${
										showCoordinateSystem
											? 'bg-blue-500/30 border-blue-500/40 text-blue-300'
											: 'bg-gray-500/20 border-gray-500/40 text-gray-400 hover:bg-gray-500/30'
									}`}
									title='Toggle coordinate system axes (dev only)'
								>
									📐 {showCoordinateSystem ? 'Hide' : 'Show'} Axes
								</button>
								<button
									onClick={() => {
										// Force re-render by reloading the page
										// This will trigger the localStorage loading in CargoProvider
										window.location.reload()
									}}
									className='px-2 py-1 text-xs bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded text-orange-300 transition-colors'
									title='Refresh canvas and reload ship data (dev only)'
								>
									🔄 Refresh
								</button>
							</div>
						)}
					</div>
					<div className='flex gap-6'>
						<div className='text-center'>
							<div className='text-sm text-muted-foreground'>GRIDS</div>
							<div className='text-lg font-semibold text-foreground'>
								{ship.cargoGrids.length}
							</div>
						</div>
						<div className='text-center'>
							<div className='text-sm text-muted-foreground'>LOADED SCU</div>
							<div className='text-lg font-semibold text-orange-500'>
								{containers.reduce((acc, c) => acc + c.size, 0)}
							</div>
						</div>
						<div className='text-center md:mr-12'>
							<div className='text-sm text-muted-foreground'>UTILIZATION</div>
							<div className='text-lg font-semibold text-blue-500'>
								{ship.totalCapacity > 0
									? Math.round(
											(containers.reduce((acc, c) => acc + c.size, 0) /
												ship.totalCapacity) *
												100,
										)
									: 0}
								%
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main canvas and info container */}
			<div className='flex-1 flex gap-4 min-h-0 h-full'>
				{/* Canvas container - takes up most of the space */}
				<div className='flex-1 relative bg-gradient-to-br from-background/50 to-background border border-border/40 rounded-lg overflow-hidden shadow-lg h-[60vh] min-h-[60vh]'>
					<Canvas
						key={`canvas-${ship.name}`}
						camera={{
							position: cameraPosition,
							fov: 50,
						}}
						onClick={canvasClickHandler}
						className='w-full h-full'
						style={{
							touchAction: isInteractive ? 'none' : 'pan-y',
							pointerEvents: isInteractive ? 'auto' : 'none',
						}}
					>
						<color
							attach='background'
							args={['#060809']}
						/>
						<ambientLight intensity={0.3} />
						<spotLight
							position={[10, 10, 10]}
							angle={0.15}
							penumbra={1}
							intensity={0.7}
							color='#FF8A00'
						/>
						<CoordinateSystemHelper visible={showCoordinateSystem} />
						<GridPlane grids={ship.cargoGrids} />
						{containers.map((container, index) => (
							<ContainerVoxel
								key={`container-${container.contractIndex}-${index}`}
								container={container}
								onClick={handleContainerClick}
								isHighlighted={highlightedContainer === container}
								ship={ship}
								contracts={contracts}
							/>
						))}
						{isInteractive ? (
							<OrbitControls
								makeDefault
								enabled
								enablePan
								enableZoom
								enableRotate
								target={[gridsCenter.x, gridsCenter.y, gridsCenter.z]}
								touches={{
									ONE: THREE.TOUCH.ROTATE,
									TWO: THREE.TOUCH.DOLLY_PAN,
								}}
							/>
						) : (
							<OrbitControls
								makeDefault
								enabled={false}
								enablePan={false}
								enableZoom={false}
								enableRotate={false}
								target={[gridsCenter.x, gridsCenter.y, gridsCenter.z]}
							/>
						)}
					</Canvas>
				</div>

				{/* Container info panel - only shows when container is selected */}
				{selectedContainer && contracts.length > 0 && (
					<div className='w-80 bg-gradient-to-b from-background via-background/95 to-background border border-border/40 rounded-lg shadow-lg overflow-hidden'>
						<div className='bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-border/40 p-3'>
							<div className='flex items-center gap-2'>
								<div className='w-1 h-4 bg-orange-500 rounded-full'></div>
								<h3 className='font-semibold text-foreground'>
									Container Info
								</h3>
							</div>
						</div>
						<div className='p-4'>
							<ContainerInfo
								container={selectedContainer}
								contracts={contracts}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export { CargoHold }
