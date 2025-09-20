// @/app/components/GridPlane.tsx
import { CargoGrid } from '@/constants/types'

interface GridPlaneProps {
	readonly grids: CargoGrid[]
	readonly borderColor?: string
	readonly interiorColor?: string
	readonly heightColor?: string
	readonly heightLines?: boolean
	readonly heightValue?: number
}

/**
 * GridPlane component renders the cargo grids as a 3D plane with optional height lines.
 * @param {CargoGrid[]} grids - Array of cargo grids to be rendered.
 * @param {string} [borderColor='#FF8A00'] - Color for the border lines of the grid.
 * @param {string} [interiorColor='#444444'] - Color for the interior lines of the grid.
 * @param {string} [heightColor='#335577'] - Color for the height lines of the grid.
 * @param {boolean} [heightLines=true] - Flag to indicate if height lines should be rendered.
 * @param {number} [heightValue=1] - Default height value for the grid.
 */
function GridPlane({
	grids,
	borderColor = '#FF8A00', // Orange border color
	interiorColor = '#444444', // Subtle gray for interior lines
	heightColor = '#335577', // Bluish color for height lines
	heightLines = true,
	heightValue = 1, // Default height of 1 unit
}: GridPlaneProps) {
	return (
		<group>
			{grids.map((grid, gridIndex) => {
				const {
					width,
					length,
					height = heightValue, // Use the grid's height if specified, otherwise use default
					position = { x: 0, y: 0, z: 0 },
					rotation = { x: 0, y: 0, z: 0 },
				} = grid

				return (
					<group
						key={`grid-x${position.x}-y${position.y}-z${position.z}-w${width}-l${length}-h${height}`}
						position={[position.x, position.y, position.z]}
						rotation={[rotation.x, rotation.y, rotation.z]}
					>
						<group position={[-0.5, 0, -0.5]}>
							{/* Vertical lines (along X axis) */}
							{Array.from({ length: width + 1 }).map((_, i) => (
								<line key={`vertical-${i}-${gridIndex}`}>
									<bufferGeometry attach='geometry'>
										<bufferAttribute
											attach='attributes-position'
											args={[new Float32Array([i, 0, 0, i, 0, length]), 3]}
										/>
									</bufferGeometry>
									<lineBasicMaterial
										color={i === 0 || i === width ? borderColor : interiorColor}
										linewidth={i === 0 || i === width ? 2 : 1}
									/>
								</line>
							))}

							{/* Horizontal lines (along Z axis) */}
							{Array.from({ length: length + 1 }).map((_, i) => (
								<line key={`horizontal-${i}-${gridIndex}`}>
									<bufferGeometry attach='geometry'>
										<bufferAttribute
											attach='attributes-position'
											args={[new Float32Array([0, 0, i, width, 0, i]), 3]}
										/>
									</bufferGeometry>
									<lineBasicMaterial
										color={
											i === 0 || i === length ? borderColor : interiorColor
										}
										linewidth={i === 0 || i === length ? 2 : 1}
									/>
								</line>
							))}

							{/* Height lines (vertical from corners) */}
							{heightLines && (
								<>
									{/* Bottom Left */}
									<line
										key={`height-bl-x${position.x}-z${position.z}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[new Float32Array([0, 0, 0, 0, height, 0]), 3]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.6}
											transparent
										/>
									</line>

									{/* Bottom Right */}
									<line
										key={`height-br-x${position.x + width}-z${
											position.z
										}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([width, 0, 0, width, height, 0]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.6}
											transparent
										/>
									</line>

									{/* Top Left */}
									<line
										key={`height-tl-x${position.x}-z${
											position.z + length
										}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([0, 0, length, 0, height, length]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.6}
											transparent
										/>
									</line>

									{/* Top Right */}
									<line
										key={`height-tr-x${position.x + width}-z${
											position.z + length
										}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([
														width,
														0,
														length,
														width,
														height,
														length,
													]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.6}
											transparent
										/>
									</line>

									{/* Optional: Top frame (connecting the top of the height lines) */}
									<line
										key={`height-top-front-x${position.x}-w${width}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([0, height, 0, width, height, 0]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.4}
											transparent
										/>
									</line>

									<line
										key={`height-top-right-x${
											position.x + width
										}-l${length}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([
														width,
														height,
														0,
														width,
														height,
														length,
													]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.4}
											transparent
										/>
									</line>

									<line
										key={`height-top-back-x${
											position.x + width
										}-l${length}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([
														width,
														height,
														length,
														0,
														height,
														length,
													]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.4}
											transparent
										/>
									</line>

									<line
										key={`height-top-left-x${position.x}-l${length}-g${gridIndex}`}
									>
										<bufferGeometry attach='geometry'>
											<bufferAttribute
												attach='attributes-position'
												args={[
													new Float32Array([0, height, length, 0, height, 0]),
													3,
												]}
											/>
										</bufferGeometry>
										<lineBasicMaterial
											color={heightColor}
											opacity={0.4}
											transparent
										/>
									</line>
								</>
							)}
						</group>
					</group>
				)
			})}
		</group>
	)
}

export { GridPlane }
