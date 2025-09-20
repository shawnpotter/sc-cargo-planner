// app/hooks/useContractAPI.ts
import { useState, useCallback } from 'react'
import { Contract } from '@/constants/types'

/**
 * Custom React hook for managing contract-related API operations.
 *
 * Provides methods to fetch, save, update, delete, and clear contracts via RESTful endpoints.
 * Handles loading and error states internally.
 *
 * @returns An object containing:
 * - `loading`: Indicates if an API request is in progress.
 * - `error`: Contains the error message if an API request fails, otherwise `null`.
 * - `fetchContracts`: Fetches the list of contracts from the server.
 * - `saveContracts`: Saves an array of contracts to the server.
 * - `updateContract`: Updates a specific contract by ID.
 * - `deleteContract`: Deletes a specific contract by ID.
 * - `clearAllContracts`: Deletes all contracts from the server.
 *
 * @example
 * const {
 *   loading,
 *   error,
 *   fetchContracts,
 *   saveContracts,
 *   updateContract,
 *   deleteContract,
 *   clearAllContracts,
 * } = useContractAPI();
 */
function useContractAPI() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchContracts = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch('/api/contracts')
			if (!response.ok) throw new Error('Failed to fetch contracts')
			const data = await response.json()
			return data.contracts as Contract[]
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
			return []
		} finally {
			setLoading(false)
		}
	}, [])

	const saveContracts = useCallback(async (contracts: Contract[]) => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch('/api/contracts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contracts }),
			})
			if (!response.ok) throw new Error('Failed to save contracts')
			const data = await response.json()
			return data.contracts as Contract[]
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
			return null
		} finally {
			setLoading(false)
		}
	}, [])

	const updateContract = useCallback(
		async (id: string, updates: Partial<Contract>) => {
			setLoading(true)
			setError(null)
			try {
				const response = await fetch(`/api/contracts/${id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updates),
				})
				if (!response.ok) throw new Error('Failed to update contract')
				return true
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
				return false
			} finally {
				setLoading(false)
			}
		},
		[]
	)

	const deleteContract = useCallback(async (id: string) => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch(`/api/contracts/${id}`, {
				method: 'DELETE',
			})
			if (!response.ok) throw new Error('Failed to delete contract')
			return true
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
			return false
		} finally {
			setLoading(false)
		}
	}, [])

	const clearAllContracts = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch('/api/contracts', {
				method: 'DELETE',
			})
			if (!response.ok) throw new Error('Failed to clear contracts')
			return true
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
			return false
		} finally {
			setLoading(false)
		}
	}, [])

	return {
		loading,
		error,
		fetchContracts,
		saveContracts,
		updateContract,
		deleteContract,
		clearAllContracts,
	}
}

export { useContractAPI }
