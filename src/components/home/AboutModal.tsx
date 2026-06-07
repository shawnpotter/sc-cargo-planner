'use client'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface AboutModalProps {
	readonly open: boolean
	readonly onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>About U.C.M.S.</DialogTitle>
					<DialogDescription>
						Universal Cargo Management System helps Star Citizen haulers plan
						contracts, optimize routing, and manage cargo loading workflows in
						one place.
					</DialogDescription>
				</DialogHeader>
				<div className='space-y-2 text-sm text-muted-foreground'>
					<p>Version: 0.2.1 (β)</p>
					<p>
						Built for route planning, cargo tracking, and delivery coordination.
					</p>
				</div>
				<DialogFooter>
					A Product of{' '}
					<Link
						href='https://robertsspaceindustries.com/en/orgs/LOADSTONE'
						target='_blank'
						rel='noopener noreferrer'
						className='font-bold'
					>
						Loadstone
					</Link>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
