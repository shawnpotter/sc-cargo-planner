import { describe, expect, it, vi } from 'vitest'
import { createRunStore } from './store'
import { encodeRunSnapshot, RUN_STORAGE_KEY } from './snapshot'
import { fixtureRun } from './runFixtures'

describe('run storage lifecycle', () => {
	it('does not access storage during construction and hydrates only once across resubscription', () => {
		const run = fixtureRun()
		const storage = { getItem: vi.fn(() => encodeRunSnapshot(run)), setItem: vi.fn(), removeItem: vi.fn() }
		const getStorage = vi.fn(() => storage)
		const store = createRunStore(getStorage)
		expect(getStorage).not.toHaveBeenCalled()
		expect(store.getServerSnapshot().saveStatus).toBe('loading')
		const unsubscribe = store.subscribe(vi.fn())
		expect(store.getSnapshot().run).toEqual(run)
		expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(RUN_STORAGE_KEY)
		expect(storage.setItem).not.toHaveBeenCalled()
		unsubscribe()
		store.subscribe(vi.fn())()
		expect(storage.getItem).toHaveBeenCalledTimes(1)
		expect(store.getServerSnapshot().saveStatus).toBe('loading')
	})
	it('starts an update from the hydrated run even before an initial subscription', () => {
		const run = fixtureRun()
		const storage = { getItem: vi.fn(() => encodeRunSnapshot(run)), setItem: vi.fn(), removeItem: vi.fn() }
		const store = createRunStore(() => storage)
		store.changeRun((previous) => ({ ...previous, manualPayout: 5000 }))
		expect(store.getSnapshot().run.stopStatuses).toEqual(run.stopStatuses)
		expect(store.getSnapshot().run.manualPayout).toBe(5000)
		expect(storage.setItem).toHaveBeenCalledTimes(1)
	})
})
