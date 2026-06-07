import { NextRequest, NextResponse } from 'next/server'
import { fetchSystemLocations } from '@/lib/map/serverClient'
import { normalizeMapLocations } from '@/lib/map/normalize'
import type { NormalizedMapResponse } from '@/lib/map/types'
import { locations as staticFallbackLocations, type Location } from '@/data/locations'

const lastSuccessfulBySystem = new Map<string, NormalizedMapResponse>()

function getStaticFallbackLocations(system: string): Location[] {
  const normalizedSystem = system.toLowerCase()

  return staticFallbackLocations
    .filter((location) => {
      // Most bundled locations are Stanton and do not have an explicit system field.
      const locationSystem = (location.system ?? 'stanton').toLowerCase()
      return locationSystem === normalizedSystem
    })
    .map((location) => ({
      ...location,
      system: (location.system ?? 'stanton').toLowerCase(),
    }))
}

function getSystemFromRequest(request: NextRequest): string {
  const system = request.nextUrl.searchParams.get('system')
  if (system) {
    return system
  }
  return process.env.SCMAP_DEFAULT_SYSTEM || 'stanton'
}

export async function GET(request: NextRequest) {
  const system = getSystemFromRequest(request)
  try {
    const apiLocations = await fetchSystemLocations(system)
    const normalizedLocations = normalizeMapLocations(apiLocations, system)

    const freshResponse: NormalizedMapResponse = {
      locations: normalizedLocations,
      system,
      count: normalizedLocations.length,
      cached: false,
      fetchedAt: new Date().toISOString(),
    }

    lastSuccessfulBySystem.set(system, freshResponse)

    return NextResponse.json({
      data: normalizedLocations,
      meta: {
        count: normalizedLocations.length,
        system,
        cached: false,
        fetchedAt: freshResponse.fetchedAt,
      },
    })
  } catch (error) {
    const cachedResponse = lastSuccessfulBySystem.get(system)
    if (cachedResponse) {
      return NextResponse.json({
        data: cachedResponse.locations,
        meta: {
          count: cachedResponse.count,
          system,
          cached: true,
          fetchedAt: cachedResponse.fetchedAt,
        },
      })
    }

    const staticFallback = getStaticFallbackLocations(system)
    if (staticFallback.length > 0) {
      const fetchedAt = new Date().toISOString()
      return NextResponse.json({
        data: staticFallback,
        meta: {
          count: staticFallback.length,
          system,
          cached: true,
          fetchedAt,
          source: 'static-fallback',
        },
      })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to fetch map locations',
      },
      { status: 502 },
    )
  }
}
