// @/components/ocr/utils/imageProcessing.ts
import { ImageProcessingSettings } from '@/components/ocr/parser/types'

export function applyImageProcessing(
	imageData: ImageData,
	settings: ImageProcessingSettings
): ImageData {
	const data = imageData.data

	if (settings.grayscale) {
		applyGrayscale(data)
	}

	applyBrightnessContrast(data, settings.brightness, settings.contrast)

	if (settings.threshold) {
		applyThreshold(data, settings.thresholdValue)
	}

	if (settings.invert) {
		applyInvert(data)
	}

	if (settings.denoise) {
		applyDenoise(data, imageData.width, imageData.height)
	}

	if (settings.sharpen) {
		applySharpen(data, imageData.width, imageData.height)
	}

	return imageData
}

function applyGrayscale(data: Uint8ClampedArray) {
	for (let i = 0; i < data.length; i += 4) {
		const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
		data[i] = gray
		data[i + 1] = gray
		data[i + 2] = gray
	}
}

function applyBrightnessContrast(
	data: Uint8ClampedArray,
	brightness: number,
	contrast: number
) {
	const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

	for (let i = 0; i < data.length; i += 4) {
		// Brightness
		data[i] += brightness
		data[i + 1] += brightness
		data[i + 2] += brightness

		// Contrast
		data[i] = contrastFactor * (data[i] - 128) + 128
		data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128
		data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128

		// Clamp values
		data[i] = Math.max(0, Math.min(255, data[i]))
		data[i + 1] = Math.max(0, Math.min(255, data[i + 1]))
		data[i + 2] = Math.max(0, Math.min(255, data[i + 2]))
	}
}

function applyThreshold(data: Uint8ClampedArray, thresholdValue: number) {
	for (let i = 0; i < data.length; i += 4) {
		const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
		const val = avg > thresholdValue ? 255 : 0
		data[i] = val
		data[i + 1] = val
		data[i + 2] = val
	}
}

function applyInvert(data: Uint8ClampedArray) {
	for (let i = 0; i < data.length; i += 4) {
		data[i] = 255 - data[i]
		data[i + 1] = 255 - data[i + 1]
		data[i + 2] = 255 - data[i + 2]
	}
}

function applyDenoise(data: Uint8ClampedArray, width: number, height: number) {
	const output = new Uint8ClampedArray(data)

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			for (let c = 0; c < 3; c++) {
				const pixels = []
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const idx = ((y + dy) * width + (x + dx)) * 4 + c
						pixels.push(data[idx])
					}
				}
				pixels.sort((a, b) => a - b)
				output[(y * width + x) * 4 + c] = pixels[4] // median
			}
		}
	}

	for (let i = 0; i < data.length; i++) {
		data[i] = output[i]
	}
}

function applySharpen(data: Uint8ClampedArray, width: number, height: number) {
	const output = new Uint8ClampedArray(data)
	const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			for (let c = 0; c < 3; c++) {
				let sum = 0
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = ((y + ky) * width + (x + kx)) * 4 + c
						const kernelIdx = (ky + 1) * 3 + (kx + 1)
						sum += data[idx] * kernel[kernelIdx]
					}
				}
				output[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum))
			}
		}
	}

	for (let i = 0; i < data.length; i += 4) {
		data[i] = output[i]
		data[i + 1] = output[i + 1]
		data[i + 2] = output[i + 2]
	}
}
