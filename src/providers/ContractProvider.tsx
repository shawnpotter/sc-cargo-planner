// @/providers/ContractContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Contract, DeliveryPoint } from '@/constants/types'

interface ContractProviderType {
	contracts: Contract[]
	currentContract: Partial<Contract>

	// Contract management
	addContract: (contract: Contract) => string
	updateContract: (id: string, updates: Partial<Contract>) => void
	removeContract: (id: string) => void
	clearContracts: () => void

	// Current contract management
	setCurrentContract: (contract: Partial<Contract>) => void
	updateCurrentContract: (updates: Partial<Contract>) => void
	saveCurrentContract: () => string | null
	resetCurrentContract: () => void

	// Delivery point management
	addDeliveryPoint: (deliveryPoint: DeliveryPoint) => void
	removeDeliveryPoint: (index: number) => void

	// Bulk operations
	importContracts: (contracts: Contract[]) => void
	addOCRContracts: (ocrContracts: Contract[]) => void
}

const ContractContext = createContext<ContractProviderType | undefined>(
	undefined
)

function ContractProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const [contracts, setContracts] = useState<Contract[]>([])
	const [currentContract, setCurrentContract] = useState<Partial<Contract>>({
		maxContainerSize: 4,
		origin: '',
		deliveryPoints: [],
		payout: 0,
	})

	const generateId = useCallback(
		() => `id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		[]
	)

	const addContract = useCallback(
		(contract: Contract) => {
			const newContract = {
				...contract,
				id: contract.id || generateId(),
			}
			setContracts((prev) => [...prev, newContract])
			return newContract.id!
		},
		[generateId]
	)

	const updateContract = useCallback(
		(id: string, updates: Partial<Contract>) => {
			setContracts((prev) =>
				prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
			)
		},
		[]
	)

	const removeContract = useCallback((id: string) => {
		setContracts((prev) => prev.filter((c) => c.id !== id))
	}, [])

	const clearContracts = useCallback(() => {
		setContracts([])
		resetCurrentContract()
	}, [])

	const resetCurrentContract = useCallback(() => {
		setCurrentContract({
			maxContainerSize: 4,
			origin: '',
			deliveryPoints: [],
			payout: 0,
		})
	}, [])

	const updateCurrentContract = useCallback((updates: Partial<Contract>) => {
		setCurrentContract((prev) => ({ ...prev, ...updates }))
	}, [])

	// FIXED: Removed auto-save logic, just adds delivery point to current contract
	const addDeliveryPoint = useCallback(
		(deliveryPoint: DeliveryPoint) => {
			setCurrentContract((prev) => {
				const newPoint = {
					...deliveryPoint,
					id: deliveryPoint.id || generateId(),
				}

				return {
					...prev,
					deliveryPoints: [...(prev.deliveryPoints || []), newPoint],
				}
			})
		},
		[generateId]
	)

	const removeDeliveryPoint = useCallback((index: number) => {
		setCurrentContract((prev) => ({
			...prev,
			deliveryPoints: prev.deliveryPoints?.filter((_, i) => i !== index) || [],
		}))
	}, [])

	// FIXED: Always creates a new contract when saving
	const saveCurrentContract = useCallback(() => {
		if (!currentContract.origin || !currentContract.deliveryPoints?.length) {
			return null
		}

		const newContract: Contract = {
			id: generateId(),
			maxContainerSize: currentContract.maxContainerSize || 4,
			origin: currentContract.origin,
			deliveryPoints: currentContract.deliveryPoints,
			payout: currentContract.payout,
		}

		const id = addContract(newContract)

		// Reset current contract
		resetCurrentContract()

		return id
	}, [currentContract, generateId, addContract, resetCurrentContract])

	const importContracts = useCallback(
		(newContracts: Contract[]) => {
			const contractsWithIds = newContracts.map((c) => ({
				...c,
				id: c.id || generateId(),
			}))
			setContracts(contractsWithIds)
		},
		[generateId]
	)

	const addOCRContracts = useCallback(
		(ocrContracts: Contract[]) => {
			const contractsWithIds = ocrContracts.map((c) => ({
				...c,
				id: c.id || generateId(),
			}))

			setContracts((prev) => [...prev, ...contractsWithIds])
		},
		[generateId]
	)

	const value: ContractProviderType = {
		contracts,
		currentContract,
		addContract,
		updateContract,
		removeContract,
		clearContracts,
		setCurrentContract,
		updateCurrentContract,
		saveCurrentContract,
		resetCurrentContract,
		addDeliveryPoint,
		removeDeliveryPoint,
		importContracts,
		addOCRContracts,
	}

	return (
		<ContractContext.Provider value={value}>
			{children}
		</ContractContext.Provider>
	)
}

function useContracts() {
	const context = useContext(ContractContext)
	if (!context) {
		throw new Error('useContracts must be used within a ContractProvider')
	}
	return context
}

export { ContractProvider, useContracts }
