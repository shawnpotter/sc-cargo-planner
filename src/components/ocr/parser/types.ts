// @/components/ocr/parser/types.ts
export interface ImageProcessingSettings {
	brightness: number
	contrast: number
	sharpen: boolean
	grayscale: boolean
	invert: boolean
	threshold: boolean
	thresholdValue: number
	scale: number
	rotate: number
	denoise: boolean
	splitColumn: number
}

export interface ParsedContract {
	origin?: string
	destinations?: Array<{
		location: string
		cargo: Array<{
			type: string
			quantity: number
		}>
	}>
	maxContainerSize?: number
	payout?: number
	contractedBy?: string
	rank?: string
}

export interface ColumnOCRResult {
	left: {
		text: string
		confidence: number
	}
	right: {
		text: string
		confidence: number
	}
	combined: string
}

export const DEFAULT_SETTINGS: ImageProcessingSettings = {
	brightness: 0,
	contrast: 0,
	sharpen: false,
	grayscale: false,
	invert: false,
	threshold: false,
	thresholdValue: 128,
	scale: 100,
	rotate: 0,
	denoise: false,
	splitColumn: 50,
}

export const PRESETS = {
	Default: DEFAULT_SETTINGS,
	'Dark Screenshot': {
		...DEFAULT_SETTINGS,
		brightness: 20,
		contrast: 30,
		sharpen: true,
	},
	'Light Text': {
		...DEFAULT_SETTINGS,
		invert: true,
		contrast: 20,
		sharpen: true,
	},
	'High Contrast': {
		...DEFAULT_SETTINGS,
		grayscale: true,
		threshold: true,
		thresholdValue: 128,
		sharpen: true,
	},
	'Enhance Details': {
		...DEFAULT_SETTINGS,
		contrast: 15,
		sharpen: true,
		scale: 150,
		denoise: true,
	},
}
