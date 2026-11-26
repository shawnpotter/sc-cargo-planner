import { ships } from '@/data/ships'
import { createInitialRun, type RunState } from './state'
import { decodeRunSnapshot, encodeRunSnapshot, LEGACY_SHIP_STORAGE_KEY, RUN_STORAGE_KEY } from './snapshot'

export type SaveStatus = 'loading' | 'saved' | 'error'
export interface RunStoreSnapshot {
	run: RunState
	saveStatus: SaveStatus
	storageError: string | null
}
type RunStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Storage starts when React subscribes, never during rendering or server hydration. */
export function createRunStore(getStorage: () => RunStorage = () => window.localStorage) {
	const serverSnapshot: RunStoreSnapshot = { run: createInitialRun(), saveStatus: 'loading', storageError: null }
	let snapshot = serverSnapshot
	let hydrated = false
	let blocked = false
	const listeners = new Set<() => void>()

	function publish(next: RunStoreSnapshot) {
		snapshot = next
		for (const listener of listeners) listener()
	}
	function fail(run: RunState, storageError: string) {
		publish({ run, saveStatus: 'error', storageError })
	}
	function persist(run: RunState) {
		try {
			getStorage().setItem(RUN_STORAGE_KEY, encodeRunSnapshot(run))
			publish({ run, saveStatus: 'saved', storageError: null })
		} catch {
			fail(run, 'Changes could not be saved in this browser. Keep this tab open and free browser storage to save your run.')
		}
	}
	function hydrate() {
		if (hydrated) return
		hydrated = true
		try {
			const storage = getStorage()
			const stored = storage.getItem(RUN_STORAGE_KEY)
			if (stored !== null) {
				const result = decodeRunSnapshot(stored)
				if (!result.success) {
					blocked = true
					fail(snapshot.run, result.error)
					return
				}
				publish({ run: result.run, saveStatus: 'saved', storageError: null })
				return
			}
			let run = snapshot.run
			const legacy = storage.getItem(LEGACY_SHIP_STORAGE_KEY)
			if (legacy !== null) {
				const name: unknown = JSON.parse(legacy)
				const selectedShip = ships.find((ship) => ship.name === name)
				if (!selectedShip) throw new Error('Invalid saved ship')
				run = { ...run, selectedShip }
			}
			persist(run)
		} catch {
			blocked = true
			fail(snapshot.run, 'The saved run could not be read. Browser storage may be unavailable. Reset the saved run to start again.')
		}
	}
	return {
		getSnapshot: () => snapshot,
		getServerSnapshot: () => serverSnapshot,
		subscribe(listener: () => void) {
			listeners.add(listener)
			hydrate()
			return () => { listeners.delete(listener) }
		},
		changeRun(update: (previous: RunState) => RunState) {
			hydrate()
			const run = update(snapshot.run)
			if (run === snapshot.run) return
			if (blocked) publish({ ...snapshot, run })
			else persist(run)
		},
		resetRun() {
			hydrated = true
			const run = createInitialRun()
			try {
				const storage = getStorage()
				storage.removeItem(RUN_STORAGE_KEY)
				storage.removeItem(LEGACY_SHIP_STORAGE_KEY)
				blocked = false
				persist(run)
			} catch {
				blocked = true
				fail(run, 'The saved run could not be reset because browser storage is unavailable. Your changes remain in this tab.')
			}
		},
	}
}
