// @/components/ocr/Results.tsx
import { Button } from '@/components/ui/button'
import { ColumnOCRResult, ParsedContract } from '@/components/ocr/parser/types'

interface ResultsProps {
	ocrResult: ColumnOCRResult
	parsedData: ParsedContract | null
	onNewImage: () => void
	onClose: () => void
	onApply: () => void
}

/**
 * Displays the results of OCR processing and contract data extraction.
 *
 * @component
 * @param {object} props - The component props.
 * @param {OcrResult} props.ocrResult - The raw OCR result containing text and confidence for left and right columns.
 * @param {ParsedContractData | null} props.parsedData - The parsed contract data extracted from the OCR result.
 * @param {() => void} props.onNewImage - Callback invoked when the user requests to process a new image.
 * @param {() => void} props.onClose - Callback invoked when the user cancels or closes the results view.
 * @param {() => void} props.onApply - Callback invoked when the user applies the extracted contract data to the form.
 *
 * @returns {JSX.Element} The rendered results view, including confidence summary, extracted contract data, raw OCR text, and action buttons.
 */
function Results({
	ocrResult,
	parsedData,
	onNewImage,
	onClose,
	onApply,
}: Readonly<ResultsProps>) {
	// Calculate overall confidence
	const avgConfidence = (
		(ocrResult.left.confidence + ocrResult.right.confidence) /
		2
	).toFixed(1)

	// Determine confidence color
	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 80) return 'text-green-400'
		if (confidence >= 60) return 'text-yellow-400'
		return 'text-red-400'
	}

	// Check what data was successfully parsed
	const hasParsedData =
		parsedData &&
		(parsedData.origin ||
			parsedData.destinations?.length ||
			parsedData.maxContainerSize ||
			parsedData.payout ||
			parsedData.rank ||
			parsedData.contractedBy)

	// Calculate totals
	const totalCargo =
		parsedData?.destinations?.reduce(
			(sum, dest) => sum + dest.cargo.reduce((s, c) => s + c.quantity, 0),
			0
		) || 0

	return (
		<div className='flex flex-col gap-4'>
			{/* OCR Confidence Summary */}
			<div className='bg-card p-3 rounded border border-border'>
				<h3 className='text-sm font-semibold text-foreground'>
					OCR Confidence
				</h3>
				<div className='mt-2 grid grid-cols-3 gap-2 text-sm text-muted-foreground'>
					<div className='flex flex-col'>
						<span className='opacity-70'>Left Column:</span>
						<span className={getConfidenceColor(ocrResult.left.confidence)}>
							{ocrResult.left.confidence.toFixed(1)}%
						</span>
					</div>
					<div className='flex flex-col'>
						<span className='opacity-70'>Right Column:</span>
						<span className={getConfidenceColor(ocrResult.right.confidence)}>
							{ocrResult.right.confidence.toFixed(1)}%
						</span>
					</div>
					<div className='flex flex-col'>
						<span className='opacity-70'>Average:</span>
						<span className='text-foreground'>{avgConfidence}%</span>
					</div>
				</div>
			</div>

			{/* Extracted Contract Data */}
			<div className='bg-card p-3 rounded border border-border'>
				<h3 className='text-sm font-semibold text-foreground'>
					Extracted Contract Data
				</h3>

				{hasParsedData ? (
					<div className='mt-2 space-y-3 text-sm text-muted-foreground'>
						{/* Basic Contract Info */}
						<div className='grid grid-cols-2 gap-3'>
							<div className='space-y-2'>
								{parsedData.rank && (
									<div>
										<div className='opacity-70 text-xs'>Contract Rank:</div>
										<div className='text-sm text-foreground'>
											{parsedData.rank}
										</div>
									</div>
								)}
								{parsedData.origin && (
									<div>
										<div className='opacity-70 text-xs'>Origin:</div>
										<div className='text-sm text-foreground'>
											{parsedData.origin}
										</div>
									</div>
								)}
								{parsedData.maxContainerSize && (
									<div>
										<div className='opacity-70 text-xs'>
											Max Container Size:
										</div>
										<div className='text-sm text-foreground'>
											{parsedData.maxContainerSize} SCU
										</div>
									</div>
								)}
							</div>
							<div className='space-y-2'>
								{parsedData.payout && (
									<div>
										<div className='opacity-70 text-xs'>Contract Payout:</div>
										<div className='text-sm text-foreground'>
											{parsedData.payout.toLocaleString()} aUEC
										</div>
									</div>
								)}
								{parsedData.contractedBy && (
									<div>
										<div className='opacity-70 text-xs'>Contractor:</div>
										<div className='text-sm text-foreground'>
											{parsedData.contractedBy}
										</div>
									</div>
								)}
								{totalCargo > 0 && (
									<div>
										<div className='opacity-70 text-xs'>Total Cargo:</div>
										<div className='text-sm text-foreground'>
											{totalCargo} SCU
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Delivery Points */}
						{parsedData.destinations && parsedData.destinations.length > 0 && (
							<div>
								<div className='opacity-70 text-xs'>
									Delivery Points ({parsedData.destinations.length}):
								</div>
								<div className='mt-2 space-y-2'>
									{parsedData.destinations.map((dest) => (
										<div
											key={dest.location}
											className='bg-card p-2 rounded border border-border'
										>
											<div className='font-medium text-foreground'>
												📍 {dest.location}
											</div>
											<div className='mt-1 text-sm text-muted-foreground space-y-1'>
												{dest.cargo.map((c) => (
													<div
														key={c.type}
														className='flex justify-between'
													>
														<span>{c.type}</span>
														<span>{c.quantity} SCU</span>
													</div>
												))}
												<div className='text-xs opacity-70'>
													Subtotal:{' '}
													{dest.cargo.reduce((sum, c) => sum + c.quantity, 0)}{' '}
													SCU
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Validation Warnings */}
						{!parsedData.origin && (
							<div className='flex items-center gap-2 text-yellow-300'>
								<span>⚠️</span>
								<span className='text-sm'>
									Warning: Origin location not detected
								</span>
							</div>
						)}
						{(!parsedData.destinations ||
							parsedData.destinations.length === 0) && (
							<div className='flex items-center gap-2 text-yellow-300'>
								<span>⚠️</span>
								<span className='text-sm'>
									Warning: No delivery points detected
								</span>
							</div>
						)}
					</div>
				) : (
					<div className='mt-2 text-sm text-muted-foreground'>
						<p>⚠️ No contract data could be parsed</p>
						<p>
							Please check the raw OCR text below and try adjusting image
							settings
						</p>
					</div>
				)}
			</div>

			{/* Raw OCR Text */}
			<details className='bg-card p-3 rounded border border-border text-sm text-muted-foreground'>
				<summary className='flex justify-between items-center cursor-pointer'>
					<span>📄 Raw OCR Text</span>
					<span className='opacity-70'>(Click to expand)</span>
				</summary>
				<div className='mt-2 grid grid-cols-1 md:grid-cols-2 gap-2'>
					<div className='p-2 bg-background rounded'>
						<div className='opacity-70 text-xs'>
							Left Column: {ocrResult.left.confidence.toFixed(1)}%
						</div>
						<pre className='whitespace-pre-wrap text-xs mt-1'>
							{ocrResult.left.text || '(No text detected)'}
						</pre>
					</div>
					<div className='p-2 bg-background rounded'>
						<div className='opacity-70 text-xs'>
							Right Column: {ocrResult.right.confidence.toFixed(1)}%
						</div>
						<pre className='whitespace-pre-wrap text-xs mt-1'>
							{ocrResult.right.text || '(No text detected)'}
						</pre>
					</div>
				</div>
			</details>

			{/* Action Buttons */}
			<div className='flex gap-2 justify-end'>
				<Button
					onClick={onNewImage}
					variant='secondary'
				>
					🔄 New Image
				</Button>
				<Button
					onClick={onClose}
					variant='secondary'
				>
					✕ Cancel
				</Button>
				<Button
					onClick={onApply}
					variant='default'
					disabled={!parsedData?.origin || !parsedData?.destinations?.length}
				>
					{parsedData?.origin && parsedData?.destinations?.length
						? '✓ Apply to Form'
						: '⚠️ Missing Required Data'}
				</Button>
			</div>
		</div>
	)
}

export { Results }
