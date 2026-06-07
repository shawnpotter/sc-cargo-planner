import { useState, useCallback, useEffect, useRef } from 'react'
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
	startLocation: string | null

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
	setStartLocation: (location: string | null) => void
}

export function useContractForm(
	onSubmit: (
		contracts: Contract[],
		startLocation?: string,
		endLocation?: string,
	) => void,
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

	const {
		routeType,
		endLocation,
		startLocation,
		setRouteType,
		setEndLocation,
		setStartLocation,
	} = useCargo()
	const { saveContracts, loading: apiLoading } = useContractAPI()
	const lastAutoAppliedOriginRef = useRef<string | null>(null)

	const [showScanner, setShowScanner] = useState(false)
	const [newDelivery, setNewDelivery] = useState<DeliveryPointExtended>({
		location: '',
		cargo: [],
		quantity: 0,
	})

	useEffect(() => {
		if (!startLocation) {
			lastAutoAppliedOriginRef.current = null
			return
		}

		const currentOrigin = currentContract.origin
		const lastAutoApplied = lastAutoAppliedOriginRef.current
		const shouldApplyDefault =
			!currentOrigin ||
			(lastAutoApplied !== null && currentOrigin === lastAutoApplied)

		if (shouldApplyDefault && currentOrigin !== startLocation) {
			updateCurrentContract({ origin: startLocation })
		}

		if (shouldApplyDefault) {
			lastAutoAppliedOriginRef.current = startLocation
		}
	}, [startLocation, currentContract.origin, updateCurrentContract])

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
		// Ensure contract type is set before saving.
		if (!currentContract.contractType) {
			updateCurrentContract({ contractType: 'delivery' })
		}
		saveCurrentContract()
	}, [currentContract, saveCurrentContract, updateCurrentContract])

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
		// Collect contracts for submission - include current contract if it has content
		let contractsToValidate = contracts

		// Save current contract if it has content
		if (
			hasValidContractContent(
				currentContract.origin,
				currentContract.deliveryPoints?.length,
			)
		) {
			// Ensure contractType is set
			if (!currentContract.contractType) {
				updateCurrentContract({ contractType: 'delivery' })
			}
			const contractId = saveCurrentContract()
			if (contractId) {
				// The saved contract was added to state, but due to async batching,
				// we need to reconstruct it manually for validation
				const newContract: Contract = {
					id: contractId,
					maxContainerSize: currentContract.maxContainerSize || 4,
					origin: currentContract.origin,
					deliveryPoints: currentContract.deliveryPoints || [],
					payout: currentContract.payout,
					contractType: currentContract.contractType || 'delivery',
					pickupLocation: currentContract.pickupLocation,
				}
				contractsToValidate = [...contracts, newContract]
			}
		}

		// Require a start location for route generation.
		if (!startLocation) {
			return {
				success: false,
				error: {
					title: 'Missing Start Location',
					description: 'Please select a starting location for your journey.',
				},
			}
		}

		// Validate before submission
		const validation = validateContractsForSubmission(
			contractsToValidate,
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

		// Pass journey bounds to the submit handler.
		onSubmit(
			contracts,
			startLocation,
			routeType === 'path' ? (endLocation ?? undefined) : undefined,
		)
		return { success: true }
	}, [
		contracts,
		currentContract,
		routeType,
		endLocation,
		startLocation,
		saveCurrentContract,
		saveContracts,
		onSubmit,
		updateCurrentContract,
	])

	const handleReset = useCallback(() => {
		clearContracts()
		setNewDelivery({ location: '', cargo: [], quantity: 0 })
		setRouteType('loop')
		setEndLocation(null)
		setStartLocation(null)
		onReset()
	}, [clearContracts, setRouteType, setEndLocation, setStartLocation, onReset])

	return {
		// State
		contracts,
		currentContract,
		newDelivery,
		showScanner,
		apiLoading,
		routeType,
		endLocation,
		startLocation,

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
		setStartLocation,
	}
}
