// @/components/ocr/UploadImage.tsx
import { useCallback, useEffect } from 'react'

interface UploadImageProps {
	onImageSelected: (imageUrl: string) => void
	disabled?: boolean
}

/**
 * A React component that allows users to upload an image either by selecting a file
 * or by pasting an image from the clipboard. The selected image is converted to a
 * data URL and passed to the `onImageSelected` callback.
 *
 * @param onImageSelected - Callback function invoked with the image data URL when an image is selected or pasted.
 * @param disabled - If true, disables the upload and paste functionality.
 *
 * @remarks
 * - Supports PNG and JPG file uploads.
 * - Supports clipboard paste (Ctrl+V) for images.
 * - The file input is visually hidden; interaction is handled via the styled label.
 */
function UploadImage({
	onImageSelected,
	disabled,
}: Readonly<UploadImageProps>) {
	const processClipboardItems = useCallback(
		(items: DataTransferItemList | null | undefined) => {
			if (!items || disabled) {
				return false
			}

			for (const item of items) {
				if (item.type.includes('image')) {
					const blob = item.getAsFile()
					if (blob) {
						const reader = new FileReader()
						reader.onload = (event) => {
							onImageSelected(event.target?.result as string)
						}
						reader.readAsDataURL(blob)
						return true
					}
				}
			}

			return false
		},
		[disabled, onImageSelected],
	)

	const handleFileUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return

			const reader = new FileReader()
			reader.onload = (e) => {
				onImageSelected(e.target?.result as string)
			}
			reader.readAsDataURL(file)
		},
		[onImageSelected],
	)

	const handlePaste = useCallback(
		async (e: React.ClipboardEvent) => {
			const handled = processClipboardItems(e.clipboardData?.items)
			if (handled) {
				e.preventDefault()
			}
		},
		[processClipboardItems],
	)

	useEffect(() => {
		if (disabled) {
			return
		}

		const handleGlobalPaste = (event: ClipboardEvent) => {
			const handled = processClipboardItems(event.clipboardData?.items)
			if (handled) {
				event.preventDefault()
			}
		}

		window.addEventListener('paste', handleGlobalPaste)
		return () => {
			window.removeEventListener('paste', handleGlobalPaste)
		}
	}, [disabled, processClipboardItems])

	return (
		<div
			onPaste={handlePaste}
			className='w-full'
		>
			<input
				type='file'
				accept='image/*'
				onChange={handleFileUpload}
				id='ocr-file-input'
				disabled={disabled}
				className='hidden'
			/>
			<label
				htmlFor='ocr-file-input'
				className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-border bg-card hover:bg-background transition text-center cursor-pointer ${
					disabled ? 'opacity-50 pointer-events-none' : ''
				}`}
			>
				<span className='sr-only'>Upload image</span>
				<div className='text-3xl'>📸</div>
				<div className='text-sm font-medium text-foreground'>
					Click to upload or paste screenshot
				</div>
				<div className='text-xs text-muted-foreground'>
					Supports PNG, JPG, or clipboard paste (Ctrl+V)
				</div>
			</label>
		</div>
	)
}

export { UploadImage }
