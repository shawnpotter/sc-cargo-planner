import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteChecklist } from '@/components/cargo/RouteChecklist'
import { optimizeRoute } from '@/utils/routeOptimizer'
import { getStopId } from '@/utils/stopIdentity'
import type { Contract } from '@/constants/types'
import type { Location } from '@/data/locations'

const locations: Location[] = ['A', 'B', 'C', 'D'].map((name, index) => ({ name, type: 'ORBITAL_STATION', coordinates: { x: index, y: 0, z: 0 } }))
const contract = (origin: string, delivery: string): Contract => ({ origin, contractType: 'delivery', maxContainerSize: 4,
	deliveryPoints: [{ location: delivery, quantity: 4, cargo: [{ cargoType: 'Food', quantity: 4 }] }] })
afterEach(cleanup)

describe('RouteChecklist visit order', () => {
	it('renders optimizer sequence unchanged, including delivery before a later pickup', () => {
		const plan = optimizeRoute([contract('A', 'B'), contract('C', 'D')], { locations, cargoCapacity: 4 })
		const { container } = render(<RouteChecklist stops={plan.stops} stopStatuses={{}} onStopStatusChange={() => {}} />)
		const visits = [...container.querySelectorAll('button[aria-label^="Mark "]')].map((button) => button.getAttribute('aria-label'))
		expect(visits).toEqual(plan.stops.map((stop) => `Mark ${stop.location} as in progress`))
		expect(visits).toEqual(['Mark A as in progress', 'Mark B as in progress', 'Mark C as in progress', 'Mark D as in progress'])
	})

	it('toggles each return visit independently and counts progress by visit ID', () => {
		const plan = optimizeRoute([contract('A', 'B'), contract('B', 'A')], { locations })
		const onChange = vi.fn()
		render(<RouteChecklist stops={plan.stops} stopStatuses={{ [getStopId(plan.stops[0])]: 'completed', [getStopId(plan.stops[1])]: 'completed' }} onStopStatusChange={onChange} />)
		expect(screen.getByText('2/3 done')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'Mark A as not started' }))
		fireEvent.click(screen.getByRole('button', { name: 'Mark A as in progress' }))
		expect(onChange.mock.calls).toEqual([['1:A'], ['3:A']])
	})

	it('selects a map visit without changing progress and prevents jumping ahead', () => {
		const plan = optimizeRoute([contract('A', 'B')], { locations })
		const select = vi.fn()
		const progress = vi.fn()
		render(<RouteChecklist stops={plan.stops} stopStatuses={{}} onStopStatusChange={progress} selectedStopId='2:B' onSelectStop={select} />)
		fireEvent.click(screen.getByRole('button', { name: 'B' }))
		expect(select).toHaveBeenCalledWith('2:B')
		expect(screen.getByRole('button', { name: 'B' }).getAttribute('aria-pressed')).toBe('true')
		fireEvent.click(screen.getByRole('button', { name: 'Mark B as in progress' }))
		expect(progress).not.toHaveBeenCalled()
	})
})
