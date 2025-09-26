'use client'

import { useCargo } from '@/providers/CargoProvider'
import { useContracts } from '@/providers/ContractProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import { Contract, RouteAlgorithm } from '@/constants/types'
import { ContractForm } from '@/components/cargo/ContractForm'
import { HaulingModeToggle } from '@/components/cargo/HaulingModeToggle'
import { HaulingMode } from '@/utils/calculateContainers'
import { handleLoadCargo } from '@/utils/handleLoadCargo'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { CubeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function ContractsPage() {
	const { navigateTo } = useCargoNavigation()
	const {
		selectedShip,
		haulingMode,
		setHaulingMode,
		setContainers,
		containers,
	} = useCargo()
	const { contracts, clearContracts } = useContracts()
	const [alertOpen, setAlertOpen] = useState(false)
	const [alertTitle, setAlertTitle] = useState('')
	const [alertDescription, setAlertDescription] = useState('')

	// Check if cargo layout has been generated (containers exist)
	const hasCargoLayout = containers.length > 0

	const handleHaulingModeChange = (mode: HaulingMode) => {
		setHaulingMode(mode)
		clearContracts()
		setContainers([])
	}

	const handleContractSubmit = (newContracts: Contract[]) => {
		if (selectedShip) {
			// Load the cargo and navigate to main cargo view
			handleLoadCargo({
				contracts: newContracts,
				selectedShip,
				setContainers,
				routeAlgorithm: RouteAlgorithm.A_STAR,
				haulingMode,
			})
			navigateTo('/cargo')
		} else {
			setAlertTitle('No ship selected')
			setAlertDescription(
				'Please select a ship first before configuring contracts.'
			)
			setAlertOpen(true)
		}
	}

	const handleReset = () => {
		clearContracts()
		setContainers([])
	}

	if (!selectedShip) {
		return (
			<div className='min-h-screen flex flex-col bg-background text-foreground'>
				<div className='flex-1 flex items-center justify-center p-4'>
					<div className='text-center'>
						<CubeIcon className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
						<h1 className='text-2xl font-bold mb-2'>No Ship Selected</h1>
						<p className='text-muted-foreground mb-6'>
							Please select a ship before configuring contracts.
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

					<div className='mb-6 flex items-center justify-between'>
						<h1 className='text-3xl font-bold mb-2'>Configure Contracts</h1>
						<HaulingModeToggle
							currentMode={haulingMode}
							onChange={handleHaulingModeChange}
						/>
					</div>

					<div className='space-y-6'>
						<div className='p-4 rounded-lg bg-muted/30 border'>
							<h2 className='font-semibold text-lg mb-2'>
								Ship: {selectedShip.name}
							</h2>
							<p className='text-muted-foreground'>
								Capacity: {selectedShip.totalCapacity} SCU
							</p>
						</div>

						<ContractForm
							haulingMode={haulingMode}
							onSubmit={handleContractSubmit}
							onReset={handleReset}
						/>

						{contracts.length > 0 && (
							<div className='mt-6 flex gap-2'>
								<button
									onClick={() => navigateTo('/cargo')}
									className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition'
								>
									View Cargo Hold
								</button>
								<button
									onClick={() => navigateTo('/cargo/payments')}
									className='px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition'
								>
									View Payment Distribution
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Global alert dialog */}
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
		</div>
	)
}
