import { useState, useCallback, useEffect, useRef } from 'react'
import { Contract, DeliveryPoint } from '@/constants/types'
import { useContracts } from '@/providers/ContractProvider'
import { useCargo } from '@/providers/CargoProvider'
import { CargoEntry, DeliveryPointExtended } from '@/components/cargo/types'
import {
	generateId,
	calculateTotalQuantity,
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
	isSubmitting: boolean
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
	handleEditContract: (contract: Contract) => void
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
		setCurrentContract,
	} = useContracts()

	const {
		routeType,
		endLocation,
		startLocation,
		setRouteType,
		setEndLocation,
		setStartLocation,
		deliveryDraft: newDelivery,
		setDeliveryDraft: setNewDelivery,
	} = useCargo()
	const [isSubmitting, setSubmitting] = useState(false)
	const submittingRef = useRef(false)
	const lastAutoAppliedOriginRef = useRef<string | null>(null)

	const [showScanner, setShowScanner] = useState(false)

	useEffect(() => {
		if (currentContract.id) return
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
	}, [startLocation, currentContract.id, currentContract.origin, updateCurrentContract])

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
	}, [newDelivery, addDeliveryPoint, setNewDelivery])

	const handleRemoveCargoFromDelivery = useCallback((cargoIndex: number) => {
		setNewDelivery((prev) => ({
			...prev,
			cargo: prev.cargo.filter((_, i) => i !== cargoIndex),
		}))
	}, [setNewDelivery])

	const handleAddCargoToDelivery = useCallback((cargo: CargoEntry) => {
		setNewDelivery((prev) => ({
			...prev,
			cargo: [...prev.cargo, cargo],
		}))
	}, [setNewDelivery])

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

	const handleEditContract = useCallback((contract: Contract) => {
		lastAutoAppliedOriginRef.current = null
		setCurrentContract(structuredClone(contract))
		setNewDelivery({ location: '', cargo: [], quantity: 0 })
	}, [setCurrentContract, setNewDelivery])

	const handleSubmit = useCallback(async () => {
		if (submittingRef.current) return { success: false }
		submittingRef.current = true
		setSubmitting(true)
		try {
			if (!startLocation) return { success: false, error: {
				title: 'Missing Start Location', description: 'Please select a starting location for your journey.',
			} }
			const hasDraft = !!currentContract.deliveryPoints?.length || !!currentContract.id
			if (hasDraft && !currentContract.origin) return { success: false, error: {
				title: 'Missing Contract Origin', description: 'Please select an origin location before submitting.',
			} }
			const draft: Contract | null = hasDraft && currentContract.origin ? {
				...currentContract,
				id: currentContract.id || generateId(),
				origin: currentContract.origin,
				maxContainerSize: currentContract.maxContainerSize ?? 4,
				deliveryPoints: currentContract.deliveryPoints || [],
				contractType: currentContract.contractType || 'delivery',
			} : null
			const finalizedContracts = draft
				? contracts.some(contract => contract.id === draft.id)
					? contracts.map(contract => contract.id === draft.id ? draft : contract)
					: [...contracts, draft]
				: contracts
			const validation = validateContractsForSubmission(finalizedContracts, hasDraft, routeType, endLocation)
			if (!validation.isValid) return { success: false, error: {
				title: validation.title || 'Invalid contracts', description: validation.description || 'Please check the contract fields.',
			} }
			// Save once, then pass the exact validated fields to generation.
			if (draft) {
				const savedId = saveCurrentContract()
				if (!savedId) throw new Error('The current contract could not be saved. Please check its fields.')
				draft.id = savedId
			}
			onSubmit(finalizedContracts, startLocation, routeType === 'path' ? (endLocation ?? undefined) : undefined)
			return { success: true }
		} catch (error) {
			return { success: false, error: { title: 'Plan generation failed', description: error instanceof Error ? error.message : 'Unable to generate the cargo plan. Please try again.' } }
		} finally {
			// Keep the lock through the event's microtask boundary.
			await Promise.resolve()
			submittingRef.current = false
			setSubmitting(false)
		}
	}, [contracts, currentContract, routeType, endLocation, startLocation, saveCurrentContract, onSubmit])

	// The workspace confirms discarding the run before resetting shared state.
	const handleReset = useCallback(() => {
		onReset()
	}, [onReset])

	return {
		// State
		contracts,
		currentContract,
		newDelivery,
		showScanner,
		isSubmitting,
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
		handleEditContract,
		handleRemoveDeliveryPoint,
		handleSubmit,
		handleReset,
		setRouteType,
		setEndLocation,
		setStartLocation,
	}
}
