import { useCallback, useEffect, useState } from 'react'

interface UploadImageProps {
	onImageSelected: (imageUrl: string) => void
	disabled?: boolean
}

export function UploadImage({ onImageSelected, disabled }: Readonly<UploadImageProps>) {
	const [error, setError] = useState<string | null>(null)
	const readImage = useCallback((file: File) => {
		if (disabled) return
		if (!file.type.startsWith('image/')) {
			setError('Choose an image file such as PNG or JPG.')
			return
		}
		setError(null)
		const reader = new FileReader()
		reader.onerror = () => setError('Unable to read this screenshot. Choose another image.')
		reader.onload = event => {
			if (typeof event.target?.result === 'string') onImageSelected(event.target.result)
		}
		reader.readAsDataURL(file)
	}, [disabled, onImageSelected])

	useEffect(() => {
		if (disabled) return
		const handlePaste = (event: ClipboardEvent) => {
			const items = event.clipboardData?.items
			if (!items) return
			for (const item of items) {
				if (!item.type.startsWith('image/')) continue
				const file = item.getAsFile()
				if (file) {
					event.preventDefault()
					readImage(file)
					return
				}
			}
		}
		window.addEventListener('paste', handlePaste)
		return () => window.removeEventListener('paste', handlePaste)
	}, [disabled, readImage])

	return <div className='w-full rounded-xl border border-primary/25 bg-card p-5 space-y-3'>
		<label htmlFor='ocr-file-input' className='block font-medium'>Choose a contract screenshot</label>
		<input
			type='file'
			accept='image/*'
			id='ocr-file-input'
			aria-label='Upload screenshot'
			disabled={disabled}
			className='block w-full rounded-md border p-3 min-h-11'
			onChange={event => {
				const file = event.target.files?.[0]
				if (file) readImage(file)
			}}
		/>
		<p className='text-sm text-muted-foreground'>Select an image from your device, or paste a screenshot with Ctrl+V.</p>
		{error && <p role='alert' className='text-sm text-destructive'>{error}</p>}
	</div>
}
