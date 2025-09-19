'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserButton } from '@/components/auth/UserButton'
import { ThemeSwitchButton } from '@/components/home/ThemeSwitchButton'
import { UserSettingsModal } from '@/components/auth/UserSettingsModal'

export default function HeaderBar() {
	const { data: session, status } = useSession()
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)

	const handleEditAccount = () => {
		setIsSettingsOpen(true)
	}

	const handleSaveSettings = async (userData: {
		name: string
		email: string
	}) => {
		try {
			// Make API call to update user settings
			const response = await fetch('/api/user/update', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData),
			})

			if (!response.ok) {
				throw new Error('Failed to update user')
			}

			// Optionally refresh the session to get updated data
			// You might need to implement session refresh logic here
			console.log('User settings updated successfully')
		} catch (error) {
			console.error('Failed to update user settings:', error)
			// Handle error (show toast, error message, etc.)
		}
	}

	return (
		<header className='w-full bg-background border-b border-dashed border-[#FF8A00] px-4 py-3 flex flex-col md:flex-row items-center justify-between relative shadow-[0_4px_6px_rgba(0,0,0,0.1)]'>
			{/* CRT overlay effect (approximate with Tailwind gradients) */}
			<div className='pointer-events-none absolute inset-0 rounded border border-[rgba(255,138,0,0.2)] bg-gradient-radial from-white/5 via-transparent to-transparent' />

			{/* Left: Logo and Title */}
			<div className='flex flex-col md:flex-row items-center gap-2 z-10'>
				<div className='hidden md:block w-8 h-8 bg-primary rounded-full mr-2 border-2 border-[#FF8A00] shadow-lg' />
				<div className='flex flex-col items-center md:items-start'>
					<h1 className='text-lg md:text-2xl font-bold font-sans tracking-wider uppercase text-[#FF8A00] dark:text-[#FF8A00] drop-shadow-[0_0_8px_rgba(255,138,0,0.4)] leading-tight'>
						UNIVERSAL CARGO MANAGEMENT SYSTEM
					</h1>
					<span className='text-xs md:text-sm text-foreground tracking-widest font-mono'>
						U.C.M.S.
					</span>
				</div>
			</div>

			{/* Center: Version and Date */}
			<div className='flex flex-col items-center z-10'>
				<span className='text-secondary font-semibold text-sm md:text-base tracking-wide'>
					SC Cargo Planner v0.1
				</span>
				<span className='text-xs text-foreground font-mono tracking-wider border-b border-dashed border-[#FF8A00] dark:border-[#FF8A00] pb-0.5 mt-0.5'>
					{(() => {
						const currentDate = new Date()
						const scYear = currentDate.getFullYear() + 930
						const month = String(currentDate.getMonth() + 1).padStart(2, '0')
						const day = String(currentDate.getDate()).padStart(2, '0')
						return `${month}/${day}/${scYear}`
					})()}
				</span>
			</div>

			{/* Right: Theme Switch and User Button */}
			<div className='z-10 flex items-center gap-2'>
				<ThemeSwitchButton />
				{status === 'authenticated' && session?.user && (
					<UserButton
						name={session.user.name ?? 'User'}
						onEditAccount={handleEditAccount}
					/>
				)}
			</div>

			{/* User Settings Modal */}
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
		</header>
	)
}
