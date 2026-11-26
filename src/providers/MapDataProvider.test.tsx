import React from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapDataProvider, useMapData } from './MapDataProvider'
import { locations as staticLocations } from '@/data/locations'

const wrapper = ({ children }: { children: React.ReactNode }) => <MapDataProvider>{children}</MapDataProvider>
const good = (name: string) => ({
	data: [{ name, coordinates: { x: 1, y: 2, z: 3 }, type: 'ORBITAL_STATION' }],
	meta: { system: name.toLowerCase(), cached: false },
})
const response = (body: unknown, ok = true) => ({ ok, json: async () => body })
const systems = (ids = ['stanton', 'nyx', 'pyro']) => response({ data: ids.map((id) => ({ id, label: id })) })

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('MapDataProvider resilience', () => {
	it('keeps bundled locations and marks the view cached when every system fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
		const { result } = renderHook(useMapData, { wrapper })
		await waitFor(() => expect(result.current.loading).toBe(false))
		expect(result.current.locations).toBe(staticLocations)
		expect(result.current.cached).toBe(true)
		expect(result.current.error).toMatch(/offline/i)
	})

	it('shows partial loading as degraded and cached', async () => {
		vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
			const url = String(input)
			if (url === '/api/map/systems') return Promise.resolve(systems())
			return url.includes('stanton')
				? Promise.resolve(response(good('stanton')))
				: Promise.reject(new Error('offline'))
		}))
		const { result } = renderHook(useMapData, { wrapper })
		await waitFor(() => expect(result.current.loading).toBe(false))
		expect(result.current.locations).toHaveLength(1)
		expect(result.current.cached).toBe(true)
		expect(result.current.error).toContain('nyx, pyro')
	})

	it('retains warm data and reports failure after a malformed retry response', async () => {
		let malformed = false
		const fetchMock = vi.fn((input: RequestInfo | URL) => {
			const url = String(input)
			if (url === '/api/map/systems') return Promise.resolve(systems())
			return Promise.resolve(response(malformed ? { data: [{ name: 'broken' }] } : good(url)))
		})
		vi.stubGlobal('fetch', fetchMock)
		const { result } = renderHook(useMapData, { wrapper })
		await waitFor(() => expect(result.current.loading).toBe(false))
		const lastGood = result.current.locations
		expect(lastGood).toHaveLength(3)
		malformed = true
		await act(async () => { await result.current.refresh() })
		expect(result.current.locations).toBe(lastGood)
		expect(result.current.cached).toBe(true)
		expect(result.current.error).toMatch(/any system/i)
	})

	it('loads only API-discovered systems including systems outside the bundled catalog', async () => {
		const fetchMock = vi.fn((input: RequestInfo | URL) => {
			const url = String(input)
			return Promise.resolve(url === '/api/map/systems' ? systems(['terra']) : response(good('terra')))
		})
		vi.stubGlobal('fetch', fetchMock)
		const { result } = renderHook(useMapData, { wrapper })
		await waitFor(() => expect(result.current.loading).toBe(false))
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/map/systems', '/api/map/locations?system=terra'])
		expect(result.current.availableSystems).toEqual(['terra'])
		expect(result.current.system).toBe('terra')
		expect(result.current.cached).toBe(false)
	})

	it('rejects unknown normalized location types and keeps the bundled map', async () => {
		vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve(
			String(input) === '/api/map/systems' ? systems(['terra']) : response({ data: [{ ...good('terra').data[0], type: 'invalid' }] }),
		)))
		const { result } = renderHook(useMapData, { wrapper })
		await waitFor(() => expect(result.current.loading).toBe(false))
		expect(result.current.locations).toBe(staticLocations)
		expect(result.current.error).toMatch(/any system/i)
	})

	it('keeps fresh system coordinates and shows a retry message when local context is incomplete', async () => {
		vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve(String(input) === '/api/map/systems'
			? systems(['nyx']) : response({ ...good('nyx'), meta: { cached: false, contextIncomplete: true, contextWarnings: ['nyx local body context unavailable: Not Found'] } }),
		)))
		const { result } = renderHook(useMapData, { wrapper })
		await waitFor(() => expect(result.current.loading).toBe(false))
		expect(result.current.locations[0].name).toBe('nyx')
		expect(result.current.cached).toBe(false)
		expect(result.current.error).toBe('Local map detail is unavailable for parts of Nyx. Route coordinates are available.')
	})
})
