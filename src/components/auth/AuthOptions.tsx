// @/components/auth/AuthOptions.tsx
import React from 'react'
import { Button } from '@/components/ui/button'

interface AuthOptionsProps {
	readonly onSignIn: () => void
	readonly onSignUp: () => void
	readonly onContinueAsGuest: () => void
}

/**
 * Renders authentication options for the user, including buttons to sign in,
 * create an account, or continue as a guest. Authenticated users gain access
 * to saved configurations and extended system capabilities.
 *
 * @param onSignIn - Callback invoked when the "Sign In" button is clicked.
 * @param onSignUp - Callback invoked when the "Create Account" button is clicked.
 * @param onContinueAsGuest - Callback invoked when the "Continue as Guest" button is clicked.
 */
function AuthOptions({
	onSignIn,
	onSignUp,
	onContinueAsGuest,
}: AuthOptionsProps) {
	return (
		<div>
			<div>
				<p>Sign in or continue as a guest</p>
				<p>
					Authenticated users have access to saved configurations and extended
					system capabilities.
				</p>
			</div>

			<div>
				<Button
					onClick={onSignIn}
					variant='default'
				>
					Sign In
				</Button>

				<Button
					onClick={onSignUp}
					variant='default'
				>
					Create Account
				</Button>

				<Button
					onClick={onContinueAsGuest}
					variant='secondary'
				>
					Continue as Guest
				</Button>
			</div>
		</div>
	)
}

export { AuthOptions }
