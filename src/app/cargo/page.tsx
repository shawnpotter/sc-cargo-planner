// @/app/cargo/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCargo } from '@/providers/CargoProvider'
import { useContracts } from '@/providers/ContractProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import { CargoHold } from '@/components/canvas/CargoHold'
import { UserSettingsModal } from '@/components/auth/UserSettingsModal'
import { CubeIcon } from '@heroicons/react/24/outline'

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
		<>
			{/* Canvas container with interaction toggle */}
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
								<p className='font-semibold'>Tap to interact with 3D view</p>
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
		</>
	)
}
