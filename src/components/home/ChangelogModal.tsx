'use client'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface ChangelogModalProps {
	readonly open: boolean
	readonly onOpenChange: (open: boolean) => void
}

const changelogEntries = [
	{
		title: 'Header quality-of-life updates',
		description: 'Added quick access menu for About and Changelog.',
	},
	{
		title: 'Cargo planning improvements',
		description: 'Refinements across routing and cargo management workflows.',
	},
]

export function ChangelogModal({ open, onOpenChange }: ChangelogModalProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Changelog</DialogTitle>
					<DialogDescription>Recent updates to U.C.M.S.</DialogDescription>
				</DialogHeader>
				<ul className='space-y-3 text-sm'>
					{changelogEntries.map((entry) => (
						<li key={entry.title}>
							<p className='font-medium text-foreground'>{entry.title}</p>
							<p className='text-muted-foreground'>{entry.description}</p>
						</li>
					))}
				</ul>
			</DialogContent>
		</Dialog>
	)
}
