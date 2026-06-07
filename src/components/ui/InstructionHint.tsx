'use client'

import React from 'react'
import { CircleHelp } from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface InstructionHintProps {
	readonly title: string
	readonly description: string
	readonly side?: 'top' | 'right' | 'bottom' | 'left'
}

function InstructionHint({
	title,
	description,
	side = 'top',
}: InstructionHintProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type='button'
					className='inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground'
					aria-label='Show help'
				>
					<CircleHelp className='h-4 w-4' />
				</button>
			</TooltipTrigger>
			<TooltipContent
				side={side}
				sideOffset={8}
				className='max-w-xs text-left'
			>
				<p className='font-semibold'>{title}</p>
				<p className='mt-1'>{description}</p>
			</TooltipContent>
		</Tooltip>
	)
}

export { InstructionHint }
