// @/components/cargo/RouteTypeToggle.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { RouteType } from '@/providers/CargoProvider'
import { LocationSearch } from '@/components/cargo/LocationSearch'

interface RouteTypeToggleProps {
	currentType: RouteType
	endLocation: string | null
	onTypeChange: (type: RouteType) => void
	onEndLocationChange: (location: string | null) => void
	className?: string
	filterSystem?: string
}

/**
 * Toggle component for selecting between closed loop and open path route types.
 * When open path is selected, displays a location selector for the end destination.
 *
 * @param currentType - The currently selected route type ('loop' or 'path')
 * @param endLocation - The selected end location for open path routes
 * @param onTypeChange - Callback when route type changes
 * @param onEndLocationChange - Callback when end location changes
 * @param className - Optional additional CSS classes
 */
function RouteTypeToggle({
	currentType,
	endLocation,
	onTypeChange,
	onEndLocationChange,
	className,
	filterSystem,
}: Readonly<RouteTypeToggleProps>) {
	return (
		<div className={cn('flex flex-col gap-3', className)}>
			<div className='flex items-center gap-2'>
				<span className='text-sm font-medium text-muted-foreground'>
					Route Type:
				</span>
				<div className='inline-flex rounded-md border border-border overflow-hidden'>
					<button
						type='button'
						onClick={() => onTypeChange('loop')}
						className={cn(
							'px-3 py-1.5 text-sm font-medium transition-colors',
							currentType === 'loop'
								? 'bg-primary text-primary-foreground'
								: 'bg-background text-foreground hover:bg-muted',
						)}
					>
						Loop
					</button>
					<button
						type='button'
						onClick={() => onTypeChange('path')}
						className={cn(
							'px-3 py-1.5 text-sm font-medium transition-colors border-l border-border',
							currentType === 'path'
								? 'bg-primary text-primary-foreground'
								: 'bg-background text-foreground hover:bg-muted',
						)}
					>
						Path
					</button>
				</div>
			</div>

			{currentType === 'path' && (
				<div className='flex flex-col gap-1'>
					<label
						htmlFor='endLocation'
						className='text-sm font-medium text-muted-foreground'
					>
						End Location
					</label>
					<LocationSearch
						id='endLocation'
						value={endLocation || ''}
						onValueChange={(value) => onEndLocationChange(value || null)}
						placeholder='Search end location...'
						filterSystem={filterSystem}
					/>
				</div>
			)}

			<p className='text-xs text-muted-foreground'>
				{currentType === 'loop'
					? 'Route will return to the port of origin after all deliveries.'
					: 'Route will end at the specified location without returning to origin.'}
			</p>
		</div>
	)
}

export { RouteTypeToggle }
