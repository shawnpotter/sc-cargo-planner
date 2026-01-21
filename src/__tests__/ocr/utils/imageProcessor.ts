// src/__tests__/ocr/utils/imageProcessor.ts
import { createCanvas, loadImage, Image } from 'canvas'
import { applyImageProcessing } from '@/components/ocr/utils/imageProcessing'
import type { ImageProcessingSettings } from '@/components/ocr/parser/types'

export async function splitImageForTest(
	imagePath: string,
	splitColumn: number = 50
): Promise<{ left: string; right: string }> {
	try {
		// Load the image using node-canvas
		const img = await loadImage(imagePath)

		const splitX = Math.floor(img.width * (splitColumn / 100))

		// Create left canvas
		const leftCanvas = createCanvas(splitX, img.height)
		const leftCtx = leftCanvas.getContext('2d')
		leftCtx.drawImage(
			img as unknown as Image,
			0,
			0,
			splitX,
			img.height,
			0,
			0,
			splitX,
			img.height
		)

		// Create right canvas
		const rightCanvas = createCanvas(img.width - splitX, img.height)
		const rightCtx = rightCanvas.getContext('2d')
		rightCtx.drawImage(
			img as unknown as Image,
			splitX,
			0,
			img.width - splitX,
			img.height,
			0,
			0,
			img.width - splitX,
			img.height
		)

		// Convert to base64 data URLs
		return {
			left: leftCanvas.toDataURL('image/png'),
			right: rightCanvas.toDataURL('image/png'),
		}
	} catch (error) {
		console.error('Error splitting image:', error)
		throw error
	}
}

/**
 * Dev-parity helper: mimic the browser-side split + preprocessing pipeline used by
 * `useImageProcessor()` so OCR output is closer between tests and the app.
 */
export async function splitAndProcessImageForTest(
	imagePath: string,
	settings: ImageProcessingSettings
): Promise<{ left: string; right: string }> {
	try {
		const img = await loadImage(imagePath)

		const scale = settings.scale / 100
		const scaledWidth = img.width * scale
		const scaledHeight = img.height * scale
		const splitX = Math.floor(scaledWidth * (settings.splitColumn / 100))

		// Create left canvas
		const leftCanvas = createCanvas(splitX, Math.floor(scaledHeight))
		const leftCtx = leftCanvas.getContext('2d')

		// Match the browser code path: use non-integer source crop values based on original width
		leftCtx.drawImage(
			img as unknown as Image,
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
		leftImageData = applyImageProcessing(
			leftImageData as unknown as ImageData,
			settings
		) as unknown as typeof leftImageData
		leftCtx.putImageData(leftImageData, 0, 0)

		// Create right canvas
		const rightCanvas = createCanvas(
			Math.floor(scaledWidth) - splitX,
			Math.floor(scaledHeight)
		)
		const rightCtx = rightCanvas.getContext('2d')

		rightCtx.drawImage(
			img as unknown as Image,
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
		rightImageData = applyImageProcessing(
			rightImageData as unknown as ImageData,
			settings
		) as unknown as typeof rightImageData
		rightCtx.putImageData(rightImageData, 0, 0)

		return {
			left: leftCanvas.toDataURL('image/png'),
			right: rightCanvas.toDataURL('image/png'),
		}
	} catch (error) {
		console.error('Error splitting/processing image:', error)
		throw error
	}
}
