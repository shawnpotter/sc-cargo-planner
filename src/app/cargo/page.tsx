// @/app/cargo/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Ship, Container, Contract, RouteAlgorithm } from '@/constants/types'
import { CargoHold } from '@/components/canvas/CargoHold'
import ShipSelector from '@/components/cargo/ShipSelector'
import { ContractForm } from '@/components/cargo/ContractForm'
import { CrewPaymentDistribution } from '@/components/cargo/CrewPaymentDistribution'
import { HaulingModeToggle } from '@/components/cargo/HaulingModeToggle'
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
import { HaulingMode } from '@/utils/calculateContainers'
import { UserSettingsModal } from '@/components/auth/UserSettingsModal'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerClose,
} from '@/components/ui/drawer'
import {
	CubeIcon,
	DocumentTextIcon,
	CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

type ViewMode = 'ship' | 'cargo' | 'payment'

export default function Cargo() {
	const { data: session, status } = useSession()
	const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
	const [containers, setContainers] = useState<Container[]>([])
	const [contracts, setContracts] = useState<Contract[]>([])
	const [haulingMode, setHaulingMode] = useState<HaulingMode>(
		HaulingMode.CONTRACT
	)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [activeView, setActiveView] = useState<ViewMode>('ship')
	const [isDrawerOpen, setIsDrawerOpen] = useState(false)
	const [isCanvasInteractive, setIsCanvasInteractive] = useState(false)
	const [alertOpen, setAlertOpen] = useState(false)
	const [alertTitle, setAlertTitle] = useState('')
	const [alertDescription, setAlertDescription] = useState('')

	const handleSaveSettings = async (userData: {
		name: string
		email: string
	}) => {
		try {
			const response = await fetch('/api/user/update', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData),
			})

			if (!response.ok) {
				throw new Error('Failed to update user')
			}

			console.log('User settings updated successfully')
		} catch (error) {
			console.error('Failed to update user settings:', error)
		}
	}

	const handleReset = () => {
		setContainers([])
		setContracts([])
	}

	const handleHaulingModeChange = (mode: HaulingMode) => {
		setHaulingMode(mode)
		handleReset()
	}

	const handleViewChange = (view: ViewMode) => {
		setActiveView(view)
		setIsDrawerOpen(true)
	}

	let drawerTitle = 'Crew Payment'
	if (activeView === 'ship') {
		drawerTitle = 'Select Ship'
	} else if (activeView === 'cargo') {
		drawerTitle = 'Cargo Manifest'
	}
	return (
		<div className='min-h-screen flex flex-col bg-background text-foreground'>
			{/* Main content area with canvas */}
			<main className='flex-1 flex flex-col items-center justify-center p-2 md:p-6'>
				{/* Canvas container with interaction toggle */}
				<div className='w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative min-h-[350px] md:min-h-[500px]'>
					{selectedShip ? (
						<>
							{/* Canvas overlay to control interactions */}
							{!isCanvasInteractive && (
								<button
									type='button'
									aria-label='Enable canvas interaction'
									onClick={() => setIsCanvasInteractive(true)}
									className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur rounded-lg border border-dashed border-primary/40 shadow-lg hover:bg-background/90 transition'
								>
									<div className='flex flex-col items-center gap-2'>
										<CubeIcon
											className='w-8 h-8 text-primary animate-bounce'
											aria-hidden
										/>
										<p className='font-semibold'>
											Tap to interact with 3D view
										</p>
										<p className='text-xs text-muted-foreground'>
											Use bottom navigation for controls
										</p>
									</div>
								</button>
							)}

							{/* The actual canvas with interaction prop */}
							<CargoHold
								ship={selectedShip}
								containers={containers}
								contracts={contracts}
								isInteractive={isCanvasInteractive}
							/>

							{/* Exit interaction button */}
							{isCanvasInteractive && (
								<button
									onClick={() => setIsCanvasInteractive(false)}
									aria-label='Exit canvas interaction'
									className='absolute top-2 right-2 z-20 p-2 rounded-full bg-background border border-muted-foreground/20 hover:bg-muted transition'
								>
									<svg
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
										aria-hidden
										className='w-5 h-5'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M6 18L18 6M6 6l12 12'
										/>
									</svg>
								</button>
							)}
						</>
					) : (
						<div className='flex flex-col items-center justify-center h-full w-full py-12'>
							<div className='flex flex-col items-center gap-2'>
								<CubeIcon className='w-10 h-10 text-muted-foreground' />
								<p className='font-semibold'>
									Select a ship to view cargo hold
								</p>
							</div>
						</div>
					)}
				</div>
			</main>
			{/* Static bottom navigation bar */}
			<nav className='sticky bottom-0 left-0 w-full bg-background border-t border-muted-foreground/10 z-30'>
				<div className='flex justify-around items-center py-2 gap-2'>
					<button
						aria-label='Ship view'
						onClick={() => handleViewChange('ship')}
						className='flex flex-col items-center px-3 py-1 rounded hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition'
					>
						<CubeIcon className='w-6 h-6 mb-1' />
						<span className='text-xs font-medium'>Ship</span>
					</button>
					<button
						aria-label='Cargo manifest'
						onClick={() => handleViewChange('cargo')}
						className='flex flex-col items-center px-3 py-1 rounded hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition'
					>
						<DocumentTextIcon className='w-6 h-6 mb-1' />
						<span className='text-xs font-medium'>Cargo</span>
					</button>
					<button
						aria-label='Crew payment'
						onClick={() => handleViewChange('payment')}
						disabled={contracts.length === 0}
						className='flex flex-col items-center px-3 py-1 rounded hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-50 disabled:cursor-not-allowed'
					>
						<CurrencyDollarIcon className='w-6 h-6 mb-1' />
						<span className='text-xs font-medium'>Payment</span>
					</button>
				</div>
			</nav>
			{/* Mobile drawer for content */}
			<Drawer
				open={isDrawerOpen}
				onOpenChange={(open) => {
					if (!open) setIsDrawerOpen(false)
				}}
			>
				<DrawerContent className='bg-background border-t border-muted-foreground/10 rounded-t-xl shadow-xl'>
					<DrawerHeader className='flex flex-row items-center justify-between pb-2 border-b border-muted-foreground/10'>
						<DrawerTitle className='text-lg font-bold tracking-wide'>
							{drawerTitle}
						</DrawerTitle>
						<DrawerClose asChild>
							<button
								onClick={() => setIsDrawerOpen(false)}
								title='Close drawer'
								className='ml-auto p-2 rounded-full hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40'
							>
								<span
									aria-hidden='true'
									className='text-2xl'
								>
									&times;
								</span>
							</button>
						</DrawerClose>
					</DrawerHeader>
					{activeView === 'ship' && (
						<div className='p-4 flex flex-col gap-4'>
							<ShipSelector
								onSelect={(ship) => {
									setSelectedShip(ship)
									setContainers([])
									setActiveView('cargo')
									setIsDrawerOpen(false)
								}}
							/>
							{selectedShip && (
								<div className='mt-2 p-2 rounded bg-muted/30'>
									<h3 className='font-semibold text-base'>
										{selectedShip.name}
									</h3>
									<p className='text-xs text-muted-foreground'>
										Capacity: {selectedShip.totalCapacity} SCU
									</p>
								</div>
							)}
						</div>
					)}

					{activeView === 'cargo' && (
						<div className='p-4 flex flex-col gap-4 mx-auto w-full max-w-4xl'>
							<HaulingModeToggle
								currentMode={haulingMode}
								onChange={handleHaulingModeChange}
							/>
							<ContractForm
								haulingMode={haulingMode}
								onSubmit={(newContracts) => {
									if (selectedShip) {
										setContracts(newContracts)
										handleLoadCargo({
											contracts: newContracts,
											selectedShip,
											setContainers,
											routeAlgorithm: RouteAlgorithm.A_STAR,
											haulingMode,
										})
										setIsDrawerOpen(false)
										setIsCanvasInteractive(true)
									} else {
										setAlertTitle('No ship selected')
										setAlertDescription('Please select a ship first')
										setAlertOpen(true)
										setActiveView('ship')
									}
								}}
								onReset={handleReset}
							/>
						</div>
					)}

					{activeView === 'payment' && contracts.length > 0 && (
						<div className='p-4'>
							<CrewPaymentDistribution
								contracts={contracts.filter(
									(c) => c.payout !== undefined && c.payout > 0
								)}
								haulingMode={haulingMode}
							/>
						</div>
					)}
				</DrawerContent>
			</Drawer>

			{/* Global alert dialog for this page */}
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
			{/* Settings modal */}
			{status === 'authenticated' && session?.user && (
				<UserSettingsModal
					isOpen={isSettingsOpen}
					onClose={() => setIsSettingsOpen(false)}
					onSave={handleSaveSettings}
					currentUser={{
						name: session.user.name ?? '',
						email: session.user.email ?? '',
					}}
				/>
			)}
		</div>
	)
}
