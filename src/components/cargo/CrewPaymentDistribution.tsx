// @/app/components/CrewPaymentDistribution.tsx
import { useState, useEffect } from 'react'
import { Contract } from '@/constants/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HaulingMode } from '@/utils/calculateContainers'

interface CrewMember {
	id: string
	name: string
	share: number
}

interface CrewPaymentDistributionProps {
	readonly contracts: Contract[]
	readonly haulingMode: HaulingMode
}

export default function CrewPaymentDistribution({
	contracts,
	haulingMode,
}: CrewPaymentDistributionProps) {
	const [crewMembers, setCrewMembers] = useState<CrewMember[]>([
		{ id: '1', name: 'Captain', share: 40 },
		{ id: '2', name: 'Co-Pilot', share: 30 },
		{ id: '3', name: 'Engineer', share: 30 },
	])

	const [newMember, setNewMember] = useState<{ name: string; share: number }>({
		name: '',
		share: 0,
	})

	const [totalPayout, setTotalPayout] = useState<number>(0)
	const [manualPayout, setManualPayout] = useState<number>(0)

	useEffect(() => {
		if (haulingMode === HaulingMode.CONTRACT) {
			// Calculate total payout from all contracts
			const total = contracts.reduce(
				(sum, contract) => sum + (contract.payout ?? 0),
				0
			)
			setTotalPayout(total)
		}
	}, [contracts, haulingMode])

	// Get the effective payout based on hauling mode
	const effectivePayout =
		haulingMode === HaulingMode.CONTRACT ? totalPayout : manualPayout

	const addCrewMember = (e: React.MouseEvent) => {
		e.preventDefault()
		if (newMember.name && newMember.share > 0) {
			setCrewMembers([
				...crewMembers,
				{
					id: Date.now().toString(),
					name: newMember.name,
					share: newMember.share,
				},
			])
			setNewMember({ name: '', share: 0 })
		}
	}

	const removeCrewMember = (id: string) => {
		setCrewMembers(crewMembers.filter((member) => member.id !== id))
	}

	const updateCrewMemberShare = (id: string, share: number) => {
		setCrewMembers(
			crewMembers.map((member) =>
				member.id === id ? { ...member, share } : member
			)
		)
	}

	const totalShares = crewMembers.reduce((sum, member) => sum + member.share, 0)

	const getPaymentForMember = (share: number) => {
		if (totalShares === 0) return 0
		return (share / totalShares) * effectivePayout
	}

	return (
		<div>
			<div>
				<h1>Crew Payment Distribution</h1>
			</div>

			<div>
				{/* Total payout information */}
				<div>
					{haulingMode === HaulingMode.CONTRACT ? (
						<div>
							<span>Total Contract Payout:</span>
							<span>{totalPayout.toLocaleString()} aUEC</span>
						</div>
					) : (
						<div>
							<span>Enter Commodity Payout:</span>
							<div className='flex items-center gap-2'>
								<Input
									type='number'
									value={manualPayout || ''}
									onChange={(e) =>
										setManualPayout(parseInt(e.target.value) || 0)
									}
									min='0'
									placeholder='Total Payout'
								/>
								<span className='text-xs text-gray-400'>aUEC</span>
							</div>
						</div>
					)}

					<div>
						<span>Total Share Percentage:</span>
						<span>{totalShares}%</span>
					</div>
					{totalShares !== 100 && (
						<div>Note: Total shares do not equal 100%</div>
					)}
				</div>

				{/* Crew member list */}
				<div>
					<div>
						<span></span>
						<h3>Crew Members</h3>
						<span></span>
					</div>

					<div>
						<div>Name</div>
						<div>Share %</div>
						<div>Payment</div>
						<div>Action</div>
					</div>

					{crewMembers.map((member) => (
						<div key={member.id}>
							<div>{member.name}</div>
							<div>
								<div className='flex items-center gap-2'>
									<Input
										type='number'
										value={member.share}
										onChange={(e) =>
											updateCrewMemberShare(
												member.id,
												parseInt(e.target.value) || 0
											)
										}
										min='0'
									/>
									<span className='text-xs text-gray-400'>%</span>
								</div>
							</div>
							<div>
								{getPaymentForMember(member.share).toLocaleString()} aUEC
							</div>
							<div>
								<Button
									onClick={() => removeCrewMember(member.id)}
									variant='destructive'
								>
									Remove
								</Button>
							</div>
						</div>
					))}
				</div>

				{/* Add new crew member */}
				<div>
					<div>
						<span></span>
						<h3>Add New Crew Member</h3>
						<span></span>
					</div>

					<div>
						<div>
							<div>
								<label htmlFor='crew-member-name'>Crew Member Name</label>
								<Input
									id='crew-member-name'
									type='text'
									value={newMember.name}
									onChange={(e) =>
										setNewMember({ ...newMember, name: e.target.value })
									}
									placeholder='Crew Member Name'
								/>
							</div>
						</div>
						<div>
							<div className='flex items-center gap-2'>
								<Input
									type='number'
									value={newMember.share || ''}
									onChange={(e) =>
										setNewMember({
											...newMember,
											share: parseInt(e.target.value) || 0,
										})
									}
									min='0'
									placeholder='Share'
								/>
								<span className='text-xs text-gray-400'>%</span>
							</div>
						</div>
						<div>
							<Button
								onClick={addCrewMember}
								variant='default'
							>
								Add Crew Member
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
