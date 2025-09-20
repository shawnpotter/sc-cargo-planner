// @/components/auth/SignInForm.tsx
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SignInFormProps {
	readonly onSubmit: (credentials: { name: string; password: string }) => void
	readonly onCancel: () => void
}

/**
 * Renders a sign-in form for user authentication.
 *
 * @param {object} props - The component props.
 * @param {(credentials: { name: string; password: string }) => void} props.onSubmit - Callback invoked when the form is submitted with the entered username and password.
 * @param {() => void} props.onCancel - Callback invoked when the cancel button is clicked.
 *
 * @returns {JSX.Element} The sign-in form component.
 *
 * @remarks
 * - The form includes fields for username and password.
 * - The "Authenticate" button submits the form, while the "Cancel" button triggers the onCancel callback.
 */
function SignInForm({ onSubmit, onCancel }: SignInFormProps) {
	const [name, setName] = useState('')
	const [password, setPassword] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit({ name, password })
	}

	return (
		<form onSubmit={handleSubmit}>
			<div>
				<span></span>
				<h3>System Access</h3>
				<span></span>
			</div>

			<div>
				<label htmlFor='username'>Username</label>
				<Input
					id='username'
					type='text'
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder='Enter your username'
				/>
			</div>

			<div>
				<label htmlFor='password'>Password</label>
				<Input
					id='password'
					type='password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder='Enter your password'
				/>
			</div>

			<div>
				<Button
					onClick={onCancel}
					variant='secondary'
					type='button'
				>
					Cancel
				</Button>

				<Button
					variant='default'
					type='submit'
				>
					Authenticate
				</Button>
			</div>
		</form>
	)
}

export { SignInForm }
