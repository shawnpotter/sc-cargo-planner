import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocationSearch } from '@/components/cargo/LocationSearch'
import { useMapData } from '@/providers/MapDataProvider'
import { ColumnOCRResult, ParsedContract } from '../parser/types'
import { transformParsedContract } from '../utils/contractTransformer'

interface ResultsProps {
	ocrResult: ColumnOCRResult
	parsedData: ParsedContract | null
	onNewImage: () => void
	onClose: () => void
	onApply: (reviewed: ParsedContract) => void
}

export function Results({ ocrResult, parsedData, onNewImage, onClose, onApply }: Readonly<ResultsProps>) {
	const { locations } = useMapData()
	const [review, setReview] = useState<ParsedContract>(() => ({
		...parsedData,
		origin: parsedData?.origin || '',
		contractType: parsedData?.contractType || 'delivery',
		maxContainerSize: parsedData?.maxContainerSize,
		payout: parsedData?.payout ?? 0,
		destinations: parsedData?.destinations?.length ? structuredClone(parsedData.destinations) : [{ location: '', cargo: [{ type: '', quantity: 0 }] }],
	}))
	const applied = useRef(false)
	const [applyError, setApplyError] = useState<string | null>(null)
	const validation = transformParsedContract(review, locations.filter(location => location.isSelectable !== false).map(location => location.name))
	const updateDestination = (index: number, updates: Partial<NonNullable<ParsedContract['destinations']>[number]>) => {
		setReview(previous => ({ ...previous, destinations: previous.destinations?.map((destination, i) => i === index ? { ...destination, ...updates } : destination) }))
	}
	const apply = () => {
		if (applied.current || validation.error) return
		applied.current = true
		try { onApply(review) } catch (error) {
			applied.current = false
			setApplyError(error instanceof Error ? error.message : 'Unable to add this contract. Please try again.')
		}
	}
	return <div className='space-y-4 max-h-[75vh] overflow-y-auto'>
		<div className='rounded-xl border border-primary/25 bg-card p-4 space-y-4'>
			<h3 className='font-semibold'>Review scanned contract</h3>
			<p className='text-sm text-muted-foreground'>Check every field before adding this contract to your run.</p>
			<div className='grid gap-4 sm:grid-cols-2'>
				<label className='space-y-2'>Contract type<select className='w-full rounded-md border bg-background p-2 min-h-10' value={review.contractType} onChange={event => {
					const value = event.target.value
					if (value === 'delivery' || value === 'pickup') setReview({ ...review, contractType: value })
				}}><option value='delivery'>Delivery</option><option value='pickup'>Pickup</option></select></label>
				<div><label htmlFor='review-origin'>{review.contractType === 'pickup' ? 'Delivery location' : 'Pickup location'}</label><LocationSearch id='review-origin' value={review.origin || ''} onValueChange={origin => setReview({ ...review, origin })} /></div>
				<label>Container limit (SCU)<select className='w-full rounded-md border bg-background p-2 min-h-10' value={review.maxContainerSize ?? ''} onChange={event => setReview({ ...review, maxContainerSize: Number(event.target.value) })}><option value=''>Choose limit</option>{[1, 2, 4, 8, 16, 24, 32].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
				<label>Payout (aUEC)<Input type='number' min='0' value={review.payout ?? ''} onChange={event => setReview({ ...review, payout: event.target.value === '' ? undefined : Number(event.target.value) })} /></label>
			</div>
			{review.destinations?.map((destination, index) => <fieldset key={index} className='space-y-3 rounded-lg border p-3'>
				<legend className='px-2 text-sm'>Stop {index + 1}</legend>
				<label htmlFor={`review-stop-${index}`}>{review.contractType === 'pickup' ? 'Pickup' : 'Delivery'} location {index + 1}</label>
				<LocationSearch id={`review-stop-${index}`} value={destination.location} onValueChange={location => updateDestination(index, { location })} />
				{destination.cargo.map((cargo, cargoIndex) => <div key={cargoIndex} className='grid gap-3 sm:grid-cols-2'>
					<label>Cargo {index + 1}.{cargoIndex + 1}<Input value={cargo.type} onChange={event => updateDestination(index, { cargo: destination.cargo.map((item, i) => i === cargoIndex ? { ...item, type: event.target.value } : item) })} /></label>
					<label>Quantity {index + 1}.{cargoIndex + 1} (SCU)<Input type='number' min='1' step='1' value={cargo.quantity || ''} onChange={event => updateDestination(index, { cargo: destination.cargo.map((item, i) => i === cargoIndex ? { ...item, quantity: Number(event.target.value) } : item) })} /></label>
				</div>)}
				<Button type='button' variant='outline' onClick={() => updateDestination(index, { cargo: [...destination.cargo, { type: '', quantity: 0 }] })}>Add cargo</Button>
			</fieldset>)}
			<Button type='button' variant='outline' onClick={() => setReview({ ...review, destinations: [...(review.destinations || []), { location: '', cargo: [{ type: '', quantity: 0 }] }] })}>Add stop</Button>
		</div>
		{(validation.error || applyError) && <p role='alert' className='text-sm text-destructive'>{validation.error || applyError}</p>}
		<details className='rounded-lg border p-3 text-sm'><summary className='cursor-pointer min-h-10'>Advanced: recognition confidence and raw text</summary>
			<p>Recognition confidence: {((ocrResult.left.confidence + ocrResult.right.confidence) / 2).toFixed(1)}%</p>
			<pre className='whitespace-pre-wrap text-xs mt-3'>{ocrResult.combined}</pre>
		</details>
		<div className='flex flex-wrap justify-end gap-2'>
			<Button type='button' variant='secondary' onClick={onNewImage}>New image</Button>
			<Button type='button' variant='secondary' onClick={onClose}>Cancel</Button>
			<Button type='button' disabled={!!validation.error} onClick={apply}>Apply to run</Button>
		</div>
	</div>
}
