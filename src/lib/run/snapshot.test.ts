import { describe, expect, it } from 'vitest'
import { createInitialRun, type RunState } from './state'
import { decodeRunSnapshot, encodeRunSnapshot } from './snapshot'
import { fixtureRun } from './runFixtures'
import { buildCargoPlan } from '@/utils/handleLoadCargo'
import { ships } from '@/data/ships'
import type { Contract } from '@/constants/types'

describe('active run snapshot', () => {
	it('round trips all run fields and every destination-total Map', () => {
		const original = fixtureRun()
		const result = decodeRunSnapshot(encodeRunSnapshot(original))
		expect(result.success).toBe(true)
		if (!result.success) throw new Error(result.error)
		expect(result.run).toEqual(original)
		for (const [index, stop] of result.run.optimizedRoute?.stops.entries() ?? []) {
			expect(stop.cargoStateBefore.byDestination).toBeInstanceOf(Map)
			expect(stop.cargoStateAfter.byDestination).toBeInstanceOf(Map)
			expect([...stop.cargoStateBefore.byDestination]).toEqual([...original.optimizedRoute!.stops[index].cargoStateBefore.byDestination])
			expect([...stop.cargoStateAfter.byDestination]).toEqual([...original.optimizedRoute!.stops[index].cargoStateAfter.byDestination])
		}
	})
	it('round trips an empty run', () => {
		expect(decodeRunSnapshot(encodeRunSnapshot(createInitialRun()))).toEqual({ success: true, run: createInitialRun() })
	})
	it('restores a real generated plan with multiple destination totals and cargo identities', () => {
		const contracts: Contract[] = [{ id: 'live-contract', origin: 'Port Tressler', maxContainerSize: 4, contractType: 'delivery', deliveryPoints: [
			{ id: 'destination-1', location: 'New Babbage Interstellar Spaceport', quantity: 2, cargo: [{ cargoType: 'Ore', quantity: 2 }] },
			{ id: 'destination-2', location: 'Riker Memorial Spaceport', quantity: 1, cargo: [{ cargoType: 'Medical Supplies', quantity: 1 }] },
		] }]
		const plan = buildCargoPlan({ contracts, selectedShip: ships[0] })
		if (!plan.success) throw new Error(plan.error)
		const run: RunState = { ...createInitialRun(), contracts, selectedShip: ships[0], containers: plan.containers, optimizedRoute: plan.optimizedRoute, planStatus: 'ready' }
		const result = decodeRunSnapshot(encodeRunSnapshot(run))
		if (!result.success) throw new Error(result.error)
		expect(result.run).toEqual(run)
		expect(result.run.optimizedRoute?.stops[0].cargoStateAfter.byDestination.size).toBe(2)
		expect(result.run.containers.every((container) => container.id && container.pickupStopId && container.deliveryStopId)).toBe(true)
	})
	it('preserves incomplete numeric entry for correction while rejecting nonfinite serialization', () => {
		const run = createInitialRun()
		run.currentContract = { origin: '', maxContainerSize: -1, payout: -10 }
		run.deliveryDraft = { location: '', quantity: -2, cargo: [{ id: 'unfinished', cargoType: '', quantity: -2 }] }
		expect(decodeRunSnapshot(encodeRunSnapshot(run))).toEqual({ success: true, run })
		run.deliveryDraft.quantity = Number.NaN
		expect(() => encodeRunSnapshot(run)).toThrow('non-finite')
	})
	it('preserves an outdated prior plan after its input contracts or ship are removed', () => {
		const run = fixtureRun()
		run.planStatus = 'outdated'
		run.contracts = []
		run.selectedShip = null
		expect(decodeRunSnapshot(encodeRunSnapshot(run))).toEqual({ success: true, run })
	})
	it.each(['{', 'null', '[]', '{"version":999,"run":{}}', '{"version":1,"run":{}}'])(
		'rejects unreadable or unsupported data: %s', (raw) => expect(decodeRunSnapshot(raw).success).toBe(false),
	)
	it('rejects a lost Map, invalid visit progress, duplicate visits, and invalid nested cargo', () => {
		const raw = encodeRunSnapshot(fixtureRun())
		const invalidProgress = fixtureRun()
		invalidProgress.stopStatuses['missing-visit'] = 'completed'
		const duplicateVisit = fixtureRun()
		if (!duplicateVisit.optimizedRoute) throw new Error('Expected fixture route')
		duplicateVisit.optimizedRoute.stops[2] = duplicateVisit.optimizedRoute.stops[0]
		for (const corrupted of [
			raw.replace('"byDestination":[]', '"byDestination":{}'),
			raw.replace('"x":1', '"x":"bad"'),
			encodeRunSnapshot(invalidProgress), encodeRunSnapshot(duplicateVisit),
		]) expect(decodeRunSnapshot(corrupted).success).toBe(false)
	})
})
