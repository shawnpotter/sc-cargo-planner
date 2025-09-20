// @/app/components/canvas/CargoHold/CargoHold.tsx
import { useState, useRef } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ContainerVoxel } from '@/components/canvas/ContainerVoxel'
import { ContainerInfo } from '@/components/canvas/ContainerInfo'
import { GridPlane } from '@/components/canvas/GridPlane'
import { Ship, Container, Contract } from '@/constants/types'
import * as THREE from 'three'

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
		null
	)
	const [highlightedContainer, setHighlightedContainer] =
		useState<Container | null>(null)
	const cameraDistance = 15
	const containerClickedRef = useRef(false)

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
		reactEvent
	) => {
		if (!isInteractive) return
		const threeEvent = reactEvent as unknown as ThreeEvent<MouseEvent>
		handleCanvasClick(threeEvent)
	}

	return (
		<div>
			{/* Header with ship data */}
			<div>
				<div>
					<div></div>
					<h3>{ship.name}</h3>
					<span>|</span>
					<span>CARGO CAPACITY:</span>
					<span>{ship.totalCapacity} SCU</span>
					<div>
						<div>
							<span>GRIDS:</span> {ship.cargoGrids.length}
						</div>
						<div>
							<span>SCU:</span> {containers.reduce((acc, c) => acc + c.size, 0)}
						</div>
					</div>
				</div>
			</div>

			<div>
				<Canvas
					key={`canvas-${ship.name}`}
					camera={{
						position: [cameraDistance, cameraDistance, cameraDistance],
						fov: 50,
					}}
					onClick={canvasClickHandler}
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
						/>
					)}
				</Canvas>
				{selectedContainer && contracts.length > 0 && (
					<div>
						<div>
							<span></span>
							<h3>Container Info</h3>
							<span></span>
						</div>
						<ContainerInfo
							container={selectedContainer}
							contracts={contracts}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export { CargoHold }
