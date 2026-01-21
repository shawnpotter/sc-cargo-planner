'use client'
import { Geist, Geist_Mono } from 'next/font/google'
import '../app/globals.css'
import { Providers } from '@/providers/Providers'
import HeaderBar from '@/components/home/HeaderBar'
import { PageTransition } from '@/components/PageTransition'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
			>
				<Providers>
					<HeaderBar />
					<PageTransition>{children}</PageTransition>
					{/* <Footer /> */}
				</Providers>
			</body>
		</html>
	)
}
