// @/components/ocr/UploadImage.tsx
import { useCallback } from 'react'

interface UploadImageProps {
	onImageSelected: (imageUrl: string) => void
	disabled?: boolean
}

function UploadImage({ onImageSelected, disabled }: UploadImageProps) {
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
		[onImageSelected]
	)

	const handlePaste = useCallback(
		async (e: React.ClipboardEvent) => {
			const items = e.clipboardData?.items
			if (!items) return

			for (const item of items) {
				if (item.type.indexOf('image') !== -1) {
					const blob = item.getAsFile()
					if (blob) {
						const reader = new FileReader()
						reader.onload = (e) => {
							onImageSelected(e.target?.result as string)
						}
						reader.readAsDataURL(blob)
					}
				}
			}
		},
		[onImageSelected]
	)

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
