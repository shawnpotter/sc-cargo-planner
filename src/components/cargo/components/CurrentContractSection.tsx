import React from 'react'
import { Contract } from '@/constants/types'
import { ContractCard } from '@/components/cargo/components/ContractCard'

interface CurrentContractSectionProps {
	currentContract: Partial<Contract>
	onRemoveDeliveryPoint: (index: number) => void
	onSaveContract: () => void
}

export function CurrentContractSection({
	currentContract,
	onRemoveDeliveryPoint,
	onSaveContract,
}: Readonly<CurrentContractSectionProps>) {
	if (
		!currentContract.deliveryPoints ||
		currentContract.deliveryPoints.length === 0
	) {
		return null
	}

	return (
		<div className='bg-card p-3 rounded'>
			<h2 className='text-lg font-semibold mb-1'>Current Contract</h2>
			<div className='text-sm mb-3'>Origin: {currentContract.origin}</div>
			<ContractCard
				contract={currentContract}
				onRemoveDeliveryPoint={onRemoveDeliveryPoint}
				onSave={onSaveContract}
				variant='current'
			/>
		</div>
	)
}
