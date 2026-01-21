import { Button } from '@/components/ui/button'

interface ScannerModalProps {
	title: string
	onClose: () => void
	children: React.ReactNode
}

export function ScannerModal({ title, onClose, children }: ScannerModalProps) {
	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60'>
			<div className='w-full max-w-4xl bg-card border border-border backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-ring overflow-hidden'>
				<div className='p-4'>
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-lg font-semibold text-foreground'>{title}</h2>
						<Button
							variant='ghost'
							size='sm'
							onClick={onClose}
							className='p-1'
							aria-label='Close'
						>
							×
						</Button>
					</div>
					{children}
				</div>
			</div>
		</div>
	)
}
