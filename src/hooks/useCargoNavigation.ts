'use client'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useCargoNavigation() {
	const router = useRouter()

	const navigateTo = useCallback(
		(path: string) => {
			// Add a small delay to let any state updates complete
			// This helps prevent race conditions with context updates
			setTimeout(() => {
				router.push(path)
			}, 50) // 50ms delay to ensure state propagation
		},
		[router]
	)

	return { navigateTo }
}
