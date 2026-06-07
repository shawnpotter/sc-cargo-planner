import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as THREE from 'three'

type ShipModelGLTFProps = {
	url: string
	scale?: number | [number, number, number]
	position?: [number, number, number]
	rotation?: [number, number, number]
	opacity?: number
}

export function ShipModelGLTF({
	url,
	scale = 1,
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	opacity = 1,
}: Readonly<ShipModelGLTFProps>) {
	const gltf = useLoader(GLTFLoader, url, (loader) => {
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('/draco/')
		loader.setDRACOLoader(dracoLoader)
	})
	const clampedOpacity = Math.min(1, Math.max(0, opacity))

	const memoScene = useMemo(() => {
		const clone = gltf.scene.clone()

		clone.traverse((child) => {
			if (!(child as THREE.Mesh).isMesh) return

			const mesh = child as THREE.Mesh
			mesh.castShadow = true
			mesh.receiveShadow = true

			if (Array.isArray(mesh.material)) {
				mesh.material = mesh.material.map((material) => {
					const m = material.clone()
					m.transparent = true
					m.opacity = clampedOpacity
					m.depthWrite = clampedOpacity >= 1
					m.needsUpdate = true
					return m
				})
			} else if (mesh.material) {
				const material = mesh.material.clone()
				material.transparent = true
				material.opacity = clampedOpacity
				material.depthWrite = clampedOpacity >= 1
				material.needsUpdate = true
				mesh.material = material
			}

			mesh.renderOrder = clampedOpacity < 1 ? 1 : 0
		})

		return clone
	}, [gltf.scene, clampedOpacity])

	return (
		<primitive
			object={memoScene}
			scale={scale}
			position={position}
			rotation={rotation}
		/>
	)
}
