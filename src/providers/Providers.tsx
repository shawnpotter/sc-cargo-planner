import React from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import SessionProvider from '@/providers/SessionProvider'
import { ContractProvider } from './ContractProvider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			enableSystem
			disableTransitionOnChange
		>
			<SessionProvider>
				<ContractProvider>{children}</ContractProvider>
			</SessionProvider>
		</ThemeProvider>
	)
}
