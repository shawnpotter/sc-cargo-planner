import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getLocations } from '@/app/api/map/locations/route'
import { GET as getSystems } from '@/app/api/map/systems/route'
import { GET as search } from '@/app/api/map/search/route'
import { fetchSystemLocations, fetchSystems, searchLocations } from './serverClient'
import type { MapApiLocation } from './types'

vi.mock('./serverClient', () => ({ fetchSystemLocations: vi.fn(), fetchSystems: vi.fn(), searchLocations: vi.fn() }))
const metadata = { datasetId: 'scmap-star-citizen-locations', datasetVersion: '' }
const location: MapApiLocation = {
  id: 'station', name: 'Station', kind: 'station', entity_name: 'station', parent_entity_name: null,
  hierarchy: [], star_map_record: null, is_gps_relevant: true,
  position: { x: 100_000_000, y: -200_000_000, z: 300 }, rotation: { x: 0, y: 0, z: 0, w: 1 },
}
afterEach(() => vi.resetAllMocks())

describe('SCMap proxy provenance', () => {
  it('preserves dataset identity and unknown release in fresh and cached location responses', async () => {
    vi.mocked(fetchSystemLocations).mockResolvedValueOnce({ data: [location], meta: metadata, bodyLocations: [], contextWarnings: [] }).mockRejectedValueOnce(new Error('offline'))
    const request = new NextRequest('http://localhost/api/map/locations?system=provenance-test')
    const fresh = await (await getLocations(request)).json()
    expect(fresh.meta).toMatchObject({ ...metadata, cached: false, system: 'provenance-test' })
    expect(fresh.data[0].coordinates).toEqual(location.position)
    const cached = await (await getLocations(request)).json()
    expect(cached.meta).toEqual({ ...fresh.meta, cached: true })
    expect(cached.data).toEqual(fresh.data)
  })

  it('preserves metadata through system discovery and search', async () => {
    vi.mocked(fetchSystems).mockResolvedValueOnce({ data: [{ id: 'terra', label: 'Terra' }], meta: metadata })
    vi.mocked(searchLocations).mockResolvedValueOnce({ data: [location], meta: metadata })
    expect((await (await getSystems()).json()).meta).toMatchObject(metadata)
    expect((await (await search(new NextRequest('http://localhost/api/map/search?q=Station'))).json()).meta).toMatchObject(metadata)
  })

  it('keeps fresh system coordinates usable while explicitly reporting incomplete body context', async () => {
    const contextWarnings = ['nyx local body context unavailable for nyx_1: Not Found']
    vi.mocked(fetchSystemLocations).mockResolvedValueOnce({ data: [location], meta: metadata, bodyLocations: [], contextWarnings })
    const response = await getLocations(new NextRequest('http://localhost/api/map/locations?system=nyx'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta).toMatchObject({ cached: false, contextIncomplete: true, contextWarnings })
    expect(body.data[0].coordinates).toEqual(location.position)
  })
})
