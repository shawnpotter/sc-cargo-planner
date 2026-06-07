'use client'
import { useContracts } from '@/providers/ContractProvider'
import { useCargoNavigation } from '@/hooks/useCargoNavigation'
import {
	CubeIcon,
	DocumentTextIcon,
	CurrencyDollarIcon,
	RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'

export function CargoNavigation() {
	const { navigateTo } = useCargoNavigation()
	const { contracts } = useContracts()
	const pathname = usePathname()
	const hasPayableContracts = contracts.some(
		(contract) => !!contract.payout && contract.payout > 0,
	)

	const isActive = (path: string) => pathname === path

	return (
		<nav className='relative bottom-0 left-0 w-[90%] flex self-center items-center bg-background border-muted-foreground/10 z-30 h-8 md:h-10 my-2'>
			<div className='flex w-full gap-1 '>
				<button
					aria-label='Ship selection'
					onClick={() => navigateTo('/cargo')}
					className={`flex-1 flex flex-col items-center py-3 px-2 rounded text-foreground border-r border-muted-foreground/10 hover:bg-chart-2/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition ${
						isActive('/cargo') ? 'bg-primary/90' : 'bg-primary/10'
					}`}
				>
					<span
						className={`flex flex-row items-center gap-2 ${
							isActive('/cargo') ? 'text-primary-foreground' : 'text-foreground'
						}`}
					>
						<CubeIcon className='w-5 h-5 md:w-6 md:h-6' />
						<span className='hidden md:block text-sm font-medium'>
							Cargohold
						</span>
					</span>
				</button>
				<button
					aria-label='Ship selection'
					onClick={() => navigateTo('/cargo/ships')}
					className={`flex-1 flex flex-col items-center py-3 px-2 rounded text-foreground border-r border-muted-foreground/10 hover:bg-chart-2/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition ${
						isActive('/cargo/ships') ? 'bg-primary/90' : 'bg-primary/10'
					}`}
				>
					<span
						className={`flex flex-row items-center gap-2 ${
							isActive('/cargo/ships')
								? 'text-primary-foreground'
								: 'text-foreground'
						}`}
					>
						<RocketLaunchIcon className='w-5 h-5 md:w-6 md:h-6' />
						<span className='hidden md:block text-sm font-medium'>Ships</span>
					</span>
				</button>
				<button
					aria-label='Contract configuration'
					onClick={() => navigateTo('/cargo/contracts')}
					className={`flex-1 flex flex-col items-center py-3 px-2 rounded text-foreground border-r border-muted-foreground/10 hover:bg-chart-2/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition ${
						isActive('/cargo/contracts') ? 'bg-primary/90' : 'bg-primary/10'
					}`}
				>
					<span
						className={`flex flex-row items-center gap-2 ${
							isActive('/cargo/contracts')
								? 'text-primary-foreground'
								: 'text-foreground'
						}`}
					>
						<DocumentTextIcon className='w-5 h-5 md:w-6 md:h-6' />
						<span className='hidden md:block text-sm font-medium'>
							Contracts
						</span>
					</span>
				</button>
				<button
					aria-label='Payment distribution'
					onClick={() => navigateTo('/cargo/payments')}
					disabled={!hasPayableContracts}
					className={`flex-1 flex flex-col items-center py-3 px-2 rounded text-foreground hover:bg-chart-2/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset transition disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
						isActive('/cargo/payments') ? 'bg-primary/90' : 'bg-primary/10'
					}`}
				>
					<span
						className={`flex flex-row items-center gap-2 ${
							isActive('/cargo/payments')
								? 'text-primary-foreground'
								: 'text-foreground'
						}`}
					>
						<CurrencyDollarIcon className='w-5 h-5 md:w-6 md:h-6' />
						<span className='hidden md:block text-sm font-medium'>
							Payments
						</span>
					</span>
				</button>
			</div>
		</nav>
	)
}
