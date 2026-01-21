import { useState, useCallback } from 'react'
import { Contract, DeliveryPoint } from '@/constants/types'
import { useContracts } from '@/providers/ContractProvider'
import { useContractAPI } from '@/hooks/useContractAPI'
import { useCargo } from '@/providers/CargoProvider'
import { CargoEntry, DeliveryPointExtended } from '@/components/cargo/types'
import {
	generateId,
	calculateTotalQuantity,
	hasValidContractContent,
} from '@/components/cargo/utils/contractHelpers'
import {
	validateContractsForSubmission,
	validateDeliveryPoint,
} from '@/components/cargo/utils/contractValidation'

interface UseContractFormReturn {
	// State
	contracts: Contract[]
	currentContract: Partial<Contract>
	newDelivery: DeliveryPointExtended
	showScanner: boolean
	apiLoading: boolean
	routeType: 'loop' | 'path'
	endLocation: string | null

	// Actions
	updateCurrentContract: (updates: Partial<Contract>) => void
	setNewDelivery: (delivery: DeliveryPointExtended) => void
	setShowScanner: (show: boolean) => void
	handleAddDeliveryPoint: () => void
	handleAddCargoToDelivery: (cargo: CargoEntry) => void
	handleRemoveCargoFromDelivery: (index: number) => void
	handleSaveCurrentContract: () => void
	handleRemoveContract: (id: string) => void
	handleRemoveDeliveryPoint: (index: number) => void
	handleSubmit: () => Promise<{
		success: boolean
		error?: { title: string; description: string }
	}>
	handleReset: () => void
	setRouteType: (type: 'loop' | 'path') => void
	setEndLocation: (location: string | null) => void
}

export function useContractForm(
	onSubmit: (contracts: Contract[], endLocation?: string) => void,
	onReset: () => void,
): UseContractFormReturn {
	const {
		contracts,
		currentContract,
		updateCurrentContract,
		addDeliveryPoint,
		removeDeliveryPoint,
		saveCurrentContract,
		removeContract,
		clearContracts,
	} = useContracts()

	const { routeType, endLocation, setRouteType, setEndLocation } = useCargo()
	const { saveContracts, loading: apiLoading } = useContractAPI()

	const [showScanner, setShowScanner] = useState(false)
	const [newDelivery, setNewDelivery] = useState<DeliveryPointExtended>({
		location: '',
		cargo: [],
		quantity: 0,
	})

	const handleAddDeliveryPoint = useCallback(() => {
		if (validateDeliveryPoint(newDelivery.location, newDelivery.cargo.length)) {
			const deliveryPoint: DeliveryPoint = {
				id: generateId(),
				location: newDelivery.location,
				quantity: calculateTotalQuantity(newDelivery.cargo),
				cargo: newDelivery.cargo,
			}

			addDeliveryPoint(deliveryPoint)
			setNewDelivery({ location: '', cargo: [], quantity: 0 })
		}
	}, [newDelivery, addDeliveryPoint])

	const handleRemoveCargoFromDelivery = useCallback((cargoIndex: number) => {
		setNewDelivery((prev) => ({
			...prev,
			cargo: prev.cargo.filter((_, i) => i !== cargoIndex),
		}))
	}, [])

	const handleAddCargoToDelivery = useCallback((cargo: CargoEntry) => {
		setNewDelivery((prev) => ({
			...prev,
			cargo: [...prev.cargo, cargo],
		}))
	}, [])

	const handleSaveCurrentContract = useCallback(() => {
		saveCurrentContract()
	}, [saveCurrentContract])

	const handleRemoveContract = useCallback(
		(id: string) => {
			removeContract(id)
		},
		[removeContract],
	)

	const handleRemoveDeliveryPoint = useCallback(
		(index: number) => {
			removeDeliveryPoint(index)
		},
		[removeDeliveryPoint],
	)

	const handleSubmit = useCallback(async () => {
		// Save current contract if it has content
		if (
			hasValidContractContent(
				currentContract.origin,
				currentContract.deliveryPoints?.length,
			)
		) {
			saveCurrentContract()
		}

		// Validate before submission
		const validation = validateContractsForSubmission(
			contracts,
			hasValidContractContent(
				currentContract.origin,
				currentContract.deliveryPoints?.length,
			),
			routeType,
			endLocation,
		)

		if (!validation.isValid) {
			return {
				success: false,
				error: {
					title: validation.title!,
					description: validation.description!,
				},
			}
		}

		// Optionally save to API
		if (saveContracts) {
			await saveContracts(contracts)
		}

		onSubmit(
			contracts,
			routeType === 'path' ? (endLocation ?? undefined) : undefined,
		)
		return { success: true }
	}, [
		contracts,
		currentContract,
		routeType,
		endLocation,
		saveCurrentContract,
		saveContracts,
		onSubmit,
	])

	const handleReset = useCallback(() => {
		clearContracts()
		setNewDelivery({ location: '', cargo: [], quantity: 0 })
		setRouteType('loop')
		setEndLocation(null)
		onReset()
	}, [clearContracts, setRouteType, setEndLocation, onReset])

	return {
		// State
		contracts,
		currentContract,
		newDelivery,
		showScanner,
		apiLoading,
		routeType,
		endLocation,

		// Actions
		updateCurrentContract,
		setNewDelivery,
		setShowScanner,
		handleAddDeliveryPoint,
		handleAddCargoToDelivery,
		handleRemoveCargoFromDelivery,
		handleSaveCurrentContract,
		handleRemoveContract,
		handleRemoveDeliveryPoint,
		handleSubmit,
		handleReset,
		setRouteType,
		setEndLocation,
	}
}
