// @/app/components/ShipSelector
'use client'

import { useState } from 'react'
import { Ship } from '@/constants/types'
import { ships } from '@/data/ships'
import Modal from '@/components/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShipSelectorProps {
	onSelect: (ship: Ship) => void
}

/**
 * ShipSelector component allows the user to select a ship from a modal.
 * @param {Function} onSelect - Function to handle the selection of a ship.
 */
/**
 * ShipSelector component allows users to select a ship from a list.
 *
 * @remarks
 * Displays a button that opens a modal dialog containing a searchable list of ships.
 * Users can filter ships by name and select one, triggering the `onSelect` callback.
 *
 * @param props - Component props
 * @param props.onSelect - Callback function invoked when a ship is selected
 *
 * @example
 * ```tsx
 * <ShipSelector onSelect={(ship) => console.log(ship)} />
 * ```
 */
export default function ShipSelector({
	onSelect,
}: Readonly<ShipSelectorProps>) {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	const filteredShips = ships.filter((ship) =>
		ship.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div>
			<Button
				onClick={() => setIsModalOpen(true)}
				variant='default'
			>
				Select Ship
			</Button>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title='Select a Ship'
			>
				<div>
					<div>
						<label htmlFor='ship-search'>Search ships</label>
						<Input
							id='ship-search'
							type='text'
							placeholder='Search ships...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div>
						{filteredShips.map((ship) => (
							<button
								key={ship.name}
								onClick={() => {
									onSelect(ship)
									setIsModalOpen(false)
								}}
							>
								{ship.name} ({ship.totalCapacity} SCU)
							</button>
						))}
					</div>
				</div>
			</Modal>
		</div>
	)
}
