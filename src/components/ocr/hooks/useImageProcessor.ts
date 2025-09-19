// app/components/OCRScanner/hooks/useImageProcessor.ts
import { useCallback, useRef } from 'react'
import { ImageProcessingSettings } from '@/components/ocr/parser/types'
import { applyImageProcessing } from '@/components/ocr/utils/imageProcessing'

export function useImageProcessor() {
	const leftCanvasRef = useRef<HTMLCanvasElement>(null)
	const rightCanvasRef = useRef<HTMLCanvasElement>(null)

	const splitAndProcessImage = useCallback(
		(
			originalImage: string,
			settings: ImageProcessingSettings
		): Promise<{ left: string; right: string }> => {
			return new Promise((resolve) => {
				const img = new Image()
				img.onload = () => {
					const leftCanvas = leftCanvasRef.current!
					const rightCanvas = rightCanvasRef.current!
					const leftCtx = leftCanvas.getContext('2d')!
					const rightCtx = rightCanvas.getContext('2d')!

					const scale = settings.scale / 100
					const scaledWidth = img.width * scale
					const scaledHeight = img.height * scale
					const splitX = Math.floor(scaledWidth * (settings.splitColumn / 100))

					// Set canvas sizes
					leftCanvas.width = splitX
					leftCanvas.height = scaledHeight
					rightCanvas.width = scaledWidth - splitX
					rightCanvas.height = scaledHeight

					// Draw and process left half
					leftCtx.drawImage(
						img,
						0,
						0,
						img.width * (settings.splitColumn / 100),
						img.height,
						0,
						0,
						leftCanvas.width,
						leftCanvas.height
					)
					let leftImageData = leftCtx.getImageData(
						0,
						0,
						leftCanvas.width,
						leftCanvas.height
					)
					leftImageData = applyImageProcessing(leftImageData, settings)
					leftCtx.putImageData(leftImageData, 0, 0)

					// Draw and process right half
					rightCtx.drawImage(
						img,
						img.width * (settings.splitColumn / 100),
						0,
						img.width * (1 - settings.splitColumn / 100),
						img.height,
						0,
						0,
						rightCanvas.width,
						rightCanvas.height
					)
					let rightImageData = rightCtx.getImageData(
						0,
						0,
						rightCanvas.width,
						rightCanvas.height
					)
					rightImageData = applyImageProcessing(rightImageData, settings)
					rightCtx.putImageData(rightImageData, 0, 0)

					resolve({
						left: leftCanvas.toDataURL('image/png'),
						right: rightCanvas.toDataURL('image/png'),
					})
				}
				img.src = originalImage
			})
		},
		[]
	)

	return {
		leftCanvasRef,
		rightCanvasRef,
		splitAndProcessImage,
	}
}
