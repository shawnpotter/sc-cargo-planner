// @/app/components/HaulingModeToggle.tsx
import React from 'react'
import { HaulingMode } from '@/utils/calculateContainers'
import { Button } from '@/components/ui/button'

interface HaulingModeToggleProps {
	readonly currentMode: HaulingMode
	readonly onChange: (mode: HaulingMode) => void
	readonly className?: string
}

/**
 * A toggle component for selecting the hauling mode in the cargo planner.
 *
 * Renders two buttons allowing the user to switch between "Contract Hauling" and "Commodity Hauling" modes.
 * The currently selected mode is visually highlighted.
 *
 * @param currentMode - The currently selected hauling mode.
 * @param onChange - Callback invoked with the new mode when a button is clicked.
 * @param className - Optional CSS class for custom styling.
 */
function HaulingModeToggle({
	currentMode,
	onChange,
	className = '',
}: HaulingModeToggleProps) {
	return (
		<div className={className}>
			<Button
				onClick={() => onChange(HaulingMode.CONTRACT)}
				variant={currentMode === HaulingMode.CONTRACT ? 'default' : 'secondary'}
			>
				Contract Hauling
			</Button>
			<Button
				onClick={() => onChange(HaulingMode.COMMODITY)}
				variant={
					currentMode === HaulingMode.COMMODITY ? 'default' : 'secondary'
				}
			>
				Commodity Hauling
			</Button>
		</div>
	)
}

export { HaulingModeToggle }
