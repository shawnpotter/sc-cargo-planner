// src/__tests__/hooks/useContractAPI.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useContractAPI } from '@/hooks/useContractAPI'
import { Contract } from '@/constants/types'

describe('useContractAPI', () => {
	const mockContracts: Contract[] = [
		{
			id: 'contract-1',
			maxContainerSize: 32,
			origin: 'Port Olisar',
			deliveryPoints: [
				{
					id: 'delivery-1',
					location: 'Lorville',
					quantity: 100,
					cargo: [
						{
							cargoType: 'Medical Supplies',
							quantity: 100,
						},
					],
				},
			],
			payout: 50000,
		},
		{
			id: 'contract-2',
			maxContainerSize: 24,
			origin: 'Area18',
			deliveryPoints: [
				{
					id: 'delivery-2',
					location: 'New Babbage',
					quantity: 50,
					cargo: [
						{
							cargoType: 'Electronics',
							quantity: 50,
						},
					],
				},
			],
			payout: 25000,
		},
	]

	let mockedFetch: ReturnType<typeof vi.fn>

	beforeEach(() => {
		vi.clearAllMocks()
		// Create a properly typed mock for the global fetch function
		mockedFetch = vi.fn()
		// Assign to global.fetch with a safe cast through unknown to match the global type
		global.fetch = mockedFetch as unknown as typeof fetch
	})

	describe('fetchContracts', () => {
		it('should fetch contracts successfully', async () => {
			const mockResponse = { contracts: mockContracts }
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe(null)

			let contracts: Contract[] = []
			await act(async () => {
				contracts = await result.current.fetchContracts()
			})

			expect(contracts).toEqual(mockContracts)
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe(null)
			expect(mockedFetch).toHaveBeenCalledWith('/api/contracts')
		})

		it('should handle fetch error', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let contracts: Contract[] = []
			await act(async () => {
				contracts = await result.current.fetchContracts()
			})

			expect(contracts).toEqual([])
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe('Failed to fetch contracts')
		})

		it('should handle network error', async () => {
			mockedFetch.mockRejectedValueOnce(new Error('Network error'))

			const { result } = renderHook(() => useContractAPI())

			let contracts: Contract[] = []
			await act(async () => {
				contracts = await result.current.fetchContracts()
			})

			expect(contracts).toEqual([])
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe('Network error')
		})

		it('should set loading state during fetch', async () => {
			const mockResponse = { contracts: mockContracts }
			mockedFetch.mockImplementationOnce(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => mockResponse,
								} as unknown as Response),
							100
						)
					)
			)

			const { result } = renderHook(() => useContractAPI())

			let fetchPromise: Promise<Contract[]>
			act(() => {
				fetchPromise = result.current.fetchContracts()
			})

			expect(result.current.loading).toBe(true)

			await act(async () => {
				await fetchPromise
			})

			expect(result.current.loading).toBe(false)
		})
	})

	describe('saveContracts', () => {
		it('should save contracts successfully', async () => {
			const mockResponse = { contracts: mockContracts }
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let savedContracts: Contract[] | null = null
			await act(async () => {
				savedContracts = await result.current.saveContracts(mockContracts)
			})

			expect(savedContracts).toEqual(mockContracts)
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe(null)
			expect(mockedFetch).toHaveBeenCalledWith('/api/contracts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contracts: mockContracts }),
			})
		})

		it('should handle save error', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let savedContracts: Contract[] | null = null
			await act(async () => {
				savedContracts = await result.current.saveContracts(mockContracts)
			})

			expect(savedContracts).toBe(null)
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe('Failed to save contracts')
		})
	})

	describe('updateContract', () => {
		it('should update contract successfully', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			const updates: Partial<Contract> = { payout: 75000 }
			let success = false
			await act(async () => {
				success = await result.current.updateContract('contract-1', updates)
			})

			expect(success).toBe(true)
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe(null)
			expect(mockedFetch).toHaveBeenCalledWith('/api/contracts/contract-1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
			})
		})

		it('should handle update error', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let success = false
			await act(async () => {
				success = await result.current.updateContract('contract-1', {
					payout: 75000,
				})
			})

			expect(success).toBe(false)
			expect(result.current.error).toBe('Failed to update contract')
		})
	})

	describe('deleteContract', () => {
		it('should delete contract successfully', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let success = false
			await act(async () => {
				success = await result.current.deleteContract('contract-1')
			})

			expect(success).toBe(true)
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe(null)
			expect(mockedFetch).toHaveBeenCalledWith('/api/contracts/contract-1', {
				method: 'DELETE',
			})
		})

		it('should handle delete error', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let success = false
			await act(async () => {
				success = await result.current.deleteContract('contract-1')
			})

			expect(success).toBe(false)
			expect(result.current.error).toBe('Failed to delete contract')
		})
	})

	describe('clearAllContracts', () => {
		it('should clear all contracts successfully', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let success = false
			await act(async () => {
				success = await result.current.clearAllContracts()
			})

			expect(success).toBe(true)
			expect(result.current.loading).toBe(false)
			expect(result.current.error).toBe(null)
			expect(mockedFetch).toHaveBeenCalledWith('/api/contracts', {
				method: 'DELETE',
			})
		})

		it('should handle clear error', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			let success = false
			await act(async () => {
				success = await result.current.clearAllContracts()
			})

			expect(success).toBe(false)
			expect(result.current.error).toBe('Failed to clear contracts')
		})
	})

	describe('error handling', () => {
		it('should clear error on successful request after error', async () => {
			// First request fails
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			} as unknown as Response)

			const { result } = renderHook(() => useContractAPI())

			await act(async () => {
				await result.current.fetchContracts()
			})

			expect(result.current.error).toBe('Failed to fetch contracts')

			// Second request succeeds
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ contracts: mockContracts }),
			} as unknown as Response)

			await act(async () => {
				await result.current.fetchContracts()
			})

			expect(result.current.error).toBe(null)
		})
	})
})
