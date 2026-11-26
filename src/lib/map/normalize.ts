import type { Location } from '@/data/locations'
import type { MapApiLocation, MapBodyLocations } from '@/lib/map/types'

const SURFACE_KINDS = new Set([
  'surface_poi',
  'forward_operating_base',
  'derelict_settlement',
  'city',
  'underground_facility',
  'outpost',
  'asteroid_base',
])

function mapKindToType(kind: string): Location['type'] {
  const normalizedKind = kind.toLowerCase()
  switch (normalizedKind) {
    case 'planet': return 'PLANET'
    case 'moon': return 'MOON'
    case 'lagrange_point': return 'LAGRANGE_POINT_STATION'
    case 'star': return 'STAR'
    case 'jump_point': return 'GATEWAY'
    default: return SURFACE_KINDS.has(normalizedKind) ? 'SURFACE_LOCATION' : 'ORBITAL_STATION'
  }
}

const SELECTABLE_KINDS = new Set([...SURFACE_KINDS, 'station', 'lagrange_point'])

function uniqueIndex(locations: MapApiLocation[], key: (location: MapApiLocation) => string) {
  const index = new Map<string, MapApiLocation | null>()
  for (const location of locations) {
    const identifier = key(location)
    if (identifier) index.set(identifier, index.has(identifier) ? null : location)
  }
  return index
}

function locationIdentity(location: MapApiLocation): string {
  // Live body endpoints return body-local positions despite documenting resolved positions.
  // Match unique non-coordinate identity only; always render all-locations positions unchanged.
  return JSON.stringify([
    location.id, location.name, location.kind, location.entity_name, location.sub_kind ?? null,
    location.star_map_record, location.is_gps_relevant,
    location.rotation.x, location.rotation.y, location.rotation.z, location.rotation.w,
  ])
}

export function normalizeMapLocations(
  apiLocations: MapApiLocation[],
  system?: string,
  bodyLocations: MapBodyLocations[] = [],
): { locations: Location[]; contextWarnings: string[] } {
  const excludedKinds = new Set(
    (process.env.SCMAP_EXCLUDED_KINDS ?? '')
      .split(',')
      .map((kind) => kind.trim().toLowerCase())
      .filter((kind) => /^[a-z][a-z0-9_]*$/.test(kind)),
  )
  // Both ids and entity names may be generic and shared by unrelated locations.
  const byId = uniqueIndex(apiLocations, (location) => location.id)
  const byEntity = uniqueIndex(apiLocations, (location) => location.entity_name)
  const resolveAncestor = (id: string) => byId.has(id) ? byId.get(id) : byEntity.get(id)
  const byIdentity = uniqueIndex(apiLocations, locationIdentity)
  const contextualBodies = new Map<MapApiLocation, MapApiLocation>()
  const conflictingContext = new Set<MapApiLocation>()
  const contextWarnings: string[] = []
  for (const body of bodyLocations) {
    const parent = resolveAncestor(body.bodyEntityName)
    if (!parent || !['planet', 'moon'].includes(parent.kind.toLowerCase())) {
      contextWarnings.push(`SCMap body ${body.bodyEntityName} has no unique planet or moon; local context omitted.`)
      continue
    }
    let unmatched = 0
    for (const bodyLocation of body.locations) {
      const matched = byIdentity.get(locationIdentity(bodyLocation))
      if (!matched) { unmatched++; continue }
      if (conflictingContext.has(matched)) continue
      const previous = contextualBodies.get(matched)
      if (previous && previous !== parent) {
        contextWarnings.push(`Conflicting SCMap body context for ${bodyLocation.name}; local context omitted.`)
        contextualBodies.delete(matched)
        conflictingContext.add(matched)
        continue
      }
      if (matched !== parent) contextualBodies.set(matched, parent)
    }
    if (unmatched) contextWarnings.push(`SCMap body ${body.bodyEntityName} has ${unmatched} locations without a unique system match; local context omitted.`)
  }

  const locations: Location[] = apiLocations.filter((location) => !excludedKinds.has(location.kind.toLowerCase())).map((apiLocation) => {
    const mappedType = mapKindToType(apiLocation.kind)
    const directParent = apiLocation.parent_entity_name ? resolveAncestor(apiLocation.parent_entity_name) : undefined
    const ancestors = apiLocation.hierarchy.flatMap((id) => {
      const ancestor = resolveAncestor(id)
      return ancestor && ancestor.id !== apiLocation.id ? [ancestor] : []
    })
    // A moon is more specific than a planet regardless of ancestor-chain order.
    const hierarchyParent = ancestors.find((ancestor) => ancestor.kind.toLowerCase() === 'moon')
      ?? ancestors.find((ancestor) => ancestor.kind.toLowerCase() === 'planet')
      ?? (ancestors.length === 1 ? ancestors[0] : undefined)
    const parentObject = (directParent !== apiLocation ? directParent : undefined)?.name
      ?? contextualBodies.get(apiLocation)?.name ?? hierarchyParent?.name

    return {
      name: apiLocation.name,
      coordinates: {
        // SCMap has already resolved parent offsets in meters. Never add them again.
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
  return { locations, contextWarnings }
}
