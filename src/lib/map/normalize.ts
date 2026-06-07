import type { Location } from '@/data/locations'
import type { MapApiLocation } from '@/lib/map/types'

const SURFACE_KINDS = new Set([
  'surface_poi',
  'forward_operating_base',
  'derelict_settlement',
  'city',
  'underground_facility',
  'outpost',
  'asteroid_base',
])

const KIND_TO_LOCATION_TYPE: Record<Location['type'], string[]> = {
  PLANET: ['planet'],
  MOON: ['moon'],
  SURFACE_LOCATION: Array.from(SURFACE_KINDS),
  ORBITAL_STATION: ['station', 'comm_array'],
  LAGRANGE_POINT_STATION: ['lagrange_point'],
  STAR: ['star'],
  GATEWAY: ['jump_point'],
}

function mapKindToType(kind: string): Location['type'] {
  const normalizedKind = kind.toLowerCase()
  for (const [type, kinds] of Object.entries(KIND_TO_LOCATION_TYPE)) {
    if (kinds.includes(normalizedKind)) {
      return type as Location['type']
    }
  }

  return SURFACE_KINDS.has(normalizedKind)
    ? 'SURFACE_LOCATION'
    : 'ORBITAL_STATION'
}

const SELECTABLE_KINDS = new Set(['surface_poi', 'station', 'lagrange_point', 'city'])

export function normalizeMapLocations(
  apiLocations: MapApiLocation[],
  system?: string,
): Location[] {
  const byEntity = new Map<string, string>()

  for (const apiLocation of apiLocations) {
    if (apiLocation.entity_name) {
      byEntity.set(apiLocation.entity_name, apiLocation.name)
    }
  }

  return apiLocations.map((apiLocation) => {
    const mappedType = mapKindToType(apiLocation.kind)
    const parentObject = apiLocation.parent_entity_name
      ? byEntity.get(apiLocation.parent_entity_name)
      : undefined

    return {
      name: apiLocation.name,
      coordinates: {
        x: apiLocation.position.x,
        y: apiLocation.position.y,
        z: apiLocation.position.z,
      },
      type: mappedType,
      parentObject,
      requiresPlanetaryVisit: mappedType === 'SURFACE_LOCATION',
      isSelectable: SELECTABLE_KINDS.has(apiLocation.kind.toLowerCase()),
      system: (apiLocation.system ?? system ?? 'stanton').toLowerCase(),
    }
  })
}
