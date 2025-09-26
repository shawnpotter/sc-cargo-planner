'use client'
import { PageTransition } from '@/components/PageTransition'

export default function CargoLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className='min-h-screen'>
			<PageTransition>{children}</PageTransition>
		</div>
	)
}
