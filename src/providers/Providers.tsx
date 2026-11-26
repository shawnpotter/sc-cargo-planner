// @/providers/Providers.tsx
import React from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { RunProvider } from '@/providers/RunProvider'
import { MapDataProvider } from '@/providers/MapDataProvider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			enableSystem
			disableTransitionOnChange
		>
				<MapDataProvider>
					<RunProvider>{children}</RunProvider>
				</MapDataProvider>
		</ThemeProvider>
	)
}
