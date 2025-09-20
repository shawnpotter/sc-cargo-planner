// @/components/ocr/parser/types.ts
/**
 * Configuration options for image processing operations.
 *
 * @property brightness - Adjusts the image brightness level.
 * @property contrast - Adjusts the image contrast level.
 * @property sharpen - Enables or disables image sharpening.
 * @property grayscale - Converts the image to grayscale if true.
 * @property invert - Inverts the image colors if true.
 * @property threshold - Applies thresholding to the image if true.
 * @property thresholdValue - The value used for thresholding the image.
 * @property scale - Scales the image by the specified factor.
 * @property rotate - Rotates the image by the specified degrees.
 * @property denoise - Applies denoising to the image if true.
 * @property splitColumn - Splits the image into columns; specifies the number of columns.
 */
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

/**
 * Represents a parsed contract containing details about cargo transportation.
 *
 * @property origin - The starting location of the contract (optional).
 * @property destinations - An array of destination objects, each specifying a location and associated cargo details (optional).
 * @property destinations.location - The destination location.
 * @property destinations.cargo - An array of cargo items, each with a type and quantity.
 * @property destinations.cargo.type - The type of cargo.
 * @property destinations.cargo.quantity - The quantity of the cargo.
 * @property maxContainerSize - The maximum allowed container size for the contract (optional).
 * @property payout - The payout amount for fulfilling the contract (optional).
 * @property contractedBy - The entity or person who issued the contract (optional).
 * @property rank - The rank or level associated with the contract (optional).
 */
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

/**
 * Represents the OCR (Optical Character Recognition) result for a column,
 * including separate results for the left and right parts, as well as the combined text.
 *
 * @property left - The OCR result for the left part of the column, containing recognized text and its confidence score.
 * @property right - The OCR result for the right part of the column, containing recognized text and its confidence score.
 * @property combined - The combined recognized text from both left and right parts.
 */
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

/**
 * Default image processing settings used for OCR parsing.
 *
 * @remarks
 * These settings control various aspects of image preprocessing such as brightness, contrast,
 * sharpening, grayscale conversion, inversion, thresholding, scaling, rotation, denoising,
 * and column splitting. Adjust these values to optimize OCR results for different image sources.
 *
 * @property brightness - The brightness adjustment value (default: 0).
 * @property contrast - The contrast adjustment value (default: 0).
 * @property sharpen - Whether to apply sharpening to the image (default: false).
 * @property grayscale - Whether to convert the image to grayscale (default: false).
 * @property invert - Whether to invert the image colors (default: false).
 * @property threshold - Whether to apply thresholding to the image (default: false).
 * @property thresholdValue - The threshold value used if thresholding is enabled (default: 128).
 * @property scale - The scale percentage for resizing the image (default: 100).
 * @property rotate - The rotation angle in degrees (default: 0).
 * @property denoise - Whether to apply denoising to the image (default: false).
 * @property splitColumn - The column index used for splitting the image (default: 50).
 */
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

/**
 * A collection of preset configurations for image processing in OCR tasks.
 * Each preset extends the `DEFAULT_SETTINGS` and customizes properties such as brightness,
 * contrast, sharpening, inversion, grayscale, thresholding, scaling, and denoising to optimize
 * OCR results for different image conditions.
 *
 * Presets:
 * - `Default`: Uses the default settings.
 * - `Dark Screenshot`: Enhances brightness and contrast for dark screenshots, and applies sharpening.
 * - `Light Text`: Inverts colors, increases contrast, and sharpens for images with light text.
 * - `High Contrast`: Applies grayscale, thresholding, and sharpening for high-contrast images.
 * - `Enhance Details`: Increases contrast, sharpens, scales up, and denoises to enhance image details.
 *
 * @constant
 */
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
