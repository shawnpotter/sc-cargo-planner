// @/app/cargo/contracts/page.tsx
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
import { CubeIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useMapData } from '@/providers/MapDataProvider'

export default function ContractsPage() {
	const { navigateTo } = useCargoNavigation()
	const {
		selectedShip,
		haulingMode,
		setHaulingMode,
		setContainers,
		setRouteType,
		setEndLocation,
		setStartLocation,
		setOptimizedRoute,
		resetStopStatuses,
	} = useCargo()
	const { contracts, clearContracts } = useContracts()
	const {
		locations,
		loading: mapLoading,
		error: mapError,
		cached,
	} = useMapData()
	const [alertOpen, setAlertOpen] = useState(false)
	const [alertTitle, setAlertTitle] = useState('')
	const [alertDescription, setAlertDescription] = useState('')

	const handleHaulingModeChange = (mode: HaulingMode) => {
		setHaulingMode(mode)
		clearContracts()
		setContainers([])
		setRouteType('loop')
		setEndLocation(null)
		setStartLocation(null)
		setOptimizedRoute(null)
		resetStopStatuses()
	}

	const handleContractSubmit = (
		newContracts: Contract[],
		startLocation?: string,
		endLocation?: string,
	) => {
		if (mapLoading) {
			setAlertTitle('Map locations still loading')
			setAlertDescription(
				'Please wait for map location data to finish loading before generating a route.',
			)
			setAlertOpen(true)
			return
		}

		if (mapError || locations.length === 0) {
			setAlertTitle('Map locations unavailable')
			setAlertDescription(
				mapError ||
					'No map locations were returned. Confirm the Map API is configured and reachable.',
			)
			setAlertOpen(true)
			return
		}

		if (selectedShip) {
			// Reset stop statuses before generating new layout
			resetStopStatuses()

			handleLoadCargo({
				contracts: newContracts,
				selectedShip,
				setContainers,
				setOptimizedRoute,
				routeAlgorithm: RouteAlgorithm.A_STAR,
				haulingMode,
				startLocation,
				endLocation,
				locations,
			})
			navigateTo('/cargo')
		} else {
			setAlertTitle('No ship selected')
			setAlertDescription(
				'Please select a ship first before configuring contracts.',
			)
			setAlertOpen(true)
		}
	}

	const handleReset = () => {
		clearContracts()
		setContainers([])
		setRouteType('loop')
		setEndLocation(null)
		setStartLocation(null)
		setOptimizedRoute(null)
		resetStopStatuses()
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
					{cached && (
						<div className='mb-4 rounded border border-yellow-600/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700'>
							Using cached map data because the upstream map API is currently
							unavailable.
						</div>
					)}
					<div className='mb-6 flex flex-col md:flex-row items-center justify-between'>
						<h1 className='text-3xl font-bold mb-2'>Configure Contracts</h1>
						<HaulingModeToggle
							currentMode={haulingMode}
							onChange={handleHaulingModeChange}
							className='text-xs md:text-base'
						/>
					</div>

					<div className='space-y-6'>
						<div className='p-4 rounded-lg bg-muted/30 border'>
							<h2 className='text-base font-semibold md:text-lg mb-2'>
								Ship: {selectedShip.name}
							</h2>
							<p className='text-sm md:text-base text-muted-foreground'>
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
