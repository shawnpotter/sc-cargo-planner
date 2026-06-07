'use client'

import { useState } from 'react'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { AboutModal } from '@/components/home/AboutModal'
import { ChangelogModal } from '@/components/home/ChangelogModal'

export function InfoMenu() {
	const [menuOpen, setMenuOpen] = useState(false)
	const [aboutOpen, setAboutOpen] = useState(false)
	const [changelogOpen, setChangelogOpen] = useState(false)

	const openAbout = () => {
		setMenuOpen(false)
		setAboutOpen(true)
	}

	const openChangelog = () => {
		setMenuOpen(false)
		setChangelogOpen(true)
	}

	return (
		<>
			<Popover
				open={menuOpen}
				onOpenChange={setMenuOpen}
			>
				<PopoverTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						aria-label='Open information menu'
						className='h-8 w-8'
					>
						<EllipsisHorizontalIcon className='h-4 w-4' />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align='end'
					className='w-36 p-1'
				>
					<div className='flex flex-col'>
						<Button
							variant='ghost'
							className='justify-start'
							onClick={openAbout}
						>
							About
						</Button>
						<Button
							variant='ghost'
							className='justify-start'
							onClick={openChangelog}
						>
							Changelog
						</Button>
					</div>
				</PopoverContent>
			</Popover>

			<AboutModal
				open={aboutOpen}
				onOpenChange={setAboutOpen}
			/>
			<ChangelogModal
				open={changelogOpen}
				onOpenChange={setChangelogOpen}
			/>
		</>
	)
}
