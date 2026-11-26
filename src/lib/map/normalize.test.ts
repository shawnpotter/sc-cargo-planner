import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeMapLocations } from './normalize'
import { getParentBody } from './routeView'
import type { MapApiLocation } from './types'

const location = (overrides: Partial<MapApiLocation>): MapApiLocation => ({
  id: 'harbor', name: 'Harbor', kind: 'station', entity_name: 'objectcontainer_reststop',
  parent_entity_name: null, hierarchy: ['hurston'], star_map_record: null,
  is_gps_relevant: true, position: { x: -50_774_200_000, y: -90_346_400_000, z: 496_489.1 },
  rotation: { x: 0, y: 0, z: 0, w: 1 }, ...overrides,
})
const planet = location({ id: 'hurston', name: 'Hurston', kind: 'planet', entity_name: 'hurston', hierarchy: [] })

afterEach(() => vi.unstubAllEnvs())

describe('SCMap location normalization', () => {
  it('preserves fully resolved raw meter coordinates and resolves a body from hierarchy', () => {
    const raw = location({})
    const { locations: normalized } = normalizeMapLocations([planet, raw], 'stanton')
    expect(normalized[1].coordinates).toEqual(raw.position)
    expect(normalized[1].parentObject).toBe('Hurston')
    expect(getParentBody(normalized[1], normalized)).toBe('Hurston')
  })

  it('uses authoritative IDs when generic entity names are reused by stations', () => {
    const raw = location({ id: 'surface', name: 'Surface', kind: 'surface_poi', parent_entity_name: 'objectcontainer_reststop' })
    const { locations: normalized } = normalizeMapLocations([planet, location({}), location({ id: 'other', name: 'Other station' }), raw], 'stanton')
    expect(normalized[3].parentObject).toBe('Hurston')
  })

  it('chooses the moon ancestor when both planet and moon are in the hierarchy', () => {
    const moon = location({ id: 'arial', name: 'Arial', kind: 'moon', entity_name: 'arial', hierarchy: ['hurston'] })
    const { locations: normalized } = normalizeMapLocations([planet, moon, location({ hierarchy: ['hurston', 'arial'] })], 'stanton')
    expect(normalized[2].parentObject).toBe('Arial')
    expect(getParentBody(normalized[2], normalized)).toBe('Arial')
  })

  it('does not turn an unresolved container name into a local body', () => {
    const { locations: [normalized] } = normalizeMapLocations([location({ hierarchy: [], parent_entity_name: 'missing-container' })], 'stanton')
    expect(normalized.parentObject).toBeUndefined()
    expect(getParentBody({ ...normalized, parentObject: 'missing-container' }, [normalized])).toBeNull()
  })

  it('enriches self-only hierarchy from body membership while preserving resolved system positions', () => {
    const microTech = location({ id: 'stanton4microtech', name: 'microTech', kind: 'planet', entity_name: 'stanton_4_microtech', hierarchy: ['stanton', 'stanton_4_microtech'] })
    const port = location({ id: 'objectcontainer_reststop', name: 'Port Tressler', hierarchy: ['objectcontainer_reststop'], position: { x: 22462646723.530945, y: 37186290817.84713, z: 808831.762531 } })
    const city = location({ id: 'newbabbage_loc', name: 'New Babbage', kind: 'city', entity_name: 'newbabbage_loc', hierarchy: ['newbabbage_loc'] })
    const otherPort = location({ id: 'objectcontainer_reststop', name: 'Everus Harbor', hierarchy: ['objectcontainer_reststop'] })
    const { locations: normalized } = normalizeMapLocations([microTech, port, city, otherPort], 'stanton', [{
      bodyEntityName: 'stanton_4_microtech', locations: [
        { ...port, position: { x: 561471.046151, y: 545853.017029, z: 808831.762531 } },
        { ...city, position: { x: 520722.992113, y: 419364.313162, z: 743654.685314 } },
      ],
    }])
    expect(normalized[1].parentObject).toBe('microTech')
    expect(normalized[2].parentObject).toBe('microTech')
    expect(normalized[1].coordinates).toEqual(port.position)
    expect(normalized[2].coordinates).toEqual(city.position)
    expect(normalized[3].parentObject).toBeUndefined()
  })

  it('never arbitrarily resolves repeated generic ids or ambiguous body membership', () => {
    const port = location({ id: 'objectcontainer_reststop', hierarchy: ['objectcontainer_reststop'] })
    const other = { ...port, name: 'Other port' }
    const { locations: normalized } = normalizeMapLocations([planet, port, other], 'stanton')
    expect(normalized[1].parentObject).toBeUndefined()
    expect(normalized[2].parentObject).toBeUndefined()
    const ambiguous = normalizeMapLocations([planet, port, { ...port, position: { x: 1, y: 2, z: 3 } }], 'stanton', [{ bodyEntityName: 'hurston', locations: [port] }])
    expect(ambiguous.locations).toHaveLength(3)
    expect(ambiguous.locations[1].parentObject).toBeUndefined()
    expect(ambiguous.contextWarnings).toEqual([expect.stringContaining('without a unique system match')])
  })

  it('includes supported surface destinations and respects excluded kinds', () => {
    const outpost = location({ kind: 'outpost' })
    expect(normalizeMapLocations([outpost]).locations[0]).toMatchObject({ type: 'SURFACE_LOCATION', isSelectable: true })
    vi.stubEnv('SCMAP_EXCLUDED_KINDS', 'outpost')
    expect(normalizeMapLocations([outpost]).locations).toEqual([])
  })

  it('retains system locations and warns when a listed body name cannot identify its planet', () => {
    const raw = location({ hierarchy: ['harbor'] })
    const result = normalizeMapLocations([planet, raw], 'pyro', [{ bodyEntityName: 'pyro_1', locations: [raw] }])
    expect(result.locations).toHaveLength(2)
    expect(result.locations[1].coordinates).toEqual(raw.position)
    expect(result.locations[1].parentObject).toBeUndefined()
    expect(result.contextWarnings).toEqual(['SCMap body pyro_1 has no unique planet or moon; local context omitted.'])
  })

  it('keeps conflicting body membership unresolved even if a third body repeats it', () => {
    const raw = location({ hierarchy: ['harbor'] })
    const second = { ...planet, id: 'second', entity_name: 'second', name: 'Second' }
    const third = { ...planet, id: 'third', entity_name: 'third', name: 'Third' }
    const result = normalizeMapLocations([planet, second, third, raw], 'stanton', [planet, second, third].map((body) => ({
      bodyEntityName: body.entity_name, locations: [raw],
    })))
    expect(result.locations[3].parentObject).toBeUndefined()
    expect(result.contextWarnings).toEqual(['Conflicting SCMap body context for Harbor; local context omitted.'])
  })
})
