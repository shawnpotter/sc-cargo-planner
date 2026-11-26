// @/__tests__/components/ContractForm.test.tsx
import React from 'react'
import {
	render,
	screen,
	fireEvent,
	waitFor,
	cleanup,
	within,
} from '@testing-library/react'
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContractForm } from '@/components/cargo/ContractForm'
import { HaulingMode } from '@/utils/calculateContainers'
import { ContractProvider } from '@/providers/ContractProvider'
import { CargoProvider } from '@/providers/CargoProvider'
import { createInitialRun } from '@/lib/run/state'
import { encodeRunSnapshot, RUN_STORAGE_KEY } from '@/lib/run/snapshot'
import { buildCargoPlan } from '@/utils/handleLoadCargo'
import { ships } from '@/data/ships'
import type { Contract } from '@/constants/types'
import {
	addDraftToCurrentContract,
	buildBasicDeliveryDraft,
	saveCurrentContract,
	setJourneyStartLocation,
} from './contractFormTestUtils'

const mockFetch = vi.fn()
const mockMapSystems = vi.hoisted(() => ({ availableSystems: ['stanton'] }))

// Mock MapDataProvider so ContractForm's useMapData() call works without a provider
vi.mock('@/providers/MapDataProvider', () => ({
	useMapData: () => ({
		locations: [],
		loading: false,
		error: null,
		system: 'stanton',
		cached: false,
		availableSystems: mockMapSystems.availableSystems,
		refresh: vi.fn(),
	}),
	MapDataProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock OCR Scanner
vi.mock('@/components/ocr/Scanner', () => ({
	default: ({ onClose }: { onClose: () => void }) => (
		<div data-testid='ocr-scanner'>
			<button onClick={onClose}>Close Scanner</button>
		</div>
	),
}))

// Mock LocationSelect (component lives in cargo folder)
vi.mock('@/components/cargo/LocationSelect', () => ({
	LocationSelect: ({
		value,
		onValueChange,
		placeholder,
	}: {
		value?: string
		onValueChange?: (value: string) => void
		placeholder?: string
	}) => (
		<select
			data-testid='location-select'
			aria-label={placeholder || 'Select location'}
			value={value || ''}
			onChange={(e) => onValueChange?.(e.target.value)}
		>
			<option value=''>Select location</option>
			<option value='Baijini Point'>Baijini Point</option>
			<option value='Riker Memorial Spaceport'>Riker Memorial Spaceport</option>
			<option value='Port Tressler'>Port Tressler</option>
			<option value='Everus Harbor'>Everus Harbor</option>
		</select>
	),
}))

// Mock LocationSearch (used for start/end location fields)
vi.mock('@/components/cargo/LocationSearch', () => ({
	LocationSearch: ({
		value,
		onValueChange,
		placeholder,
		id,
		filterSystem,
	}: {
		value?: string
		onValueChange?: (value: string) => void
		placeholder?: string
		id?: string
		filterSystem?: string
	}) => (
		<input
			data-testid='location-search'
			id={id}
			data-filter-system={filterSystem}
			aria-label={placeholder || 'Search locations...'}
			value={value || ''}
			placeholder={placeholder}
			readOnly
			onChange={(e) => onValueChange?.(e.target.value)}
		/>
	),
}))

// Test wrapper with both ContractProvider and CargoProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<CargoProvider>
		<ContractProvider>{children}</ContractProvider>
	</CargoProvider>
)

describe('ContractForm', () => {
	const mockOnSubmit = vi.fn()
	const mockOnReset = vi.fn()

	const defaultProps = {
		onSubmit: mockOnSubmit,
		onReset: mockOnReset,
		haulingMode: HaulingMode.CONTRACT,
	}

	beforeEach(() => {
		// Ensure previous renders are cleaned up to avoid state leaking between tests
		cleanup()
		vi.clearAllMocks()
		window.localStorage.clear()
		mockMapSystems.availableSystems = ['stanton']
		vi.stubGlobal('Worker', class {})
		vi.stubGlobal('fetch', mockFetch)
	})

	const renderComponent = (props = {}) => {
		return render(
			<TestWrapper>
				<ContractForm
					{...defaultProps}
					{...props}
				/>
			</TestWrapper>,
		)
	}

	describe('Initial Render', () => {
		it('should render all form sections', () => {
			renderComponent()

			expect(screen.getByText('Max Container Size (SCU)')).toBeInTheDocument()
			expect(screen.getByLabelText('Contract Payout')).toBeInTheDocument()
			expect(screen.getByLabelText('Search starting location...')).toBeTruthy()
			expect(screen.getByLabelText(/Pickup Location/)).toBeTruthy()
			expect(screen.getByLabelText('Search destination...')).toBeTruthy()
			expect(screen.getByLabelText('Cargo Type')).toBeTruthy()
			expect(screen.getAllByPlaceholderText('Qty')[0]).toBeTruthy()
		})

		it('should render scan contract button in CONTRACT mode', () => {
			renderComponent({ haulingMode: HaulingMode.CONTRACT })
			expect(
				screen.getAllByRole('button', { name: '📸 Scan Contract' })[0],
			).toBeTruthy()
		})

		it('should not render contract payout in COMMODITY mode', () => {
			renderComponent({ haulingMode: HaulingMode.COMMODITY })
			expect(screen.queryByText('Contract Payout')).not.toBeInTheDocument()
		})

		it('should have Add to Contract button disabled initially', () => {
			renderComponent()
			const addButton = screen.getAllByRole('button', {
				name: 'Add to Contract',
			})[0]
			expect(addButton).toBeDisabled()
		})

		it('should render route type toggle with Loop selected by default', () => {
			renderComponent()

			expect(screen.getByText('Route Type:')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Loop' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Path' })).toBeInTheDocument()
			expect(
				screen.getByText(/Route will return to the port of origin/),
			).toBeInTheDocument()
		})
	})

	describe('Route Type Toggle', () => {
		it('uses discovered systems, defaults to an available system, and retains the selected system after updates', () => {
			mockMapSystems.availableSystems = ['terra', 'nyx']
			const rendered = renderComponent()
			const systemSelector = screen.getByLabelText('Current System')
			expect(systemSelector).toHaveTextContent('Terra')
			expect(screen.getByLabelText('Search starting location...')).toHaveAttribute('data-filter-system', 'terra')
			fireEvent.keyDown(systemSelector, { key: 'ArrowDown' })
			expect(screen.getByRole('option', { name: 'Terra' })).toBeInTheDocument()
			expect(screen.queryByRole('option', { name: 'Stanton' })).not.toBeInTheDocument()
			fireEvent.click(screen.getByRole('option', { name: 'Nyx' }))
			mockMapSystems.availableSystems = ['terra', 'nyx', 'sol']
			rendered.rerender(<TestWrapper><ContractForm {...defaultProps} /></TestWrapper>)
			expect(systemSelector).toHaveTextContent('Nyx')
			expect(screen.getByLabelText('Search starting location...')).toHaveAttribute('data-filter-system', 'nyx')
		})

		it('should show end location selector when Path is selected', () => {
			renderComponent()

			const pathButton = screen.getByRole('button', { name: 'Path' })
			fireEvent.click(pathButton)

			expect(screen.getByText('End Location')).toBeInTheDocument()
			expect(
				screen.getByText(/Route will end at the specified location/),
			).toBeInTheDocument()
		})

		it('should hide end location selector when switching back to Loop', () => {
			renderComponent()

			// Switch to Path
			const pathButton = screen.getByRole('button', { name: 'Path' })
			fireEvent.click(pathButton)
			expect(screen.getByText('End Location')).toBeInTheDocument()

			// Switch back to Loop
			const loopButton = screen.getByRole('button', { name: 'Loop' })
			fireEvent.click(loopButton)
			expect(screen.queryByText('End Location')).not.toBeInTheDocument()
		})

		it('should show alert when submitting Path route without end location', async () => {
			renderComponent()

			// Fill form with valid contract
			buildBasicDeliveryDraft({
				startLocation: 'Baijini Point',
				origin: 'Baijini Point',
				destination: 'Riker Memorial Spaceport',
				cargoType: 'Copper',
				quantity: 2,
			})
			addDraftToCurrentContract()
			saveCurrentContract()

			// Switch to Path mode without selecting end location
			const pathButton = screen.getByRole('button', { name: 'Path' })
			fireEvent.click(pathButton)

			// Try to submit
			const submitButton = screen.getAllByRole('button', {
				name: /Generate Layout/i,
			})[0]
			fireEvent.click(submitButton)

			const alertTitle = await screen.findByText('End location required')
			expect(alertTitle).toBeTruthy()
		})

		it('should submit with end location when Path route is configured', async () => {
			renderComponent()

			// Fill form with valid contract
			buildBasicDeliveryDraft({
				startLocation: 'Baijini Point',
				origin: 'Baijini Point',
				destination: 'Riker Memorial Spaceport',
				cargoType: 'Copper',
				quantity: 2,
			})
			addDraftToCurrentContract()
			saveCurrentContract()

			// Switch to Path mode
			const pathButton = screen.getByRole('button', { name: 'Path' })
			fireEvent.click(pathButton)

			// Wait for the End Location section to appear
			await waitFor(() => {
				expect(screen.getByText('End Location')).toBeInTheDocument()
			})

			// Find the end location search input by its aria-label
			const endLocationSelect = screen.getByLabelText('Search end location...')
			fireEvent.change(endLocationSelect, {
				target: { value: 'Everus Harbor' },
			})

			// Verify the selection was made
			expect(endLocationSelect).toHaveValue('Everus Harbor')

			// Submit
			const submitButton = screen.getAllByRole('button', {
				name: /Generate Layout/i,
			})[0]
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							origin: 'Baijini Point',
						}),
					]),
					'Baijini Point',
					'Everus Harbor',
				)
			})
		})
	})

	describe('Cargo Management', () => {
		it('should add cargo to delivery', () => {
			renderComponent()

			const cargoTypeInput = screen.getByLabelText('Cargo Type')
			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(cargoTypeInput, { target: { value: 'Copper' } })
			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)

			expect(screen.getByText('Copper: 2 SCU')).toBeInTheDocument()
		})

		it('should not add cargo with empty cargo type', () => {
			renderComponent()

			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)

			// There should be no cargo entries added
			expect(screen.queryByText(/:\s*\d+\s*SCU/)).not.toBeInTheDocument()
		})

		it('should clear cargo inputs after adding', () => {
			renderComponent()

			const cargoTypeInput = screen.getByLabelText('Cargo Type')
			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(cargoTypeInput, { target: { value: 'Copper' } })
			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)

			expect(cargoTypeInput).toHaveValue('')
			expect(quantityInput).toHaveValue(null)
		})
	})

	describe('Contract Creation', () => {
		const fillCompleteForm = () => {
			buildBasicDeliveryDraft({
				startLocation: 'Baijini Point',
				origin: 'Baijini Point',
				destination: 'Riker Memorial Spaceport',
				cargoType: 'Copper',
				quantity: 2,
			})
		}

		it('should enable Add to Contract button when form is complete', () => {
			renderComponent()
			fillCompleteForm()

			const addToContractButton = screen.getAllByRole('button', {
				name: 'Add to Contract',
			})[0]
			expect(addToContractButton).not.toBeDisabled()
		})

		it('should keep Add to Contract button disabled without destination', () => {
			renderComponent()

			// Set origin only
			setJourneyStartLocation('Baijini Point')
			const originInput = screen.getByLabelText(/Pickup Location/)
			fireEvent.change(originInput, {
				target: { value: 'Baijini Point' },
			})

			// Add cargo
			const cargoTypeInput = screen.getByLabelText('Cargo Type')
			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(cargoTypeInput, { target: { value: 'Copper' } })
			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)

			// Scope the Add to Contract button to the delivery points section
			const destinationLabel = screen.getByText('Select a destination')
			const deliverySection = destinationLabel.closest('div')?.parentElement
			const addToContractButton = within(
				deliverySection as HTMLElement,
			).getByRole('button', {
				name: 'Add to Contract',
			})
			expect(addToContractButton).toBeDisabled()
		})

		it('should add delivery point to current contract', () => {
			renderComponent()
			fillCompleteForm()

			const addToContractButton = screen.getAllByRole('button', {
				name: 'Add to Contract',
			})[0]
			fireEvent.click(addToContractButton)

			expect(screen.getByText('Current Contract')).toBeInTheDocument()
			// Use a more specific query to find the location in the current contract section
			const currentContractSection =
				screen.getByText('Current Contract').parentElement
			expect(currentContractSection).toHaveTextContent(
				'Riker Memorial Spaceport',
			)
		})

		it('should default pickup location to selected starting location', () => {
			renderComponent()

			setJourneyStartLocation('Baijini Point')

			const originInput = screen.getByLabelText(/Pickup Location/)
			expect(originInput).toHaveValue('Baijini Point')
		})

		it('should keep manual pickup location when starting location changes', () => {
			renderComponent()

			setJourneyStartLocation('Baijini Point')

			const originInput = screen.getByLabelText(/Pickup Location/)
			fireEvent.change(originInput, {
				target: { value: 'Port Tressler' },
			})

			setJourneyStartLocation('Everus Harbor')

			expect(originInput).toHaveValue('Port Tressler')
		})
	})

	describe('Form Submission', () => {
		it('should submit form with saved contracts', async () => {
			renderComponent()

			// Fill and add contract
			buildBasicDeliveryDraft({
				startLocation: 'Baijini Point',
				origin: 'Baijini Point',
				destination: 'Riker Memorial Spaceport',
				cargoType: 'Copper',
				quantity: 2,
			})
			addDraftToCurrentContract()
			saveCurrentContract()

			// Submit
			const submitButton = screen.getAllByRole('button', {
				name: /Generate Layout/i,
			})[0]
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							origin: 'Baijini Point',
							deliveryPoints: expect.arrayContaining([
								expect.objectContaining({
									location: 'Riker Memorial Spaceport',
								}),
							]),
						}),
					]),
					'Baijini Point',
					undefined, // endLocation is undefined for loop routes
				)
			})
		})

		it('should submit successfully when submitting with unsaved current contract', async () => {
			renderComponent()

			// Populate current contract but do not save to saved contracts
			buildBasicDeliveryDraft({
				startLocation: 'Baijini Point',
				origin: 'Baijini Point',
				destination: 'Riker Memorial Spaceport',
				cargoType: 'Copper',
				quantity: 2,
			})
			addDraftToCurrentContract()

			const submitButton = screen.getAllByRole('button', {
				name: /Generate Layout/i,
			})[0]
			fireEvent.click(submitButton)

			// The form should submit successfully because the unsaved current contract is saved during submission
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith([expect.objectContaining({
					origin: 'Baijini Point', deliveryPoints: [expect.objectContaining({ location: 'Riker Memorial Spaceport', cargo: [expect.objectContaining({ cargoType: 'Copper', quantity: 2 })] })],
				})], 'Baijini Point', undefined)
				expect(mockFetch).not.toHaveBeenCalled()
			})
		})

		it('blocks repeated Generate actions during the same submission', async () => {
			renderComponent()
			buildBasicDeliveryDraft({ startLocation: 'Baijini Point', origin: 'Baijini Point', destination: 'Riker Memorial Spaceport', cargoType: 'Copper', quantity: 2 })
			addDraftToCurrentContract()
			const generate = screen.getByRole('button', { name: 'Generate Layout' })
			fireEvent.click(generate)
			fireEvent.click(generate)
			await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1))
			expect(screen.getByText('Saved Contracts (1)')).toBeInTheDocument()
		})

		it('keeps an unsaved draft intact when journey validation fails', async () => {
			renderComponent()
			buildBasicDeliveryDraft({ startLocation: 'Baijini Point', origin: 'Baijini Point', destination: 'Riker Memorial Spaceport', cargoType: 'Copper', quantity: 2 })
			addDraftToCurrentContract()
			fireEvent.click(screen.getByRole('button', { name: 'Path' }))
			fireEvent.click(screen.getByRole('button', { name: 'Generate Layout' }))
			expect(await screen.findByText('End location required')).toBeInTheDocument()
			fireEvent.click(screen.getByRole('button', { name: 'OK' }))
			expect(screen.getByRole('button', { name: 'Save Contract' })).toBeInTheDocument()
			expect(screen.queryByText('Saved Contracts (1)')).not.toBeInTheDocument()
			expect(mockOnSubmit).not.toHaveBeenCalled()
		})

		it('shows generation failure and retains the contract for retry without duplicating it', async () => {
			renderComponent({ onSubmit: () => { throw new Error('Copper does not fit the selected ship') } })
			buildBasicDeliveryDraft({ startLocation: 'Baijini Point', origin: 'Baijini Point', destination: 'Riker Memorial Spaceport', cargoType: 'Copper', quantity: 2 })
			addDraftToCurrentContract()
			fireEvent.click(screen.getByRole('button', { name: 'Generate Layout' }))
			expect(await screen.findByText('Copper does not fit the selected ship')).toBeInTheDocument()
			fireEvent.click(screen.getByRole('button', { name: 'OK' }))
			fireEvent.click(screen.getByRole('button', { name: 'Generate Layout' }))
			expect(await screen.findByText('Copper does not fit the selected ship')).toBeInTheDocument()
			expect(screen.getByText('Saved Contracts (1)')).toBeInTheDocument()
			expect(mockFetch).not.toHaveBeenCalled()
		})

		it('edits saved contract fields and submits one updated contract with its original id', async () => {
			renderComponent()
			buildBasicDeliveryDraft({ startLocation: 'Baijini Point', origin: 'Baijini Point', destination: 'Riker Memorial Spaceport', cargoType: 'Copper', quantity: 2 })
			addDraftToCurrentContract()
			saveCurrentContract()
			fireEvent.click(screen.getByRole('button', { name: 'Generate Layout' }))
			await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1))
			const originalId = mockOnSubmit.mock.calls[0][0][0].id
			fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
			fireEvent.change(screen.getByLabelText('Cargo 1.1'), { target: { value: 'Iron' } })
			fireEvent.change(screen.getByLabelText('Quantity 1.1 (SCU)'), { target: { value: '7' } })
			fireEvent.change(screen.getByLabelText('Contract Payout'), { target: { value: '1000' } })
			fireEvent.click(screen.getByRole('button', { name: 'Generate Layout' }))
			await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(2))
			expect(mockOnSubmit.mock.calls[1][0]).toEqual([expect.objectContaining({ id: originalId, payout: 1000, deliveryPoints: [expect.objectContaining({ quantity: 7, cargo: [expect.objectContaining({ cargoType: 'Iron', quantity: 7 })] })] })])
			expect(screen.getByText('Saved Contracts (1)')).toBeInTheDocument()
		})

		it('edits a saved pickup contract delivery destination and generates the corrected delivery visit', async () => {
			const pickup: Contract = {
				id: 'pickup-existing', contractType: 'pickup', origin: 'Baijini Point', maxContainerSize: 4,
				deliveryPoints: [{ id: 'pickup-stop', location: 'Port Tressler', quantity: 2, cargo: [{ cargoType: 'Copper', quantity: 2 }] }],
			}
			window.localStorage.setItem(RUN_STORAGE_KEY, encodeRunSnapshot({
				...createInitialRun(), startLocation: 'Baijini Point', contracts: [pickup],
			}))
			renderComponent()
			fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
			fireEvent.change(screen.getByLabelText('Delivery destination'), { target: { value: 'Everus Harbor' } })
			fireEvent.click(screen.getByRole('button', { name: 'Generate Layout' }))
			await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1))
			const [submittedContracts, startLocation, endLocation] = mockOnSubmit.mock.calls[0]
			expect(submittedContracts).toEqual([{ ...pickup, origin: 'Everus Harbor' }])
			const plan = buildCargoPlan({ contracts: submittedContracts, selectedShip: ships[0], startLocation, endLocation })
			if (!plan.success) throw new Error(plan.error)
			expect(plan.optimizedRoute.stops.map(stop => ({ location: stop.location, type: stop.type }))).toEqual([
				{ location: 'Port Tressler', type: 'pickup' },
				{ location: 'Everus Harbor', type: 'delivery' },
			])
			expect(screen.getByText('Saved Contracts (1)')).toBeInTheDocument()
		})
	})

	describe('OCR Scanner', () => {
		it('should open OCR scanner on desktop', async () => {
			Object.defineProperty(navigator, 'userAgent', {
				value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
				configurable: true,
			})

			renderComponent()

			const scanButton = screen.getAllByRole('button', {
				name: '📸 Scan Contract',
			})[0]
			fireEvent.click(scanButton)

			const scanner = await screen.findByTestId('ocr-scanner')
			expect(scanner).toBeTruthy()
		})

		it('should open scanner on tablet and mobile browsers with supported APIs', async () => {
			Object.defineProperty(navigator, 'userAgent', {
				value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
				configurable: true,
			})

			renderComponent()

			const scanButton = screen.getAllByRole('button', {
				name: '📸 Scan Contract',
			})[0]
			fireEvent.click(scanButton)

			expect(await screen.findByTestId('ocr-scanner')).toBeTruthy()
		})
	})

	describe('Reset Functionality', () => {
		it('should reset form when clicking reset', () => {
			renderComponent()

			const resetButton = screen.getAllByRole('button', { name: 'Reset' })[0]
			fireEvent.click(resetButton)

			expect(mockOnReset).toHaveBeenCalled()
		})

		it('preserves route and draft while the workspace requests discard confirmation', () => {
			renderComponent()

			// Switch to Path mode
			const pathButton = screen.getByRole('button', { name: 'Path' })
			fireEvent.click(pathButton)
			expect(screen.getByText('End Location')).toBeInTheDocument()

			// Click reset
			const resetButton = screen.getAllByRole('button', { name: 'Reset' })[0]
			fireEvent.click(resetButton)

			expect(mockOnReset).toHaveBeenCalledTimes(1)
			expect(screen.getByText('End Location')).toBeInTheDocument()
		})
	})
})
