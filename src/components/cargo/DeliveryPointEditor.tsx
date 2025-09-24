import React from 'react'
import { Button } from '@/components/ui/button'
import { LocationSelect } from '@/components/cargo/LocationSelect'
import { CargoInput } from '@/components/cargo/CargoInput'
import { CurrentCargoList } from '@/components/cargo/CurrentCargoList'
import type { DeliveryPointValue, CargoEntry } from './types'

interface DeliveryPointEditorProps {
	value: DeliveryPointValue
	onChange: (next: DeliveryPointValue) => void
	onAddDelivery: () => void
	onAddCargo: (cargo: CargoEntry) => void
	onRemoveCargo: (index: number) => void
}

export const DeliveryPointEditor: React.FC<DeliveryPointEditorProps> = ({
	value,
	onChange,
	onAddDelivery,
	onAddCargo,
	onRemoveCargo,
}) => {
	const [localCargo, setLocalCargo] = React.useState<CargoEntry>({
		cargoType: '',
		quantity: 0,
	})

	return (
		<div className='bg-card border border-border p-4 rounded shadow-sm flex flex-col gap-4'>
			<div>
				<label htmlFor='destination'>Select a destination</label>
				<LocationSelect
					value={value.location}
					onValueChange={(v) => onChange({ ...value, location: v })}
				/>
			</div>

			{/* Cargo management section */}
			<div className='bg-card p-3 rounded border border-border'>
				<h3 className='text-sm font-semibold text-foreground mb-2'>
					Add Cargo
				</h3>
				<CargoInput
					value={localCargo}
					onChange={(c) => setLocalCargo(c)}
					onAdd={() => {
						if (localCargo.cargoType && localCargo.quantity > 0) {
							onAddCargo({
								...localCargo,
								id: `id-${Math.random().toString(36).substring(2, 11)}`,
							})
							setLocalCargo({ cargoType: '', quantity: 0 })
						}
					}}
				/>
			</div>

			<CurrentCargoList
				cargo={value.cargo}
				onRemove={onRemoveCargo}
			/>

			<div className='flex justify-start gap-2 mt-4'>
				<Button
					onClick={(e) => {
						e.preventDefault()
						onAddDelivery()
					}}
					variant='default'
					disabled={!value.location || value.cargo.length === 0}
				>
					Add to Contract
				</Button>
			</div>
		</div>
	)
}

export default DeliveryPointEditor
