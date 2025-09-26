'use client'

import { useCargo } from '@/providers/CargoProvider'
import { useContracts } from '@/providers/ContractProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import { CrewPaymentDistribution } from '@/components/cargo/CrewPaymentDistribution'
import { CurrencyDollarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function PaymentsPage() {
	const { navigateTo } = useCargoNavigation()
	const { selectedShip, haulingMode, containers } = useCargo()
	const { contracts } = useContracts()

	// Check if cargo layout has been generated (containers exist)
	const hasCargoLayout = containers.length > 0

	// Filter contracts with valid payouts
	const contractsWithPayouts = contracts.filter(
		(c) => c.payout !== undefined && c.payout > 0
	)

	if (!selectedShip) {
		return (
			<div className='min-h-screen flex flex-col bg-background text-foreground'>
				<div className='flex-1 flex items-center justify-center p-4'>
					<div className='text-center'>
						<CurrencyDollarIcon className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
						<h1 className='text-2xl font-bold mb-2'>No Ship Selected</h1>
						<p className='text-muted-foreground mb-6'>
							Please select a ship before viewing payment distribution.
						</p>
						<button
							onClick={() => navigateTo('/cargo/ships')}
							className='px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold'
						>
							Select Ship
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (contractsWithPayouts.length === 0) {
		return (
			<div className='min-h-screen flex flex-col bg-background text-foreground'>
				<div className='flex-1 flex items-center justify-center p-4'>
					<div className='text-center'>
						<CurrencyDollarIcon className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
						<h1 className='text-2xl font-bold mb-2'>
							No Contracts with Payouts
						</h1>
						<p className='text-muted-foreground mb-6'>
							Please configure contracts with payment information to view crew
							payment distribution.
						</p>
						<div className='flex gap-2 justify-center'>
							<button
								onClick={() => navigateTo('/cargo/contracts')}
								className='px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold'
							>
								Configure Contracts
							</button>
							<button
								onClick={() => navigateTo('/cargo')}
								className='px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition font-semibold'
							>
								Back to Cargo Hold
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen flex flex-col bg-background text-foreground'>
			<div className='flex-1 p-4'>
				<div className='max-w-4xl mx-auto'>
					{/* Header with back button when cargo layout exists */}
					{hasCargoLayout && (
						<div className='mb-4'>
							<button
								onClick={() => navigateTo('/cargo')}
								className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
							>
								<ArrowLeftIcon className='w-4 h-4' />
								<span className='text-sm'>Back to Cargo Hold</span>
							</button>
						</div>
					)}

					<div className='mb-6'>
						<h1 className='text-3xl font-bold mb-2'>
							Crew Payment Distribution
						</h1>
						<p className='text-muted-foreground'>
							Payment breakdown for {selectedShip.name} cargo operations
						</p>
					</div>

					<div className='mb-6 p-4 rounded-lg bg-muted/30 border'>
						<h2 className='font-semibold text-lg mb-2'>
							Ship: {selectedShip.name}
						</h2>
						<p className='text-muted-foreground'>
							Contracts with payouts: {contractsWithPayouts.length}
						</p>
					</div>

					<div className='mb-6'>
						<CrewPaymentDistribution
							contracts={contractsWithPayouts}
							haulingMode={haulingMode}
						/>
					</div>

					<div className='flex gap-2'>
						<button
							onClick={() => navigateTo('/cargo')}
							className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition'
						>
							View Cargo Hold
						</button>
						<button
							onClick={() => navigateTo('/cargo/contracts')}
							className='px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition'
						>
							Modify Contracts
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
