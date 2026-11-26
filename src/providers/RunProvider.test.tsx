import React, { StrictMode } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RunProvider, useRun } from './RunProvider'
import { CargoProvider, useCargo } from './CargoProvider'
import { ContractProvider, useContracts } from './ContractProvider'
import { decodeRunSnapshot, encodeRunSnapshot, LEGACY_SHIP_STORAGE_KEY, RUN_STORAGE_KEY } from '@/lib/run/snapshot'
import { fixtureContract, fixtureContainer, fixtureRoute, fixtureRun } from '@/lib/run/runFixtures'
import { ships } from '@/data/ships'
import { HaulingMode } from '@/utils/calculateContainers'

function wrapper({ children }: { children: React.ReactNode }) { return <StrictMode><RunProvider>{children}</RunProvider></StrictMode> }
beforeEach(() => { window.localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('RunProvider recovery', () => {
	it('hydrates inputs, draft, cargo maps, visit progress, crew and payout before writing', async () => {
		const run = fixtureRun()
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(run))
		const writes = vi.spyOn(Storage.prototype, 'setItem')
		const { result, unmount } = renderHook(useRun, { wrapper })
		await waitFor(() => expect(result.current.saveStatus).toBe('saved'))
		expect(result.current.stopStatuses).toEqual(run.stopStatuses)
		expect(result.current.crewMembers).toEqual(run.crewMembers)
		expect(result.current.manualPayout).toBe(run.manualPayout)
		expect(result.current.currentContract).toEqual(run.currentContract)
		expect(result.current.deliveryDraft).toEqual(run.deliveryDraft)
		expect(result.current.optimizedRoute?.stops[0].cargoStateAfter.byDestination.get('B')).toBe(2)
		for (const [key, value] of writes.mock.calls) {
			if (key !== RUN_STORAGE_KEY) continue
			const saved = decodeRunSnapshot(value)
			expect(saved.success && saved.run.stopStatuses).toEqual(run.stopStatuses)
		}
		unmount()
		const reopened = renderHook(useRun, { wrapper })
		expect(reopened.result.current.stopStatuses).toEqual(run.stopStatuses)
	})
	it.each(['{broken', '{"version":999}', '{"version":1,"run":{}}'])(
		'preserves malformed storage until explicit reset: %s', (stored) => {
			window.localStorage.setItem(RUN_STORAGE_KEY, stored)
			const { result } = renderHook(useRun, { wrapper })
			expect(result.current.saveStatus).toBe('error')
			act(() => result.current.setManualPayout(50))
			expect(window.localStorage.getItem(RUN_STORAGE_KEY)).toBe(stored)
			act(() => result.current.resetRun())
			expect(result.current.saveStatus).toBe('saved')
			expect(result.current.storageError).toBeNull()
			expect(result.current.manualPayout).toBe(0)
			expect(decodeRunSnapshot(window.localStorage.getItem(RUN_STORAGE_KEY) ?? '').success).toBe(true)
		},
	)
	it('shows read failure and blocks autosave until reset succeeds', () => {
		const reads = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
		const writes = vi.spyOn(Storage.prototype, 'setItem')
		const { result } = renderHook(useRun, { wrapper })
		expect(result.current.saveStatus).toBe('error')
		act(() => result.current.setManualPayout(120))
		expect(result.current.manualPayout).toBe(120)
		expect(writes).not.toHaveBeenCalled()
		reads.mockRestore()
		act(() => result.current.resetRun())
		expect(result.current.saveStatus).toBe('saved')
	})
	it('shows write failure, keeps work usable, and retries on the next edit', () => {
		const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
		const { result } = renderHook(useRun, { wrapper })
		expect(result.current.saveStatus).toBe('error')
		act(() => result.current.addContract(fixtureContract()))
		expect(result.current.contracts).toHaveLength(1)
		expect(result.current.storageError).toContain('could not be saved')
		writes.mockRestore()
		act(() => result.current.setManualPayout(140))
		expect(result.current.saveStatus).toBe('saved')
	})
	it('keeps reset errors visible and allows a later explicit reset', () => {
		window.localStorage.setItem(RUN_STORAGE_KEY, '{bad')
		const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Denied') })
		const { result } = renderHook(useRun, { wrapper })
		act(() => result.current.resetRun())
		expect(result.current.saveStatus).toBe('error')
		expect(window.localStorage.getItem(RUN_STORAGE_KEY)).toBe('{bad')
		remove.mockRestore()
		act(() => result.current.resetRun())
		expect(result.current.saveStatus).toBe('saved')
	})
	it('migrates a legacy ship only when no active snapshot exists, and clears it on reset', () => {
		window.localStorage.setItem(LEGACY_SHIP_STORAGE_KEY, JSON.stringify(ships[0].name))
		const { result } = renderHook(useRun, { wrapper })
		expect(result.current.selectedShip?.name).toBe(ships[0].name)
		expect(decodeRunSnapshot(window.localStorage.getItem(RUN_STORAGE_KEY) ?? '').success).toBe(true)
		act(() => result.current.resetRun())
		expect(window.localStorage.getItem(LEGACY_SHIP_STORAGE_KEY)).toBeNull()
	})
})

describe('coherent run edits and execution', () => {
	it('shares the same owner through legacy provider wrappers', () => {
		function legacy({ children }: { children: React.ReactNode }) { return <CargoProvider><ContractProvider>{children}</ContractProvider></CargoProvider> }
		const { result } = renderHook(() => ({ cargo: useCargo(), contracts: useContracts() }), { wrapper: legacy })
		act(() => result.current.contracts.addContract(fixtureContract()))
		expect(result.current.cargo.contracts).toEqual(result.current.contracts.contracts)
	})
	it('updates the same contract id from a draft without creating a duplicate', () => {
		const { result } = renderHook(useRun, { wrapper })
		act(() => {
			result.current.addContract(fixtureContract())
			result.current.setCurrentContract(fixtureContract())
			result.current.updateCurrentContract({ payout: 5000 })
			expect(result.current.saveCurrentContract()).toBe('contract-1')
		})
		expect(result.current.contracts).toHaveLength(1)
		expect(result.current.contracts[0]).toMatchObject({ id: 'contract-1', payout: 5000 })
		expect(result.current.contracts[0].deliveryPoints[0].id).toBe('delivery-1')
	})
	it('keeps prior plan and progress on meaningful edits, blocks execution until atomic commit', () => {
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(fixtureRun()))
		const { result } = renderHook(useRun, { wrapper })
		const oldRoute = result.current.optimizedRoute
		act(() => result.current.updateContract('contract-1', { origin: 'C' }))
		expect(result.current.planStatus).toBe('outdated')
		expect(result.current.optimizedRoute).toBe(oldRoute)
		expect(result.current.stopStatuses['1:A']).toBe('completed')
		act(() => result.current.cycleStopStatus('1:A'))
		expect(result.current.stopStatuses['1:A']).toBe('completed')
		const newRoute = fixtureRoute()
		act(() => result.current.commitPlan([fixtureContainer()], newRoute))
		expect(result.current.optimizedRoute).toBe(newRoute)
		expect(result.current.planStatus).toBe('ready')
		expect(result.current.stopStatuses).toEqual({})
	})
	it('preserves status for unchanged inputs and editor copies; visits to one location are independent', () => {
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(fixtureRun()))
		const { result } = renderHook(useRun, { wrapper })
		act(() => {
			result.current.setSelectedShip(ships[0])
			result.current.importContracts([fixtureContract()])
			result.current.setCurrentContract(fixtureContract())
		})
		expect(result.current.planStatus).toBe('ready')
		act(() => {
			result.current.setStopStatus('2:B', 'completed')
			result.current.cycleStopStatus('3:A')
		})
		expect(result.current.stopStatuses['3:A']).toBe('in-progress')
		expect(result.current.stopStatuses['1:A']).toBe('completed')
		act(() => result.current.setStopStatus('A', 'completed'))
		expect(result.current.stopStatuses.A).toBeUndefined()
	})
	it.each(['ship', 'mode', 'route type', 'start', 'end', 'draft', 'cargo'])(
		'marks the plan outdated for changes to %s', (input) => {
			window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(fixtureRun()))
			const { result } = renderHook(useRun, { wrapper })
			act(() => {
				switch (input) {
					case 'ship': result.current.setSelectedShip(ships[1]); break
					case 'mode': result.current.setHaulingMode(HaulingMode.COMMODITY); break
					case 'route type': result.current.setRouteType('loop'); break
					case 'start': result.current.setStartLocation('C'); break
					case 'end': result.current.setEndLocation('C'); break
					case 'draft': result.current.updateCurrentContract({ origin: 'C' }); break
					case 'cargo': result.current.addDeliveryPoint({ location: 'C', quantity: 2, cargo: [{ cargoType: 'Ore', quantity: 2 }] }); break
				}
			})
			expect(result.current.planStatus).toBe('outdated')
			expect(result.current.stopStatuses['1:A']).toBe('completed')
		},
	)
	it('persists crew and payout updates without invalidating a generated plan', () => {
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(fixtureRun()))
		const { result } = renderHook(useRun, { wrapper })
		act(() => {
			result.current.setCrewMembers((previous) => [...previous, { id: 'escort', name: 'Escort', share: 10 }])
			result.current.setManualPayout(3000)
		})
		expect(result.current.planStatus).toBe('ready')
		const restored = decodeRunSnapshot(window.localStorage.getItem(RUN_STORAGE_KEY) ?? '')
		expect(restored.success && restored.run.crewMembers).toHaveLength(3)
		expect(restored.success && restored.run.manualPayout).toBe(3000)
	})
	it('does not invalidate a restored plan when the form fills the empty new draft origin', () => {
		const run = fixtureRun()
		run.currentContract = { maxContainerSize: 4, origin: '', deliveryPoints: [], payout: 0, contractType: 'delivery' }
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(run))
		const { result } = renderHook(useRun, { wrapper })
		act(() => result.current.updateCurrentContract({ origin: 'A' }))
		expect(result.current.planStatus).toBe('ready')
		expect(result.current.stopStatuses).toEqual(run.stopStatuses)
		act(() => result.current.addDeliveryPoint({ location: 'C', quantity: 2, cargo: [{ cargoType: 'Ore', quantity: 2 }] }))
		expect(result.current.planStatus).toBe('outdated')
	})
	it('saves unfinished delivery inputs before AddDelivery, restores cargo IDs, and clears them on reset', () => {
		const { result, unmount } = renderHook(useRun, { wrapper })
		act(() => {
			result.current.setDeliveryDraft({ location: 'C', quantity: 5, cargo: [] })
			result.current.setDeliveryDraft((previous) => ({ ...previous, cargo: [{ id: 'draft-entry', cargoType: 'Medical Supplies', quantity: 5 }] }))
		})
		const expected = result.current.deliveryDraft
		unmount()
		const reopened = renderHook(useRun, { wrapper })
		expect(reopened.result.current.deliveryDraft).toEqual(expected)
		expect(reopened.result.current.currentContract.deliveryPoints).toEqual([])
		act(() => reopened.result.current.resetRun())
		expect(reopened.result.current.deliveryDraft).toEqual({ location: '', quantity: 0, cargo: [] })
	})
	it('requires prior visits complete and clears downstream progress when an earlier visit reopens', () => {
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(fixtureRun()))
		const { result } = renderHook(useRun, { wrapper })
		act(() => result.current.setStopStatus('3:A', 'completed'))
		expect(result.current.stopStatuses['3:A']).toBe('idle')
		act(() => {
			result.current.setStopStatus('2:B', 'completed')
			result.current.setStopStatus('3:A', 'completed')
		})
		expect(result.current.stopStatuses['3:A']).toBe('completed')
		act(() => result.current.cycleStopStatus('1:A'))
		expect(result.current.stopStatuses).toEqual({ '1:A': 'idle' })
		act(() => result.current.cycleStopStatus('2:B'))
		expect(result.current.stopStatuses).toEqual({ '1:A': 'idle' })
	})
	it('compares delivery values independently of field order and generated delivery IDs', () => {
		window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot(fixtureRun()))
		const { result } = renderHook(useRun, { wrapper })
		const contract = fixtureContract()
		contract.deliveryPoints = contract.deliveryPoints.map((point) => ({ cargo: point.cargo.map((entry) => ({ quantity: entry.quantity, cargoType: entry.cargoType })),
			quantity: point.quantity, location: point.location, id: 'replacement-metadata' }))
		act(() => result.current.importContracts([contract]))
		expect(result.current.planStatus).toBe('ready')
		expect(result.current.contracts[0].deliveryPoints[0].id).toBe('delivery-1')
	})
})
