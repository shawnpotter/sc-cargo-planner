// @/components/ocr/Scanner.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { createWorker, Worker } from 'tesseract.js'
import { Contract } from '@/constants/types'
import { UploadImage } from '@/components/ocr/UploadImage'
import { Preview } from '@/components/ocr/Preview'
import { Controls } from '@/components/ocr/Controls'
import { Results } from '@/components/ocr/Results'
import { Button } from '@/components/ui/button'
import { useImageProcessor } from '@/components/ocr/hooks/useImageProcessor'
import { parseContractText } from '@/components/ocr/parser/parseContract'
import {
	DEFAULT_SETTINGS,
	ImageProcessingSettings,
	ColumnOCRResult,
	ParsedContract,
} from '@/components/ocr/parser/types'
import { useContracts } from '@/providers/ContractProvider'

interface ScannerProps {
	onClose: () => void
}

/**
 * Scanner component for OCR contract scanning.
 *
 * This component provides an interface for users to upload an image, process it using OCR (Optical Character Recognition),
 * and parse the extracted text into contract data. It supports image splitting, processing progress indication, error handling,
 * and allows users to apply the parsed contract data to a form.
 *
 * @param {Readonly<ScannerProps>} props - The props for the Scanner component.
 * @param {() => void} props.onClose - Callback invoked when the scanner is closed.
 *
 * @returns {JSX.Element} The rendered Scanner component UI.
 *
 * @remarks
 * - Utilizes a web worker for OCR processing.
 * - Handles image upload, preview, settings adjustment, and result display.
 * - Integrates with contract management via `useContracts`.
 * - Displays progress and error messages during processing.
 */
export default function Scanner({ onClose }: Readonly<ScannerProps>) {
	const { addOCRContracts } = useContracts()
	const [isProcessing, setIsProcessing] = useState(false)
	const [ocrResult, setOcrResult] = useState<ColumnOCRResult | null>(null)
	const [parsedData, setParsedData] = useState<ParsedContract | null>(null)
	const [originalImage, setOriginalImage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [progress, setProgress] = useState<number>(0)
	const [worker, setWorker] = useState<Worker | null>(null)
	const [settings, setSettings] =
		useState<ImageProcessingSettings>(DEFAULT_SETTINGS)

	const { leftCanvasRef, rightCanvasRef, splitAndProcessImage } =
		useImageProcessor()

	// Initialize worker
	useEffect(() => {
		const initWorker = async () => {
			const w = await createWorker('eng', 1, {
				logger: (m) => {
					if (m.status === 'recognizing text') {
						setProgress(Math.round(m.progress * 100))
					}
				},
			})
			setWorker(w)
		}
		initWorker()

		return () => {
			worker?.terminate()
		}
	}, [])

	const processImages = useCallback(async () => {
		if (!worker || !originalImage) return

		setIsProcessing(true)
		setError(null)
		setProgress(0)

		try {
			const { left, right } = await splitAndProcessImage(
				originalImage,
				settings
			)

			setProgress(25)
			const leftResult = await worker.recognize(left)

			setProgress(75)
			const rightResult = await worker.recognize(right)

			const result: ColumnOCRResult = {
				left: {
					text: leftResult.data.text,
					confidence: leftResult.data.confidence,
				},
				right: {
					text: rightResult.data.text,
					confidence: rightResult.data.confidence,
				},
				combined: `LEFT:\n${leftResult.data.text}\n\nRIGHT:\n${rightResult.data.text}`,
			}

			setOcrResult(result)
			setParsedData(
				parseContractText(leftResult.data.text, rightResult.data.text)
			)
			setProgress(100)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsProcessing(false)
			setProgress(0)
		}
	}, [worker, originalImage, settings, splitAndProcessImage])

	const handleReset = useCallback(() => {
		setOriginalImage(null)
		setOcrResult(null)
		setParsedData(null)
		setSettings(DEFAULT_SETTINGS)
	}, [])

	const applyToForm = useCallback(() => {
		if (!parsedData) return

		const contracts: Contract[] = []
		if (parsedData.origin && parsedData.destinations) {
			contracts.push({
				id: `ocr-${Date.now()}`,
				maxContainerSize: parsedData.maxContainerSize || 16,
				origin: parsedData.origin,
				payout: parsedData.payout,
				deliveryPoints: parsedData.destinations.map((dest, idx) => ({
					id: `dp-${idx}`,
					location: dest.location,
					quantity: dest.cargo.reduce((sum, c) => sum + c.quantity, 0),
					cargo: dest.cargo.map((c) => ({
						cargoType: c.type,
						quantity: c.quantity,
					})),
				})),
			})
		}

		addOCRContracts(contracts) // Just add to saved contracts
		onClose()
	}, [parsedData, addOCRContracts, onClose])

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60'>
			<div className='w-full max-w-4xl bg-card border border-border backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-ring overflow-hidden'>
				<div className='p-4'>
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-lg font-semibold text-foreground'>
							OCR Contract Scanner
						</h2>
						<Button
							variant='ghost'
							size='sm'
							onClick={onClose}
							className='p-1'
							aria-label='Close'
						>
							×
						</Button>
					</div>

					{!originalImage && (
						<div className='min-h-[160px] flex items-center justify-center'>
							<UploadImage
								onImageSelected={setOriginalImage}
								disabled={isProcessing}
							/>
						</div>
					)}

					{originalImage && !ocrResult && (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='bg-card p-3 rounded border border-border'>
								<Preview
									leftCanvasRef={leftCanvasRef}
									rightCanvasRef={rightCanvasRef}
									splitColumn={settings.splitColumn}
								/>
							</div>
							<div className='bg-card p-3 rounded border border-border flex flex-col gap-3'>
								<Controls
									settings={settings}
									onSettingsChange={setSettings}
									onReset={() => setSettings(DEFAULT_SETTINGS)}
									onRunOCR={processImages}
									isProcessing={isProcessing}
									hasWorker={!!worker}
								/>
							</div>
						</div>
					)}

					{isProcessing && (
						<div className='flex flex-col items-center gap-2 py-6'>
							<div className='text-sm text-muted-foreground'>
								Processing columns... {progress}%
							</div>
							<div className='w-full'>
								<progress
									value={progress}
									max={100}
									className='w-full h-2 appearance-none rounded bg-background'
								/>
							</div>
						</div>
					)}

					{error && (
						<div className='bg-destructive/10 border border-destructive p-3 rounded'>
							<div className='font-medium text-destructive'>Error</div>
							<div className='text-sm text-muted-foreground mt-1'>{error}</div>
						</div>
					)}

					{!isProcessing && ocrResult && (
						<div className='mt-3'>
							<Results
								ocrResult={ocrResult}
								parsedData={parsedData}
								onNewImage={handleReset}
								onClose={onClose}
								onApply={applyToForm}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
