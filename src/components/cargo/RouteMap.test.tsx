import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteMap, type RouteMapProps } from './RouteMap'
import type { Location } from '@/data/locations'
import type { RouteStop } from '@/constants/types'

const locations: Location[] = [
	{ name: 'Body', type: 'PLANET', system: 'stanton', coordinates: { x: 10, y: 20, z: 0 } },
	{ name: 'A', type: 'ORBITAL_STATION', parentObject: 'Body', system: 'stanton', coordinates: { x: 10, y: 20, z: 0 } },
	{ name: 'B', type: 'SURFACE_LOCATION', parentObject: 'Body', system: 'stanton', coordinates: { x: 10, y: 20, z: 0 } },
	{ name: 'Stanton gateway', type: 'GATEWAY', system: 'stanton', coordinates: { x: 30, y: 40, z: 0 } },
	{ name: 'Pyro gateway', type: 'GATEWAY', system: 'pyro', coordinates: { x: 0, y: 0, z: 0 } },
	{ name: 'C', type: 'ORBITAL_STATION', system: 'pyro', coordinates: { x: 20, y: 10, z: 0 } },
]
const stop = (location: string, sequenceNumber: number): RouteStop => ({ location, sequenceNumber, type: 'both', contractIndices: [0], operations: {
	pickups: [{ cargoType: 'Food', quantity: 2, contractIndex: 0, deliveryPointIndex: 0, destinedFor: 'B' }],
	deliveries: [{ cargoType: 'Ore', quantity: 1, contractIndex: 0, deliveryPointIndex: 0, pickedUpFrom: 'A' }],
}, cargoStateBefore: { containers: [], totalSCU: 0, byDestination: new Map() }, cargoStateAfter: { containers: [], totalSCU: 0, byDestination: new Map() } })
const props = (): RouteMapProps => ({ locations, route: ['A', 'B', 'A', 'Stanton gateway', 'Pyro gateway', 'C'], stops: [stop('A', 1), stop('B', 2), stop('A', 3), stop('C', 4)], stopStatuses: { '1:A': 'completed' }, selectedStopId: null, onSelectStop: vi.fn(), cached: false, error: null, onRetry: vi.fn() })
afterEach(cleanup)

describe('RouteMap', () => {
	it('keeps overlapping and return visits individually selectable with independent progress', () => {
		const input = props()
		render(<RouteMap {...input} />)
		const first = screen.getByRole('button', { name: 'Visit 1: A, Start, Completed' })
		const returning = screen.getByRole('button', { name: 'Visit 3: A, Not started' })
		expect(first.style.left).not.toBe(returning.style.left)
		fireEvent.click(returning)
		expect(input.onSelectStop).toHaveBeenCalledWith('3:A')
		expect(input.stopStatuses).toEqual({ '1:A': 'completed' })
		expect(screen.getByRole('button', { name: 'Visit 2: B, Next visit' })).toBeTruthy()
	})
	it('follows checklist selection across systems and shows its cargo details', () => {
		const input = props()
		const { rerender } = render(<RouteMap {...input} />)
		expect(screen.queryByRole('button', { name: 'Visit 4: C, End, Not started' })).toBeNull()
		rerender(<RouteMap {...input} selectedStopId='4:C' />)
		expect(screen.getByRole('button', { name: 'Visit 4: C, End, Not started' }).getAttribute('aria-pressed')).toBe('true')
		expect(screen.getByText('Pick up 2 SCU Food for B')).toBeTruthy()
		expect(screen.getByText('Deliver 1 SCU Ore from A')).toBeTruthy()
		expect(screen.getByText(/Gateway transition: Stanton gateway/)).toBeTruthy()
	})
	it('offers local context, zoom and fit without changing progress', () => {
		const input = props()
		render(<RouteMap {...input} selectedStopId='2:B' />)
		fireEvent.click(screen.getByRole('button', { name: 'Show local detail' }))
		expect(screen.getByRole('option', { name: 'Around Body', selected: true })).toBeTruthy()
		expect(screen.queryByRole('button', { name: /Transit 4: Stanton gateway/ })).toBeNull()
		const marker = screen.getByRole('button', { name: 'Visit 2: B, Next visit' })
		const left = marker.style.left
		fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
		expect(marker.style.left).not.toBe(left)
		fireEvent.click(screen.getByRole('button', { name: 'Fit route' }))
		expect(marker.style.left).toBe(left)
		expect(input.onSelectStop).not.toHaveBeenCalled()
	})
	it('preserves local detail when selecting another visit within the same body', () => {
		const input = props()
		const { rerender } = render(<RouteMap {...input} selectedStopId='2:B' />)
		fireEvent.click(screen.getByRole('button', { name: 'Show local detail' }))
		fireEvent.click(screen.getByRole('button', { name: 'Visit 3: A, Not started' }))
		expect(input.onSelectStop).toHaveBeenCalledWith('3:A')
		rerender(<RouteMap {...input} selectedStopId='3:A' />)
		expect(screen.getByRole('option', { name: 'Around Body', selected: true })).toBeTruthy()
		rerender(<RouteMap {...input} selectedStopId='4:C' />)
		expect(screen.getByRole('option', { name: 'Whole system route', selected: true })).toBeTruthy()
		expect(screen.getByLabelText('pyro route view')).toBeTruthy()
	})
	it('preserves a local view chosen before any visit selection for markers and visit-list buttons', () => {
		const input = props()
		const { rerender } = render(<RouteMap {...input} />)
		fireEvent.change(screen.getByRole('combobox', { name: 'Local detail' }), { target: { value: 'Body' } })
		fireEvent.click(screen.getByRole('button', { name: 'Visit 2: B, Next visit' }))
		expect(input.onSelectStop).toHaveBeenCalledWith('2:B')
		rerender(<RouteMap {...input} selectedStopId='2:B' />)
		expect(screen.getByRole('option', { name: 'Around Body', selected: true })).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: '3. A' }))
		expect(input.onSelectStop).toHaveBeenCalledWith('3:A')
		expect(screen.getByRole('option', { name: 'Around Body', selected: true })).toBeTruthy()
		rerender(<RouteMap {...input} selectedStopId='3:A' />)
		expect(screen.getByRole('option', { name: 'Around Body', selected: true })).toBeTruthy()
	})
	it('explains incomplete data and allows retry without drawing a partial route', () => {
		const input = props()
		render(<RouteMap {...input} locations={locations.filter((location) => location.name !== 'B')} cached error='Map request failed' />)
		expect(screen.getByText('Fallback map data')).toBeTruthy()
		expect(screen.getByText(/Missing coordinates for B/)).toBeTruthy()
		expect(screen.queryByLabelText('stanton route view')).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Retry map' }))
		expect(input.onRetry).toHaveBeenCalledOnce()
	})

	it('pans with a touch pointer without selecting a visit', () => {
		const input = props()
		render(<RouteMap {...input} />)
		const viewport = screen.getByLabelText('stanton route view')
		vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, width: 800, height: 440, top: 0, left: 0, right: 800, bottom: 440, toJSON: () => ({}) })
		const marker = screen.getByRole('button', { name: 'Visit 1: A, Start, Completed' })
		const left = marker.style.left
		fireEvent.pointerDown(viewport, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100, clientY: 100 })
		fireEvent.pointerMove(viewport, { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 100 })
		fireEvent.pointerUp(viewport, { pointerId: 1, pointerType: 'touch' })
		expect(marker.style.left).not.toBe(left)
		expect(input.onSelectStop).not.toHaveBeenCalled()
	})
})
