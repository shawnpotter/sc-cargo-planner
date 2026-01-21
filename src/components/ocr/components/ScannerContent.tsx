import { useCallback } from 'react'
import { useOCRScanner } from '../hooks/useOCRScanner'
import { UploadImage } from './UploadImage'
import { Preview } from './Preview'
import { Controls } from './Controls'
import { Results } from './Results'
import { transformParsedContract } from '../utils/contractTransformer'
import { useContracts } from '@/providers/ContractProvider'

interface ScannerContentProps {
	onClose: () => void
}

export function ScannerContent({ onClose }: ScannerContentProps) {
	const { addOCRContracts } = useContracts()
	const {
		originalImage,
		ocrResult,
		parsedData,
		settings,
		error,
		isProcessing,
		progress,
		setOriginalImage,
		setSettings,
		processImage,
		reset,
		setError,
		leftCanvasRef,
		rightCanvasRef,
		isWorkerReady,
	} = useOCRScanner()

	const handleApplyToForm = useCallback(() => {
		const { contracts, error: transformError } =
			transformParsedContract(parsedData)

		if (transformError) {
			setError(transformError)
			return
		}

		if (contracts.length > 0) {
			addOCRContracts(contracts)
			onClose()
		}
	}, [parsedData, addOCRContracts, onClose, setError])

	// Show upload interface when no image is selected
	if (!originalImage) {
		return (
			<div className='min-h-[160px] flex items-center justify-center'>
				<UploadImage
					onImageSelected={setOriginalImage}
					disabled={isProcessing}
				/>
			</div>
		)
	}

	// Show preview and controls when image is selected but not processed
	if (!ocrResult) {
		return (
			<>
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
							onReset={() => setSettings({ ...settings })}
							onRunOCR={processImage}
							isProcessing={isProcessing}
							hasWorker={isWorkerReady}
						/>
					</div>
				</div>

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
					<div className='bg-destructive/10 border border-destructive p-3 rounded mt-3'>
						<div className='font-medium text-destructive'>Error</div>
						<div className='text-sm text-muted-foreground mt-1'>{error}</div>
					</div>
				)}
			</>
		)
	}

	// Show results when OCR is complete
	return (
		<div className='mt-3'>
			{error && (
				<div className='bg-destructive/10 border border-destructive p-3 rounded mb-3'>
					<div className='font-medium text-destructive'>Error</div>
					<div className='text-sm text-muted-foreground mt-1'>{error}</div>
				</div>
			)}
			<Results
				ocrResult={ocrResult}
				parsedData={parsedData}
				onNewImage={reset}
				onClose={onClose}
				onApply={handleApplyToForm}
			/>
		</div>
	)
}
