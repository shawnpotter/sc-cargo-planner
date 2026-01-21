// @/providers/Providers.tsx
import React from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import SessionProvider from '@/providers/SessionProvider'
import { ContractProvider } from './ContractProvider'
import { CargoProvider } from './CargoProvider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			enableSystem
			disableTransitionOnChange
		>
			<SessionProvider>
				<ContractProvider>
					<CargoProvider>{children}</CargoProvider>
				</ContractProvider>
			</SessionProvider>
		</ThemeProvider>
	)
}
