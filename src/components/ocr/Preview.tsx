// @/components/ocr/Preview.tsx
import React from 'react'

interface PreviewProps {
	readonly leftCanvasRef: React.RefObject<HTMLCanvasElement | null>
	readonly rightCanvasRef: React.RefObject<HTMLCanvasElement | null>
	readonly splitColumn: number
}

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
