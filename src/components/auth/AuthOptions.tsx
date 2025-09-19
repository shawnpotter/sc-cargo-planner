// @/components/auth/AuthOptions.tsx
import React from 'react'
import { Button } from '@/components/ui/button'

interface AuthOptionsProps {
	readonly onSignIn: () => void
	readonly onSignUp: () => void
	readonly onContinueAsGuest: () => void
}

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
