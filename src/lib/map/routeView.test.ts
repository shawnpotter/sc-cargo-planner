import { describe, expect, it } from 'vitest'
import { buildMapVisits, layoutMapVisits } from './routeView'
import type { Location } from '@/data/locations'

const location = (name: string, system: string): Location => ({ name, system, type: 'ORBITAL_STATION', coordinates: { x: 1, y: 2, z: 3 } })

describe('route map coordinate boundary', () => {
  it('rejects ambiguous names shared by systems instead of plotting the last match', () => {
    const result = buildMapVisits([location('Station', 'stanton'), location('Station', 'pyro')], ['Station'], [])
    expect(result.visits).toEqual([])
    expect(result.missing).toEqual(['Station'])
  })

  it('keeps every repeated visit selectable at the same resolved position', () => {
    const result = buildMapVisits([location('Station', 'stanton')], ['Station', 'Station', 'Station'], [])
    const points = layoutMapVisits(result.visits)
    expect(new Set(points.map((point) => `${point.x},${point.y}`)).size).toBe(3)
    expect(new Set(points.map((point) => `${point.anchorX},${point.anchorY}`)).size).toBe(1)
  })
})
