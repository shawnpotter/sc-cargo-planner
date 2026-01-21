'use client'

import { useCargo } from '@/providers/CargoProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import { Ship } from '@/constants/types'
import ShipSelector from '@/components/cargo/ShipSelector'

export default function ShipsPage() {
	const { navigateTo } = useCargoNavigation()
	const { selectedShip, setSelectedShip, clearContainers } = useCargo()

	const handleSelectShip = (ship: Ship) => {
		setSelectedShip(ship)
		clearContainers() // Clear containers when changing ships
		// Don't automatically navigate - let user choose their next step
	}

	return (
		<div className='min-h-screen flex flex-col bg-background text-foreground w-full'>
			<div className='flex-1 p-4 w-full'>
				<div className='w-full mx-auto'>
					<div className='mb-6'>
						<h1 className='text-3xl font-bold mb-2'>Select Ship</h1>
						<p className='text-muted-foreground'>
							Choose a ship for your cargo operations
						</p>
					</div>
					{selectedShip && (
						<div className='p-3 md:p-4 rounded-lg bg-muted/30 border'>
							<div className='flex flex-col lg:flex-row md:gap-3 items-center justify-between'>
								<div>
									<h2 className='font-semibold text-lg'>
										Selected: {selectedShip.name}
									</h2>
									<p className='text-muted-foreground'>
										Capacity: {selectedShip.totalCapacity} SCU
									</p>
								</div>
								<div className=''>
									<button
										onClick={() => navigateTo('/cargo/contracts')}
										className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90'
									>
										Continue to Contracts
									</button>
								</div>
							</div>
						</div>
					)}

					<ShipSelector onSelect={handleSelectShip} />
				</div>
			</div>
		</div>
	)
}
