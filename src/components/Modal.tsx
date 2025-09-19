// components/ui/Modal/Modal.tsx
'use client'
import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface ModalProps {
	readonly isOpen: boolean
	readonly onClose: () => void
	readonly title: string
	readonly children: React.ReactNode
}

export default function Modal({
	isOpen,
	onClose,
	title,
	children,
}: ModalProps) {
	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'auto'
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen) return null

	return (
		<div>
			{/* Modal content */}
			<div>
				<div>
					<h2>{title}</h2>
					<button
						onClick={onClose}
						title='Close modal'
					>
						<XMarkIcon />
					</button>
				</div>
				<div>{children}</div>
			</div>
		</div>
	)
}
