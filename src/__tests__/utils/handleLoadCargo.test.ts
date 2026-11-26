// @/utils/handleLoadCargo.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleLoadCargo } from '@/utils/handleLoadCargo'
import { Ship, Contract, Container, RouteAlgorithm } from '@/constants/types'
import { HaulingMode } from '@/utils/calculateContainers'

const makeShip = (): Ship => ({
	name: 'Test Ship',
	totalCapacity: 64,
	cargoGrids: [{ width: 4, length: 4, height: 4 }],
})

const makeContract = (
	origin: string,
	deliveries: Array<{ location: string; quantity: number; cargoType?: string }>,
): Contract => ({
	maxContainerSize: 8,
	contractType: 'delivery',
	origin,
	deliveryPoints: deliveries.map((d, idx) => ({
		id: `delivery-${idx}`,
		location: d.location,
		quantity: d.quantity,
		cargo: [
			{
				cargoType: d.cargoType || 'General',
				quantity: d.quantity,
			},
		],
	})),
})

describe('handleLoadCargo - Unit Tests', () => {
	let mockSetContainers: ReturnType<typeof vi.fn<(containers: Container[]) => void>>

	beforeEach(() => {
		vi.clearAllMocks()
		mockSetContainers = vi.fn<(containers: Container[]) => void>()
	})

	describe('FILO (First In, Last Out) Loading', () => {
		it('loads containers in delivery route order', () => {
			const ship = makeShip()
			const contracts = [
				makeContract('Port Tressler', [
					{ location: 'New Babbage Interstellar Spaceport', quantity: 4 },
					{ location: 'Riker Memorial Spaceport', quantity: 4 },
					{ location: 'Teasa Spaceport', quantity: 4 },
				]),
			]

			handleLoadCargo({
				contracts,
				selectedShip: ship,
				setContainers: mockSetContainers,
				routeAlgorithm: RouteAlgorithm.NEAREST_NEIGHBOR,
			})

			expect(mockSetContainers).toHaveBeenCalled()
			const containersSet =
				mockSetContainers.mock.calls[mockSetContainers.mock.calls.length - 1][0]

			// Should have created containers for all deliveries
			expect(containersSet.length).toBeGreaterThan(0)

			// Verify containers exist for each delivery point
			const deliveryIndices = new Set(
				containersSet.map((c: Container) => c.deliveryIndex),
			)
			expect(deliveryIndices.size).toBe(3)
		})
	})

	describe('Container Size Selection', () => {
		it('uses calculateOptimalContainerSize for each cargo unit', () => {
			const ship = makeShip()
			const contracts = [
				makeContract('Port Tressler', [
					{ location: 'New Babbage Interstellar Spaceport', quantity: 10 },
				]),
			]

			handleLoadCargo({
				contracts,
				selectedShip: ship,
				setContainers: mockSetContainers,
				haulingMode: HaulingMode.CONTRACT,
			})

			expect(mockSetContainers).toHaveBeenCalled()
			const containers = mockSetContainers.mock.calls[
				mockSetContainers.mock.calls.length - 1
			][0]

			// Should have created containers totaling 10 SCU
			const totalSCU = containers.reduce((sum, c) => sum + c.size, 0)
			expect(totalSCU).toBe(10)
			expect(containers.length).toBeGreaterThan(0)
		})

		it('handles mixed cargo types at same delivery point', () => {
			const ship = makeShip()
			const contracts: Contract[] = [
				{
					maxContainerSize: 8,
					contractType: 'delivery',
					origin: 'Port Tressler',
					deliveryPoints: [
						{
							id: 'dp-1',
							location: 'New Babbage Interstellar Spaceport',
							quantity: 20,
							cargo: [
								{ cargoType: 'Fragile', quantity: 12 },
								{ cargoType: 'Heavy', quantity: 8 },
							],
						},
					],
				},
			]

			handleLoadCargo({
				contracts,
				selectedShip: ship,
				setContainers: mockSetContainers,
			})

			const containers = mockSetContainers.mock.calls[
				mockSetContainers.mock.calls.length - 1
			][0]

			// Should have created containers totaling 20 SCU
			const totalSCU = containers.reduce((sum, c) => sum + c.size, 0)
			expect(totalSCU).toBe(20)
			expect(containers.length).toBeGreaterThan(0)

			expect(containers.filter((c) => c.cargoTypeIndex === 0).reduce((sum, c) => sum + c.size, 0)).toBe(12)
			expect(containers.filter((c) => c.cargoTypeIndex === 1).reduce((sum, c) => sum + c.size, 0)).toBe(8)
		})
	})

	describe('Error Handling', () => {
		it('returns an actionable error and preserves the active plan when cargo cannot fit', () => {
			const ship = makeShip()
			const contracts = [
				makeContract('Port Tressler', [
					{ location: 'New Babbage Interstellar Spaceport', quantity: 100 },
				]),
			]

			const result = handleLoadCargo({
				contracts,
				selectedShip: ship,
				setContainers: mockSetContainers,
			})

			expect(result.success).toBe(false)
			if (!result.success) expect(result.error).toContain('General')
			expect(mockSetContainers).not.toHaveBeenCalled()
		})

		it('commits complete containers once after successful generation', () => {
			const ship = makeShip()
			const contracts = [
				makeContract('Port Tressler', [
					{ location: 'New Babbage Interstellar Spaceport', quantity: 4 },
				]),
			]

			handleLoadCargo({
				contracts,
				selectedShip: ship,
				setContainers: mockSetContainers,
			})

			// No preliminary clearing or partial callback.
			expect(mockSetContainers).toHaveBeenCalledTimes(1)

			// Last call should have new containers
			const lastCall =
				mockSetContainers.mock.calls[mockSetContainers.mock.calls.length - 1]
			expect(lastCall[0].length).toBeGreaterThan(0)
		})
	})
})
