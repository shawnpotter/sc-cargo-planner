// @/components/cargo/LocationSelect.tsx
import * as React from 'react'
import { useMemo, useState } from 'react'
import type { Location } from '@/data/locations'
import { useMapData } from '@/providers/MapDataProvider'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

type PlanetGroup = {
	label: string
	direct: Location[]
	moons: Array<{ moon?: Location; children: Location[] }>
}

function buildLookup(allLocations: Location[]): Map<string, Location> {
	const lookup = new Map<string, Location>()
	for (const loc of allLocations) lookup.set(loc.name, loc)
	return lookup
}

function findTopParent(loc: Location, lookup: Map<string, Location>): Location {
	let current = loc
	while (current.parentObject) {
		const parent = lookup.get(current.parentObject)
		if (!parent) break
		if (parent.type === 'PLANET' || parent.type === 'STAR') return parent
		current = parent
	}
	if (loc.parentObject) return lookup.get(loc.parentObject) ?? loc
	return loc
}

function placeInGroup(
	l: Location,
	planetMap: Map<string, PlanetGroup>,
	lookup: Map<string, Location>,
): void {
	const top = findTopParent(l, lookup)
	const topName = top.name || l.parentObject || l.type || 'Other'

	if (!planetMap.has(topName))
		planetMap.set(topName, { label: topName, direct: [], moons: [] })

	const group = planetMap.get(topName)!

	if (l.type === 'MOON') {
		group.moons.push({ moon: l, children: [] })
		return
	}

	if (l.parentObject) {
		const parent = lookup.get(l.parentObject)
		if (parent?.type === 'MOON') {
			let moonBucket = group.moons.find((m) => m.moon?.name === parent.name)
			if (!moonBucket) {
				moonBucket = { moon: parent, children: [] }
				group.moons.push(moonBucket)
			}
			moonBucket.children.push(l)
			return
		}
	}

	group.direct.push(l)
}

// Groups and filters locations.
// Returns an array of [groupLabel, locations[]] sorted by groupLabel.
const groupAndFilterLocations = (
	locs: Location[],
	allLocations: Location[],
	query: string,
) => {
	const q = query.trim().toLowerCase()

	const filtered = q
		? locs.filter((l) => {
				const name = (l.name || '').toLowerCase()
				const parent = (l.parentObject || '').toLowerCase()
				const type = (l.type || '').toLowerCase()
				return name.includes(q) || parent.includes(q) || type.includes(q)
			})
		: locs.slice()

	const lookup = buildLookup(allLocations)
	const planetMap = new Map<string, PlanetGroup>()

	for (const l of filtered) {
		placeInGroup(l, planetMap, lookup)
	}

	const groups = Array.from(planetMap.values())
	groups.sort((a, b) => a.label.localeCompare(b.label))
	for (const g of groups) {
		g.direct.sort((x, y) => String(x.name).localeCompare(String(y.name)))
		g.moons.sort((a, b) =>
			(a.moon?.name || '').localeCompare(b.moon?.name || ''),
		)
		for (const m of g.moons) {
			m.children.sort((x, y) => String(x.name).localeCompare(String(y.name)))
		}
	}

	return groups
}

interface LocationSelectProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	filterSystem?: string
}

/**
 * Renders a searchable dropdown select for choosing a location.
 *
 * Locations are grouped by their parent (e.g., planet, moon), and can be filtered by a search query.
 * The dropdown displays groups with labels for planets and moons, and lists selectable locations as items.
 *
 * @param value - The currently selected location value.
 * @param onValueChange - Callback invoked when the selected location changes.
 * @param placeholder - Optional placeholder text for the select input. Defaults to 'Select a location'.
 *
 * @remarks
 * - Uses `getSelectableLocations()` to fetch available locations.
 * - Uses `groupAndFilterLocations()` to group and filter locations based on the search query.
 * - Displays a search input at the top of the dropdown for filtering locations.
 * - Shows a message when no locations match the search query.
 */
function LocationSelect({
	value,
	onValueChange,
	placeholder = 'Select a location',
	filterSystem,
}: Readonly<LocationSelectProps>) {
	const { locations, loading } = useMapData()
	const [query, setQuery] = useState('')
	const selectableLocations = useMemo(
		() =>
			locations.filter((location) => {
				if (location.isSelectable === false || !location.name) return false
				if (filterSystem) {
					return location.system?.toLowerCase() === filterSystem.toLowerCase()
				}
				return true
			}),
		[locations, filterSystem],
	)

	const groups = useMemo(
		() => groupAndFilterLocations(selectableLocations, locations, query),
		[query, selectableLocations, locations],
	)

	return (
		<Select
			value={value}
			onValueChange={onValueChange}
		>
			<SelectTrigger className='!dark:bg-accent-foreground bg-accent'>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>

			<SelectContent>
				{loading && (
					<div className='px-3 py-2 text-sm text-muted-foreground'>
						Loading map locations...
					</div>
				)}
				{/* Search input */}
				<div className='px-3 py-2'>
					<input
						type='search'
						aria-label='Search locations'
						placeholder='Search locations...'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDownCapture={(e) => {
							e.stopPropagation()
						}}
						onKeyDown={(e) => {
							e.stopPropagation()
						}}
						className='w-full bg-transparent px-2 py-1 outline-none text-sm'
					/>
				</div>
				<div className='overflow-y-auto max-h-80'>
					{!loading && groups.length === 0 ? (
						<div className='px-3 py-2 text-sm text-muted-foreground'>
							No locations found
						</div>
					) : (
						groups.map((group, gi) => (
							<SelectGroup key={group.label ?? gi}>
								<SelectLabel className='text-sm font-medium text-secondary-foreground bg-muted-foreground'>
									{group.label}
								</SelectLabel>
								{/* Direct children of the planet */}
								{group.direct.map((location) => (
									<SelectItem
										key={location.name}
										value={location.name}
									>
										{location.name}
									</SelectItem>
								))}
								{/* Moons and their children */}
								{group.moons.map((m, mi) => (
									<React.Fragment key={m.moon?.name ?? `moon-${mi}`}>
										{m.moon && (
											<SelectLabel className='ml-3 text-xs font-medium text-secondary-foreground bg-muted-foreground'>
												{m.moon.name}
											</SelectLabel>
										)}
										{m.children.map((location) => (
											<SelectItem
												key={location.name}
												value={location.name}
												className='ml-4'
											>
												{location.name}
											</SelectItem>
										))}
									</React.Fragment>
								))}
							</SelectGroup>
						))
					)}
				</div>
			</SelectContent>
		</Select>
	)
}

export { LocationSelect }
