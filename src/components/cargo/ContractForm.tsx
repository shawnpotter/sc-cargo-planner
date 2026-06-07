import React, { useState } from 'react'
import { useContractForm } from '@/components/cargo/hooks/useContractForm'
import { useAlertDialog } from '@/components/cargo/hooks/useAlertDialog'
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
import { DeliveryPointEditor } from '@/components/cargo/DeliveryPointEditor'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { LocationSearch } from '@/components/cargo/LocationSearch'
import { RouteTypeToggle } from '@/components/cargo/RouteTypeToggle'
import { CurrentContractSection } from '@/components/cargo/components/CurrentContractSection'
import { ContractList } from '@/components/cargo/components/ContractList'
import { isScannerAvailable } from '@/components/cargo/utils/contractValidation'
import { Contract } from '@/constants/types'
import { useMapData } from '@/providers/MapDataProvider'
import { cn } from '@/lib/utils'
import { InstructionHint } from '@/components/ui/InstructionHint'

interface ContractFormProps {
	readonly onSubmit: (
		contracts: Contract[],
		startLocation?: string,
		endLocation?: string,
	) => void
	readonly onReset: () => void
	readonly haulingMode: HaulingMode
}

function ContractForm({ onSubmit, onReset, haulingMode }: ContractFormProps) {
	const HINTS = {
		contractType: {
			title: 'Contract Type',
			description:
				'Delivery is for transporting cargo from one location to another. Pickup is for collecting cargo from multiple locations and bringing it to a single destination.',
		},
		pickupLocationDelivery: {
			title: 'Pickup Location',
			description:
				'For delivery contracts, this is the location where the cargo will be picked up.',
		},
		pickupLocationPickup: {
			title: 'Pickup Location (Pickup Contract)',
			description:
				'For pickup contracts, this is the location where the cargo will be collected from multiple locations.',
		},
		startingLocation: {
			title: 'Starting Location',
			description: 'This is your current location in-game.',
		},
		routeType: {
			title: 'Route Type',
			description:
				'Loop routes will return you to your starting location. Path routes will end at a different location of your choice.',
		},
	} as const

	const {
		contracts,
		currentContract,
		newDelivery,
		showScanner,
		apiLoading,
		routeType,
		endLocation,
		startLocation,
		updateCurrentContract,
		setNewDelivery,
		setShowScanner,
		handleAddDeliveryPoint,
		handleAddCargoToDelivery,
		handleRemoveCargoFromDelivery,
		handleSaveCurrentContract,
		handleRemoveContract,
		handleRemoveDeliveryPoint,
		handleSubmit,
		handleReset,
		setRouteType,
		setEndLocation,
		setStartLocation,
	} = useContractForm(onSubmit, onReset)

	const {
		isOpen: alertOpen,
		title: alertTitle,
		description: alertDescription,
		showAlert,
		closeAlert,
	} = useAlertDialog()

	useMapData() // ensure provider is present
	const SYSTEMS = ['stanton', 'nyx', 'pyro'] as const
	const [isInterstellar, setIsInterstellar] = useState(false)
	const [selectedSystem, setSelectedSystem] = useState<string>('stanton')
	const filterSystem =
		!isInterstellar && selectedSystem ? selectedSystem : undefined

	const onSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const result = await handleSubmit()
		if (!result.success && result.error) {
			showAlert(result.error.title, result.error.description)
		}
	}

	const handleScannerClick = (e: React.MouseEvent) => {
		e.preventDefault()
		const { available, reason } = isScannerAvailable()

		if (!available && reason) {
			showAlert('Scanner not available', reason)
			return
		}

		setShowScanner(true)
	}

	const handleSaveContractClick = () => {
		// For delivery contracts, origin is required
		// For pickup contracts, origin is not needed (cargo delivered to starting location)
		if (
			currentContract.contractType === 'delivery' &&
			!currentContract.origin
		) {
			showAlert(
				'Pickup location required',
				'Select a pickup location in Contract Configuration before saving this contract.',
			)
			return
		}

		handleSaveCurrentContract()
	}

	return (
		<div className='grid gap-2 pb-2'>
			{showScanner && <Scanner onClose={() => setShowScanner(false)} />}

			<AlertDialog
				open={alertOpen}
				onOpenChange={closeAlert}
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
							<AlertDialogAction onClick={closeAlert}>OK</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				)}
			</AlertDialog>

			<form
				onSubmit={onSubmitForm}
				className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full overflow-y-auto'
			>
				{/* LEFT COLUMN */}
				<div className='md:col-span-1 flex flex-col gap-6'>
					{/* Basic Configuration */}
					<div className='bg-card border border-primary p-4 rounded shadow-sm flex flex-col gap-4'>
						<div className='flex items-center gap-2'>
							<h3 className='text-lg font-semibold'>Contract Configuration</h3>
							<InstructionHint
								title='Contract Configuration'
								description='Configure the basic settings for your contract, including type, payout, and container size.'
							/>
						</div>

						{/* Contract type selection */}
						<div>
							<div className='flex items-center gap-2'>
								<label htmlFor='contractType'>Contract Type</label>
								<InstructionHint
									title={HINTS.contractType.title}
									description={HINTS.contractType.description}
								/>
							</div>
							<Select
								value={currentContract.contractType || 'delivery'}
								onValueChange={(value: 'delivery' | 'pickup') =>
									updateCurrentContract({ contractType: value })
								}
							>
								<SelectTrigger className='!dark:bg-accent-foreground bg-accent text-foreground w-full'>
									<SelectValue placeholder='Select type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='delivery'>Delivery</SelectItem>
									<SelectItem value='pickup'>Pickup</SelectItem>
								</SelectContent>
							</Select>
							<p className='text-xs text-muted-foreground mt-1'>
								{currentContract.contractType === 'pickup'
									? 'Pickup cargo from locations and deliver to origin'
									: 'Pickup cargo from origin and deliver to locations'}
							</p>
						</div>

						<div>
							<label htmlFor='maxContainerSize'>Max Container Size (SCU)</label>
							<Select
								value={currentContract.maxContainerSize?.toString() || ''}
								onValueChange={(value) =>
									updateCurrentContract({
										maxContainerSize: Number.parseInt(value),
									})
								}
							>
								<SelectTrigger className='!dark:bg-accent-foreground bg-accent text-foreground w-full'>
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
										className='!dark:bg-accent-foreground bg-accent'
										value={currentContract.payout?.toString() ?? ''}
										onChange={(e) =>
											updateCurrentContract({
												payout: Number.parseInt(e.target.value) || 0,
											})
										}
										placeholder='Contract Payout'
									/>
									<span className='text-xs text-muted-foreground'>aUEC</span>
								</div>
							</div>
						)}

						{/* Origin field - only for delivery contracts */}
						{currentContract.contractType === 'delivery' && (
							<div>
								<div className='flex items-center gap-2'>
									<label htmlFor='origin'>
										Pickup Location (Where cargo starts)
									</label>
									<InstructionHint
										title={HINTS.pickupLocationDelivery.title}
										description={HINTS.pickupLocationDelivery.description}
									/>
								</div>
								<LocationSearch
									id='origin'
									value={currentContract.origin || ''}
									onValueChange={(value) =>
										updateCurrentContract({ origin: value })
									}
									placeholder='Search pickup location...'
									filterSystem={filterSystem}
								/>
							</div>
						)}

						{/* pickup location override for pickup contracts */}
						{currentContract.contractType === 'pickup' && (
							<div>
								<div className='flex items-center gap-2'>
									<label htmlFor='pickupLocation'>Pickup Location</label>
									<InstructionHint
										title={HINTS.pickupLocationPickup.title}
										description={HINTS.pickupLocationPickup.description}
									/>
								</div>
								<LocationSearch
									id='pickupLocation'
									value={currentContract.pickupLocation || ''}
									onValueChange={(value) =>
										updateCurrentContract({ pickupLocation: value })
									}
									placeholder='Search pickup location...'
									filterSystem={filterSystem}
								/>

								<p className='text-xs text-muted-foreground mt-1'>
									Leave empty to use delivery point locations as pickup points
								</p>
							</div>
						)}
					</div>

					{/* Delivery Points */}
					<DeliveryPointEditor
						value={newDelivery}
						onChange={(next) => setNewDelivery(next)}
						onAddDelivery={handleAddDeliveryPoint}
						onAddCargo={handleAddCargoToDelivery}
						onRemoveCargo={(index) => handleRemoveCargoFromDelivery(index)}
						filterSystem={filterSystem}
					/>
				</div>

				{/* RIGHT COLUMN */}
				<div className='md:col-span-1 flex flex-col gap-6'>
					{/* Journey configuration */}
					<div className='bg-card border border-primary p-4 rounded shadow-sm flex flex-col gap-4'>
						<div className='flex items-center gap-2'>
							<h3 className='text-lg font-semibold'>Journey Configuration</h3>
							<InstructionHint
								title='Journey Configuration'
								description='Configure settings related to your journey, such as starting location, route type, and system filters.'
							/>
						</div>

						{/* Interstellar toggle */}
						<div className='flex flex-col gap-2'>
							<div className='flex items-center gap-2'>
								<span className='text-sm font-medium text-muted-foreground'>
									Interstellar:
								</span>
								<div className='inline-flex rounded-md border border-border overflow-hidden'>
									<button
										type='button'
										onClick={() => {
											setIsInterstellar(true)
											setSelectedSystem('')
										}}
										className={cn(
											'px-3 py-1.5 text-sm font-medium transition-colors',
											isInterstellar
												? 'bg-primary text-primary-foreground'
												: 'bg-background text-foreground hover:bg-muted',
										)}
									>
										Yes
									</button>
									<button
										type='button'
										onClick={() => setIsInterstellar(false)}
										className={cn(
											'px-3 py-1.5 text-sm font-medium transition-colors border-l border-border',
											isInterstellar
												? 'bg-background text-foreground hover:bg-muted'
												: 'bg-primary text-primary-foreground',
										)}
									>
										No
									</button>
								</div>
							</div>
							<p className='text-xs text-muted-foreground'>
								{isInterstellar
									? 'Showing locations across all systems'
									: 'Filter locations to a single system'}
							</p>

							{!isInterstellar && (
								<div>
									<label
										htmlFor='currentSystem'
										className='text-sm font-medium'
									>
										Current System
									</label>
									<Select
										value={selectedSystem}
										onValueChange={setSelectedSystem}
									>
										<SelectTrigger
											id='currentSystem'
											className='!dark:bg-accent-foreground bg-accent text-foreground w-full mt-1'
										>
											<SelectValue placeholder='Select system' />
										</SelectTrigger>
										<SelectContent>
											{SYSTEMS.map((sys) => (
												<SelectItem
													key={sys}
													value={sys}
												>
													{sys.charAt(0).toUpperCase() + sys.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className='text-xs text-muted-foreground mt-1'>
										Locations from other systems will be hidden
									</p>
								</div>
							)}
						</div>

						<div>
							<div className='flex items-center gap-2'>
								<label
									htmlFor='startLocation'
									className='text-sm font-medium'
								>
									Starting Location
								</label>
								<InstructionHint
									title={HINTS.startingLocation.title}
									description={HINTS.startingLocation.description}
								/>
							</div>
							<LocationSearch
								id='startLocation'
								value={startLocation || ''}
								onValueChange={(value) => setStartLocation(value || null)}
								placeholder='Search starting location...'
								filterSystem={filterSystem}
							/>
							<p className='text-xs text-muted-foreground mt-1'>
								Where your journey begins
							</p>
						</div>

						<div className='space-y-1'>
							<div className='flex items-center gap-2'>
								<p className='text-sm font-medium'>Route Type</p>
								<InstructionHint
									title={HINTS.routeType.title}
									description={HINTS.routeType.description}
								/>
							</div>
							<RouteTypeToggle
								currentType={routeType}
								endLocation={endLocation}
								onTypeChange={setRouteType}
								onEndLocationChange={setEndLocation}
								filterSystem={filterSystem}
							/>
						</div>
					</div>

					{/* Alert: Contracts saved but no starting location */}
					{contracts.length > 0 && !startLocation && (
						<div className='bg-destructive/20 border border-destructive/50 rounded p-4 flex gap-3'>
							<div className='text-destructive text-lg leading-none'>⚠️</div>
							<div className='flex flex-col gap-1'>
								<p className='text-sm font-semibold text-destructive'>
									Starting Location Required
								</p>
								<p className='text-xs text-destructive/80'>
									You have {contracts.length} saved contract
									{contracts.length !== 1 ? 's' : ''}, but haven&apos;t selected a
									starting location yet. Please choose a starting location above
									to generate your route.
								</p>
							</div>
						</div>
					)}

					{/* Scanner Button */}
					{haulingMode === HaulingMode.CONTRACT && (
						<div className='bg-card border border-primary p-4 rounded shadow-sm'>
							<div className='flex flex-col items-center gap-3'>
								<Button
									onClick={handleScannerClick}
									variant='default'
								>
									📸 Scan Contract
								</Button>
							</div>
						</div>
					)}

					{/* Current Contract */}
					<CurrentContractSection
						currentContract={currentContract}
						onRemoveDeliveryPoint={handleRemoveDeliveryPoint}
						onSaveContract={handleSaveContractClick}
					/>

					{/* Saved Contracts */}
					<ContractList
						contracts={contracts}
						haulingMode={haulingMode}
						onRemoveContract={handleRemoveContract}
					/>
				</div>

				{/* Submit Buttons */}
				<div className='md:col-span-2 flex justify-center gap-4 mt-6'>
					<Button
						type='submit'
						variant='default'
						className='!bg-primary'
						disabled={
							apiLoading ||
							!startLocation ||
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
		</div>
	)
}

export { ContractForm }
