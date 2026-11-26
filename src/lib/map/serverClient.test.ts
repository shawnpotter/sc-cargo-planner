import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSystemLocations } from './serverClient'

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('SCMap server client boundary', () => {
	it('requests raw resolved coordinates with server authentication and retains dataset metadata', async () => {
		vi.stubEnv('SCMAP_BASE_URL', 'https://map.invalid/api')
		vi.stubEnv('SCMAP_API_KEY', 'test-key')
		const envelope = { data: [], meta: { datasetId: 'scmap-star-citizen-locations', datasetVersion: '' } }
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => envelope })
		vi.stubGlobal('fetch', fetchMock)
		await expect(fetchSystemLocations('terra')).resolves.toEqual({ ...envelope, bodyLocations: [], contextWarnings: [] })
		expect(fetchMock).toHaveBeenCalledWith('https://map.invalid/api/systems/terra/all-locations?project=false', expect.objectContaining({
			headers: { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' },
		}))
	})

	it('loads authoritative body membership on the server without using body positions', async () => {
		vi.stubEnv('SCMAP_BASE_URL', 'https://map.invalid/api')
		vi.stubEnv('SCMAP_API_KEY', 'test-key')
		const fetchMock = vi.fn((url: string) => Promise.resolve({ ok: true, json: async () => ({ data: url.endsWith('/bodies') ? ['microtech'] : [] }) }))
		vi.stubGlobal('fetch', fetchMock)
		await expect(fetchSystemLocations('stanton')).resolves.toMatchObject({ bodyLocations: [{ bodyEntityName: 'microtech', locations: [] }] })
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			'https://map.invalid/api/systems/stanton/all-locations?project=false',
			'https://map.invalid/api/systems/stanton/bodies',
			'https://map.invalid/api/systems/stanton/bodies/microtech/locations?project=false',
		])
	})
	it('rejects malformed envelopes and location records with controlled errors', async () => {
		vi.stubEnv('SCMAP_BASE_URL', 'https://map.invalid')
		vi.stubEnv('SCMAP_API_KEY', 'test-key')
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ name: 'missing-fields' }] }) }))
		await expect(fetchSystemLocations('stanton')).rejects.toThrow('Map API returned invalid data')
	})

	it('keeps system data and successful body context when a listed body returns 404', async () => {
		vi.stubEnv('SCMAP_BASE_URL', 'https://map.invalid')
		vi.stubEnv('SCMAP_API_KEY', 'test-key')
		vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve({
			ok: !url.includes('/bodies/pyro5/'), status: url.includes('/bodies/pyro5/') ? 404 : 200,
			json: async () => url.includes('/bodies/pyro5/') ? { error: 'Not Found' } : { data: url.endsWith('/bodies') ? ['pyro1', 'pyro5'] : [] },
		})))
		await expect(fetchSystemLocations('pyro')).resolves.toMatchObject({
			data: [], bodyLocations: [{ bodyEntityName: 'pyro1', locations: [] }],
			contextWarnings: ['pyro local body context unavailable for pyro5: Not Found'],
		})
	})

	it('aborts a stalled upstream request at the bounded timeout', async () => {
		vi.useFakeTimers()
		vi.stubEnv('SCMAP_BASE_URL', 'https://map.invalid')
		vi.stubEnv('SCMAP_API_KEY', 'test-key')
		vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
			init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
		})))
		const pending = fetchSystemLocations('stanton')
		const assertion = expect(pending).rejects.toThrow('Map API request timed out')
		await vi.advanceTimersByTimeAsync(8_000)
		await assertion
	})

	it('shares the same deadline across system discovery and subsequent body requests', async () => {
		vi.useFakeTimers()
		vi.stubEnv('SCMAP_BASE_URL', 'https://map.invalid')
		vi.stubEnv('SCMAP_API_KEY', 'test-key')
		vi.stubGlobal('fetch', vi.fn((url: string, init: RequestInit) => new Promise((resolve, reject) => {
			if (!url.includes('/bodies/microtech/')) {
				setTimeout(() => resolve({ ok: true, json: async () => ({ data: url.endsWith('/bodies') ? ['microtech'] : [] }) }), 7_000)
			}
			init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
		})))
		const pending = fetchSystemLocations('stanton')
		await vi.advanceTimersByTimeAsync(8_000)
		await expect(pending).resolves.toMatchObject({ data: [], bodyLocations: [], contextWarnings: [expect.stringContaining('Map API request timed out')] })
	})
})
