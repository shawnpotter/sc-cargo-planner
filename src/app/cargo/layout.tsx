import { CargoNavigation } from '@/components/cargo/CargoNavigation'

interface CargoLayoutProps {
	children: React.ReactNode
}

export default function CargoLayout({ children }: CargoLayoutProps) {
	return (
		<div className='flex flex-col h-[calc(100vh-var(--header-h))] bg-background text-foreground'>
			{/* Top navigation bar */}
			<CargoNavigation />

			{/* Main content area */}
			<main className='flex-1 flex flex-col items-center justify-center p-2 md:p-6 industrial-border'>
				<div className='w-full max-w-7xl mx-auto flex-1 flex flex-col relative'>
					{children}
				</div>
			</main>
		</div>
	)
}
