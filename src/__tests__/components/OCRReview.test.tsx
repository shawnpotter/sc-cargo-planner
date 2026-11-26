import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Results } from '@/components/ocr/components/Results'
import { UploadImage } from '@/components/ocr/components/UploadImage'
import { transformParsedContract } from '@/components/ocr/utils/contractTransformer'
import type { ParsedContract } from '@/components/ocr/parser/types'

vi.mock('@/providers/MapDataProvider', () => ({ useMapData: () => ({ locations: [{ name: 'Baijini Point' }, { name: 'Port Tressler' }] }) }))
vi.mock('@/components/cargo/LocationSearch', () => ({ LocationSearch: ({ id, value, onValueChange }: { id: string; value: string; onValueChange: (value: string) => void }) => <input id={id} value={value} onChange={event => onValueChange(event.target.value)} /> }))
const parsed: ParsedContract = { origin: 'Baijini Point', maxContainerSize: 24, payout: 5000, destinations: [{ location: 'Port Tressler', cargo: [{ type: 'Copper', quantity: 3 }] }] }
const ocr = { left: { text: 'left', confidence: 90 }, right: { text: 'right', confidence: 80 }, combined: 'left right' }
afterEach(cleanup)

function renderReview(value: ParsedContract = parsed, onApply = vi.fn()) {
	const onClose = vi.fn()
	render(<Results parsedData={value} ocrResult={ocr} onApply={onApply} onClose={onClose} onNewImage={vi.fn()} />)
	return { onApply, onClose }
}

describe('OCR review', () => {
	it('applies corrected fields once and transforms them into the manual contract shape', () => {
		const { onApply } = renderReview()
		fireEvent.change(screen.getByLabelText('Cargo 1.1'), { target: { value: 'Iron' } })
		fireEvent.change(screen.getByLabelText('Quantity 1.1 (SCU)'), { target: { value: '7' } })
		fireEvent.change(screen.getByLabelText('Payout (aUEC)'), { target: { value: '9000' } })
		fireEvent.change(screen.getByLabelText('Contract type'), { target: { value: 'pickup' } })
		fireEvent.click(screen.getByRole('button', { name: 'Apply to run' }))
		fireEvent.click(screen.getByRole('button', { name: 'Apply to run' }))
		expect(onApply).toHaveBeenCalledTimes(1)
		const result = transformParsedContract(onApply.mock.calls[0][0], ['Baijini Point', 'Port Tressler'])
		expect(result.error).toBeUndefined()
		expect(result.contracts).toEqual([expect.objectContaining({ origin: 'Baijini Point', contractType: 'pickup', payout: 9000, maxContainerSize: 24, deliveryPoints: [expect.objectContaining({ location: 'Port Tressler', quantity: 7, cargo: [expect.objectContaining({ cargoType: 'Iron', quantity: 7 })] })] })])
	})

	it('requires unmatched locations and invalid quantities to be corrected', () => {
		renderReview({ ...parsed, origin: 'Unmatched OCR location' })
		const apply = screen.getByRole('button', { name: 'Apply to run' })
		expect(apply).toBeDisabled()
		fireEvent.change(screen.getByLabelText('Pickup location'), { target: { value: 'Baijini Point' } })
		fireEvent.change(screen.getByLabelText('Quantity 1.1 (SCU)'), { target: { value: '-3' } })
		expect(apply).toBeDisabled()
		fireEvent.change(screen.getByLabelText('Quantity 1.1 (SCU)'), { target: { value: '1.5' } })
		expect(apply).toBeDisabled()
		fireEvent.change(screen.getByLabelText('Quantity 1.1 (SCU)'), { target: { value: '3' } })
		expect(apply).toBeEnabled()
	})

	it('shows an apply failure, permits retry, and cancellation never applies', () => {
		const onApply = vi.fn().mockImplementationOnce(() => { throw new Error('Unable to add contract') })
		const { onClose } = renderReview(parsed, onApply)
		fireEvent.click(screen.getByRole('button', { name: 'Apply to run' }))
		expect(screen.getByRole('alert')).toHaveTextContent('Unable to add contract')
		fireEvent.click(screen.getByRole('button', { name: 'Apply to run' }))
		expect(onApply).toHaveBeenCalledTimes(2)
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(onClose).toHaveBeenCalledTimes(1)
		expect(onApply).toHaveBeenCalledTimes(2)
	})

	it('provides a touch accessible file picker and reads a selected image', async () => {
		const onImageSelected = vi.fn()
		render(<UploadImage onImageSelected={onImageSelected} />)
		const picker = screen.getByLabelText('Upload screenshot')
		expect(picker).toHaveAttribute('type', 'file')
		expect(picker).not.toHaveClass('hidden')
		fireEvent.change(picker, { target: { files: [new File(['image'], 'contract.png', { type: 'image/png' })] } })
		await waitFor(() => expect(onImageSelected).toHaveBeenCalledWith(expect.stringContaining('data:image/png;base64,')))
	})
})
