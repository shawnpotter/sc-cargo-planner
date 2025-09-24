import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CargoEntry } from '@/components/cargo/types'

interface CargoInputProps {
	value: CargoEntry
	onChange: (next: CargoEntry) => void
	onAdd: () => void
}

export const CargoInput: React.FC<CargoInputProps> = ({
	value,
	onChange,
	onAdd,
}) => {
	const disabled = !value.cargoType || value.quantity <= 0

	return (
		<div className='flex items-end gap-2'>
			<div className='flex-1'>
				<div>
					<label htmlFor='cargoType'>Cargo Type</label>
					<Input
						id='cargoType'
						type='text'
						value={value.cargoType}
						placeholder='Cargo Type'
						onChange={(e) => onChange({ ...value, cargoType: e.target.value })}
					/>
				</div>
			</div>
			<div className='w-24'>
				<div className='flex items-center gap-2'>
					<Input
						type='number'
						value={value.quantity || ''}
						min='1'
						onChange={(e) =>
							onChange({ ...value, quantity: parseInt(e.target.value) || 0 })
						}
						placeholder='Qty'
					/>
					<span className='text-xs text-muted-foreground'>SCU</span>
				</div>
			</div>
			<Button
				onClick={(e) => {
					e.preventDefault()
					onAdd()
				}}
				variant='default'
				disabled={disabled}
			>
				Add
			</Button>
		</div>
	)
}

export default CargoInput
