'use client'
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserButton } from '@/components/auth/UserButton'
import { ThemeSwitchButton } from '@/components/home/ThemeSwitchButton'
import { InfoMenu } from '@/components/home/InfoMenu'
import { UserSettingsModal } from '@/components/auth/UserSettingsModal'
import { CubeIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

/**
 * Renders the main header bar for the Universal Cargo Management System (U.C.M.S.) application.
 *
 * The header includes:
 * - Application logo and title.
 * - Current version and in-universe date (Star Citizen year).
 * - Theme switch button.
 * - User account button (with modal for editing user settings if authenticated).
 *
 * Handles user settings updates via an API call and displays a modal for editing account information.
 *
 * @returns {JSX.Element} The header bar component.
 */
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
		<header className='w-full bg-background px-5 py-1 flex flex-row sm:flex-row items-center justify-between relative h-[var(--header-h)]'>
			{/* CRT overlay effect (approximate with Tailwind gradients) */}
			<div className='pointer-events-none absolute inset-0 rounded border bg-gradient-radial from-white/5 via-transparent to-transparent' />

			{/* Left: Logo and Title */}
			<Link
				href={'/'}
				className='w-28 md:w-64 h-12 z-10'
			>
				<div className='beveled-tl-br-lg bg-primary w-full h-full flex flex-row md:flex-row justify-center items-center gap-2'>
					<div className='hidden md:block w-8 h-8 rounded text-primary-foreground mr-2 '>
						<CubeIcon />
					</div>
					<div className='flex flex-col items-center md:items-start'>
						<h1 className='text-lg md:text-2xl font-bold font-sans tracking-wider text-primary-foreground dark:text-primary-foreground leading-tight'>
							U.C.M.S. (β)
						</h1>
					</div>
				</div>
			</Link>

			{/* Center: Version and Date */}
			<div className='flex flex-row items-center'>
				<span className=' tracking-wide'>
					<span className='text-xs font-light text-chart-2'>
						{(() => {
							const currentDate = new Date()
							const scYear = currentDate.getFullYear() + 930
							const month = String(currentDate.getMonth() + 1).padStart(2, '0')
							const day = String(currentDate.getDate()).padStart(2, '0')
							return `${month}/${day}/${scYear}`
						})()}
					</span>
				</span>
			</div>

			{/* Right: Theme Switch and User Button */}
			<div className='z-10 flex items-center gap-2'>
				<ThemeSwitchButton />
				<InfoMenu />
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
