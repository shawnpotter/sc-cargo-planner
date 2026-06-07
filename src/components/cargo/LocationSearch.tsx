// @/components/cargo/LocationSearch.tsx
'use client'

import * as React from 'react'
import { useMemo, useState, useRef, useEffect, useId } from 'react'
import type { Location } from '@/data/locations'
import { useMapData } from '@/providers/MapDataProvider'
import { cn } from '@/lib/utils'

interface LocationSearchProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	filterSystem?: string
	id?: string
}

function matchesQuery(loc: Location, q: string): boolean {
	const name = loc.name.toLowerCase()
	const parent = (loc.parentObject ?? '').toLowerCase()
	const type = loc.type.toLowerCase()
	return name.includes(q) || parent.includes(q) || type.includes(q)
}

/**
 * A searchable text-input combobox for selecting a location.
 * Shows a suggestion list while typing; clicking a suggestion commits the value.
 */
export function LocationSearch({
	value = '',
	onValueChange,
	placeholder = 'Search locations...',
	filterSystem,
	id,
}: Readonly<LocationSearchProps>) {
	const { locations } = useMapData()
	const generatedId = useId()
	const inputId = id ?? generatedId

	const selectableLocations = useMemo(
		() =>
			locations.filter((loc) => {
				if (loc.isSelectable === false || !loc.name) return false
				if (filterSystem) {
					return loc.system?.toLowerCase() === filterSystem.toLowerCase()
				}
				return true
			}),
		[locations, filterSystem],
	)

	// The text shown in the input — mirrors the selected value's name
	const [query, setQuery] = useState(value)
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const [activeIndex, setActiveIndex] = useState(-1)

	// Keep input text in sync when external value changes (e.g. reset)
	useEffect(() => {
		setQuery(value)
	}, [value])

	const suggestions = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return selectableLocations.slice(0, 50)
		return selectableLocations
			.filter((loc) => matchesQuery(loc, q))
			.slice(0, 50)
	}, [query, selectableLocations])

	const commit = (name: string) => {
		setQuery(name)
		setOpen(false)
		setActiveIndex(-1)
		onValueChange?.(name)
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value)
		setOpen(true)
		setActiveIndex(-1)
		if (e.target.value === '') {
			onValueChange?.('')
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
			return
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActiveIndex((i) => Math.max(i - 1, 0))
		} else if (e.key === 'Enter') {
			e.preventDefault()
			if (activeIndex >= 0 && suggestions[activeIndex]) {
				commit(suggestions[activeIndex].name)
			}
		} else if (e.key === 'Escape') {
			setOpen(false)
			setActiveIndex(-1)
		}
	}

	// Close on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const listId = `${inputId}-list`

	// Scroll active item into view
	useEffect(() => {
		if (activeIndex >= 0) {
			const listEl = document.getElementById(listId)
			const item = listEl?.children[activeIndex] as HTMLElement | undefined
			item?.scrollIntoView({ block: 'nearest' })
		}
	}, [activeIndex, listId])

	return (
		<div
			ref={containerRef}
			className='relative w-full'
		>
			<input
				id={inputId}
				type='text'
				role='combobox'
				aria-autocomplete='list'
				aria-expanded={open}
				aria-controls={listId}
				aria-activedescendant={
					activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
				}
				value={query}
				onChange={handleInputChange}
				onFocus={() => setOpen(true)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				autoComplete='off'
				className='w-full rounded-md border border-input bg-accent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
			/>
			{open && suggestions.length > 0 && (
				<div
					id={listId}
					className='absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-md text-sm'
				>
					{suggestions.map((loc, i) => (
						<button
							key={loc.name}
							id={`${listId}-${i}`}
							type='button'
							tabIndex={-1}
							onMouseDown={(e) => {
								e.preventDefault()
								commit(loc.name)
							}}
							className={cn(
								'w-full text-left cursor-pointer px-3 py-1.5 text-foreground',
								i === activeIndex
									? 'bg-primary text-primary-foreground'
									: 'hover:bg-muted',
							)}
						>
							<span className='font-medium'>{loc.name}</span>
							{loc.parentObject && (
								<span
									className={cn(
										'ml-2 text-xs',
										i === activeIndex
											? 'text-primary-foreground/70'
											: 'text-muted-foreground',
									)}
								>
									{loc.parentObject}
								</span>
							)}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
