import { useState, useEffect, useCallback, useRef } from 'react'
import { createWorker, Worker } from 'tesseract.js'

interface OCRResult {
	text: string
	confidence: number
}

interface UseOCRWorkerReturn {
	recognizeImage: (imageData: string) => Promise<OCRResult>
	progress: number
	isReady: boolean
}

export function useOCRWorker(): UseOCRWorkerReturn {
	const [worker, setWorker] = useState<Worker | null>(null)
	const [progress, setProgress] = useState<number>(0)
	const [isReady, setIsReady] = useState(false)
	const workerRef = useRef<Worker | null>(null)

	useEffect(() => {
		let mounted = true

		const initWorker = async () => {
			try {
				const w = await createWorker('eng', 1, {
					logger: (m) => {
						if (mounted && m.status === 'recognizing text') {
							setProgress(Math.round(m.progress * 100))
						}
					},
				})

				if (mounted) {
					workerRef.current = w
					setWorker(w)
					setIsReady(true)
				} else {
					// If component unmounted during init, terminate immediately
					await w.terminate()
				}
			} catch (error) {
				console.error('Failed to initialize OCR worker:', error)
			}
		}

		initWorker()

		return () => {
			mounted = false
			if (workerRef.current) {
				workerRef.current.terminate()
			}
		}
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
		isReady,
	}
}
