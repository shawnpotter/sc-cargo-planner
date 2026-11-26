import type { MapApiEnvelope, MapApiLocation, MapSystemLocationsResponse } from '@/lib/map/types'

const REQUEST_TIMEOUT_MS = 8_000

function getApiConfig() {
  const baseUrl = process.env.SCMAP_BASE_URL
  const apiKey = process.env.SCMAP_API_KEY
  if (!baseUrl) throw new Error('Missing SCMAP_BASE_URL')
  if (!apiKey) throw new Error('Missing SCMAP_API_KEY')
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLocation(value: unknown): value is MapApiLocation {
  if (!isRecord(value)) return false
  const position = value.position
  const rotation = value.rotation
  const parentName = value.parent_entity_name
  const hierarchy = value.hierarchy
  const system = value.system
  if (!isRecord(position) || !isRecord(rotation) || !Array.isArray(hierarchy)) return false
  return typeof value.id === 'string' && typeof value.name === 'string' &&
    typeof value.kind === 'string' && typeof value.entity_name === 'string' &&
    (parentName === null || typeof parentName === 'string') &&
    hierarchy.every((entry: unknown) => typeof entry === 'string') &&
    (system === undefined || typeof system === 'string') &&
    (value.sub_kind === undefined || typeof value.sub_kind === 'string') &&
    (value.star_map_record === null || typeof value.star_map_record === 'string') &&
    typeof value.is_gps_relevant === 'boolean' &&
    ['x', 'y', 'z'].every((key) => typeof position[key] === 'number' && Number.isFinite(position[key])) &&
    ['x', 'y', 'z', 'w'].every((key) => typeof rotation[key] === 'number' && Number.isFinite(rotation[key]))
}

function isSystems(value: unknown): value is Array<{ id: string; label: string }> {
  if (!Array.isArray(value)) return false
  return value.every((entry: unknown) => isRecord(entry) && typeof entry.id === 'string' && typeof entry.label === 'string')
}

function isLocations(value: unknown): value is MapApiLocation[] {
  if (!Array.isArray(value)) return false
  return value.every(isLocation)
}

async function fetchEnvelope<T>(path: string, isData: (value: unknown) => value is T, requestSignal?: AbortSignal): Promise<MapApiEnvelope<T>> {
  const config = getApiConfig()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      headers: { 'X-API-Key': config.apiKey, 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: requestSignal ? AbortSignal.any([controller.signal, requestSignal]) : controller.signal,
    })
    if (!response.ok) {
      let errorMessage = `Map API request failed with status ${response.status}`
      try {
        const errorJson: unknown = await response.json()
        if (isRecord(errorJson) && typeof errorJson.error === 'string') errorMessage = errorJson.error
      } catch { /* Ignore non-JSON error body. */ }
      throw new Error(errorMessage)
    }
    const json: unknown = await response.json()
    if (!isRecord(json) || !('data' in json) || !isData(json.data)) throw new Error('Map API returned invalid data')
    return { data: json.data, meta: isRecord(json.meta) ? json.meta : undefined }
  } catch (error) {
    if (controller.signal.aborted || requestSignal?.aborted) throw new Error('Map API request timed out')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchSystems() {
  return fetchEnvelope('/systems', isSystems)
}

function isBodyNames(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string' && entry.length > 0)
}

export async function fetchSystemLocations(systemId: string): Promise<MapSystemLocationsResponse> {
  const path = `/systems/${encodeURIComponent(systemId)}`
  // Bound the entire enrichment, including the parallel body lookups, to one deadline.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const [locations, bodies] = await Promise.all([
      fetchEnvelope(`${path}/all-locations?project=false`, isLocations, controller.signal),
      fetchEnvelope(`${path}/bodies`, isBodyNames, controller.signal)
        .then((response): { data: string[]; warnings: string[] } => ({ data: response.data, warnings: [] }))
        .catch((error: unknown) => ({ data: [], warnings: [`${systemId} local body context unavailable: ${error instanceof Error ? error.message : 'request failed'}`] })),
    ])
    const bodyNames = [...new Set(bodies.data)]
    const results = await Promise.allSettled(bodyNames.map(async (bodyEntityName) => {
      const body = await fetchEnvelope(`${path}/bodies/${encodeURIComponent(bodyEntityName)}/locations?project=false`, isLocations, controller.signal)
      return { bodyEntityName, locations: body.data }
    }))
    const bodyLocations = []
    const contextWarnings = [...bodies.warnings]
    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') bodyLocations.push(result.value)
      else contextWarnings.push(`${systemId} local body context unavailable for ${bodyNames[index]}: ${result.reason instanceof Error ? result.reason.message : 'request failed'}`)
    }
    return { ...locations, bodyLocations, contextWarnings }
  } finally {
    controller.abort()
    clearTimeout(timeout)
  }
}

export async function searchLocations(query: string, system?: string, limit = 30): Promise<MapApiEnvelope<MapApiLocation[]>> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  if (system) params.set('system', system)
  return fetchEnvelope(`/search?${params.toString()}`, isLocations)
}
