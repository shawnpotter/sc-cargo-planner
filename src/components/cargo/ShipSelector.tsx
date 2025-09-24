// @/app/components/ShipSelector
'use client'

import { useState } from 'react'
import { Ship } from '@/constants/types'
import { ships } from '@/data/ships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShipSelectorProps {
	onSelect: (ship: Ship) => void
}

/**
 * ShipSelector now renders inline (no modal) so it can be used inside the
 * shadcn Drawer or other containers. Each ship is shown as a styled Button
 * for consistent look & feel.
 */
export default function ShipSelector({
	onSelect,
}: Readonly<ShipSelectorProps>) {
	const [searchQuery, setSearchQuery] = useState('')

	const filteredShips = ships.filter((ship) =>
		ship.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div className='mx-auto w-full max-w-2xl space-y-3'>
			<div>
				<label
					htmlFor='ship-search'
					className='sr-only'
				>
					Search ships
				</label>
				<Input
					id='ship-search'
					type='text'
					placeholder='Search ships...'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className='grid gap-2 overflow-y-auto max-h-64'>
				{filteredShips.map((ship) => (
					<Button
						key={ship.name}
						variant='outline'
						size='default'
						onClick={() => onSelect(ship)}
						className='justify-between w-full'
					>
						<span className='truncate'>{ship.name}</span>
						<span className='text-sm text-muted-foreground ml-2'>
							{ship.totalCapacity} SCU
						</span>
					</Button>
				))}
			</div>
		</div>
	)
}
