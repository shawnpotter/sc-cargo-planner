// @/providers/ContractProvider.tsx
'use client'

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
} from 'react'
import { Contract, DeliveryPoint } from '@/constants/types'

interface ContractProviderType {
	contracts: Contract[]
	currentContract: Partial<Contract>

	addContract: (contract: Contract) => string
	updateContract: (id: string, updates: Partial<Contract>) => void
	removeContract: (id: string) => void
	clearContracts: () => void

	setCurrentContract: (contract: Partial<Contract>) => void
	updateCurrentContract: (updates: Partial<Contract>) => void
	saveCurrentContract: () => string | null
	resetCurrentContract: () => void

	addDeliveryPoint: (deliveryPoint: DeliveryPoint) => void
	removeDeliveryPoint: (index: number) => void

	importContracts: (contracts: Contract[]) => void
	addOCRContracts: (ocrContracts: Contract[]) => void
}

const ContractContext = createContext<ContractProviderType | undefined>(
	undefined,
)

function createInitialContractState(): Partial<Contract> {
	return {
		maxContainerSize: 4,
		origin: '',
		deliveryPoints: [],
		payout: 0,
		contractType: 'delivery',
	}
}

function ContractProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const [contracts, setContracts] = useState<Contract[]>([])
	const [currentContract, setCurrentContract] = useState<Partial<Contract>>(
		createInitialContractState(),
	)

	const generateId = useCallback(
		() => `id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		[],
	)

	const addContract = useCallback(
		(contract: Contract) => {
			const newContract = {
				...contract,
				id: contract.id || generateId(),
			}
			setContracts((prev) => [...prev, newContract])
			return newContract.id || ''
		},
		[generateId],
	)

	const updateContract = useCallback(
		(id: string, updates: Partial<Contract>) => {
			setContracts((prev) =>
				prev.map((contract) =>
					contract.id === id ? { ...contract, ...updates } : contract,
				),
			)
		},
		[],
	)

	const removeContract = useCallback((id: string) => {
		setContracts((prev) => prev.filter((contract) => contract.id !== id))
	}, [])

	const resetCurrentContract = useCallback(() => {
		setCurrentContract(createInitialContractState())
	}, [])

	const clearContracts = useCallback(() => {
		setContracts([])
		resetCurrentContract()
	}, [resetCurrentContract])

	const updateCurrentContract = useCallback((updates: Partial<Contract>) => {
		setCurrentContract((prev) => ({ ...prev, ...updates }))
	}, [])

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
		[generateId],
	)

	const removeDeliveryPoint = useCallback((index: number) => {
		setCurrentContract((prev) => ({
			...prev,
			deliveryPoints:
				prev.deliveryPoints?.filter((_, pointIndex) => pointIndex !== index) ||
				[],
		}))
	}, [])

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
			contractType: currentContract.contractType || 'delivery',
			pickupLocation: currentContract.pickupLocation,
		}

		const id = addContract(newContract)
		resetCurrentContract()
		return id
	}, [currentContract, generateId, addContract, resetCurrentContract])

	const importContracts = useCallback(
		(newContracts: Contract[]) => {
			const contractsWithIds = newContracts.map((contract) => ({
				...contract,
				id: contract.id || generateId(),
				contractType: contract.contractType || 'delivery',
			}))
			setContracts(contractsWithIds)
		},
		[generateId],
	)

	const addOCRContracts = useCallback(
		(ocrContracts: Contract[]) => {
			const contractsWithIds = ocrContracts.map((contract) => ({
				...contract,
				id: contract.id || generateId(),
				contractType: contract.contractType || 'delivery',
			}))

			setContracts((prev) => [...prev, ...contractsWithIds])
		},
		[generateId],
	)

	const value: ContractProviderType = useMemo(
		() => ({
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
		}),
		[
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
		],
	)

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
