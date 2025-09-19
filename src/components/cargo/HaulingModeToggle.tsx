// @/app/components/HaulingModeToggle.tsx
import React from 'react'
import { HaulingMode } from '@/utils/calculateContainers'
import { Button } from '@/components/ui/button'

interface HaulingModeToggleProps {
	readonly currentMode: HaulingMode
	readonly onChange: (mode: HaulingMode) => void
	readonly className?: string
}

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
