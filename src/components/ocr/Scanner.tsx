// @/components/ocr/Scanner.tsx
'use client'

import { ScannerModal } from './components/ScannerModal'
import { ScannerContent } from './components/ScannerContent'

interface ScannerProps {
	onClose: () => void
}

/**
 * Scanner component for OCR contract scanning.
 *
 * This component provides an interface for users to upload an image, process it using OCR (Optical Character Recognition),
 * and parse the extracted text into contract data. It supports image splitting, processing progress indication, error handling,
 * and allows users to apply the parsed contract data to a form.
 *
 * @param {Readonly<ScannerProps>} props - The props for the Scanner component.
 * @param {() => void} props.onClose - Callback invoked when the scanner is closed.
 *
 * @returns {JSX.Element} The rendered Scanner component UI.
 */
export default function Scanner({ onClose }: Readonly<ScannerProps>) {
	return (
		<ScannerModal
			title='OCR Contract Scanner'
			onClose={onClose}
		>
			<ScannerContent onClose={onClose} />
		</ScannerModal>
	)
}
