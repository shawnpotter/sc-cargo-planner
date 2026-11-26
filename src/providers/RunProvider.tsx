'use client'

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react'
import type { Container, Contract, DeliveryPoint, Ship, StopStatus } from '@/constants/types'
import type { HaulingMode } from '@/utils/calculateContainers'
import type { OptimizedRoute } from '@/utils/routeOptimizer'
import { getStopId } from '@/utils/stopIdentity'
import { contractsEqual, createId, createInitialContractState, createInitialDeliveryDraft, getNextStatus, identifyContract, markPlanOutdated } from '@/lib/run/state'
import type { CrewMember, DeliveryDraft, RouteType, RunState } from '@/lib/run/state'
import { createRunStore, type SaveStatus } from '@/lib/run/store'

export type { SaveStatus } from '@/lib/run/store'
interface RunActions {
	setSelectedShip: (ship: Ship | null) => void
	setHaulingMode: (mode: HaulingMode) => void
	setRouteType: (type: RouteType) => void
	setStartLocation: (location: string | null) => void
	setEndLocation: (location: string | null) => void
	commitPlan: (containers: Container[], optimizedRoute: OptimizedRoute) => void
	setStopStatus: (visitId: string, status: StopStatus) => void
	cycleStopStatus: (visitId: string) => void
	resetRun: () => void
	resetCargo: () => void
	setCrewMembers: React.Dispatch<React.SetStateAction<CrewMember[]>>
	setManualPayout: React.Dispatch<React.SetStateAction<number>>
	addContract: (contract: Contract) => string
	updateContract: (id: string, updates: Partial<Contract>) => void
	removeContract: (id: string) => void
	clearContracts: () => void
	setCurrentContract: (contract: Partial<Contract>) => void
	setDeliveryDraft: React.Dispatch<React.SetStateAction<DeliveryDraft>>
	updateCurrentContract: (updates: Partial<Contract>) => void
	saveCurrentContract: () => string | null
	resetCurrentContract: () => void
	addDeliveryPoint: (point: DeliveryPoint) => void
	removeDeliveryPoint: (index: number) => void
	importContracts: (contracts: Contract[]) => void
	addOCRContracts: (contracts: Contract[]) => void
}
export interface RunContextValue extends RunState, RunActions {
	saveStatus: SaveStatus
	storageError: string | null
}
const RunContext = createContext<RunContextValue | null>(null)

export function RunProvider({ children }: Readonly<{ children: React.ReactNode }>) {
	const [store] = useState(createRunStore)
	const { run, saveStatus, storageError } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
	const changeRun = store.changeRun

	const actions = useMemo<RunActions>(() => {
		function input<K extends 'haulingMode' | 'startLocation' | 'endLocation'>(key: K, value: RunState[K]) {
			changeRun((previous) => previous[key] === value ? previous : markPlanOutdated({ ...previous, [key]: value }))
		}
		function editDraft(contract: Partial<Contract>) {
			changeRun((previous) => {
				if (contractsEqual(previous.currentContract, contract)) return previous
				const existing = contract.id ? previous.contracts.find((item) => item.id === contract.id) : undefined
				const next = { ...previous, currentContract: contract }
				const changesPlan = !!contract.id || !!previous.currentContract.id || !!contract.deliveryPoints?.length || !!previous.currentContract.deliveryPoints?.length
				return !changesPlan || (existing && contractsEqual(existing, contract)) ? next : markPlanOutdated(next)
			})
		}
		function replaceContracts(contracts: Contract[]) {
			changeRun((previous) => {
				const identified = contracts.map(identifyContract)
				if (identified.length === previous.contracts.length && identified.every((contract, index) => contractsEqual(contract, previous.contracts[index]))) return previous
				return markPlanOutdated({ ...previous, contracts: identified })
			})
		}
		function upsertContract(contract: Contract): string {
			const identified = identifyContract(contract)
			const id = identified.id ?? createId()
			const existing = store.getSnapshot().run.contracts.some((item) => item.id === id)
			replaceContracts(existing ? store.getSnapshot().run.contracts.map((item) => item.id === id ? identified : item) : [...store.getSnapshot().run.contracts, identified])
			return id
		}
		function setStopStatus(visitId: string, status: StopStatus) {
			changeRun((previous) => {
				if (previous.planStatus !== 'ready' || !previous.optimizedRoute) return previous
				const stops = previous.optimizedRoute.stops
				const visitIndex = stops.findIndex((stop) => getStopId(stop) === visitId)
				if (visitIndex < 0) return previous
				if (status !== 'idle' && stops.slice(0, visitIndex).some((stop) => previous.stopStatuses[getStopId(stop)] !== 'completed')) return previous
				const stopStatuses = { ...previous.stopStatuses, [visitId]: status }
				if (status !== 'completed') for (const stop of stops.slice(visitIndex + 1)) delete stopStatuses[getStopId(stop)]
				return { ...previous, stopStatuses }
			})
		}
		const resetRun = store.resetRun
		return {
			setSelectedShip: (selectedShip) => changeRun((previous) => previous.selectedShip?.name === selectedShip?.name ? previous : markPlanOutdated({ ...previous, selectedShip })),
			setHaulingMode: (mode) => input('haulingMode', mode),
			setStartLocation: (location) => input('startLocation', location),
			setEndLocation: (location) => input('endLocation', location),
			setRouteType: (routeType) => changeRun((previous) => previous.routeType === routeType ? previous : markPlanOutdated({ ...previous, routeType, endLocation: routeType === 'loop' ? null : previous.endLocation })),
			commitPlan: (containers, optimizedRoute) => changeRun((previous) => ({ ...previous, containers, optimizedRoute, planStatus: 'ready', stopStatuses: {} })),
			setStopStatus,
			cycleStopStatus: (id) => setStopStatus(id, getNextStatus(store.getSnapshot().run.stopStatuses[id] ?? 'idle')),
			resetRun,
			resetCargo: resetRun,
			setCrewMembers: (value) => changeRun((previous) => ({ ...previous, crewMembers: typeof value === 'function' ? value(previous.crewMembers) : value })),
			setManualPayout: (value) => changeRun((previous) => ({ ...previous, manualPayout: typeof value === 'function' ? value(previous.manualPayout) : value })),
			addContract: upsertContract,
			updateContract: (id, updates) => replaceContracts(store.getSnapshot().run.contracts.map((contract) => contract.id === id ? { ...contract, ...updates, id } : contract)),
			removeContract: (id) => replaceContracts(store.getSnapshot().run.contracts.filter((contract) => contract.id !== id)),
			clearContracts: () => { replaceContracts([]); changeRun((previous) => ({ ...previous, currentContract: createInitialContractState(), deliveryDraft: createInitialDeliveryDraft() })) },
			setCurrentContract: editDraft,
			setDeliveryDraft: (value) => changeRun((previous) => {
				const deliveryDraft = typeof value === 'function' ? value(previous.deliveryDraft) : value
				if (JSON.stringify(deliveryDraft) === JSON.stringify(previous.deliveryDraft)) return previous
				const next = { ...previous, deliveryDraft }
				return previous.deliveryDraft.cargo.length || deliveryDraft.cargo.length ? markPlanOutdated(next) : next
			}),
			updateCurrentContract: (updates) => editDraft({ ...store.getSnapshot().run.currentContract, ...updates }),
			saveCurrentContract: () => {
				const draft = store.getSnapshot().run.currentContract
				if (!draft.origin || !draft.deliveryPoints?.length) return null
				const id = upsertContract({ ...draft, origin: draft.origin, deliveryPoints: draft.deliveryPoints,
					maxContainerSize: draft.maxContainerSize ?? 4, contractType: draft.contractType ?? 'delivery' })
				changeRun((previous) => ({ ...previous, currentContract: createInitialContractState() }))
				return id
			},
			resetCurrentContract: () => changeRun((previous) => ({ ...previous, currentContract: createInitialContractState(), deliveryDraft: createInitialDeliveryDraft() })),
			addDeliveryPoint: (point) => editDraft({ ...store.getSnapshot().run.currentContract, deliveryPoints: [...store.getSnapshot().run.currentContract.deliveryPoints ?? [], { ...point, id: point.id || createId() }] }),
			removeDeliveryPoint: (index) => editDraft({ ...store.getSnapshot().run.currentContract, deliveryPoints: store.getSnapshot().run.currentContract.deliveryPoints?.filter((_, pointIndex) => pointIndex !== index) ?? [] }),
			importContracts: replaceContracts,
			addOCRContracts: (contracts) => {
				const ids = new Set(store.getSnapshot().run.contracts.map((contract) => contract.id))
				replaceContracts([...store.getSnapshot().run.contracts, ...contracts.filter((contract) => !contract.id || !ids.has(contract.id))])
			},
		}
	}, [changeRun, store])
	const value = useMemo<RunContextValue>(() => ({ ...run, ...actions, saveStatus, storageError }), [run, actions, saveStatus, storageError])
	return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}

export function useRun(): RunContextValue {
	const context = useContext(RunContext)
	if (!context) throw new Error('Run hooks must be used within a RunProvider')
	return context
}

export function RunProviderBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
	const context = useContext(RunContext)
	return context ? children : <RunProvider>{children}</RunProvider>
}
