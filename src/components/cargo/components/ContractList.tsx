import React from 'react'
import { Contract } from '@/constants/types'
import { ContractCard } from '@/components/cargo/components/ContractCard'
import { HaulingMode } from '@/utils/calculateContainers'

interface ContractListProps {
	contracts: Contract[]
	haulingMode: HaulingMode
	onRemoveContract: (id: string) => void
	onEditContract?: (contract: Contract) => void
}

export function ContractList({
	contracts,
	haulingMode,
	onRemoveContract,
	onEditContract,
}: ContractListProps) {
	if (contracts.length === 0) {
		return null
	}

	return (
		<div className='bg-card p-3 rounded overflow-auto'>
			<h2 className='text-lg font-semibold mb-2'>
				Saved Contracts ({contracts.length})
			</h2>
			<div className='space-y-3'>
				{contracts.map((contract) => (
					<ContractCard
						key={contract.id}
						contract={contract}
						showPayout={haulingMode === HaulingMode.CONTRACT}
						onRemove={onRemoveContract}
						onEdit={onEditContract ? () => onEditContract(contract) : undefined}
						variant='saved'
					/>
				))}
			</div>
		</div>
	)
}
