// app/components/UserSettingsModal.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UserSettingsModalProps {
	readonly isOpen: boolean
	readonly onClose: () => void
	readonly onSave: (userData: { name: string; email: string }) => void
	readonly currentUser: {
		name: string
		email: string
	}
}

/**
 * Modal component for editing user account settings.
 *
 * Displays a form allowing the user to update their username and email address.
 * Handles form state, validation, and submission. Shows loading and error states.
 * Resets form fields when the modal is opened.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.isOpen - Controls whether the modal is visible.
 * @param {() => void} props.onClose - Callback to close the modal.
 * @param {(user: { name: string; email: string }) => void} props.onSave - Callback to save updated user data.
 * @param {{ name: string; email: string }} props.currentUser - The current user data to prefill the form.
 *
 * @returns {JSX.Element | null} The rendered modal component, or null if not open.
 */

function UserSettingsModal({
	isOpen,
	onClose,
	onSave,
	currentUser,
}: UserSettingsModalProps) {
	const [name, setName] = useState(currentUser.name)
	const [email, setEmail] = useState(currentUser.email)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setName(currentUser.name)
			setEmail(currentUser.email)
			setError('')
		}
	}, [isOpen, currentUser])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			// You would typically make an API call here to update the user
			onSave({ name, email })
			onClose()
		} catch (err) {
			console.error('Failed to update account:', err)
			setError('Failed to update account')
		} finally {
			setLoading(false)
		}
	}

	if (!isOpen) return null

	return (
		<div>
			<div>
				<div>
					<div>
						<span></span>
						<h2>User Settings</h2>
						<span></span>
					</div>

					{error && <div>{error}</div>}

					<form onSubmit={handleSubmit}>
						<div>
							<label htmlFor='settings-username'>Username</label>
							<Input
								id='settings-username'
								type='text'
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='Enter your username'
								required
							/>
						</div>

						<div>
							<label htmlFor='settings-email'>Email</label>
							<Input
								id='settings-email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='Enter your email'
								required
							/>
						</div>

						<div>
							<Button
								type='button'
								variant='secondary'
								onClick={onClose}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='default'
								disabled={loading}
							>
								{loading ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export { UserSettingsModal }
