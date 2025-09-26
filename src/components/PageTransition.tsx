'use client'
import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Define the page order to determine slide direction
const pageOrder = {
	'/cargo/ships': 0,
	'/cargo/contracts': 1,
	'/cargo': 2,
	'/cargo/payments': 3,
}

const slideVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? '100%' : '-100%',
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		x: direction < 0 ? '100%' : '-100%',
		opacity: 0,
	}),
}

const transition = {
	type: 'tween' as const,
	ease: [0.25, 0.46, 0.45, 0.94] as const, // Custom easing curve
	duration: 0.3,
}

export function PageTransition({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const [direction, setDirection] = useState(0)
	const [previousPath, setPreviousPath] = useState(pathname)

	useEffect(() => {
		const currentIndex = pageOrder[pathname as keyof typeof pageOrder] ?? 2
		const previousIndex = pageOrder[previousPath as keyof typeof pageOrder] ?? 2

		setDirection(currentIndex > previousIndex ? 1 : -1)
		setPreviousPath(pathname)
	}, [pathname, previousPath])

	return (
		<AnimatePresence
			mode='wait'
			custom={direction}
		>
			<motion.div
				key={pathname}
				custom={direction}
				variants={slideVariants}
				initial='enter'
				animate='center'
				exit='exit'
				transition={transition}
				className='w-full min-h-screen'
			>
				{children}
			</motion.div>
		</AnimatePresence>
	)
}
