import { useState, useCallback } from 'react'

interface UseAlertDialogReturn {
	isOpen: boolean
	title: string
	description: string
	showAlert: (title: string, description: string) => void
	closeAlert: () => void
}

export function useAlertDialog(): UseAlertDialogReturn {
	const [isOpen, setIsOpen] = useState(false)
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')

	const showAlert = useCallback((newTitle: string, newDescription: string) => {
		setTitle(newTitle)
		setDescription(newDescription)
		setIsOpen(true)
	}, [])

	const closeAlert = useCallback(() => {
		setIsOpen(false)
		// Clear content after close animation
		setTimeout(() => {
			setTitle('')
			setDescription('')
		}, 200)
	}, [])

	return {
		isOpen,
		title,
		description,
		showAlert,
		closeAlert,
	}
}
