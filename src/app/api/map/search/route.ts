import { NextRequest, NextResponse } from 'next/server'
import { searchLocations } from '@/lib/map/serverClient'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  const system = request.nextUrl.searchParams.get('system') ?? undefined
  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 30

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter: q' },
      { status: 400 },
    )
  }

  try {
    const results = await searchLocations(query, system, Number.isNaN(limit) ? 30 : limit)
    return NextResponse.json({
      data: results,
      meta: {
        count: results.length,
        query,
        system: system ?? null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to search locations',
      },
      { status: 502 },
    )
  }
}
