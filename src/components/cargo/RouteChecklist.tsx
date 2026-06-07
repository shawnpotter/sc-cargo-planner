// @/components/cargo/RouteChecklist.tsx
'use client'

import { useState, useMemo } from 'react'
import { RouteStop, StopStatus } from '@/constants/types'
import { cn } from '@/lib/utils'
import {
	ChevronDownIcon,
	ChevronUpIcon,
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
	TruckIcon,
	MapPinIcon,
	FlagIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { Loader2 } from 'lucide-react'
import { getNextStatus } from '@/providers/CargoProvider'

interface RouteChecklistProps {
	stops: RouteStop[]
	/** The full ordered route array from the optimizer (includes waypoints). */
	route?: string[]
	startLocation?: string | null
	endLocation?: string | null
	isClosedLoop?: boolean
	className?: string
	stopStatuses: Record<string, StopStatus>
	onStopStatusChange: (location: string) => void
}

type TimelineNodeProps = {
	status: StopStatus
	isStart?: boolean
	isEnd?: boolean
	onToggle?: () => void
	location: string
}

type ConnectorLineProps = {
	status: StopStatus
}

type PickupDetailsProps = {
	pickups: RouteStop['operations']['pickups']
}

type DeliveryDetailsProps = {
	deliveries: RouteStop['operations']['deliveries']
}

type CargoStateBarProps = {
	stop: RouteStop
}

type StopRowProps = {
	stop: RouteStop
	displayIndex: number
	status: StopStatus
	isLast: boolean
	onToggle: () => void
}

// --- Sub-components ---

function TimelineNode({
	status,
	isStart,
	isEnd,
	onToggle,
	location,
}: Readonly<TimelineNodeProps>) {
	if (isStart) {
		return (
			<div className='w-5 h-5 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center flex-shrink-0'>
				<FlagIcon className='w-2.5 h-2.5 text-green-500' />
			</div>
		)
	}

	if (isEnd) {
		return (
			<div className='w-5 h-5 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center flex-shrink-0'>
				<MapPinIcon className='w-2.5 h-2.5 text-red-500' />
			</div>
		)
	}

	const statusLabels: Record<StopStatus, string> = {
		idle: 'in progress',
		'in-progress': 'complete',
		completed: 'not started',
	}

	return (
		<button
			type='button'
			onClick={onToggle}
			aria-label={`Mark ${location} as ${statusLabels[status]}`}
			className={cn(
				'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
				status === 'completed' &&
					'bg-green-500 border-green-500 shadow-[0_0_6px_rgba(34,197,94,0.3)]',
				status === 'in-progress' &&
					'bg-orange-500 border-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.3)]',
				status === 'idle' &&
					'bg-background border-border hover:border-orange-400',
			)}
		>
			{status === 'completed' && <CheckIcon className='w-3 h-3 text-white' />}
			{status === 'in-progress' && <Loader2 className='w-3 h-3 text-white' />}
		</button>
	)
}

function ConnectorLine({ status }: Readonly<ConnectorLineProps>) {
	return (
		<div
			className={cn(
				'w-px flex-1 mt-1 mb-1 min-h-[1rem] transition-colors duration-300',
				status === 'completed' && 'bg-green-500/50',
				status === 'in-progress' && 'bg-orange-500/50',
				status === 'idle' && 'bg-border/50',
			)}
		/>
	)
}

const STOP_TYPE_CONFIG = {
	pickup: {
		badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
		icon: <ArrowDownTrayIcon className='w-3 h-3' />,
		label: 'PICKUP',
		headerColor: 'text-blue-400',
		borderColor: 'border-blue-500/20',
	},
	delivery: {
		badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
		icon: <ArrowUpTrayIcon className='w-3 h-3' />,
		label: 'DELIVERY',
		headerColor: 'text-orange-400',
		borderColor: 'border-orange-500/20',
	},
	both: {
		badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
		icon: <TruckIcon className='w-3 h-3' />,
		label: 'PICKUP & DELIVER',
		headerColor: 'text-purple-400',
		borderColor: 'border-purple-500/20',
	},
} as const

function PickupDetails({ pickups }: Readonly<PickupDetailsProps>) {
	if (pickups.length === 0) return null

	return (
		<div>
			<p className='text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1'>
				<ArrowDownTrayIcon className='w-3 h-3' />
				Loading
			</p>
			<div className='space-y-1 pl-2 border-l-2 border-blue-500/20'>
				{pickups.map((pickup, i) => (
					<div
						key={`pickup-${i}-${pickup.cargoType}-${pickup.contractIndex}`}
						className='text-xs text-muted-foreground leading-relaxed'
					>
						<span className='text-foreground font-medium'>
							{pickup.cargoType}
						</span>
						<span className='mx-1'>·</span>
						<span>{pickup.quantity} SCU</span>
						<span className='mx-1 text-muted-foreground/50'>→</span>
						<span className='text-orange-400/80'>{pickup.destinedFor}</span>
					</div>
				))}
			</div>
		</div>
	)
}

function DeliveryDetails({ deliveries }: Readonly<DeliveryDetailsProps>) {
	if (deliveries.length === 0) return null

	return (
		<div>
			<p className='text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1'>
				<ArrowUpTrayIcon className='w-3 h-3' />
				Unloading
			</p>
			<div className='space-y-1 pl-2 border-l-2 border-orange-500/20'>
				{deliveries.map((delivery, i) => (
					<div
						key={`delivery-${i}-${delivery.cargoType}-${delivery.contractIndex}`}
						className='text-xs text-muted-foreground leading-relaxed'
					>
						<span className='text-foreground font-medium'>
							{delivery.cargoType}
						</span>
						<span className='mx-1'>·</span>
						<span>{delivery.quantity} SCU</span>
						<span className='mx-1 text-muted-foreground/50'>from</span>
						<span className='text-blue-400/80'>{delivery.pickedUpFrom}</span>
					</div>
				))}
			</div>
		</div>
	)
}

function CargoStateBar({ stop }: Readonly<CargoStateBarProps>) {
	const before = stop.cargoStateBefore.totalSCU
	const after = stop.cargoStateAfter.totalSCU
	const delta = after - before
	let deltaLabel: string | null = null
	let deltaColor = ''

	if (delta > 0) {
		deltaLabel = `+${delta} SCU`
		deltaColor = 'text-blue-400'
	} else if (delta < 0) {
		deltaLabel = `${delta} SCU`
		deltaColor = 'text-orange-400'
	}

	return (
		<div className='flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 mt-1'>
			<span>Hold after: {after} SCU</span>
			{deltaLabel && (
				<span className={cn('font-mono font-semibold', deltaColor)}>
					{deltaLabel}
				</span>
			)}
		</div>
	)
}

function StopRow({
	stop,
	displayIndex,
	status,
	isLast,
	onToggle,
}: Readonly<StopRowProps>) {
	const [isExpanded, setIsExpanded] = useState(false)
	const config = STOP_TYPE_CONFIG[stop.type]

	const totalSCU = [
		...stop.operations.pickups,
		...stop.operations.deliveries,
	].reduce((sum, c) => sum + c.quantity, 0)

	const pickupCount = stop.operations.pickups.length
	const deliveryCount = stop.operations.deliveries.length

	const cargoSummary = [
		pickupCount > 0 ? `${pickupCount} load` : null,
		deliveryCount > 0 ? `${deliveryCount} unload` : null,
	]
		.filter(Boolean)
		.join(' · ')

	const statusLabel: Record<StopStatus, string | null> = {
		idle: null,
		'in-progress': 'In Progress',
		completed: 'Completed',
	}

	return (
		<div
			className={cn(
				'transition-colors duration-200',
				status === 'completed' && 'bg-green-500/5',
				status === 'in-progress' && 'bg-orange-500/5',
			)}
		>
			<div className='flex items-start gap-2.5 px-3 py-2'>
				{/* Timeline column */}
				<div className='flex flex-col items-center flex-shrink-0 self-stretch pt-0.5'>
					<TimelineNode
						status={status}
						onToggle={onToggle}
						location={stop.location}
					/>
					{!isLast && <ConnectorLine status={status} />}
				</div>

				{/* Content column */}
				<div className='flex-1 min-w-0 pb-1'>
					{/* Top row: display index + location + type badge */}
					<div className='flex items-start gap-1.5 flex-wrap'>
						<span
							className={cn(
								'text-xs font-mono font-bold leading-5 flex-shrink-0',
								status === 'completed' && 'text-green-500',
								status === 'in-progress' && 'text-orange-500',
								status === 'idle' && 'text-muted-foreground',
							)}
						>
							{displayIndex}.
						</span>
						<p
							className={cn(
								'text-sm font-medium leading-5 min-w-0 flex-1',
								status === 'completed' && 'line-through text-muted-foreground',
							)}
						>
							{stop.location}
						</p>
						<span
							className={cn(
								'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border flex-shrink-0',
								config.badge,
							)}
						>
							{config.icon}
							{config.label}
						</span>
					</div>

					{/* Status indicator when in-progress or completed */}
					{statusLabel[status] && (
						<div className='flex items-center gap-1.5 mt-0.5'>
							<span
								className={cn(
									'inline-block w-1.5 h-1.5 rounded-full',
									status === 'in-progress' && 'bg-orange-500',
									status === 'completed' && 'bg-green-500',
								)}
							/>
							<span
								className={cn(
									'text-xs font-medium',
									status === 'in-progress' && 'text-orange-500',
									status === 'completed' && 'text-green-500',
								)}
							>
								{statusLabel[status]}
								{status === 'in-progress' &&
									(stop.type === 'pickup' || stop.type === 'both') &&
									' — Cargo loaded onto grid'}
							</span>
						</div>
					)}

					{/* Second row: cargo summary + expand toggle */}
					<div className='flex items-center justify-between mt-0.5'>
						<span className='text-xs text-muted-foreground'>
							{totalSCU} SCU · {cargoSummary}
						</span>
						<button
							type='button'
							onClick={() => setIsExpanded((v) => !v)}
							className='flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0'
						>
							{isExpanded ? (
								<>
									Less
									<ChevronUpIcon className='w-3 h-3' />
								</>
							) : (
								<>
									Details
									<ChevronDownIcon className='w-3 h-3' />
								</>
							)}
						</button>
					</div>

					{/* Expandable details */}
					{isExpanded && (
						<div className='mt-2 space-y-2'>
							<PickupDetails pickups={stop.operations.pickups} />
							<DeliveryDetails deliveries={stop.operations.deliveries} />
							<CargoStateBar stop={stop} />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

// --- Ordering utility ---

/**
 * Orders stops by actual travel/unloading sequence.
 *
 * The `stops` array from the optimizer has `sequenceNumber` assigned in
 * LOADING order (FILO) — containers loaded first are delivered last.
 * For the checklist, we need TRAVEL order (where we actually go first).
 *
 * Travel order is:
 * 1. Pickup stops first (in ascending sequenceNumber order)
 * 2. Delivery stops in REVERSE sequenceNumber order (FILO → FIFO for travel)
 *
 * For "both" type stops (pickup AND delivery at same location), we treat
 * them as pickups if they appear early in the sequence, otherwise as
 * deliveries. This handles the edge case of returning to a location.
 */
function orderStopsByTravelSequence(stops: RouteStop[]): RouteStop[] {
	if (stops.length === 0) return []

	// Separate pure pickup stops from stops that have deliveries
	const pickupOnlyStops: RouteStop[] = []
	const deliveryStops: RouteStop[] = [] // includes 'delivery' and 'both' types

	// Find the minimum sequence number to identify "early" stops
	const minSeq = Math.min(...stops.map((s) => s.sequenceNumber))

	for (const stop of stops) {
		if (stop.type === 'pickup') {
			// Pure pickup — always goes first
			pickupOnlyStops.push(stop)
		} else if (stop.type === 'both' && stop.sequenceNumber === minSeq) {
			// "Both" at the very start of the journey — treat as pickup-first
			pickupOnlyStops.push(stop)
		} else {
			// Delivery or "both" that happens later — part of delivery sequence
			deliveryStops.push(stop)
		}
	}

	// Sort pickup stops by ascending sequence (first pickup first)
	pickupOnlyStops.sort((a, b) => a.sequenceNumber - b.sequenceNumber)

	// Sort delivery stops by DESCENDING sequence number
	// This converts FILO (loading order) → travel order (unload accessible cargo first)
	// Highest sequenceNumber = loaded first = at back = unload LAST in loading order
	// But for travel, we visit the location where top cargo goes FIRST
	// Top cargo = loaded LAST = lowest delivery sequenceNumber
	// So we want ASCENDING by sequenceNumber for travel? Let me reconsider...
	//
	// Actually:
	// - Loading order is FILO: load cargo for LAST delivery FIRST
	// - So cargo with HIGH sequenceNumber (last delivery in loading order) is loaded FIRST
	// - That cargo is at the BACK of the hold
	// - We should UNLOAD front cargo first, which is LOW sequenceNumber cargo
	// - So travel order for deliveries = ASCENDING sequenceNumber
	//
	// Wait, but the user said the display shows seq 2,3,4,5 (ascending) and that's FILO...
	// Let me re-read: "Items 2-5 are the FILO Order" means the DISPLAY is showing FILO.
	// The user wants to see: 5,4,3,2 (descending) which is travel order.
	//
	// So: current display = ascending seq = FILO (loading) order
	//     desired display = descending seq = travel (unloading) order
	deliveryStops.sort((a, b) => b.sequenceNumber - a.sequenceNumber)

	return [...pickupOnlyStops, ...deliveryStops]
}

// --- Main Component ---

/**
 * Displays an interactive route checklist with pickup/delivery stop details.
 * Each stop cycles through three states: idle → in-progress → completed.
 * When a stop is "in-progress", containers that are picked up at that location
 * become visible on the cargo hold grid.
 *
 * Stops are displayed in TRAVEL order:
 * - Pickups first (where you load cargo)
 * - Deliveries in the order you should visit them (accessible cargo first)
 */
function RouteChecklist({
	stops,
	route,
	startLocation,
	endLocation,
	isClosedLoop = false,
	className,
	stopStatuses,
	onStopStatusChange,
}: Readonly<RouteChecklistProps>) {
	const [isCollapsed, setIsCollapsed] = useState(false)

	// Order stops by travel sequence (pickups first, then deliveries in unload order)
	const orderedStops = useMemo(() => orderStopsByTravelSequence(stops), [stops])

	const completedCount = orderedStops.filter(
		(stop) => stopStatuses[stop.location] === 'completed',
	).length
	const inProgressCount = orderedStops.filter(
		(stop) => stopStatuses[stop.location] === 'in-progress',
	).length
	const totalCount = orderedStops.length
	const progressPercent =
		totalCount > 0 ? (completedCount / totalCount) * 100 : 0
	const allComplete = completedCount === totalCount && totalCount > 0
	const hasStops = orderedStops.length > 0

	let borderClass = 'border-border/40'
	let headerAccentClass = 'bg-muted-foreground/40'
	let progressClass = 'accent-muted-foreground'

	if (hasStops) {
		if (allComplete) {
			borderClass = 'border-green-500/60'
			headerAccentClass = 'bg-green-500'
			progressClass = 'accent-green-500'
		} else if (inProgressCount > 0) {
			borderClass = 'border-orange-500/60'
			headerAccentClass = 'bg-orange-500'
			progressClass = 'accent-orange-500'
		} else {
			borderClass = 'border-border/60'
			headerAccentClass = 'bg-muted-foreground'
			progressClass = 'accent-muted-foreground'
		}
	}

	const finalLocation = isClosedLoop
		? (startLocation ?? 'Pending')
		: (endLocation ?? startLocation ?? 'Pending')

	const getStatusText = () => {
		if (!hasStops) return 'Pending'
		const parts: string[] = []
		if (inProgressCount > 0) parts.push(`${inProgressCount} active`)
		parts.push(`${completedCount}/${totalCount} done`)
		return parts.join(' · ')
	}

	return (
		<div
			className={cn(
				'flex flex-col h-full min-h-0 max-h-full bg-background/95 backdrop-blur-sm border rounded-lg shadow-2xl overflow-hidden transition-all duration-200',
				borderClass,
				className,
			)}
		>
			{/* Collapsible Header */}
			<button
				type='button'
				onClick={() => setIsCollapsed((v) => !v)}
				className='flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/50 transition-colors border-b border-border/40 text-left'
			>
				<div className='flex items-center gap-2 min-w-0'>
					<div
						className={cn(
							'w-1 h-4 rounded-full flex-shrink-0 transition-colors',
							headerAccentClass,
						)}
					/>
					<span className='font-semibold text-sm'>Route</span>
					<span className='text-xs text-muted-foreground flex-shrink-0'>
						{getStatusText()}
					</span>
				</div>

				<div className='flex items-center gap-2 flex-shrink-0'>
					<progress
						className={cn('w-16 h-1.5', progressClass)}
						max={100}
						value={progressPercent}
					/>
					{isCollapsed ? (
						<ChevronDownIcon className='w-4 h-4 text-muted-foreground' />
					) : (
						<ChevronUpIcon className='w-4 h-4 text-muted-foreground' />
					)}
				</div>
			</button>

			{/* Stop List */}
			{!isCollapsed && hasStops && (
				<div className='flex-1 min-h-0 max-h-full overflow-y-auto divide-y divide-border/20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
					{/* Start node */}
					<div className='flex items-center gap-2.5 px-3 py-2 bg-green-500/5'>
						<div className='flex flex-col items-center flex-shrink-0 self-stretch pt-0.5'>
							<TimelineNode
								status='idle'
								isStart
								location={startLocation ?? 'Pending'}
							/>
							<ConnectorLine status='idle' />
						</div>
						<div className='pb-1'>
							<p className='text-xs text-green-500 font-semibold tracking-wide'>
								START
							</p>
							<p className='text-sm font-medium'>
								{startLocation ?? 'Pending'}
							</p>
						</div>
					</div>

					{/* Route stops — ordered by travel sequence */}
					{orderedStops.map((stop, index) => (
						<StopRow
							key={`${stop.location}-${stop.sequenceNumber}`}
							stop={stop}
							displayIndex={index + 1}
							status={stopStatuses[stop.location] || 'idle'}
							isLast={index === orderedStops.length - 1}
							onToggle={() => onStopStatusChange(stop.location)}
						/>
					))}

					{/* End / Return node */}
					<div className='flex items-center gap-2.5 px-3 py-2 bg-red-500/5'>
						<div className='flex flex-col items-center flex-shrink-0 pt-0.5'>
							<TimelineNode
								status='idle'
								isEnd
								location={finalLocation}
							/>
						</div>
						<div>
							<p className='text-xs text-red-400 font-semibold tracking-wide'>
								{isClosedLoop ? 'RETURN' : 'END'}
							</p>
							<p className='text-sm font-medium'>{finalLocation}</p>
						</div>
					</div>
				</div>
			)}

			{/* Legend */}
			{!isCollapsed && hasStops && (
				<div className='px-3 py-2 bg-muted/20 border-t border-border/20'>
					<p className='text-xs text-muted-foreground mb-1'>
						Tap a stop to cycle:
					</p>
					<div className='flex items-center gap-3 text-xs'>
						<div className='flex items-center gap-1'>
							<div className='w-3 h-3 rounded-full border-2 border-border bg-background' />
							<span className='text-muted-foreground'>Idle</span>
						</div>
						<div className='flex items-center gap-1'>
							<div className='w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-500' />
							<span className='text-muted-foreground'>In Progress</span>
						</div>
						<div className='flex items-center gap-1'>
							<div className='w-3 h-3 rounded-full bg-green-500 border-2 border-green-500' />
							<span className='text-muted-foreground'>Done</span>
						</div>
					</div>
				</div>
			)}

			{!isCollapsed && !hasStops && (
				<div className='px-3 py-3 bg-card/50 border-t border-border/20'>
					<p className='text-xs font-semibold tracking-wide text-muted-foreground'>
						PENDING
					</p>
					<p className='text-sm text-muted-foreground mt-1'>
						Add contracts and generate a layout to populate route stops.
					</p>
					<p className='text-xs text-muted-foreground/80 mt-2'>
						Start: {startLocation ?? 'Not selected'}
					</p>
				</div>
			)}
		</div>
	)
}

export { RouteChecklist }
