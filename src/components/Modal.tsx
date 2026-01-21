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

/**
 * Modal component that displays its children in a centered overlay.
 * Prevents body scroll when open and restores it when closed.
 *
 * @param isOpen - Determines if the modal is visible.
 * @param onClose - Callback function invoked when the modal is requested to close.
 * @param title - Title text displayed at the top of the modal.
 * @param children - Content to be rendered inside the modal.
 *
 * @returns The modal JSX if open, otherwise null.
 */
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
