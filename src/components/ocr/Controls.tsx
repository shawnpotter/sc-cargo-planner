// @/components/ocr/Controls.tsx
import { Button } from '@/components/ui/button'
import { useId } from 'react'
import { ImageProcessingSettings, PRESETS } from '@/components/ocr/parser/types'

interface ControlsProps {
	readonly settings: ImageProcessingSettings
	readonly onSettingsChange: (settings: ImageProcessingSettings) => void
	readonly onReset: () => void
	readonly onRunOCR: () => void
	readonly isProcessing: boolean
	readonly hasWorker: boolean
}

/**
 * Renders the OCR image processing controls panel, allowing users to adjust image settings,
 * select presets, and trigger OCR processing. Includes sliders for brightness, contrast, scale,
 * and threshold, as well as toggles for grayscale, invert, sharpen, and threshold effects.
 * Also provides action buttons for resetting settings and running OCR.
 *
 * @param settings - The current image processing settings.
 * @param onSettingsChange - Callback invoked when any setting is changed.
 * @param onReset - Callback invoked when the reset button is clicked.
 * @param onRunOCR - Callback invoked when the Run OCR button is clicked.
 * @param isProcessing - Indicates if OCR processing is currently running.
 * @param hasWorker - Indicates if the OCR worker is available.
 */
export default function Controls({
	settings,
	onSettingsChange,
	onReset,
	onRunOCR,
	isProcessing,
	hasWorker,
}: ControlsProps) {
	return (
		<div className='flex flex-col gap-4 p-3'>
			<h3 className='text-sm font-semibold text-foreground'>
				Image Processing
			</h3>

			{/* Presets */}
			<div className='flex flex-col gap-2'>
				<div className='text-sm text-muted-foreground'>Presets:</div>
				<div className='flex flex-wrap gap-2'>
					{Object.entries(PRESETS).map(([name, preset]) => (
						<Button
							key={name}
							variant='ghost'
							size='sm'
							onClick={() =>
								onSettingsChange({
									...preset,
									splitColumn: settings.splitColumn,
								})
							}
							className='text-sm'
						>
							{name}
						</Button>
					))}
				</div>
			</div>

			{/* Column Split Slider */}
			<div className='flex flex-col gap-1'>
				<label
					htmlFor='ocr-split-column'
					className='flex justify-between text-xs text-muted-foreground'
				>
					<span>⚠️ Column Split Position</span>
					<span>{settings.splitColumn}%</span>
				</label>
				<input
					id='ocr-split-column'
					type='range'
					min='30'
					max='70'
					value={settings.splitColumn}
					onChange={(e) =>
						onSettingsChange({
							...settings,
							splitColumn: parseInt(e.target.value),
						})
					}
					className='w-full'
				/>
				<div className='text-xs text-muted-foreground'>
					Adjust to separate left/right columns correctly
				</div>
			</div>

			{/* Sliders */}
			<div className='flex flex-col gap-3'>
				<SliderControl
					label='Brightness'
					value={settings.brightness}
					min={-100}
					max={100}
					onChange={(value) =>
						onSettingsChange({ ...settings, brightness: value })
					}
				/>

				<SliderControl
					label='Contrast'
					value={settings.contrast}
					min={-100}
					max={100}
					onChange={(value) =>
						onSettingsChange({ ...settings, contrast: value })
					}
				/>

				<SliderControl
					label='Scale'
					value={settings.scale}
					min={50}
					max={200}
					unit='%'
					onChange={(value) => onSettingsChange({ ...settings, scale: value })}
				/>

				{settings.threshold && (
					<SliderControl
						label='Threshold Level'
						value={settings.thresholdValue}
						min={0}
						max={255}
						onChange={(value) =>
							onSettingsChange({ ...settings, thresholdValue: value })
						}
					/>
				)}
			</div>

			{/* Toggles */}
			<div className='grid grid-cols-2 gap-2'>
				<ToggleControl
					label='Grayscale'
					checked={settings.grayscale}
					onChange={(checked) =>
						onSettingsChange({ ...settings, grayscale: checked })
					}
				/>
				<ToggleControl
					label='Invert'
					checked={settings.invert}
					onChange={(checked) =>
						onSettingsChange({ ...settings, invert: checked })
					}
				/>
				<ToggleControl
					label='Sharpen'
					checked={settings.sharpen}
					onChange={(checked) =>
						onSettingsChange({ ...settings, sharpen: checked })
					}
				/>
				<ToggleControl
					label='Threshold'
					checked={settings.threshold}
					onChange={(checked) =>
						onSettingsChange({ ...settings, threshold: checked })
					}
				/>
			</div>

			{/* Action Buttons */}
			<div className='flex gap-2 justify-end mt-2'>
				<Button
					onClick={onReset}
					variant='secondary'
				>
					Reset
				</Button>
				<Button
					onClick={onRunOCR}
					variant='default'
					disabled={isProcessing || !hasWorker}
				>
					Run OCR
				</Button>
			</div>
		</div>
	)
}

interface SliderControlProps {
	readonly label: string
	readonly value: number
	readonly min: number
	readonly max: number
	readonly unit?: string
	readonly onChange: (value: number) => void
}

function SliderControl({
	label,
	value,
	min,
	max,
	unit = '',
	onChange,
}: SliderControlProps) {
	const id = useId()
	return (
		<div>
			<label htmlFor={id}>
				<span>{label}</span>
				<span>
					{value}
					{unit}
				</span>
			</label>
			<input
				id={id}
				type='range'
				min={min}
				max={max}
				value={value}
				onChange={(e) => onChange(parseInt(e.target.value))}
			/>
		</div>
	)
}

interface ToggleControlProps {
	readonly label: string
	readonly checked: boolean
	readonly onChange: (checked: boolean) => void
}

function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
	const id = useId()
	return (
		<div>
			<input
				id={id}
				type='checkbox'
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<label htmlFor={id}>{label}</label>
		</div>
	)
}

export { Controls }
