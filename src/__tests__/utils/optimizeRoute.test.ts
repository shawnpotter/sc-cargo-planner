import { describe, it, expect } from 'vitest'
import { optimizeRoute } from '@/utils/routeOptimizer'
import { Contract } from '@/constants/types'

describe('optimizeRoute', () => {
	it('returns a route for a simple contract', () => {
		const contracts = [
			{
				origin: 'Port Tressler',
				deliveryPoints: [
					{ location: 'Microtech Logistics Depot S4LD01' },
					{ location: 'Sakura Sun Goldenrod Workcenter' },
				],
			},
		]

		const routes = optimizeRoute(contracts as Contract[])
		expect(routes.length).toBe(1)
		const r = routes[0]
		expect(Array.isArray(r)).toBe(true)
		// For surface locations on Microtech, the route should include the planet 'Microtech'
		expect(r.includes('Microtech')).toBe(true)
	})
})
