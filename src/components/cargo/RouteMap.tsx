'use client'

import { useId, useMemo, useRef, useState } from 'react'
import type { RouteStop, StopStatus } from '@/constants/types'
import type { Location } from '@/data/locations'
import { buildMapVisits, getLocationSystem, getParentBody, layoutMapVisits } from '@/lib/map/routeView'
import { getStopId } from '@/utils/stopIdentity'

export interface RouteMapProps {
	locations: Location[]
	route: string[]
	stops: RouteStop[]
	stopStatuses: Record<string, StopStatus>
	selectedStopId: string | null
	onSelectStop: (id: string) => void
	cached: boolean
	error: string | null
	onRetry: () => void
}

const controlClass = 'min-h-11 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary'

export function RouteMap({ locations, route, stops, stopStatuses, selectedStopId, onSelectStop, cached, error, onRetry }: RouteMapProps) {
	const arrowId = useId().replaceAll(':', '')
	const { visits, missing } = useMemo(() => buildMapVisits(locations, route, stops), [locations, route, stops])
	const [chosenSystem, setChosenSystem] = useState('')
	const [parentBody, setParentBody] = useState('')
	const [camera, setCamera] = useState({ scale: 1, x: 0, y: 0 })
	const [previousSelection, setPreviousSelection] = useState(selectedStopId)
	const drag = useRef<{ id: number; x: number; y: number } | null>(null)
	const systems = [...new Set(visits.map((visit) => getLocationSystem(visit.location)))]
	const selected = visits.find((visit) => visit.stop && getStopId(visit.stop) === selectedStopId)
	const previousSelected = visits.find((visit) => visit.stop && getStopId(visit.stop) === previousSelection)
	const previousSystem = systems.includes(chosenSystem) ? chosenSystem : previousSelected ? getLocationSystem(previousSelected.location) : systems[0] ?? ''
	const sharesLocalView = (location: Location, visibleSystem: string) => Boolean(parentBody) && getLocationSystem(location) === visibleSystem && getParentBody(location, locations) === parentBody
	// Synchronize an external checklist selection before rendering its map view.
	if (previousSelection !== selectedStopId) {
		setPreviousSelection(selectedStopId)
		if (selected) {
			setChosenSystem(getLocationSystem(selected.location))
			const staysInLocalView = sharesLocalView(selected.location, previousSystem)
			if (!staysInLocalView) {
				setParentBody('')
				setCamera({ scale: 1, x: 0, y: 0 })
			}
		}
	}
	const system = systems.includes(chosenSystem) ? chosenSystem : selected ? getLocationSystem(selected.location) : systems[0] ?? ''
	const bodies = [...new Set(visits.filter((visit) => getLocationSystem(visit.location) === system).flatMap((visit) => {
		const body = getParentBody(visit.location, locations)
		return body ? [body] : []
	}))]
	const activeBody = bodies.includes(parentBody) ? parentBody : ''
	const visible = visits.filter((visit) => getLocationSystem(visit.location) === system && (!activeBody || getParentBody(visit.location, locations) === activeBody || visit.location.name === activeBody))
	const points = layoutMapVisits(visible)
	const fit = () => setCamera({ scale: 1, x: 0, y: 0 })
	const zoom = (factor: number) => setCamera((previous) => {
		const scale = Math.min(5, Math.max(0.5, previous.scale * factor))
		const ratio = scale / previous.scale
		return { scale, x: 400 - (400 - previous.x) * ratio, y: 220 - (220 - previous.y) * ratio }
	})
	const selectVisit = (stop: RouteStop, location: Location) => {
		const staysInLocalView = sharesLocalView(location, system)
		setChosenSystem(getLocationSystem(location))
		if (!staysInLocalView) {
			setParentBody('')
			fit()
		}
		onSelectStop(getStopId(stop))
	}
	const current = stops.find((stop) => stopStatuses[getStopId(stop)] === 'in-progress') ?? stops.find((stop) => stopStatuses[getStopId(stop)] !== 'completed')
	const label = (stop: RouteStop) => stopStatuses[getStopId(stop)] === 'completed' ? 'Completed' : stopStatuses[getStopId(stop)] === 'in-progress' ? 'Current visit' : stop === current ? 'Next visit' : 'Not started'
	const unavailable = missing.length > 0 || visits.length === 0

	return <section className='rounded-2xl border border-border bg-card p-4 sm:p-6' aria-label='Planned route map'>
		<div className='flex flex-wrap items-start justify-between gap-3'>
			<div><p className='text-xs uppercase tracking-[0.16em] text-primary'>Navigation</p><h2 className='mt-1 text-lg font-semibold'>Your planned route</h2></div>
			{cached && <span className='rounded-full border px-3 py-1 text-xs'>Fallback map data</span>}
		</div>
		{error && <div className='mt-3 flex flex-wrap items-center gap-3 text-sm' role='status'><p>{error}</p><button className={controlClass} onClick={onRetry}>Retry map data</button></div>}
		{unavailable ? <div className='mt-5 rounded-xl border border-dashed p-6'><h3 className='font-medium'>Map unavailable</h3><p className='mt-2 text-sm text-muted-foreground'>{missing.length ? `Missing coordinates for ${missing.join(', ')}. Retry map data to show the complete route.` : 'Generate a plan with available location data to see its route.'} Your route checklist and cargo view are still available.</p><button className={`${controlClass} mt-4`} onClick={onRetry}>Retry map</button></div> : <>
			<div className='mt-4 flex flex-wrap items-end gap-2'>
				<label className='grid gap-1 text-xs'>System<select className={controlClass} value={system} onChange={(event) => { setChosenSystem(event.target.value); setParentBody(''); fit() }}>{systems.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
				<label className='grid gap-1 text-xs'>Local detail<select className={controlClass} value={activeBody} onChange={(event) => { setParentBody(event.target.value); fit() }}><option value=''>Whole system route</option>{bodies.map((body) => <option key={body} value={body}>Around {body}</option>)}</select></label>
				<button className={controlClass} aria-label='Zoom in' onClick={() => zoom(1.35)}>+</button><button className={controlClass} aria-label='Zoom out' onClick={() => zoom(1 / 1.35)}>−</button><button className={controlClass} onClick={fit}>Fit route</button>
			</div>
			<p className='my-3 text-xs text-muted-foreground'>Drag to pan. Use + and − to zoom with mouse or touch. {activeBody ? `Local view around ${activeBody}.` : `${system} coordinates only.`} Close visits are spread apart with lines to their positions.</p>
			<div className='relative h-[390px] touch-none overflow-hidden rounded-xl border border-border bg-background' aria-label={`${system} route view`} onPointerDown={(event) => { if (event.button !== 0) return; event.currentTarget.setPointerCapture?.(event.pointerId); drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY } }} onPointerMove={(event) => {
				const previous = drag.current
				if (!previous || previous.id !== event.pointerId) return
				const bounds = event.currentTarget.getBoundingClientRect()
				if (bounds.width && bounds.height) setCamera((camera) => ({ ...camera, x: camera.x + (event.clientX - previous.x) * 800 / bounds.width, y: camera.y + (event.clientY - previous.y) * 440 / bounds.height }))
				drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
			}} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
				<svg viewBox='0 0 800 440' preserveAspectRatio='none' className='absolute inset-0 h-full w-full' aria-hidden='true'>
					<defs><marker id={arrowId} markerWidth='8' markerHeight='8' refX='12' refY='4' orient='auto'><path d='M0 0 L8 4 L0 8' fill='currentColor' /></marker></defs>
					<g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`} className='text-primary'>
						{points.map((point, index) => { const next = points[index + 1]; return next && next.index === point.index + 1 ? <line key={`leg-${point.index}`} x1={point.x} y1={point.y} x2={next.x} y2={next.y} stroke='currentColor' strokeWidth='2' markerEnd={`url(#${arrowId})`} /> : null })}
						{points.map((point) => <g key={point.index}><line x1={point.anchorX} y1={point.anchorY} x2={point.x} y2={point.y} stroke='currentColor' strokeDasharray='3 4' opacity='0.5' /><circle cx={point.anchorX} cy={point.anchorY} r='3' fill='currentColor' /></g>)}
					</g>
				</svg>
				{points.map((point) => {
					const stop = point.stop
					const isSelected = stop && getStopId(stop) === selectedStopId
					const completed = stop && stopStatuses[getStopId(stop)] === 'completed'
					const next = stop === current
					const start = point.index === 0
					const end = point.index === route.length - 1
					const gateway = point.location.type === 'GATEWAY'
					const markerLabel = `${stop ? `Visit ${stop.sequenceNumber}` : `Transit ${point.index + 1}`}: ${point.location.name}${start ? ', Start' : ''}${end ? ', End' : ''}${gateway ? ', Gateway' : ''}${stop ? `, ${label(stop)}` : ''}`
					return <button key={point.index} className={`absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 text-sm font-semibold shadow-lg ${start || end || gateway ? 'rounded-lg' : 'rounded-full'} ${isSelected ? 'ring-4 ring-primary/50' : ''} ${completed ? 'border-emerald-500 bg-emerald-950 text-emerald-100' : next ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`} style={{ left: `${(point.x * camera.scale + camera.x) / 8}%`, top: `${(point.y * camera.scale + camera.y) / 4.4}%` }} aria-label={markerLabel} aria-pressed={Boolean(isSelected)} title={markerLabel} onPointerDown={(event) => event.stopPropagation()} onClick={() => { if (stop) onSelectStop(getStopId(stop)) }} disabled={!stop}>
						{completed ? '✓ ' : next ? '▶ ' : ''}{stop?.sequenceNumber ?? (gateway ? '◇' : '·')}
					</button>
				})}
			</div>
			<p className='mt-2 text-xs text-muted-foreground'>Square: start, end or gateway. ✓ Completed. ▶ Current or next visit. Numbers match the checklist. Map selection does not change progress.</p>
			{visits.some((visit, index) => index > 0 && getLocationSystem(visit.location) !== getLocationSystem(visits[index - 1].location)) && <div className='mt-4 rounded-lg border p-3 text-sm'><h3 className='font-medium'>System transitions</h3>{visits.map((visit, index) => { const previous = visits[index - 1]; return previous && getLocationSystem(previous.location) !== getLocationSystem(visit.location) ? <p className='mt-1' key={visit.index}>Gateway transition: {previous.location.name} ({getLocationSystem(previous.location)}) → {visit.location.name} ({getLocationSystem(visit.location)})</p> : null })}</div>}
			<div className='mt-4 flex flex-wrap gap-2' aria-label='Select a route visit'>{visits.map((visit) => visit.stop ? <button key={visit.index} className={`${controlClass} ${getStopId(visit.stop) === selectedStopId ? 'border-primary bg-primary/10' : ''}`} aria-pressed={getStopId(visit.stop) === selectedStopId} onClick={() => { if (visit.stop) selectVisit(visit.stop, visit.location) }}>{visit.stop.sequenceNumber}. {visit.location.name}</button> : <span key={visit.index} className='self-center px-2 text-xs text-muted-foreground'>{visit.index === 0 ? 'Start' : visit.index === route.length - 1 ? 'End' : 'Transit'}: {visit.location.name}</span>)}</div>
			{selected?.stop && <div className='mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4' aria-live='polite'><h3 className='font-semibold'>Visit {selected.stop.sequenceNumber}: {selected.location.name}</h3><p className='mt-1 text-sm'>{label(selected.stop)} · {getLocationSystem(selected.location)}{selected.location.parentObject ? ` · ${selected.location.parentObject}` : ''}</p><ul className='mt-3 space-y-2 text-sm'>{selected.stop.operations.pickups.map((pickup, index) => <li key={`pickup-${index}`}>Pick up {pickup.quantity} SCU {pickup.cargoType} for {pickup.destinedFor}</li>)}{selected.stop.operations.deliveries.map((delivery, index) => <li key={`delivery-${index}`}>Deliver {delivery.quantity} SCU {delivery.cargoType} from {delivery.pickedUpFrom}</li>)}</ul>{getParentBody(selected.location, locations) && <button className={`${controlClass} mt-3`} onClick={() => { setChosenSystem(getLocationSystem(selected.location)); setParentBody(getParentBody(selected.location, locations) ?? ''); fit() }}>Show local detail</button>}</div>}
		</>}
	</section>
}
