// @/components/ocr/Preview.tsx
import React from 'react'

interface PreviewProps {
	readonly leftCanvasRef: React.RefObject<HTMLCanvasElement | null>
	readonly rightCanvasRef: React.RefObject<HTMLCanvasElement | null>
	readonly splitColumn: number
}

/**
 * Renders a split preview view with two canvases side by side, representing the left and right columns.
 * Displays the current splitter position as a percentage.
 *
 * @param leftCanvasRef - React ref for the left canvas element.
 * @param rightCanvasRef - React ref for the right canvas element.
 * @param splitColumn - The position of the splitter as a percentage (number).
 *
 * @remarks
 * - Uses Tailwind CSS classes for styling.
 * - Intended for OCR preview scenarios where a visual split is required.
 */
function Preview({ leftCanvasRef, rightCanvasRef, splitColumn }: PreviewProps) {
	return (
		<div className='flex flex-col gap-2'>
			<h3 className='text-sm font-semibold text-foreground'>
				Preview (Split View):
			</h3>
			<div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
				<div className='bg-card p-2 rounded border border-border'>
					<div className='text-xs text-muted-foreground mb-1'>Left Column</div>
					<canvas
						ref={leftCanvasRef}
						className='w-full h-48 object-contain bg-background rounded'
					/>
				</div>
				<div className='bg-card p-2 rounded border border-border'>
					<div className='text-xs text-muted-foreground mb-1'>Right Column</div>
					<canvas
						ref={rightCanvasRef}
						className='w-full h-48 object-contain bg-background rounded'
					/>
				</div>
			</div>
			<div className='text-xs text-muted-foreground mt-1'>
				Splitter at {splitColumn}%
			</div>
		</div>
	)
}

export { Preview }
