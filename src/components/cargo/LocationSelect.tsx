// @/components/cargo/LocationSelect.tsx
import * as React from 'react'
import { useMemo, useState } from 'react'
import { locations, getSelectableLocations } from '@/data/locations'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

// Groups and filters locations.
// Returns an array of [groupLabel, locations[]] sorted by groupLabel.
const groupAndFilterLocations = (
	locs: ReturnType<typeof getSelectableLocations>,
	query: string
) => {
	const q = query.trim().toLowerCase()

	const filtered = q
		? locs.filter((l) => {
				const name = (l.name || '').toString().toLowerCase()
				const parent = (l.parentObject || '').toString().toLowerCase()
				const type = (l.type || '').toString().toLowerCase()
				return name.includes(q) || parent.includes(q) || type.includes(q)
		  })
		: locs.slice()

	// Build a lookup of all locations (including non-selectable) so we can
	// resolve parent chains (planet -> moon -> child)
	const lookup = new Map<string, (typeof locations)[0]>()
	for (const loc of locations) lookup.set(loc.name, loc)

	type PlanetGroup = {
		label: string
		direct: typeof filtered
		moons: Array<{ moon?: (typeof locations)[0]; children: typeof filtered }>
	}

	const planetMap = new Map<string, PlanetGroup>()

	// Helper to find top-level ancestor (planet or star) for a given location
	const findTopParent = (loc: (typeof locations)[0]) => {
		let current = loc
		while (current.parentObject) {
			const parent = lookup.get(current.parentObject)
			if (!parent) break
			if (parent.type === 'PLANET' || parent.type === 'STAR') return parent
			current = parent
		}
		// fallback to parentObject name or self
		if (loc.parentObject) return lookup.get(loc.parentObject) || loc
		return loc
	}

	for (const l of filtered) {
		const top = findTopParent(l)
		const topName = (top && top.name) || l.parentObject || l.type || 'Other'

		if (!planetMap.has(topName))
			planetMap.set(topName, { label: topName, direct: [], moons: [] })

		const group = planetMap.get(topName)!

		// If this item is a moon, add to moons list (as moon entry)
		if (l.type === 'MOON') {
			// ensure moon bucket exists
			group.moons.push({ moon: l, children: [] })
			continue
		}

		// If the item's parent is a moon, put it under that moon's children
		if (l.parentObject) {
			const parent = lookup.get(l.parentObject)
			if (parent && parent.type === 'MOON') {
				// find existing moon bucket or create one
				let moonBucket = group.moons.find((m) => m.moon?.name === parent.name)
				if (!moonBucket) {
					moonBucket = { moon: parent, children: [] }
					group.moons.push(moonBucket)
				}
				moonBucket.children.push(l)
				continue
			}
		}

		// Otherwise it's a direct child of the planet/top parent
		group.direct.push(l)
	}

	// Sort groups and entries
	const groups = Array.from(planetMap.values())
	groups.sort((a, b) => a.label.localeCompare(b.label))
	for (const g of groups) {
		g.direct.sort((x, y) => String(x.name).localeCompare(String(y.name)))
		g.moons.sort((a, b) =>
			(a.moon?.name || '').localeCompare(b.moon?.name || '')
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
}

function LocationSelect({
	value,
	onValueChange,
	placeholder = 'Select a location',
}: LocationSelectProps) {
	const [query, setQuery] = useState('')

	const groups = useMemo(
		() => groupAndFilterLocations(getSelectableLocations(), query),
		[query]
	)

	return (
		<Select
			value={value}
			onValueChange={onValueChange}
		>
			<SelectTrigger>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>

			<SelectContent>
				{/* Search input */}
				<div className='px-3 py-2'>
					<input
						type='search'
						aria-label='Search locations'
						placeholder='Search locations...'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='w-full bg-transparent px-2 py-1 outline-none text-sm'
					/>
				</div>
				<div className='overflow-y-auto max-h-80'>
					{groups.length === 0 ? (
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
