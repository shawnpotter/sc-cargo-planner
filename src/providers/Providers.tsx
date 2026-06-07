// @/providers/Providers.tsx
import React from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import SessionProvider from '@/providers/SessionProvider'
import { ContractProvider } from '@/providers/ContractProvider'
import { CargoProvider } from '@/providers/CargoProvider'
import { MapDataProvider } from '@/providers/MapDataProvider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			enableSystem
			disableTransitionOnChange
		>
			<SessionProvider>
				<MapDataProvider>
					<ContractProvider>
						<CargoProvider>{children}</CargoProvider>
					</ContractProvider>
				</MapDataProvider>
			</SessionProvider>
		</ThemeProvider>
	)
}
