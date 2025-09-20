// @/components/auth/SignUpForm.tsx
'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SignUpFormProps {
	readonly onSubmit: (credentials: {
		email: string
		password: string
		name: string
	}) => void
	readonly onCancel: () => void
}

/**
 * Renders a sign-up form for user registration.
 *
 * Allows users to enter a username, email, and password to create a new account.
 * Handles form submission, displays loading and error states, and prevents duplicate submissions.
 * On successful registration, calls the provided `onSubmit` callback with the entered credentials.
 * The form can be cancelled via the `onCancel` callback.
 *
 * @param {SignUpFormProps} props - The props for the SignUpForm component.
 * @param {(user: { email: string; password: string; name: string }) => void} props.onSubmit - Callback invoked after successful sign-up.
 * @param {() => void} props.onCancel - Callback invoked when the user cancels the sign-up process.
 *
 * @returns {JSX.Element} The rendered sign-up form component.
 */
function SignUpForm({ onSubmit, onCancel }: SignUpFormProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	let isSubmitting = false // Local flag to prevent race conditions

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (loading || isSubmitting) return // Prevent duplicate submissions
		isSubmitting = true // Set the local flag

		const requestId = `${Date.now()}-${Math.random()}` // Generate a unique ID using timestamp and random number
		console.log('Request ID:', requestId) // Debugging log

		setError('')
		setLoading(true)

		try {
			console.log('Sending signup request to API...')
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name, requestId }),
			})

			const data = await response.json()

			if (!response.ok) {
				setError(data.error ?? 'Failed to create account')
				setLoading(false)
				isSubmitting = false // Reset the local flag
				return
			}

			onSubmit({ email, password, name })
		} catch (error) {
			console.error('Signup error:', error)
			setError('An error occurred during signup')
		} finally {
			setLoading(false)
			isSubmitting = false // Reset the local flag
		}
	}

	return (
		<div>
			<div>
				<span></span>
				<h3>Sign Up</h3>
				<span></span>
			</div>

			{error && <div>{error}</div>}

			<form onSubmit={handleSubmit}>
				<div>
					<div>
						<label htmlFor='signup-username'>Username</label>
						<Input
							id='signup-username'
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Choose a unique username'
							required
						/>
					</div>
				</div>
				<div>
					<div>
						<label htmlFor='signup-email'>Email</label>
						<Input
							id='signup-email'
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder='Enter your email'
							required
						/>
					</div>
				</div>
				<div>
					<div>
						<label htmlFor='signup-password'>Password</label>
						<Input
							id='signup-password'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder='Enter your password'
							required
						/>
					</div>
				</div>

				<div>
					<Button
						type='submit'
						variant='default'
						disabled={loading}
					>
						{loading ? 'Authenticating...' : 'Create Account'}
					</Button>
					<Button
						type='button'
						variant='secondary'
						onClick={onCancel}
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	)
}

export { SignUpForm }
