import { useState, useCallback, RefObject } from 'react'
import { useImageProcessor } from './useImageProcessor'
import { useOCRWorker } from './useOCRWorker'
import { parseContractText } from '../parser/parseContract'
import {
	DEFAULT_SETTINGS,
	ImageProcessingSettings,
	ColumnOCRResult,
	ParsedContract,
} from '../parser/types'

interface UseOCRScannerReturn {
	// State
	originalImage: string | null
	ocrResult: ColumnOCRResult | null
	parsedData: ParsedContract | null
	settings: ImageProcessingSettings
	error: string | null
	isProcessing: boolean
	progress: number

	// Actions
	setOriginalImage: (image: string | null) => void
	setSettings: (settings: ImageProcessingSettings) => void
	processImage: () => Promise<void>
	reset: () => void
	setError: (error: string | null) => void

	// Refs from image processor - explicitly typed to match Preview component expectations
	leftCanvasRef: RefObject<HTMLCanvasElement>
	rightCanvasRef: RefObject<HTMLCanvasElement>

	// Worker status
	isWorkerReady: boolean
}

export function useOCRScanner(): UseOCRScannerReturn {
	const [originalImage, setOriginalImage] = useState<string | null>(null)
	const [ocrResult, setOcrResult] = useState<ColumnOCRResult | null>(null)
	const [parsedData, setParsedData] = useState<ParsedContract | null>(null)
	const [settings, setSettings] =
		useState<ImageProcessingSettings>(DEFAULT_SETTINGS)
	const [error, setError] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [overallProgress, setOverallProgress] = useState(0)

	const { leftCanvasRef, rightCanvasRef, splitAndProcessImage } =
		useImageProcessor()
	const {
		recognizeImage,
		progress: workerProgress,
		isReady: isWorkerReady,
	} = useOCRWorker()

	const processImage = useCallback(async () => {
		if (!isWorkerReady || !originalImage) return

		setIsProcessing(true)
		setError(null)
		setOverallProgress(0)

		try {
			// Split image into columns
			const { left, right } = await splitAndProcessImage(
				originalImage,
				settings
			)

			// Process left column
			setOverallProgress(25)
			const leftResult = await recognizeImage(left)

			// Process right column
			setOverallProgress(50 + workerProgress / 2)
			const rightResult = await recognizeImage(right)

			// Combine results
			const result: ColumnOCRResult = {
				left: leftResult,
				right: rightResult,
				combined: `LEFT:\n${leftResult.text}\n\nRIGHT:\n${rightResult.text}`,
			}

			setOcrResult(result)

			// Parse the contract text
			const parsed = parseContractText(leftResult.text, rightResult.text)
			setParsedData(parsed)

			setOverallProgress(100)
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'An error occurred during processing'
			)
		} finally {
			setIsProcessing(false)
			setOverallProgress(0)
		}
	}, [
		isWorkerReady,
		originalImage,
		settings,
		splitAndProcessImage,
		recognizeImage,
		workerProgress,
	])

	const reset = useCallback(() => {
		setOriginalImage(null)
		setOcrResult(null)
		setParsedData(null)
		setSettings(DEFAULT_SETTINGS)
		setError(null)
		setOverallProgress(0)
	}, [])

	return {
		// State
		originalImage,
		ocrResult,
		parsedData,
		settings,
		error,
		isProcessing,
		progress: isProcessing ? overallProgress : 0,

		// Actions
		setOriginalImage,
		setSettings,
		processImage,
		reset,
		setError,

		// Refs - cast to the expected type since we know they'll be defined when used
		leftCanvasRef: leftCanvasRef as RefObject<HTMLCanvasElement>,
		rightCanvasRef: rightCanvasRef as RefObject<HTMLCanvasElement>,

		// Worker status
		isWorkerReady,
	}
}
