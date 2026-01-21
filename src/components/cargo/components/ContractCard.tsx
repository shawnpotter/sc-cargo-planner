import React from 'react'
import { Contract, DeliveryPoint } from '@/constants/types'
import { Button } from '@/components/ui/button'
import { CargoItem } from '@/components/cargo/types'

interface ContractCardProps {
	contract: Partial<Contract> & { deliveryPoints?: DeliveryPoint[] }
	showPayout?: boolean
	onRemove?: (id: string) => void
	onRemoveDeliveryPoint?: (index: number) => void
	onSave?: () => void
	variant?: 'current' | 'saved'
}

export function ContractCard({
	contract,
	showPayout = false,
	onRemove,
	onRemoveDeliveryPoint,
	onSave,
	variant = 'saved',
}: ContractCardProps) {
	const isCurrent = variant === 'current'

	return (
		<div className='bg-gray-700 p-2 rounded'>
			<div className='flex justify-between items-center'>
				<div className='flex items-center gap-2'>
					<h3 className='text-base font-medium'>{contract.origin}</h3>
					{contract.contractType === 'pickup' && (
						<span className='text-xs bg-blue-600 text-white px-2 py-0.5 rounded'>
							PICKUP
						</span>
					)}
				</div>
				{onRemove && contract.id && (
					<button
						onClick={(e) => {
							e.preventDefault()
							onRemove(contract.id!)
						}}
						className='text-red-400 text-xs'
					>
						Remove
					</button>
				)}
			</div>

			{!isCurrent && contract.maxContainerSize && (
				<div className='text-sm mt-1'>
					<span className='opacity-70'>Max Container: </span>
					<span>{contract.maxContainerSize} SCU</span>
					{showPayout && contract.payout && (
						<>
							<span className='ml-3 opacity-70'>Payout: </span>
							<span>{contract.payout.toLocaleString()} aUEC</span>
						</>
					)}
				</div>
			)}

			{contract.deliveryPoints && contract.deliveryPoints.length > 0 && (
				<>
					{isCurrent ? (
						// Current contract shows all delivery points expanded
						<div className='mt-2'>
							{contract.deliveryPoints.map((point, index) => (
								<div
									key={point.id}
									className='mb-2'
								>
									<div className='flex justify-between items-center'>
										<h4 className='font-medium'>{point.location}</h4>
										{onRemoveDeliveryPoint && (
											<button
												onClick={(e) => {
													e.preventDefault()
													onRemoveDeliveryPoint(index)
												}}
												className='text-red-400 text-xs'
											>
												Remove
											</button>
										)}
									</div>
									<ul className='text-sm ml-2 mt-1'>
										{point.cargo?.map((cargo: CargoItem) => (
											<li
												key={cargo.id ?? `${cargo.cargoType}-${cargo.quantity}`}
											>
												{cargo.cargoType}: {cargo.quantity} SCU
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					) : (
						// Saved contracts use collapsible details
						<details className='text-sm mt-2'>
							<summary className='cursor-pointer'>
								{contract.deliveryPoints.length} delivery points
							</summary>
							<div className='mt-2 ml-2'>
								{contract.deliveryPoints.map((point) => (
									<div
										key={point.id}
										className='mb-2'
									>
										<div className='font-medium'>{point.location}</div>
										<ul className='ml-2 opacity-80'>
											{point.cargo.map((cargo: CargoItem) => (
												<li
													key={
														cargo.id ?? `${cargo.cargoType}-${cargo.quantity}`
													}
												>
													{cargo.cargoType}: {cargo.quantity} SCU
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						</details>
					)}
				</>
			)}

			{isCurrent && onSave && (
				<div className='mt-2'>
					<Button
						onClick={(e) => {
							e.preventDefault()
							onSave()
						}}
						variant='default'
					>
						Save Contract
					</Button>
				</div>
			)}
		</div>
	)
}
