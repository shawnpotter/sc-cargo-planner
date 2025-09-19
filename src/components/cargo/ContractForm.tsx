// @/components/cargo/ContractForm.tsx
import React, { useState } from 'react'
import { Contract, DeliveryPoint } from '@/constants/types'
import { useContracts } from '@/providers/ContractProvider'
import { useContractAPI } from '@/hooks/useContractAPI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { HaulingMode } from '@/utils/calculateContainers'
import Scanner from '@/components/ocr/Scanner'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { LocationSelect } from '@/components/cargo/LocationSelect'

interface CargoEntry {
	id?: string
	cargoType: string
	quantity: number
}

// Local alias to represent cargo items that may or may not have an `id`.
// Matches both locally-created CargoEntry (which includes optional id)
// and the shape coming from `DeliveryPoint.cargo` in the shared types.
type CargoItem = {
	id?: string
	cargoType: string
	quantity: number
}

interface DeliveryPointExtended extends DeliveryPoint {
	cargo: CargoEntry[]
}

interface ContractFormProps {
	readonly onSubmit: (contracts: Contract[]) => void
	readonly onReset: () => void
	readonly haulingMode: HaulingMode
}

function ContractForm({ onSubmit, onReset, haulingMode }: ContractFormProps) {
	const {
		contracts,
		currentContract,
		updateCurrentContract,
		addDeliveryPoint,
		removeDeliveryPoint,
		saveCurrentContract,
		removeContract,
		clearContracts,
	} = useContracts()

	const { saveContracts, loading: apiLoading } = useContractAPI()

	const [showScanner, setShowScanner] = useState(false)
	const [alertOpen, setAlertOpen] = useState(false)
	const [alertTitle, setAlertTitle] = useState('')
	const [alertDescription, setAlertDescription] = useState('')
	const [newDelivery, setNewDelivery] = useState<DeliveryPointExtended>({
		location: '',
		cargo: [],
		quantity: 0,
	})
	const [newCargo, setNewCargo] = useState<CargoEntry>({
		cargoType: '',
		quantity: 0,
	})

	const generateId = () => `id-${Math.random().toString(36).substring(2, 11)}`

	const addCargoToDelivery = () => {
		if (newCargo.cargoType && newCargo.quantity > 0) {
			setNewDelivery((prev) => ({
				...prev,
				cargo: [...prev.cargo, { ...newCargo, id: generateId() }],
			}))
			setNewCargo({ cargoType: '', quantity: 0 })
		}
	}

	const handleAddDeliveryPoint = () => {
		if (newDelivery.location && newDelivery.cargo.length > 0) {
			const deliveryPoint: DeliveryPoint = {
				id: generateId(),
				location: newDelivery.location,
				quantity: newDelivery.cargo.reduce(
					(acc, curr) => acc + curr.quantity,
					0
				),
				cargo: newDelivery.cargo,
			}

			addDeliveryPoint(deliveryPoint)
			setNewDelivery({ location: '', cargo: [], quantity: 0 })
		}
	}

	const removeCargoFromDelivery = (cargoIndex: number) => {
		setNewDelivery((prev) => ({
			...prev,
			cargo: prev.cargo.filter((_, i) => i !== cargoIndex),
		}))
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		// Save current contract if it has content
		if (currentContract.origin && currentContract.deliveryPoints?.length) {
			saveCurrentContract()
		}

		if (contracts.length === 0) {
			setAlertTitle('No valid contracts')
			setAlertDescription('Please add at least one valid contract')
			setAlertOpen(true)
			return
		}

		// Optionally save to API
		if (saveContracts) {
			await saveContracts(contracts)
		}

		onSubmit(contracts)
	}

	const handleReset = () => {
		clearContracts()
		setNewDelivery({ location: '', cargo: [], quantity: 0 })
		setNewCargo({ cargoType: '', quantity: 0 })
		onReset()
	}

	return (
		<>
			{showScanner && <Scanner onClose={() => setShowScanner(false)} />}

			{/* Alert dialog replacement for native alert() */}
			<AlertDialog
				open={alertOpen}
				onOpenChange={(open) => setAlertOpen(open)}
			>
				{alertOpen && (
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{alertTitle}</AlertDialogTitle>
							<AlertDialogDescription>
								{alertDescription}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogAction onClick={() => setAlertOpen(false)}>
								OK
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				)}
			</AlertDialog>

			<form
				onSubmit={handleSubmit}
				className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full max-h-[80vh] overflow-y-auto'
			>
				{/* LEFT COLUMN: main form sections + contract review */}
				<div className='md:col-span-1 flex flex-col gap-6'>
					{/* Basic Configuration */}
					<div className='bg-card border border-border p-4 rounded shadow-sm flex flex-col gap-4'>
						<div>
							<label htmlFor='maxContainerSize'>Max Container Size (SCU)</label>
							<Select
								value={currentContract.maxContainerSize?.toString() || ''}
								onValueChange={(value) =>
									updateCurrentContract({ maxContainerSize: parseInt(value) })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select size' />
								</SelectTrigger>
								<SelectContent>
									{[1, 2, 4, 8, 16, 24, 32].map((size) => (
										<SelectItem
											key={size}
											value={size.toString()}
										>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{haulingMode === HaulingMode.CONTRACT && (
							<div>
								<label htmlFor='payout'>Contract Payout</label>
								<div className='flex items-center gap-2'>
									<Input
										type='number'
										id='payout'
										value={currentContract.payout?.toString() ?? ''}
										onChange={(e) =>
											updateCurrentContract({
												payout: parseInt(e.target.value) || 0,
											})
										}
										placeholder='Contract Payout'
									/>
									<span className='text-xs text-muted-foreground'>aUEC</span>
								</div>
							</div>
						)}

						<div>
							<label htmlFor='origin'>Port of Origin</label>
							<LocationSelect
								value={currentContract.origin || ''}
								onValueChange={(value) =>
									updateCurrentContract({ origin: value })
								}
							/>
						</div>
					</div>

					{/* Delivery Points */}
					<div className='bg-card border border-border p-4 rounded shadow-sm flex flex-col gap-4'>
						<div>
							<label htmlFor='destination'>Select a destination</label>
							<LocationSelect
								value={newDelivery.location}
								onValueChange={(value) =>
									setNewDelivery((prev) => ({ ...prev, location: value }))
								}
							/>
						</div>

						{/* Cargo management section - same as before */}
						<div className='bg-card p-3 rounded border border-border'>
							<h3 className='text-sm font-semibold text-foreground mb-2'>
								Add Cargo
							</h3>
							<div className='flex items-end gap-2'>
								<div className='flex-1'>
									<div>
										<label htmlFor='cargoType'>Cargo Type</label>
										<Input
											id='cargoType'
											type='text'
											value={newCargo.cargoType}
											placeholder='Cargo Type'
											onChange={(e) =>
												setNewCargo((prev) => ({
													...prev,
													cargoType: e.target.value,
												}))
											}
										/>
									</div>
								</div>
								<div className='w-24'>
									<div className='flex items-center gap-2'>
										<Input
											type='number'
											value={newCargo.quantity || ''}
											min='1'
											onChange={(e) =>
												setNewCargo((prev) => ({
													...prev,
													quantity: parseInt(e.target.value) || 0,
												}))
											}
											placeholder='Qty'
										/>
										<span className='text-xs text-muted-foreground'>SCU</span>
									</div>
								</div>
								<Button
									onClick={(e) => {
										e.preventDefault()
										addCargoToDelivery()
									}}
									variant='default'
								>
									Add
								</Button>
							</div>
						</div>

						{newDelivery.cargo.length > 0 && (
							<div className='bg-card p-3 rounded border border-border'>
								<h4 className='text-sm font-semibold text-foreground mb-2'>
									Current Cargo:
								</h4>
								<div className='flex flex-col gap-2'>
									{newDelivery.cargo.map((cargo: CargoItem) => (
										<div
											key={cargo.id ?? `${cargo.cargoType}-${cargo.quantity}`}
											className='flex justify-between items-center p-2 rounded border border-border'
										>
											<span className='text-sm text-foreground'>
												{cargo.cargoType}: {cargo.quantity} SCU
											</span>
											<button
												onClick={(e) => {
													e.preventDefault()
													const idx = newDelivery.cargo.findIndex(
														(c: CargoItem) => c.id === cargo.id
													)
													if (idx >= 0) removeCargoFromDelivery(idx)
												}}
												className='text-destructive text-xs'
											>
												Remove
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						<div className='flex justify-start gap-2 mt-4'>
							<Button
								onClick={(e) => {
									e.preventDefault()
									handleAddDeliveryPoint()
								}}
								variant='default'
								disabled={
									!newDelivery.location || newDelivery.cargo.length === 0
								}
							>
								Add to Contract
							</Button>
						</div>
					</div>

					{/* end left column */}
				</div>

				{/* RIGHT COLUMN: Saved Contracts (desktop) / stacked on mobile */}
				<div className='md:col-span-1 space-y-3'>
					{/* Contract Review (moved to right column) */}
					<div className='bg-card p-4 rounded shadow-sm flex flex-col gap-4'>
						{haulingMode === HaulingMode.CONTRACT && (
							<div className='flex flex-col items-center gap-3 mb-2'>
								<Button
									onClick={(e) => {
										e.preventDefault()
										try {
											const isMobile =
												typeof navigator !== 'undefined' &&
												/Mobi|Android|iPhone|iPad|iPod/i.test(
													navigator.userAgent
												)
											if (isMobile) {
												setAlertTitle('Scanner not available on mobile')
												setAlertDescription(
													'This functionality is only available on desktop'
												)
												setAlertOpen(true)
												return
											}
											setShowScanner(true)
										} catch {
											// fallback: open scanner
											setShowScanner(true)
										}
									}}
									variant='default'
								>
									📸 Scan Contract
								</Button>
							</div>
						)}

						{/* Current Contract Display */}
						{currentContract.deliveryPoints &&
							currentContract.deliveryPoints.length > 0 && (
								<div className='bg-card p-3 rounded'>
									<h2 className='text-lg font-semibold mb-1'>
										Current Contract
									</h2>
									<div className='text-sm mb-3'>
										Origin: {currentContract.origin}
									</div>
									{currentContract.deliveryPoints.map((point, index) => (
										<div
											key={point.id}
											className='bg-gray-700 p-2 rounded mb-2'
										>
											<div className='flex justify-between items-center'>
												<h3 className='text-base font-medium'>
													{point.location}
												</h3>
												<button
													onClick={(e) => {
														e.preventDefault()
														removeDeliveryPoint(index)
													}}
													className='text-red-400 text-xs'
												>
													Remove
												</button>
											</div>
											<ul className='text-sm ml-2 mt-1'>
												{point.cargo?.map((cargo: CargoItem) => (
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
									<div className='mt-2'>
										<Button
											onClick={(e) => {
												e.preventDefault()
												saveCurrentContract()
											}}
											variant='default'
										>
											Save Contract
										</Button>
									</div>
								</div>
							)}
					</div>
					{contracts.length > 0 && (
						<div className='bg-card p-3 rounded overflow-auto max-h-[70vh]'>
							<h2 className='text-lg font-semibold mb-2'>
								Saved Contracts ({contracts.length})
							</h2>
							<div className='space-y-3'>
								{contracts.map((contract) => (
									<div
										key={contract.id}
										className='bg-gray-700 p-2 rounded'
									>
										<div className='flex justify-between items-center'>
											<h3 className='text-base font-medium'>
												{contract.origin}
											</h3>
											<button
												onClick={(e) => {
													e.preventDefault()
													removeContract(contract.id!)
												}}
												className='text-red-400 text-xs'
											>
												Remove
											</button>
										</div>
										<div className='text-sm mt-1'>
											<span className='opacity-70'>Max Container: </span>
											<span>{contract.maxContainerSize} SCU</span>
											{haulingMode === HaulingMode.CONTRACT &&
												contract.payout && (
													<>
														<span className='ml-3 opacity-70'>Payout: </span>
														<span>{contract.payout.toLocaleString()} aUEC</span>
													</>
												)}
										</div>
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
																		cargo.id ??
																		`${cargo.cargoType}-${cargo.quantity}`
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
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className='md:col-span-2 flex justify-center gap-4 mt-6'>
					<Button
						onClick={(e) => {
							e.preventDefault()
							handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
						}}
						variant='default'
						disabled={
							apiLoading ||
							(contracts.length === 0 &&
								(!currentContract.origin ||
									!currentContract.deliveryPoints?.length))
						}
					>
						{apiLoading ? 'Saving...' : 'Generate Layout'}
					</Button>

					<Button
						onClick={(e) => {
							e.preventDefault()
							handleReset()
						}}
						variant='destructive'
					>
						Reset
					</Button>
				</div>
			</form>
		</>
	)
}

export { ContractForm }
