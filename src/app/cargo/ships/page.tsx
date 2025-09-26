'use client'

import { useCargo } from '@/providers/CargoProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import { Ship } from '@/constants/types'
import ShipSelector from '@/components/cargo/ShipSelector'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ShipsPage() {
	const { navigateTo } = useCargoNavigation()
	const { selectedShip, setSelectedShip, clearContainers, containers } =
		useCargo()

	// Check if cargo layout has been generated (containers exist)
	const hasCargoLayout = containers.length > 0

	const handleSelectShip = (ship: Ship) => {
		setSelectedShip(ship)
		clearContainers() // Clear containers when changing ships
		// Don't automatically navigate - let user choose their next step
	}

	return (
		<div className='min-h-screen flex flex-col bg-background text-foreground'>
			<div className='flex-1 p-4'>
				<div className='max-w-4xl mx-auto'>
					<div className='mb-4'>
						<button
							onClick={() => navigateTo('/cargo')}
							className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
						>
							<ArrowLeftIcon className='w-4 h-4' />
							<span className='text-sm'>Back to Cargo Hold</span>
						</button>
					</div>

					<div className='mb-6'>
						<h1 className='text-3xl font-bold mb-2'>Select Ship</h1>
						<p className='text-muted-foreground'>
							Choose a ship for your cargo operations
						</p>
					</div>

					<ShipSelector onSelect={handleSelectShip} />

					{selectedShip && (
						<div className='mt-6 p-4 rounded-lg bg-muted/30 border'>
							<h2 className='font-semibold text-lg mb-2'>
								Currently Selected: {selectedShip.name}
							</h2>
							<p className='text-muted-foreground'>
								Capacity: {selectedShip.totalCapacity} SCU
							</p>
							<div className='mt-4 flex gap-2'>
								<button
									onClick={() => navigateTo('/cargo/contracts')}
									className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition'
								>
									Configure Contracts
								</button>
								<button
									onClick={() => navigateTo('/cargo')}
									className='px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition'
								>
									View Cargo Hold
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
