import { NextResponse } from 'next/server'
import { fetchSystems } from '@/lib/map/serverClient'
import { readDatasetMetadata } from '@/lib/map/metadata'

export async function GET() {
  try {
    const { data: systems, meta } = await fetchSystems()
    return NextResponse.json({
      data: systems,
      meta: { ...readDatasetMetadata(meta), count: systems.length },
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
