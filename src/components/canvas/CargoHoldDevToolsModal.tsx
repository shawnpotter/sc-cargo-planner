import { useEffect, useState, type ChangeEvent } from 'react'

type ModelTuningState = {
	scale: number
	position: [number, number, number]
	rotation: [number, number, number]
	opacity: number
}

type CargoGridTuning = {
	position: [number, number, number]
	dimensions: [number, number, number]
}

type CargoGridTuningState = Record<number, CargoGridTuning>

interface CargoHoldDevToolsModalProps {
	readonly cargoGridCount: number
	readonly modelTuning: ModelTuningState
	readonly gridTuning: CargoGridTuningState
	readonly showCoordinateSystem: boolean
	readonly showGridDebug: boolean
	readonly onClose: () => void
	readonly onToggleCoordinateSystem: () => void
	readonly onToggleGridDebug: () => void
	readonly onModelTuningChange: (next: ModelTuningState) => void
	readonly onResetModelTuning: () => void
	readonly onGridTuningChange: (next: CargoGridTuningState) => void
	readonly onResetGridTuning: (gridIndex: number) => void
	readonly onRefreshPage: () => void
}

function parseModelTuning(value: string, fallback: number) {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

export function CargoHoldDevToolsModal({
	cargoGridCount,
	modelTuning,
	gridTuning,
	showCoordinateSystem,
	showGridDebug,
	onClose,
	onToggleCoordinateSystem,
	onToggleGridDebug,
	onModelTuningChange,
	onResetModelTuning,
	onGridTuningChange,
	onResetGridTuning,
	onRefreshPage,
}: Readonly<CargoHoldDevToolsModalProps>) {
	const [gridEditorIndex, setGridEditorIndex] = useState<number | null>(null)

	useEffect(() => {
		if (
			gridEditorIndex !== null &&
			(cargoGridCount === 0 || gridEditorIndex >= cargoGridCount)
		) {
			setGridEditorIndex(null)
		}
	}, [cargoGridCount, gridEditorIndex])

	return (
		<div className='absolute top-4 bottom-20 right-4 z-40 w-96 max-w-[calc(100%-2rem)] rounded-lg border border-border/40 bg-gradient-to-b from-background to-background/95 p-4 shadow-xl overflow-auto'>
			<div className='mb-4 flex items-center justify-between'>
				<h3 className='text-sm font-semibold text-foreground'>Dev Tools</h3>
				<button
					type='button'
					onClick={onClose}
					className='rounded p-1 text-muted-foreground hover:bg-muted'
				>
					<svg
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
						className='h-4 w-4'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
				</button>
			</div>

			<div className='mb-4 space-y-2 border-b border-border/40 pb-4'>
				<div className='mb-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground'>
					Display
				</div>
				<button
					type='button'
					onClick={onToggleCoordinateSystem}
					className={`w-full rounded border px-2 py-1.5 text-left text-xs transition-colors ${
						showCoordinateSystem
							? 'border-blue-500/40 bg-blue-500/30 text-blue-300'
							: 'border-gray-500/40 bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
					}`}
				>
					📐 {showCoordinateSystem ? 'Hide' : 'Show'} Axes
				</button>
				<button
					type='button'
					onClick={onToggleGridDebug}
					className={`w-full rounded border px-2 py-1.5 text-left text-xs transition-colors ${
						showGridDebug
							? 'border-yellow-500/40 bg-yellow-500/30 text-yellow-300'
							: 'border-gray-500/40 bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
					}`}
				>
					📊 {showGridDebug ? 'Hide' : 'Show'} Grid Heights
				</button>
			</div>

			<div className='mb-4 border-b border-border/40 pb-4'>
				<div className='mb-2 flex items-center justify-between'>
					<div className='text-[11px] uppercase tracking-[0.1em] text-muted-foreground'>
						Model Tuner
					</div>
					<button
						type='button'
						onClick={onResetModelTuning}
						className='rounded border border-border/40 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted/40'
					>
						Reset
					</button>
				</div>
				<div className='space-y-2 text-xs'>
					<label className='flex items-center gap-2 rounded border border-border/40 px-2 py-1'>
						<span className='w-12 text-muted-foreground'>Scale</span>
						<input
							type='number'
							step='0.001'
							value={modelTuning.scale}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								onModelTuningChange({
									...modelTuning,
									scale: parseModelTuning(
										event.target.value,
										modelTuning.scale,
									),
								})
							}
							className='flex-1 bg-transparent text-foreground outline-none'
						/>
					</label>
					{(['x', 'y', 'z'] as const).map((axis, index) => (
						<label
							key={axis}
							className='flex items-center gap-2 rounded border border-border/40 px-2 py-1'
						>
							<span className='w-12 text-muted-foreground'>
								P{axis.toUpperCase()}
							</span>
							<input
								type='number'
								step='0.05'
								value={modelTuning.position[index]}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									onModelTuningChange({
										...modelTuning,
										position: modelTuning.position.map(
											(value, positionIndex) =>
												positionIndex === index
													? parseModelTuning(event.target.value, value)
													: value,
										) as [number, number, number],
									})
								}
								className='flex-1 bg-transparent text-foreground outline-none'
							/>
						</label>
					))}
					{(['x', 'y', 'z'] as const).map((axis, index) => (
						<label
							key={`rot-${axis}`}
							className='flex items-center gap-2 rounded border border-border/40 px-2 py-1'
						>
							<span className='w-12 text-muted-foreground'>
								R{axis.toUpperCase()}
							</span>
							<input
								type='number'
								step='0.05'
								value={modelTuning.rotation[index]}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									onModelTuningChange({
										...modelTuning,
										rotation: modelTuning.rotation.map(
											(value, rotationIndex) =>
												rotationIndex === index
													? parseModelTuning(event.target.value, value)
													: value,
										) as [number, number, number],
									})
								}
								className='flex-1 bg-transparent text-foreground outline-none'
							/>
						</label>
					))}
					<label className='flex items-center gap-2 rounded border border-border/40 px-2 py-1'>
						<span className='w-12 text-muted-foreground'>Opacity</span>
						<input
							type='number'
							min='0'
							max='1'
							step='0.01'
							value={modelTuning.opacity}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								onModelTuningChange({
									...modelTuning,
									opacity: Math.min(
										1,
										Math.max(
											0,
											parseModelTuning(event.target.value, modelTuning.opacity),
										),
									),
								})
							}
							className='flex-1 bg-transparent text-foreground outline-none'
						/>
					</label>
				</div>
			</div>

			<div className='mb-4 border-b border-border/40 pb-4'>
				<div className='mb-2 flex items-center justify-between'>
					<div className='text-[11px] uppercase tracking-[0.1em] text-muted-foreground'>
						Cargo Grids
					</div>
					{gridEditorIndex !== null && (
						<button
							type='button'
							onClick={() => onResetGridTuning(gridEditorIndex)}
							className='rounded border border-border/40 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted/40'
						>
							Reset
						</button>
					)}
				</div>
				<div className='space-y-2 text-xs max-h-96 overflow-y-auto pr-2'>
					<div className='flex flex-wrap gap-1'>
						{Array.from({ length: cargoGridCount }, (_, index) => (
							<button
								key={`cargo-grid-button-${index + 1}`}
								type='button'
								onClick={() =>
									setGridEditorIndex(gridEditorIndex === index ? null : index)
								}
								className={`flex-1 rounded border px-2 py-1 transition-colors ${
									gridEditorIndex === index
										? 'border-purple-500/40 bg-purple-500/30 text-purple-300'
										: 'border-gray-500/40 bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
								}`}
							>
								Grid {index + 1}
							</button>
						))}
					</div>
					{gridEditorIndex !== null && gridTuning[gridEditorIndex] && (
						<div className='mt-3 space-y-2 rounded border border-border/40 bg-black/20 p-2'>
							<label className='flex items-center gap-2'>
								<span className='w-12 text-muted-foreground'>PX</span>
								<input
									type='number'
									step='0.1'
									value={gridTuning[gridEditorIndex].position[0]}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										onGridTuningChange({
											...gridTuning,
											[gridEditorIndex]: {
												...gridTuning[gridEditorIndex],
												position: [
													parseModelTuning(
														event.target.value,
														gridTuning[gridEditorIndex].position[0],
													),
													gridTuning[gridEditorIndex].position[1],
													gridTuning[gridEditorIndex].position[2],
												],
											},
										})
									}
									className='flex-1 bg-transparent text-foreground outline-none'
								/>
							</label>
							<label className='flex items-center gap-2'>
								<span className='w-12 text-muted-foreground'>PY</span>
								<input
									type='number'
									step='0.1'
									value={gridTuning[gridEditorIndex].position[1]}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										onGridTuningChange({
											...gridTuning,
											[gridEditorIndex]: {
												...gridTuning[gridEditorIndex],
												position: [
													gridTuning[gridEditorIndex].position[0],
													parseModelTuning(
														event.target.value,
														gridTuning[gridEditorIndex].position[1],
													),
													gridTuning[gridEditorIndex].position[2],
												],
											},
										})
									}
									className='flex-1 bg-transparent text-foreground outline-none'
								/>
							</label>
							<label className='flex items-center gap-2'>
								<span className='w-12 text-muted-foreground'>PZ</span>
								<input
									type='number'
									step='0.1'
									value={gridTuning[gridEditorIndex].position[2]}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										onGridTuningChange({
											...gridTuning,
											[gridEditorIndex]: {
												...gridTuning[gridEditorIndex],
												position: [
													gridTuning[gridEditorIndex].position[0],
													gridTuning[gridEditorIndex].position[1],
													parseModelTuning(
														event.target.value,
														gridTuning[gridEditorIndex].position[2],
													),
												],
											},
										})
									}
									className='flex-1 bg-transparent text-foreground outline-none'
								/>
							</label>
							<label className='flex items-center gap-2'>
								<span className='w-12 text-muted-foreground'>W</span>
								<input
									type='number'
									step='0.1'
									value={gridTuning[gridEditorIndex].dimensions[0]}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										onGridTuningChange({
											...gridTuning,
											[gridEditorIndex]: {
												...gridTuning[gridEditorIndex],
												dimensions: [
													parseModelTuning(
														event.target.value,
														gridTuning[gridEditorIndex].dimensions[0],
													),
													gridTuning[gridEditorIndex].dimensions[1],
													gridTuning[gridEditorIndex].dimensions[2],
												],
											},
										})
									}
									className='flex-1 bg-transparent text-foreground outline-none'
								/>
							</label>
							<label className='flex items-center gap-2'>
								<span className='w-12 text-muted-foreground'>L</span>
								<input
									type='number'
									step='0.1'
									value={gridTuning[gridEditorIndex].dimensions[1]}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										onGridTuningChange({
											...gridTuning,
											[gridEditorIndex]: {
												...gridTuning[gridEditorIndex],
												dimensions: [
													gridTuning[gridEditorIndex].dimensions[0],
													parseModelTuning(
														event.target.value,
														gridTuning[gridEditorIndex].dimensions[1],
													),
													gridTuning[gridEditorIndex].dimensions[2],
												],
											},
										})
									}
									className='flex-1 bg-transparent text-foreground outline-none'
								/>
							</label>
							<label className='flex items-center gap-2'>
								<span className='w-12 text-muted-foreground'>H</span>
								<input
									type='number'
									step='0.1'
									value={gridTuning[gridEditorIndex].dimensions[2]}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										onGridTuningChange({
											...gridTuning,
											[gridEditorIndex]: {
												...gridTuning[gridEditorIndex],
												dimensions: [
													gridTuning[gridEditorIndex].dimensions[0],
													gridTuning[gridEditorIndex].dimensions[1],
													parseModelTuning(
														event.target.value,
														gridTuning[gridEditorIndex].dimensions[2],
													),
												],
											},
										})
									}
									className='flex-1 bg-transparent text-foreground outline-none'
								/>
							</label>
						</div>
					)}
				</div>
			</div>

			<div className='mb-2'>
				<div className='mb-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground'>
					Actions
				</div>
				<button
					type='button'
					onClick={onRefreshPage}
					className='w-full rounded border border-border/40 px-2 py-1.5 text-left text-xs text-gray-400 transition-colors hover:bg-gray-500/30'
				>
					🔄 Refresh Page
				</button>
			</div>
		</div>
	)
}
