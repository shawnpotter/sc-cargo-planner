import { useState, useEffect, useCallback } from 'react'
import { createWorker, type Worker } from 'tesseract.js'

interface OCRResult {
	text: string
	confidence: number
}

interface UseOCRWorkerReturn {
	recognizeImage: (imageData: string) => Promise<OCRResult>
	progress: number
	isReady: boolean
	initializationError: string | null
	retryInitialization: () => void
}

export function useOCRWorker(): UseOCRWorkerReturn {
	const [worker, setWorker] = useState<Worker | null>(null)
	const [progress, setProgress] = useState<number>(0)
	const [initializationError, setInitializationError] = useState<string | null>(null)
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		let mounted = true
		let activeWorker: Worker | null = null
		let initializationFailed = false

		const handleError = () => {
			if (!mounted || activeWorker) return
			initializationFailed = true
			setInitializationError(
				'The screenshot scanner could not start. Retry the scanner or enter the contract manually.'
			)
		}

		const initWorker = async () => {
			try {
				const w = await createWorker('eng', 1, {
					errorHandler: handleError,
					logger: (m) => {
						if (mounted && m.status === 'recognizing text') {
							setProgress(Math.round(m.progress * 100))
						}
					},
				})

				if (mounted && !initializationFailed) {
					activeWorker = w
					setWorker(w)
				} else {
					await w.terminate()
				}
			} catch {
				handleError()
			}
		}

		initWorker()

		return () => {
			mounted = false
			void activeWorker?.terminate()
		}
	}, [attempt])

	const retryInitialization = useCallback(() => {
		setInitializationError(null)
		setAttempt(attempt => attempt + 1)
	}, [])

	const recognizeImage = useCallback(
		async (imageData: string): Promise<OCRResult> => {
			if (!worker) {
				throw new Error('OCR worker not initialized')
			}

			const result = await worker.recognize(imageData)

			return {
				text: result.data.text,
				confidence: result.data.confidence,
			}
		},
		[worker]
	)

	return {
		recognizeImage,
		progress,
		isReady: worker !== null,
		initializationError,
		retryInitialization,
	}
}
