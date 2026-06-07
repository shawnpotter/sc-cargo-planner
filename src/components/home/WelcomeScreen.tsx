// app/components/WelcomeScreen.tsx
'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
// Removed TerminalPanel
import { AuthOptions } from '@/components/auth/AuthOptions'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'

interface WelcomeScreenProps {
	readonly onContinue: (authenticated: boolean) => void
}

type ApiStatus = 'checking' | 'online' | 'degraded' | 'offline'

/**
 * Renders the welcome screen for the Universal Cargo Management System (UCMS).
 * Provides authentication options including sign in, sign up, and guest access.
 * Displays system initialization status and handles authentication errors.
 *
 * @param {WelcomeScreenProps} props - The props for the WelcomeScreen component.
 * @param {(isAuthenticated: boolean) => void} props.onContinue - Callback invoked when the user continues, indicating authentication status.
 *
 * @returns {JSX.Element} The rendered welcome screen UI.
 */
function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
	const authDisabled = true
	const [showSignIn, setShowSignIn] = useState(false)
	const [showSignUp, setShowSignUp] = useState(false)
	const [error, setError] = useState('')
	const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')
	const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		const checkApiStatus = async () => {
			try {
				const response = await fetch('/api/map/locations', {
					cache: 'no-store',
				})
				if (!isMounted) {
					return
				}

				if (!response.ok) {
					setApiStatus('offline')
					setLastCheckedAt(new Date().toISOString())
					return
				}

				const json = (await response.json()) as {
					meta?: { cached?: boolean; fetchedAt?: string }
				}
				setApiStatus(json.meta?.cached ? 'degraded' : 'online')
				setLastCheckedAt(json.meta?.fetchedAt ?? new Date().toISOString())
			} catch {
				if (!isMounted) {
					return
				}
				setApiStatus('offline')
				setLastCheckedAt(new Date().toISOString())
			}
		}

		void checkApiStatus()
		const intervalId = window.setInterval(() => {
			void checkApiStatus()
		}, 30000)

		return () => {
			isMounted = false
			window.clearInterval(intervalId)
		}
	}, [])

	const statusCopy = useMemo(() => {
		switch (apiStatus) {
			case 'online':
				return {
					heading: 'System Ready',
					detail: 'Live map API connected',
					color: 'text-emerald-500',
					dotColor: 'bg-emerald-500',
				}
			case 'degraded':
				return {
					heading: 'System Ready (Cached Data)',
					detail: 'Map API unavailable, using last successful sync',
					color: 'text-amber-500',
					dotColor: 'bg-amber-500',
				}
			case 'offline':
				return {
					heading: 'System Degraded',
					detail: 'Map API offline and no fresh sync available',
					color: 'text-destructive',
					dotColor: 'bg-destructive',
				}
			default:
				return {
					heading: 'Initializing system components...',
					detail: 'Checking map API status',
					color: 'text-foreground',
					dotColor: 'bg-muted-foreground',
				}
		}
	}, [apiStatus])

	const handleSignIn = () => {
		if (authDisabled) {
			setError('Account features are disabled in this beta build')
			return
		}
		setShowSignIn(true)
		setShowSignUp(false)
	}

	const handleSignUp = () => {
		if (authDisabled) {
			setError('Account features are disabled in this beta build')
			return
		}
		setShowSignUp(true)
		setShowSignIn(false)
	}

	const handleSignInSubmit = async (credentials: {
		name: string
		password: string
	}) => {
		if (authDisabled) {
			setError('Account features are disabled in this beta build')
			return
		}
		setError('')
		try {
			const result = await signIn('credentials', {
				name: credentials.name,
				password: credentials.password,
				redirect: false,
			})
			if (result?.error) {
				setError('Invalid username or password')
				return
			}
			onContinue(true)
		} catch (error) {
			console.error('Sign in error:', error)
			setError('An error occurred during sign in')
		}
	}

	const handleCancel = () => {
		setShowSignIn(false)
		setShowSignUp(false)
		setError('')
	}

	const handleContinueAsGuest = () => {
		onContinue(false)
	}

	let formContent = (
		<AuthOptions
			onSignIn={handleSignIn}
			onSignUp={handleSignUp}
			onContinueAsGuest={handleContinueAsGuest}
			authDisabled={authDisabled}
		/>
	)

	if (showSignIn) {
		formContent = (
			<SignInForm
				onSubmit={handleSignInSubmit}
				onCancel={handleCancel}
				disabled={authDisabled}
			/>
		)
	} else if (showSignUp) {
		formContent = (
			<SignUpForm
				onSubmit={() => {}}
				onCancel={handleCancel}
				disabled={authDisabled}
			/>
		)
	}

	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8'>
			<div className='w-full max-w-xl flex flex-col items-center gap-8'>
				<div className='text-center'>
					<h1 className='text-3xl md:text-4xl font-bold font-sans tracking-wider uppercase text-primary mb-2'>
						UNIVERSAL CARGO MANAGEMENT SYSTEM
					</h1>
					<div className='text-foreground text-base md:text-lg font-sans mb-1'>
						Welcome to the UEE approved cargo management terminal
					</div>
					<div className='text-xs text-foreground tracking-wider border-b border-dashed border-primary dark:border-primary pb-1'>
						UCMS v0.1 // SECURE TRANSMISSION
					</div>
				</div>

				{error && (
					<div className='bg-destructive/20 border border-destructive text-destructive rounded px-4 py-2 text-center font-medium mb-2 animate-pulse'>
						{error}
					</div>
				)}

				<div className='w-full flex flex-col gap-6'>
					<div className='bg-card border border-border rounded shadow-md p-6 flex flex-col items-center gap-2 relative overflow-hidden'>
						{/* CRT overlay effect */}
						<div className='pointer-events-none absolute inset-0 rounded border border-[rgba(255,138,0,0.2)] bg-gradient-radial from-white/5 via-transparent to-transparent' />
						<div className='flex flex-col items-center gap-2 z-10'>
							<div className='bg-secondary rounded-full p-2 mb-2 shadow-lg'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									className='w-8 h-8 text-white dark:text-white'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
									/>
								</svg>
							</div>
							<div className='mt-1 flex items-center gap-2 text-xs text-foreground/80'>
								<span
									className={`inline-block h-2 w-2 rounded-full ${statusCopy.dotColor}`}
								/>
								<span>API Status: {apiStatus.toUpperCase()}</span>
								{lastCheckedAt && (
									<span className='opacity-80'>
										Last check: {new Date(lastCheckedAt).toLocaleTimeString()}
									</span>
								)}
							</div>
							<p className='text-foreground text-sm font-mono tracking-wide'>
								{statusCopy.detail}
							</p>
							<p className={`font-semibold tracking-wider ${statusCopy.color}`}>
								{statusCopy.heading}
							</p>
						</div>
					</div>

					<div
						className='bg-card border border-border rounded shadow-md p-6 flex flex-col items-center gap-4'
						title='Authentication Options'
					>
						{formContent}
					</div>
				</div>
			</div>
		</div>
	)
}

export { WelcomeScreen }
