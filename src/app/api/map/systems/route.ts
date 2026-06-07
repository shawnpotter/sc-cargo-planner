import { NextResponse } from 'next/server'
import { fetchSystems } from '@/lib/map/serverClient'

export async function GET() {
  try {
    const systems = await fetchSystems()
    return NextResponse.json({
      data: systems,
      meta: { count: systems.length },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to fetch systems',
      },
      { status: 502 },
    )
  }
}
