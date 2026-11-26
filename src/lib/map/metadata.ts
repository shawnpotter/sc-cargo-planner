import type { MapDatasetMetadata } from './types'

/** An empty version is meaningful: SCMap has not identified the game release. */
export function readDatasetMetadata(meta?: Record<string, unknown>): MapDatasetMetadata {
  return {
    ...(typeof meta?.datasetId === 'string' ? { datasetId: meta.datasetId } : {}),
    ...(typeof meta?.datasetVersion === 'string' ? { datasetVersion: meta.datasetVersion } : {}),
  }
}
