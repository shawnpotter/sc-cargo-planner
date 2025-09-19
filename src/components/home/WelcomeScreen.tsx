// app/components/WelcomeScreen.tsx
'use client'
import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
// Removed TerminalPanel
import { AuthOptions } from '@/components/auth/AuthOptions'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'

interface WelcomeScreenProps {
	readonly onContinue: (authenticated: boolean) => void
}

function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
	const [showSignIn, setShowSignIn] = useState(false)
	const [showSignUp, setShowSignUp] = useState(false)
	const [error, setError] = useState('')

	const handleSignIn = () => {
		setShowSignIn(true)
		setShowSignUp(false)
	}

	const handleSignUp = () => {
		setShowSignUp(true)
		setShowSignIn(false)
	}

	const handleSignInSubmit = async (credentials: {
		name: string
		password: string
	}) => {
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

	// UI logic to switch between forms
	const formContent = showSignIn ? (
		<SignInForm
			onSubmit={handleSignInSubmit}
			onCancel={handleCancel}
		/>
	) : showSignUp ? (
		<SignUpForm
			onSubmit={() => {}}
			onCancel={handleCancel}
		/>
	) : (
		<AuthOptions
			onSignIn={handleSignIn}
			onSignUp={handleSignUp}
			onContinueAsGuest={handleContinueAsGuest}
		/>
	)

	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8'>
			<div className='w-full max-w-xl flex flex-col items-center gap-8'>
				<div className='text-center'>
					<h1 className='text-3xl md:text-4xl font-bold font-sans tracking-wider uppercase text-[#FF8A00] dark:text-[#FF8A00] drop-shadow-[0_0_8px_rgba(255,138,0,0.4)] mb-2'>
						UNIVERSAL CARGO MANAGEMENT SYSTEM
					</h1>
					<div className='text-foreground text-base md:text-lg font-sans mb-1'>
						Welcome to the UEE approved cargo management terminal
					</div>
					<div className='text-xs text-foreground tracking-wider border-b border-dashed border-[#FF8A00] dark:border-[#FF8A00] pb-1'>
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
							<p className='text-foreground text-sm font-mono tracking-wide'>
								Initializing system components...
							</p>
							<p className='text-secondary font-semibold tracking-wider'>
								System Ready
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
