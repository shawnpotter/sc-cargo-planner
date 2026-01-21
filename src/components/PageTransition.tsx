// @/components/PageTransition.tsx
'use client'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

export function PageTransition({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const pathname = usePathname()

	return (
		<motion.div
			key={pathname}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{
				duration: 0.3,
				ease: 'easeInOut',
				delay: 0.1, // Small delay to prevent flash
			}}
			className='w-full'
		>
			{children}
		</motion.div>
	)
}
