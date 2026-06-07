import type { MapApiEnvelope, MapApiLocation } from '@/lib/map/types'

function getApiConfig() {
  const baseUrl = process.env.SCMAP_BASE_URL
  const apiKey = process.env.SCMAP_API_KEY

  if (!baseUrl) {
    throw new Error('Missing SCMAP_BASE_URL')
  }
  if (!apiKey) {
    throw new Error('Missing SCMAP_API_KEY')
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
  }
}

async function fetchEnvelope<T>(path: string): Promise<MapApiEnvelope<T>> {
  const config = getApiConfig()
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let errorMessage = `Map API request failed with status ${response.status}`
    try {
      const errorJson = (await response.json()) as { error?: string }
      if (errorJson.error) {
        errorMessage = errorJson.error
      }
    } catch {
      // Ignore non-JSON error body.
    }
    throw new Error(errorMessage)
  }

  return (await response.json()) as MapApiEnvelope<T>
}

export async function fetchSystems() {
  const result = await fetchEnvelope<Array<{ id: string; label: string }>>('/systems')
  return result.data
}

export async function fetchSystemLocations(systemId: string): Promise<MapApiLocation[]> {
  const result = await fetchEnvelope<MapApiLocation[]>(`/systems/${systemId}/all-locations`)
  return result.data
}

export async function searchLocations(query: string, system?: string, limit = 30): Promise<MapApiLocation[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  if (system) {
    params.set('system', system)
  }
  const result = await fetchEnvelope<MapApiLocation[]>(`/search?${params.toString()}`)
  return result.data
}
