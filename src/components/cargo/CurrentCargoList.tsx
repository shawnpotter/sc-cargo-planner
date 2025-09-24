import React from 'react'
import type { CargoEntry } from './types'

interface CurrentCargoListProps {
	cargo: CargoEntry[]
	onRemove: (index: number) => void
}

export const CurrentCargoList: React.FC<CurrentCargoListProps> = ({
	cargo,
	onRemove,
}) => {
	if (!cargo || cargo.length === 0) return null

	return (
		<div className='bg-card p-3 rounded border border-border'>
			<h4 className='text-sm font-semibold text-foreground mb-2'>
				Current Cargo:
			</h4>
			<div className='flex flex-col gap-2'>
				{cargo.map((c, idx) => (
					<div
						key={c.id ?? `${c.cargoType}-${c.quantity}-${idx}`}
						className='flex justify-between items-center p-2 rounded border border-border'
					>
						<span className='text-sm text-foreground'>
							{c.cargoType}: {c.quantity} SCU
						</span>
						<button
							onClick={(e) => {
								e.preventDefault()
								onRemove(idx)
							}}
							className='text-destructive text-xs'
						>
							Remove
						</button>
					</div>
				))}
			</div>
		</div>
	)
}

export default CurrentCargoList
