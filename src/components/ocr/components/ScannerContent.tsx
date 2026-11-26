import { useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { DEFAULT_SETTINGS, ParsedContract } from '../parser/types'
import { useMapData } from '@/providers/MapDataProvider'
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
	const applied = useRef(false)
	const { locations } = useMapData()
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
		leftCanvasRef,
		rightCanvasRef,
		isWorkerReady,
		initializationError,
		retryInitialization,
	} = useOCRScanner()

	const handleApplyToForm = useCallback((reviewed: ParsedContract) => {
		if (applied.current) return
		const { contracts, error: transformError } =
			transformParsedContract(reviewed, locations.filter(location => location.isSelectable !== false).map(location => location.name))

		if (transformError) {
			throw new Error(transformError)
		}

		if (contracts.length > 0) {
			applied.current = true
			try { addOCRContracts(contracts) } catch (error) { applied.current = false; throw error }
			onClose()
		}
	}, [locations, addOCRContracts, onClose])

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
						<Image src={originalImage} alt='Selected contract screenshot' width={1000} height={700} unoptimized className='w-full max-h-72 object-contain rounded-lg' />
						<details><summary className='cursor-pointer min-h-10'>Advanced column preview</summary>
						<Preview
							leftCanvasRef={leftCanvasRef}
							rightCanvasRef={rightCanvasRef}
							splitColumn={settings.splitColumn}
						/>
						</details>
					</div>
					<div className='bg-card p-3 rounded border border-border flex flex-col gap-3'>
						{initializationError ? (
							<>
								<p role='alert' className='text-sm text-destructive'>{initializationError}</p>
								<Button type='button' onClick={retryInitialization}>Retry scanner</Button>
							</>
						) : (
							<Button type='button' disabled={isProcessing || !isWorkerReady} onClick={processImage}>{isProcessing ? 'Scanning...' : isWorkerReady ? 'Scan screenshot' : 'Preparing scanner...'}</Button>
						)}
						<details><summary className='cursor-pointer min-h-10'>Advanced image adjustments</summary>
						<Controls
							settings={settings}
							onSettingsChange={setSettings}
							onReset={() => setSettings(DEFAULT_SETTINGS)}
							onRunOCR={processImage}
							isProcessing={isProcessing}
							hasWorker={isWorkerReady}
						/>
						</details>
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
