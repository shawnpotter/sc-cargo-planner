import { CargoNavigation } from '@/components/cargo/CargoNavigation'

interface CargoLayoutProps {
	children: React.ReactNode
}

export default function CargoLayout({ children }: Readonly<CargoLayoutProps>) {
	return (
		<div className='flex flex-col h-[calc(100vh-var(--header-h))] min-h-0 bg-background text-foreground overflow-x-hidden'>
			{/* Top navigation bar */}
			<CargoNavigation />

			{/* Main content area */}
			<main className='flex-1 min-h-0 flex flex-col items-center p-2 md:p-6 overflow-y-auto overflow-x-hidden'>
				<div className='w-full max-w-8xl mx-auto flex-1 min-h-0 flex flex-col relative'>
					{children}
				</div>
			</main>
		</div>
	)
}
