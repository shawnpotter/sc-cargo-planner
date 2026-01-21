import React from 'react'
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
import { LocationSelect } from '@/components/cargo/LocationSelect'
import { RouteTypeToggle } from '@/components/cargo/RouteTypeToggle'
import { CurrentContractSection } from '@/components/cargo/components/CurrentContractSection'
import { ContractList } from '@/components/cargo/components/ContractList'
import { isScannerAvailable } from '@/components/cargo/utils/contractValidation'
import { Contract } from '@/constants/types'

interface ContractFormProps {
	readonly onSubmit: (contracts: Contract[], endLocation?: string) => void
	readonly onReset: () => void
	readonly haulingMode: HaulingMode
}

/**
 * Renders the contract creation and review form for cargo hauling operations.
 *
 * Allows users to configure contract details, add delivery points with cargo items,
 * review current and saved contracts, and submit or reset the contract list.
 * Supports scanning contracts (desktop only) and displays alerts for validation.
 * Includes route type selection (closed loop vs open path).
 *
 * @param onSubmit - Callback invoked with the list of contracts and optional end location when the form is submitted.
 * @param onReset - Callback invoked when the form is reset.
 * @param haulingMode - The current hauling mode, determines contract payout visibility and scanner availability.
 */
function ContractForm({ onSubmit, onReset, haulingMode }: ContractFormProps) {
	const {
		contracts,
		currentContract,
		newDelivery,
		showScanner,
		apiLoading,
		routeType,
		endLocation,
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
	} = useContractForm(onSubmit, onReset)

	const {
		isOpen: alertOpen,
		title: alertTitle,
		description: alertDescription,
		showAlert,
		closeAlert,
	} = useAlertDialog()

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

					{/* Route Type Configuration */}
					<div className='bg-card border border-primary p-4 rounded shadow-sm'>
						<RouteTypeToggle
							currentType={routeType}
							endLocation={endLocation}
							onTypeChange={setRouteType}
							onEndLocationChange={setEndLocation}
						/>
					</div>

					{/* Delivery Points */}
					<DeliveryPointEditor
						value={newDelivery}
						onChange={(next) => setNewDelivery(next)}
						onAddDelivery={handleAddDeliveryPoint}
						onAddCargo={handleAddCargoToDelivery}
						onRemoveCargo={(index) => handleRemoveCargoFromDelivery(index)}
					/>
				</div>

				{/* RIGHT COLUMN */}
				<div className='md:col-span-1 space-y-3'>
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
						onSaveContract={handleSaveCurrentContract}
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
