// @/components/canvas/CargoHold/CargoHold.tsx
import { useEffect, useRef, useState, type PointerEventHandler } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { ContainerVoxel } from '@/components/canvas/ContainerVoxel'
import { GridPlane } from '@/components/canvas/GridPlane'
import { ShipModelGLTF } from '@/components/canvas/ShipModelGLTF'
import { CargoHoldDevToolsModal } from '@/components/canvas/CargoHoldDevToolsModal'
import { Ship, Container, Contract } from '@/constants/types'
import * as THREE from 'three'

type ModelTuningState = {
	scale: number
	position: [number, number, number]
	rotation: [number, number, number]
	opacity: number
}

type CargoGridTuning = {
	position: [number, number, number]
	dimensions: [number, number, number] // width, length, height
}

type CargoGridTuningState = Record<number, CargoGridTuning>

function getDefaultModelTuning(ship: Ship): ModelTuningState {
	return {
		scale: ship.modelScale ?? 0.1,
		position: ship.modelPosition
			? [ship.modelPosition.x, ship.modelPosition.y, ship.modelPosition.z]
			: [0, 0, -3],
		rotation: ship.modelRotation
			? [ship.modelRotation.x, ship.modelRotation.y, ship.modelRotation.z]
			: [0, 0, 0],
		opacity: 0.025,
	}
}

function getDefaultCargoGridTuning(ship: Ship): CargoGridTuningState {
	const defaults: CargoGridTuningState = {}
	ship.cargoGrids.forEach((grid, index) => {
		defaults[index] = {
			position: [
				grid.position?.x ?? 0,
				grid.position?.y ?? 0,
				grid.position?.z ?? 0,
			],
			dimensions: [grid.width, grid.length, grid.height],
		}
	})
	return defaults
}

function parseModelTuning(value: string, fallback: number) {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

function CoordinateSystemHelper({
	visible = false,
}: Readonly<{ visible?: boolean }>) {
	if (process.env.NODE_ENV !== 'development' || !visible) return null

	const axisLength = 10

	return (
		<group>
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
			<Text
				position={[axisLength + 1, 0, 0]}
				fontSize={0.8}
				color='#ff0000'
				anchorX='center'
				anchorY='middle'
			>
				+X
			</Text>
			<Text
				position={[-axisLength - 1, 0, 0]}
				fontSize={0.8}
				color='#ff0000'
				anchorX='center'
				anchorY='middle'
			>
				-X
			</Text>
			<Text
				position={[0, axisLength + 1, 0]}
				fontSize={0.8}
				color='#00ff00'
				anchorX='center'
				anchorY='middle'
			>
				+Y
			</Text>
			<Text
				position={[0, -axisLength - 1, 0]}
				fontSize={0.8}
				color='#00ff00'
				anchorX='center'
				anchorY='middle'
			>
				-Y
			</Text>
			<Text
				position={[0, 0, axisLength + 1]}
				fontSize={0.8}
				color='#0000ff'
				anchorX='center'
				anchorY='middle'
			>
				+Z
			</Text>
			<Text
				position={[0, 0, -axisLength - 1]}
				fontSize={0.8}
				color='#0000ff'
				anchorX='center'
				anchorY='middle'
			>
				-Z
			</Text>
			<mesh position={[0, 0, 0]}>
				<sphereGeometry args={[0.15]} />
				<meshBasicMaterial color='#ffffff' />
			</mesh>
		</group>
	)
}

function CargoGridDebugHelper({ ship }: Readonly<{ ship: Ship }>) {
	if (process.env.NODE_ENV !== 'development') return null

	// Calculate the highest point for each grid
	const gridHighPoints = ship.cargoGrids.map((grid, gridIndex) => {
		const pos = grid.position || { x: 0, y: 0, z: 0 }
		const rotation = grid.rotation || { x: 0, y: 0, z: 0 }

		// Convert radians to degrees for display
		const rotationDegrees = {
			x: ((rotation.x * 180) / Math.PI).toFixed(1),
			y: ((rotation.y * 180) / Math.PI).toFixed(1),
			z: ((rotation.z * 180) / Math.PI).toFixed(1),
		}

		// Create all 8 corners of the grid box
		const corners = [
			new THREE.Vector3(-0.5, 0, -0.5),
			new THREE.Vector3(grid.width - 0.5, 0, -0.5),
			new THREE.Vector3(-0.5, 0, grid.length - 0.5),
			new THREE.Vector3(grid.width - 0.5, 0, grid.length - 0.5),
			new THREE.Vector3(-0.5, grid.height, -0.5),
			new THREE.Vector3(grid.width - 0.5, grid.height, -0.5),
			new THREE.Vector3(-0.5, grid.height, grid.length - 0.5),
			new THREE.Vector3(grid.width - 0.5, grid.height, grid.length - 0.5),
		]

		const rotationEuler = new THREE.Euler(rotation.x, rotation.y, rotation.z)
		let maxY = -Infinity
		let highestPoint = new THREE.Vector3(pos.x, pos.y, pos.z)

		corners.forEach((corner) => {
			const worldCorner = corner
				.clone()
				.applyEuler(rotationEuler)
				.add(new THREE.Vector3(pos.x, pos.y, pos.z))

			if (worldCorner.y > maxY) {
				maxY = worldCorner.y
				highestPoint = worldCorner
			}
		})

		return {
			gridIndex,
			position: highestPoint,
			maxY: maxY.toFixed(2),
			rotationDegrees,
		}
	})

	return (
		<group>
			{gridHighPoints.map(({ gridIndex, position, maxY, rotationDegrees }) => (
				<group key={`grid-debug-${gridIndex}`}>
					{/* Marker sphere at highest point */}
					<mesh position={[position.x, position.y, position.z]}>
						<sphereGeometry args={[0.2]} />
						<meshBasicMaterial color='#FFD700' />
					</mesh>
					{/* Debug text - Height info */}
					<Text
						position={[position.x, position.y + 0.5, position.z]}
						fontSize={0.5}
						color='#FFD700'
						anchorX='center'
						anchorY='bottom'
						maxWidth={2}
					>
						Grid {gridIndex}: {maxY}
					</Text>
					{/* Debug text - Rotation info */}
					<Text
						position={[position.x, position.y + 2, position.z]}
						fontSize={0.4}
						color='#87CEEB'
						anchorX='center'
						anchorY='bottom'
						maxWidth={2}
					>
						{`R: X${rotationDegrees.x}° Y${rotationDegrees.y}° Z${rotationDegrees.z}°`}
					</Text>
				</group>
			))}
		</group>
	)
}

interface CargoHoldProps {
	readonly ship: Ship
	readonly containers: Container[]
	readonly contracts: Contract[]
	readonly isInteractive?: boolean
	readonly selectedContainer: Container | null // LIFTED: now controlled externally
	readonly onContainerSelect: (container: Container | null) => void // LIFTED
}

/**
 * Renders the 3D cargo hold canvas for a ship.
 * Container selection state is now controlled by the parent.
 */
function CargoHold({
	ship,
	containers,
	contracts,
	isInteractive = true,
	selectedContainer,
	onContainerSelect,
}: CargoHoldProps) {
	const isDev = process.env.NODE_ENV === 'development'
	const [showModel, setShowModel] = useState(true)
	const [showCoordinateSystem, setShowCoordinateSystem] = useState(false)
	const [showGridDebug, setShowGridDebug] = useState(false)
	const [showDevTools, setShowDevTools] = useState(false)
	const [modelTuning, setModelTuning] = useState<ModelTuningState>(() =>
		getDefaultModelTuning(ship),
	)
	const [gridTuning, setGridTuning] = useState<CargoGridTuningState>(() =>
		getDefaultCargoGridTuning(ship),
	)
	const containerClickedRef = useRef(false)
	const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null)
	const mouseDragDetectedRef = useRef(false)
	const suppressNextSelectionClickRef = useRef(false)
	const modelTuningStorageKey = `cargo.model-tuning:${encodeURIComponent(ship.name)}`
	const gridTuningStorageKey = `cargo.grid-tuning:${encodeURIComponent(ship.name)}`

	useEffect(() => {
		const defaults = getDefaultModelTuning(ship)

		if (!isDev) {
			setModelTuning(defaults)
			return
		}

		try {
			const saved = window.localStorage.getItem(modelTuningStorageKey)
			if (!saved) {
				setModelTuning(defaults)
				return
			}

			const parsed = JSON.parse(saved) as Partial<ModelTuningState>
			setModelTuning({
				scale: typeof parsed.scale === 'number' ? parsed.scale : defaults.scale,
				position:
					Array.isArray(parsed.position) && parsed.position.length === 3
						? [
								parseModelTuning(
									String(parsed.position[0]),
									defaults.position[0],
								),
								parseModelTuning(
									String(parsed.position[1]),
									defaults.position[1],
								),
								parseModelTuning(
									String(parsed.position[2]),
									defaults.position[2],
								),
							]
						: defaults.position,
				rotation:
					Array.isArray(parsed.rotation) && parsed.rotation.length === 3
						? [
								parseModelTuning(
									String(parsed.rotation[0]),
									defaults.rotation[0],
								),
								parseModelTuning(
									String(parsed.rotation[1]),
									defaults.rotation[1],
								),
								parseModelTuning(
									String(parsed.rotation[2]),
									defaults.rotation[2],
								),
							]
						: defaults.rotation,
				opacity:
					typeof parsed.opacity === 'number'
						? parsed.opacity
						: defaults.opacity,
			})
		} catch {
			setModelTuning(defaults)
		}
	}, [isDev, modelTuningStorageKey, ship])

	useEffect(() => {
		const defaults = getDefaultCargoGridTuning(ship)

		if (!isDev) {
			setGridTuning(defaults)
			return
		}

		try {
			const saved = window.localStorage.getItem(gridTuningStorageKey)
			if (!saved) {
				setGridTuning(defaults)
				return
			}

			const parsed = JSON.parse(saved) as Partial<CargoGridTuningState>
			const loaded: CargoGridTuningState = {}

			Object.entries(defaults).forEach(([indexStr, defaultTuning]) => {
				const index = Number(indexStr)
				const savedTuning = parsed[index]

				if (
					savedTuning &&
					Array.isArray(savedTuning.position) &&
					Array.isArray(savedTuning.dimensions)
				) {
					loaded[index] = {
						position: [
							parseModelTuning(
								String(savedTuning.position[0]),
								defaultTuning.position[0],
							),
							parseModelTuning(
								String(savedTuning.position[1]),
								defaultTuning.position[1],
							),
							parseModelTuning(
								String(savedTuning.position[2]),
								defaultTuning.position[2],
							),
						],
						dimensions: [
							parseModelTuning(
								String(savedTuning.dimensions[0]),
								defaultTuning.dimensions[0],
							),
							parseModelTuning(
								String(savedTuning.dimensions[1]),
								defaultTuning.dimensions[1],
							),
							parseModelTuning(
								String(savedTuning.dimensions[2]),
								defaultTuning.dimensions[2],
							),
						],
					}
				} else {
					loaded[index] = defaultTuning
				}
			})

			setGridTuning(loaded)
		} catch {
			setGridTuning(defaults)
		}
	}, [isDev, gridTuningStorageKey, ship])

	const applyModelTuning = (next: ModelTuningState) => {
		setModelTuning(next)
		if (!isDev) return

		try {
			window.localStorage.setItem(modelTuningStorageKey, JSON.stringify(next))
		} catch {
			// Ignore localStorage failures in dev tuning mode.
		}
	}

	const applyGridTuning = (next: CargoGridTuningState) => {
		setGridTuning(next)
		if (!isDev) return

		try {
			window.localStorage.setItem(gridTuningStorageKey, JSON.stringify(next))
		} catch {
			// Ignore localStorage failures in dev tuning mode.
		}
	}

	const handleResetModelTuning = () => {
		applyModelTuning(getDefaultModelTuning(ship))
	}

	const handleResetGridTuning = (gridIndex: number) => {
		applyGridTuning({
			...gridTuning,
			[gridIndex]: getDefaultCargoGridTuning(ship)[gridIndex],
		})
	}

	const getTunedGrids = (): typeof ship.cargoGrids => {
		return ship.cargoGrids.map((grid, index) => {
			const tuning = gridTuning[index]
			if (!tuning) return grid

			return {
				...grid,
				position: {
					x: tuning.position[0],
					y: tuning.position[1],
					z: tuning.position[2],
				},
				width: tuning.dimensions[0],
				length: tuning.dimensions[1],
				height: tuning.dimensions[2],
			}
		})
	}

	const calculateGridsData = (grids = ship.cargoGrids) => {
		if (grids.length === 0)
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

		grids.forEach((grid) => {
			const pos = grid.position || { x: 0, y: 0, z: 0 }
			const rotation = grid.rotation || { x: 0, y: 0, z: 0 }
			const gridCorners = [
				new THREE.Vector3(-0.5, 0, -0.5),
				new THREE.Vector3(grid.width - 0.5, 0, -0.5),
				new THREE.Vector3(-0.5, 0, grid.length - 0.5),
				new THREE.Vector3(grid.width - 0.5, 0, grid.length - 0.5),
				new THREE.Vector3(-0.5, grid.height, -0.5),
				new THREE.Vector3(grid.width - 0.5, grid.height, -0.5),
				new THREE.Vector3(-0.5, grid.height, grid.length - 0.5),
				new THREE.Vector3(grid.width - 0.5, grid.height, grid.length - 0.5),
			]

			const rotationEuler = new THREE.Euler(rotation.x, rotation.y, rotation.z)

			gridCorners.forEach((corner) => {
				const worldCorner = corner
					.applyEuler(rotationEuler)
					.add(new THREE.Vector3(pos.x, pos.y, pos.z))

				minX = Math.min(minX, worldCorner.x)
				maxX = Math.max(maxX, worldCorner.x)
				minY = Math.min(minY, worldCorner.y)
				maxY = Math.max(maxY, worldCorner.y)
				minZ = Math.min(minZ, worldCorner.z)
				maxZ = Math.max(maxZ, worldCorner.z)
			})
		})

		return {
			center: {
				x: (minX + maxX) / 2,
				y: (minY + maxY) / 2,
				z: (minZ + maxZ) / 2,
			},
			size: {
				width: maxX - minX,
				height: maxY - minY,
				depth: maxZ - minZ,
			},
		}
	}

	const tunedGrids = getTunedGrids()
	const { center: gridsCenter, size: gridsSize } =
		calculateGridsData(tunedGrids)
	const maxDimension = Math.max(
		gridsSize.width,
		gridsSize.height,
		gridsSize.depth,
	)
	const optimalDistance = Math.max(15, maxDimension * 1.5)
	const cameraPosition = [
		gridsCenter.x + optimalDistance,
		gridsCenter.y + optimalDistance,
		gridsCenter.z + optimalDistance,
	] as [number, number, number]

	const handleContainerClick = (container: Container) => {
		if (!isInteractive) return
		if (suppressNextSelectionClickRef.current) {
			suppressNextSelectionClickRef.current = false
			return
		}
		onContainerSelect(container)
		containerClickedRef.current = true
	}

	const handleCanvasClick = (event?: ThreeEvent<MouseEvent>) => {
		if (!isInteractive) return
		if (containerClickedRef.current) {
			containerClickedRef.current = false
			return
		}
		if (event?.intersections && event.intersections.length > 0) return
		setTimeout(() => {
			onContainerSelect(null)
		}, 0)
	}

	const handleCanvasPointerMissed = () => {
		if (!isInteractive) return
		if (suppressNextSelectionClickRef.current) {
			suppressNextSelectionClickRef.current = false
			return
		}
		handleCanvasClick()
	}

	const handleCanvasPointerDown: PointerEventHandler<HTMLDivElement> = (
		event,
	) => {
		if (!isInteractive || event.pointerType !== 'mouse') return
		mouseDownPositionRef.current = {
			x: event.clientX,
			y: event.clientY,
		}
		mouseDragDetectedRef.current = false
	}

	const handleCanvasPointerMove: PointerEventHandler<HTMLDivElement> = (
		event,
	) => {
		if (!isInteractive || event.pointerType !== 'mouse') return
		if (!mouseDownPositionRef.current || mouseDragDetectedRef.current) return

		const dx = event.clientX - mouseDownPositionRef.current.x
		const dy = event.clientY - mouseDownPositionRef.current.y
		const dragThreshold = 4

		if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
			mouseDragDetectedRef.current = true
		}
	}

	const handleCanvasPointerUp: PointerEventHandler<HTMLDivElement> = (
		event,
	) => {
		if (!isInteractive || event.pointerType !== 'mouse') return
		if (mouseDragDetectedRef.current) {
			suppressNextSelectionClickRef.current = true
		}
		mouseDownPositionRef.current = null
		mouseDragDetectedRef.current = false
	}

	const loadedSCU = containers.reduce((acc, c) => acc + c.size, 0)

	return (
		<div className='w-full h-full flex flex-col'>
			{/* Ship header */}
			<div className='bg-gradient-to-r from-background via-background/95 to-background border border-border/40 rounded-lg p-4 mb-4 shadow-lg backdrop-blur-sm flex-shrink-0'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
					<div className='flex items-center gap-3'>
						<div className='w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full' />
						<div>
							<h3 className='text-xl font-bold text-foreground'>{ship.name}</h3>
							<p className='text-sm text-muted-foreground'>
								CARGO CAPACITY: {ship.totalCapacity} SCU
							</p>
						</div>
						<button
							onClick={() => setShowModel((prev) => !prev)}
							className={`px-2 py-1 text-xs border rounded transition-colors ${
								showModel
									? 'bg-cyan-500/30 border-cyan-500/40 text-cyan-300'
									: 'bg-gray-500/20 border-gray-500/40 text-gray-400 hover:bg-gray-500/30'
							}`}
						>
							{showModel ? 'Hide' : 'Show'} Model
						</button>
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
								{loadedSCU}
							</div>
						</div>
						<div className='text-center md:mr-4'>
							<div className='text-sm text-muted-foreground'>UTILIZATION</div>
							<div className='text-lg font-semibold text-blue-500'>
								{ship.totalCapacity > 0
									? Math.round((loadedSCU / ship.totalCapacity) * 100)
									: 0}
								%
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Canvas */}
			<div
				className='flex-1 relative bg-gradient-to-br from-background/50 to-background border border-border/40 rounded-lg overflow-hidden shadow-lg min-h-0'
				onPointerDown={handleCanvasPointerDown}
				onPointerMove={handleCanvasPointerMove}
				onPointerUp={handleCanvasPointerUp}
			>
				<Canvas
					key={`canvas-${ship.name}`}
					camera={{ position: cameraPosition, fov: 50 }}
					onPointerMissed={handleCanvasPointerMissed}
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
					<directionalLight
						position={[10, 20, 10]}
						intensity={1.2}
						castShadow
						shadow-mapSize-width={2048}
						shadow-mapSize-height={2048}
					/>
					<spotLight
						position={[10, 10, 10]}
						angle={0.15}
						penumbra={1}
						intensity={0.7}
						color='#FF8A00'
					/>
					<CoordinateSystemHelper visible={showCoordinateSystem} />
					{showGridDebug && <CargoGridDebugHelper ship={ship} />}
					{/* Render ship model if present (GLTF) */}
					{showModel && ship.modelPath && ship.modelPath.endsWith('.glb') && (
						<ShipModelGLTF
							url={ship.modelPath}
							scale={modelTuning.scale}
							position={modelTuning.position}
							rotation={modelTuning.rotation}
							opacity={modelTuning.opacity}
						/>
					)}
					<GridPlane grids={tunedGrids} />
					{containers.map((container, index) => (
						<ContainerVoxel
							key={`container-${container.contractIndex}-${index}`}
							container={container}
							onClick={handleContainerClick}
							isHighlighted={selectedContainer === container}
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
				{/* Dev Tools Floating Button and Modal */}
				{isDev && (
					<>
						{/* Floating Toggle Button */}
						<button
							type='button'
							onClick={() => setShowDevTools((prev) => !prev)}
							className='absolute bottom-4 right-4 z-30 p-3 rounded-full bg-background border border-border/40 hover:bg-muted shadow-lg transition'
							title='Dev Tools'
						>
							<svg
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
								className='w-5 h-5 text-muted-foreground'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
								/>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
								/>
							</svg>
						</button>

						{/* Dev Tools Modal */}
						{showDevTools && (
							<CargoHoldDevToolsModal
								cargoGridCount={ship.cargoGrids.length}
								modelTuning={modelTuning}
								gridTuning={gridTuning}
								showCoordinateSystem={showCoordinateSystem}
								showGridDebug={showGridDebug}
								onClose={() => setShowDevTools(false)}
								onToggleCoordinateSystem={() =>
									setShowCoordinateSystem((prev) => !prev)
								}
								onToggleGridDebug={() => setShowGridDebug((prev) => !prev)}
								onModelTuningChange={applyModelTuning}
								onResetModelTuning={handleResetModelTuning}
								onGridTuningChange={applyGridTuning}
								onResetGridTuning={handleResetGridTuning}
								onRefreshPage={() => window.location.reload()}
							/>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export { CargoHold }
