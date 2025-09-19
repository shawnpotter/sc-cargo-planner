// @/utils/distortion.ts
import { GraphNode } from '@/hooks/useGraphData'

export function applyHierarchicalDistortion(
	nodes: GraphNode[],
	centerX: number,
	centerY: number,
	strength: number
): GraphNode[] {
	// Create a map of all celestial bodies (planets and moons) for parent lookup
	const celestialBodies = new Map<string, GraphNode>()
	nodes.forEach((node) => {
		if (node.location.type === 'PLANET' || node.location.type === 'MOON') {
			celestialBodies.set(node.location.name, node)
		}
	})

	// First pass: Apply distortion to independent objects (planets, orbital stations, etc.)
	const distortedNodes = nodes.map((node) => {
		let finalX = node.originalX
		let finalY = node.originalY

		// Skip objects that depend on other objects for now
		if (node.location.type === 'SURFACE_LOCATION') {
			return {
				...node,
				distortedX: finalX,
				distortedY: finalY,
				x: finalX,
				y: finalY,
			}
		}

		// Apply global radial distortion with both logarithmic and linear components
		const dx = node.originalX - centerX
		const dy = node.originalY - centerY
		const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

		if (distanceFromCenter > 0) {
			const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY) * 2
			const normalizedDistance = distanceFromCenter / maxDistance

			// Logarithmic scaling component
			const logScale = Math.log(normalizedDistance * 19 + 1) / Math.log(20)
			const logDistortedDistance =
				logScale * maxDistance * strength + distanceFromCenter * (1 - strength)

			// Additional linear separation component for dramatic spreading at high distortion
			const linearPushFactor = 2.0 // Adjust this to control how dramatic the separation is
			const additionalLinearPush =
				distanceFromCenter * strength * linearPushFactor

			// Combine both components
			const totalDistortedDistance = logDistortedDistance + additionalLinearPush
			const globalRatio = totalDistortedDistance / distanceFromCenter

			finalX = centerX + dx * globalRatio
			finalY = centerY + dy * globalRatio
		}

		// Handle moons and orbital stations relative to their parent planets
		if (
			node.location.parentObject &&
			(node.location.type === 'MOON' ||
				node.location.type === 'ORBITAL_STATION')
		) {
			const parentBody = celestialBodies.get(node.location.parentObject)

			if (parentBody && parentBody.location.type === 'PLANET') {
				// Get the parent's distorted position using the same distortion formula
				let parentX = parentBody.originalX
				let parentY = parentBody.originalY

				const parentDx = parentX - centerX
				const parentDy = parentY - centerY
				const parentDistance = Math.sqrt(
					parentDx * parentDx + parentDy * parentDy
				)

				if (parentDistance > 0) {
					const maxDistance =
						Math.sqrt(centerX * centerX + centerY * centerY) * 2
					const normalizedDistance = parentDistance / maxDistance

					// Apply same distortion formula as above
					const logScale = Math.log(normalizedDistance * 19 + 1) / Math.log(20)
					const logDistortedDistance =
						logScale * maxDistance * strength + parentDistance * (1 - strength)
					const additionalLinearPush = parentDistance * strength * 2.0
					const totalDistortedDistance =
						logDistortedDistance + additionalLinearPush
					const ratio = totalDistortedDistance / parentDistance

					parentX = centerX + parentDx * ratio
					parentY = centerY + parentDy * ratio
				}

				// Calculate local offset from parent
				const localDx = node.originalX - parentBody.originalX
				const localDy = node.originalY - parentBody.originalY
				const localDistance = Math.sqrt(localDx * localDx + localDy * localDy)

				if (localDistance > 0) {
					let minDistance = 0
					let pushFactor = 1

					// Reversed: Moons should be further out than orbital stations
					if (node.location.type === 'MOON') {
						minDistance = 80 * strength + 20
						pushFactor = 1.5
					} else if (node.location.type === 'ORBITAL_STATION') {
						minDistance = 30 * strength + 10
						pushFactor = 0.6
					}

					const targetDistance = Math.max(
						minDistance,
						localDistance * pushFactor
					)
					const localRatio = targetDistance / localDistance

					// Apply the local offset to the parent's distorted position
					finalX = parentX + localDx * localRatio
					finalY = parentY + localDy * localRatio
				}
			}
		}

		// Special handling for ALL Lagrange points
		if (
			node.location.type === 'LAGRANGE_POINT_STATION' &&
			node.location.parentObject
		) {
			const parentName = node.location.parentObject
			const parentBody = celestialBodies.get(parentName!)

			if (parentBody) {
				// Get the parent's distorted position using same formula
				let parentX = parentBody.originalX
				let parentY = parentBody.originalY

				const parentDx = parentX - centerX
				const parentDy = parentY - centerY
				const parentDistance = Math.sqrt(
					parentDx * parentDx + parentDy * parentDy
				)

				if (parentDistance > 0) {
					const maxDistance =
						Math.sqrt(centerX * centerX + centerY * centerY) * 2
					const normalizedDistance = parentDistance / maxDistance

					// Apply same distortion formula
					const logScale = Math.log(normalizedDistance * 19 + 1) / Math.log(20)
					const logDistortedDistance =
						logScale * maxDistance * strength + parentDistance * (1 - strength)
					const additionalLinearPush = parentDistance * strength * 2.0
					const totalDistortedDistance =
						logDistortedDistance + additionalLinearPush
					const ratio = totalDistortedDistance / parentDistance

					parentX = centerX + parentDx * ratio
					parentY = centerY + parentDy * ratio
				}

				// Handle different Lagrange points
				if (node.location.name.includes('L1')) {
					// L1: Between star and planet, closer to planet
					const directionX =
						(parentX - centerX) /
						Math.sqrt(
							Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
						)
					const directionY =
						(parentY - centerY) /
						Math.sqrt(
							Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
						)
					const l1Distance =
						Math.sqrt(
							Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
						) -
						(40 * strength + 20)

					finalX = centerX + directionX * l1Distance
					finalY = centerY + directionY * l1Distance
				} else if (node.location.name.includes('L2')) {
					// L2: Beyond the planet, away from star
					const directionX =
						(parentX - centerX) /
						Math.sqrt(
							Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
						)
					const directionY =
						(parentY - centerY) /
						Math.sqrt(
							Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
						)
					const l2Distance =
						Math.sqrt(
							Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
						) +
						(40 * strength + 20)

					finalX = centerX + directionX * l2Distance
					finalY = centerY + directionY * l2Distance
				} else if (node.location.name.includes('L3')) {
					// L3: Opposite side of star from planet
					finalX = centerX - (parentX - centerX)
					finalY = centerY - (parentY - centerY)
				} else if (
					node.location.name.includes('L4') ||
					node.location.name.includes('L5')
				) {
					// L4/L5: Same distance as planet, but 60 degrees ahead/behind
					const planetAngle = Math.atan2(parentY - centerY, parentX - centerX)
					const l4l5Offset = node.location.name.includes('L4')
						? Math.PI / 3
						: -Math.PI / 3 // 60 degrees
					const newAngle = planetAngle + l4l5Offset

					// Keep the same distance from star as the parent planet
					const distanceFromStar = Math.sqrt(
						Math.pow(parentX - centerX, 2) + Math.pow(parentY - centerY, 2)
					)

					finalX = centerX + distanceFromStar * Math.cos(newAngle)
					finalY = centerY + distanceFromStar * Math.sin(newAngle)
				}
			}
		}

		return {
			...node,
			distortedX: finalX,
			distortedY: finalY,
			x: finalX,
			y: finalY,
		}
	})

	// ... (rest of the function remains the same - moon overlap handling and surface location positioning)

	// Handle overlapping moons
	const moonGroups = new Map<string, GraphNode[]>()
	distortedNodes.forEach((node) => {
		if (node.location.type === 'MOON' && node.location.parentObject) {
			if (!moonGroups.has(node.location.parentObject)) {
				moonGroups.set(node.location.parentObject, [])
			}
			moonGroups.get(node.location.parentObject)!.push(node)
		}
	})

	// Separate overlapping moons by adjusting their angular positions
	moonGroups.forEach((moons, parentName) => {
		if (moons.length > 1) {
			const parentNode = distortedNodes.find(
				(n) => n.location.name === parentName
			)
			if (!parentNode) return

			// Check for overlaps and separate them
			for (let i = 0; i < moons.length; i++) {
				for (let j = i + 1; j < moons.length; j++) {
					const moon1 = moons[i]
					const moon2 = moons[j]

					const distance = Math.sqrt(
						Math.pow(moon1.distortedX - moon2.distortedX, 2) +
							Math.pow(moon1.distortedY - moon2.distortedY, 2)
					)

					// If moons are too close (less than 30 units apart)
					if (distance < 30 * strength + 10) {
						// Calculate angles from parent
						const angle1 = Math.atan2(
							moon1.distortedY - parentNode.distortedY,
							moon1.distortedX - parentNode.distortedX
						)
						const angle2 = Math.atan2(
							moon2.distortedY - parentNode.distortedY,
							moon2.distortedX - parentNode.distortedX
						)

						// Calculate distances from parent
						const dist1 = Math.sqrt(
							Math.pow(moon1.distortedX - parentNode.distortedX, 2) +
								Math.pow(moon1.distortedY - parentNode.distortedY, 2)
						)
						const dist2 = Math.sqrt(
							Math.pow(moon2.distortedX - parentNode.distortedX, 2) +
								Math.pow(moon2.distortedY - parentNode.distortedY, 2)
						)

						// Separate them by adjusting angles
						const angleAdjust = (30 * strength + 15) / Math.max(dist1, dist2)

						// Update positions
						const newAngle1 = angle1 - angleAdjust / 2
						const newAngle2 = angle2 + angleAdjust / 2

						moon1.distortedX =
							parentNode.distortedX + dist1 * Math.cos(newAngle1)
						moon1.distortedY =
							parentNode.distortedY + dist1 * Math.sin(newAngle1)
						moon1.x = moon1.distortedX
						moon1.y = moon1.distortedY

						moon2.distortedX =
							parentNode.distortedX + dist2 * Math.cos(newAngle2)
						moon2.distortedY =
							parentNode.distortedY + dist2 * Math.sin(newAngle2)
						moon2.x = moon2.distortedX
						moon2.y = moon2.distortedY
					}
				}
			}
		}
	})

	// Create a map of distorted positions
	const distortedPositions = new Map<string, { x: number; y: number }>()
	distortedNodes.forEach((node) => {
		distortedPositions.set(node.location.name, {
			x: node.distortedX,
			y: node.distortedY,
		})
	})

	// Second pass: Position surface locations relative to their distorted parents
	return distortedNodes.map((node) => {
		if (
			node.location.type !== 'SURFACE_LOCATION' ||
			!node.location.parentObject
		) {
			return node
		}

		// Get the parent's distorted position
		const parentPosition = distortedPositions.get(node.location.parentObject)
		if (!parentPosition) return node

		const parentNode = celestialBodies.get(node.location.parentObject)

		// Calculate local offset from parent in original space
		const originalParent = nodes.find(
			(n) => n.location.name === node.location.parentObject
		)
		if (!originalParent) return node

		const localDx = node.originalX - originalParent.originalX
		const localDy = node.originalY - originalParent.originalY
		const localDistance = Math.sqrt(localDx * localDx + localDy * localDy)

		if (localDistance > 0) {
			let minDistance = 0
			let pushFactor = 1

			// Different handling based on whether parent is moon or planet
			if (parentNode && parentNode.location.type === 'MOON') {
				minDistance = 10 * strength + 3
				pushFactor = 0.4 // Keep very close to moon
			} else {
				minDistance = 20 * strength + 5
				pushFactor = 0.6
			}

			const targetDistance = Math.max(minDistance, localDistance * pushFactor)
			const localRatio = targetDistance / localDistance

			// Apply the local offset to the parent's distorted position
			const finalX = parentPosition.x + localDx * localRatio
			const finalY = parentPosition.y + localDy * localRatio

			return {
				...node,
				distortedX: finalX,
				distortedY: finalY,
				x: finalX,
				y: finalY,
			}
		}

		return node
	})
}
