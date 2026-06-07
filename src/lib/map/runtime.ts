import type { Location } from '@/data/locations'
import { locations as fallbackLocations } from '@/data/locations'

let runtimeLocations: Location[] = fallbackLocations

export function setRuntimeLocations(locations: Location[]): void {
  runtimeLocations = locations
}

export function getRuntimeLocations(): Location[] {
  return runtimeLocations
}

export function getSelectableRuntimeLocations(): Location[] {
  return runtimeLocations.filter((location) => location.isSelectable !== false)
}

export function getKnownLocationNames(): string[] {
  return getSelectableRuntimeLocations()
    .map((location) => location.name)
    .sort((a, b) => b.length - a.length)
}
