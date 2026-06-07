import type { Location } from '@/data/locations'

export interface MapApiEnvelope<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface MapApiLocation {
  id: string
  name: string
  kind: string
  sub_kind?: string
  entity_name: string
  parent_entity_name: string | null
  hierarchy: string[]
  star_map_record: string | null
  is_gps_relevant: boolean
  position: {
    x: number
    y: number
    z: number
  }
  rotation: {
    x: number
    y: number
    z: number
    w: number
  }
  system?: string
}

export interface NormalizedMapResponse {
  locations: Location[]
  system: string
  count: number
  cached: boolean
  fetchedAt: string
}
