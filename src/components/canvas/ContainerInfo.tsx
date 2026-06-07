// @/components/canvas/ContainerInfo.tsx
import { Container, Contract } from '@/constants/types'
import { CubeIcon } from '@heroicons/react/24/outline'

interface ContainerInfoProps {
	readonly container: Container | null
	readonly contracts: Contract[]
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className='flex flex-col gap-0.5'>
			<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
				{label}
			</span>
			<span className='text-sm text-foreground font-medium'>{value}</span>
		</div>
	)
}

/**
 * Displays detailed information about a selected cargo container.
 * Shows an empty state prompt when no container is selected.
 */
function ContainerInfo({ container, contracts }: ContainerInfoProps) {
	// Empty state
	if (!container || !contracts.length) {
		return (
			<div className='h-full flex flex-col'>
				<div className='bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-border/40 p-3 flex-shrink-0'>
					<div className='flex items-center gap-2'>
						<div className='w-1 h-4 bg-orange-500 rounded-full' />
						<h3 className='font-semibold text-foreground text-sm'>
							Container Info
						</h3>
					</div>
				</div>
				<div className='flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center'>
					<CubeIcon className='w-10 h-10 text-muted-foreground/40' />
					<p className='text-sm text-muted-foreground'>
						Select a container in the 3D view to see its details.
					</p>
				</div>
			</div>
		)
	}

	const contract = contracts[container.contractIndex]
	const deliveryPoint = contract?.deliveryPoints[container.deliveryIndex]
	const cargoTypeIndex = container.cargoTypeIndex ?? 0
	const cargoItem = deliveryPoint?.cargo[cargoTypeIndex]

	return (
		<div className='h-full flex flex-col'>
			{/* Header */}
			<div className='bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-border/40 p-3 flex-shrink-0'>
				<div className='flex items-center gap-2'>
					<div className='w-1 h-4 bg-orange-500 rounded-full' />
					<h3 className='font-semibold text-foreground text-sm'>
						Container Info
					</h3>
				</div>
			</div>

			{/* Body */}
			<div className='flex-1 p-4 flex flex-col gap-4 overflow-y-auto'>
				{/* Size badge */}
				<div className='flex items-center gap-2'>
					<span className='px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold font-mono'>
						{container.size} SCU
					</span>
					{container.isPending && (
						<span className='px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold'>
							PENDING PICKUP
						</span>
					)}
				</div>

				<div className='space-y-3 divide-y divide-border/30'>
					<div className='space-y-3'>
						<InfoRow
							label='Cargo Type'
							value={cargoItem?.cargoType ?? 'Unknown'}
						/>
						<InfoRow
							label='Quantity'
							value={`${cargoItem?.quantity ?? container.size} SCU`}
						/>
					</div>

					<div className='space-y-3 pt-3'>
						<InfoRow
							label={container.isPending ? 'Pickup At' : 'Origin'}
							value={container.pickupLocation ?? contract.origin}
						/>
						<InfoRow
							label='Destination'
							value={deliveryPoint?.location ?? 'Unknown'}
						/>
					</div>

					<div className='space-y-3 pt-3'>
						<InfoRow
							label='Contract'
							value={`#${container.contractIndex + 1}`}
						/>
						{contract.payout && (
							<InfoRow
								label='Payout'
								value={`${contract.payout.toLocaleString()} aUEC`}
							/>
						)}
					</div>
				</div>

				{/* Pending note */}
				{container.isPending && (
					<div className='mt-auto p-3 rounded-md bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400'>
						This container represents cargo that will be loaded at{' '}
						<span className='font-semibold'>{container.pickupLocation}</span>.
						It is shown here to reserve space in the cargo hold.
					</div>
				)}
			</div>
		</div>
	)
}

export { ContainerInfo }
