// @/app/cargo/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCargo } from '@/providers/CargoProvider'
import { useContracts } from '@/providers/ContractProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import { CargoHold } from '@/components/canvas/CargoHold'
import { UserSettingsModal } from '@/components/auth/UserSettingsModal'
import {
	CubeIcon,
	DocumentTextIcon,
	CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

export default function Cargo() {
	const { data: session, status } = useSession()
	const { navigateTo } = useCargoNavigation()
	const { selectedShip, containers } = useCargo()
	const { contracts } = useContracts()
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [isCanvasInteractive, setIsCanvasInteractive] = useState(false)

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
							<div className='flex flex-col items-center gap-4'>
								<CubeIcon className='w-16 h-16 text-muted-foreground' />
								<div className='text-center'>
									<p className='font-semibold text-lg mb-2'>No ship selected</p>
									<p className='text-muted-foreground mb-6'>
										Select a ship to begin cargo operations
									</p>
								</div>
								<button
									onClick={() => navigateTo('/cargo/ships')}
									className='px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold'
								>
									Select Ship
								</button>
							</div>
						</div>
					)}
				</div>
			</main>

			{/* Static bottom navigation bar */}
			<nav className='sticky bottom-0 left-0 w-full bg-background border-t border-muted-foreground/10 z-30'>
				<div className='flex w-full'>
					<button
						aria-label='Ship selection'
						onClick={() => navigateTo('/cargo/ships')}
						className='flex-1 flex flex-col items-center py-3 px-2 border-r border-muted-foreground/10 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition'
					>
						<CubeIcon className='w-6 h-6 mb-1' />
						<span className='text-xs font-medium'>Ships</span>
					</button>
					<button
						aria-label='Contract configuration'
						onClick={() => navigateTo('/cargo/contracts')}
						className='flex-1 flex flex-col items-center py-3 px-2 border-r border-muted-foreground/10 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition'
					>
						<DocumentTextIcon className='w-6 h-6 mb-1' />
						<span className='text-xs font-medium'>Contracts</span>
					</button>
					<button
						aria-label='Payment distribution'
						onClick={() => navigateTo('/cargo/payments')}
						disabled={
							contracts.length === 0 ||
							contracts.every((c) => !c.payout || c.payout <= 0)
						}
						className='flex-1 flex flex-col items-center py-3 px-2 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
					>
						<CurrencyDollarIcon className='w-6 h-6 mb-1' />
						<span className='text-xs font-medium'>Payments</span>
					</button>
				</div>
			</nav>

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
