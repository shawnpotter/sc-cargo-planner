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

// Mock the hooks
const mockSaveContracts = vi.fn()
const mockContractAPI = {
	saveContracts: mockSaveContracts,
	loading: false,
	error: null,
	fetchContracts: vi.fn(),
	updateContract: vi.fn(),
	deleteContract: vi.fn(),
	clearAllContracts: vi.fn(),
}

vi.mock('@/hooks/useContractAPI', () => ({
	useContractAPI: () => mockContractAPI,
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
		...props
	}: React.ComponentProps<'select'> & {
		onValueChange?: (value: string) => void
	}) => (
		<select
			data-testid='location-select'
			value={value || ''}
			onChange={(e) => onValueChange?.(e.target.value)}
			{...props}
		>
			<option value=''>Select location</option>
			<option value='Baijini Point'>Baijini Point</option>
			<option value='Riker Memorial Spaceport'>Riker Memorial Spaceport</option>
			<option value='Port Olisar'>Port Olisar</option>
		</select>
	),
}))

// Test wrapper with ContractProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<ContractProvider>{children}</ContractProvider>
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
		// Reset mock implementations
		mockContractAPI.loading = false
		mockContractAPI.error = null
	})

	const renderComponent = (props = {}) => {
		return render(
			<TestWrapper>
				<ContractForm
					{...defaultProps}
					{...props}
				/>
			</TestWrapper>
		)
	}

	describe('Initial Render', () => {
		it('should render all form sections', () => {
			renderComponent()

			expect(screen.getByText('Max Container Size (SCU)')).toBeInTheDocument()
			expect(screen.getByLabelText('Contract Payout')).toBeInTheDocument()
			expect(screen.getAllByTestId('location-select')[0]).toBeTruthy()
			expect(screen.getAllByTestId('location-select')[1]).toBeTruthy()
			expect(screen.getByLabelText('Cargo Type')).toBeTruthy()
			expect(screen.getAllByPlaceholderText('Qty')[0]).toBeTruthy()
		})

		it('should render scan contract button in CONTRACT mode', () => {
			renderComponent({ haulingMode: HaulingMode.CONTRACT })
			expect(
				screen.getAllByRole('button', { name: '📸 Scan Contract' })[0]
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
			// Set origin
			const originSelect = screen.getAllByTestId('location-select')[0]
			fireEvent.change(originSelect, { target: { value: 'Baijini Point' } })

			// Set destination
			const destinationSelect = screen.getAllByTestId('location-select')[1]
			fireEvent.change(destinationSelect, {
				target: { value: 'Riker Memorial Spaceport' },
			})

			// Add cargo
			const cargoTypeInput = screen.getByLabelText('Cargo Type')
			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(cargoTypeInput, { target: { value: 'Copper' } })
			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)
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
			const originSelect = screen.getAllByTestId('location-select')[0]
			fireEvent.change(originSelect, { target: { value: 'Baijini Point' } })

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
				deliverySection as HTMLElement
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
				'Riker Memorial Spaceport'
			)
		})
	})

	describe('Form Submission', () => {
		it('should submit form with saved contracts', async () => {
			renderComponent()

			// Fill and add contract
			const originSelect = screen.getAllByTestId('location-select')[0]
			fireEvent.change(originSelect, { target: { value: 'Baijini Point' } })

			const destinationSelect = screen.getAllByTestId('location-select')[1]
			fireEvent.change(destinationSelect, {
				target: { value: 'Riker Memorial Spaceport' },
			})

			const cargoTypeInput = screen.getByLabelText('Cargo Type')
			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(cargoTypeInput, { target: { value: 'Copper' } })
			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)

			const addToContractButton = screen.getAllByRole('button', {
				name: 'Add to Contract',
			})[0]
			fireEvent.click(addToContractButton)

			// Save contract
			const saveContractButton = screen.getAllByRole('button', {
				name: 'Save Contract',
			})[0]
			fireEvent.click(saveContractButton)

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
					])
				)
			})
		})

		it('should show alert when submitting with no contracts', async () => {
			renderComponent()

			// Populate current contract but do not save to saved contracts
			const originSelect = screen.getAllByTestId('location-select')[0]
			fireEvent.change(originSelect, { target: { value: 'Baijini Point' } })

			const destinationSelect = screen.getAllByTestId('location-select')[1]
			fireEvent.change(destinationSelect, {
				target: { value: 'Riker Memorial Spaceport' },
			})

			const cargoTypeInput = screen.getByLabelText('Cargo Type')
			const quantityInput = screen.getAllByPlaceholderText('Qty')[0]
			const addCargoButton = screen.getAllByRole('button', { name: 'Add' })[0]

			fireEvent.change(cargoTypeInput, { target: { value: 'Copper' } })
			fireEvent.change(quantityInput, { target: { value: '2' } })
			fireEvent.click(addCargoButton)

			const addToContractButton = screen.getAllByRole('button', {
				name: 'Add to Contract',
			})[0]
			fireEvent.click(addToContractButton)

			const submitButton = screen.getAllByRole('button', {
				name: /Generate Layout/i,
			})[0]
			fireEvent.click(submitButton)

			// Alert title should appear
			const title = await screen.findByText('No valid contracts')
			expect(title).toBeTruthy()
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

		it('should show alert on mobile', async () => {
			Object.defineProperty(navigator, 'userAgent', {
				value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
				configurable: true,
			})

			renderComponent()

			const scanButton = screen.getAllByRole('button', {
				name: '📸 Scan Contract',
			})[0]
			fireEvent.click(scanButton)

			const alertText = await screen.findByText(
				'Scanner not available on mobile'
			)
			expect(alertText).toBeTruthy()
		})
	})

	describe('Reset Functionality', () => {
		it('should reset form when clicking reset', () => {
			renderComponent()

			const resetButton = screen.getAllByRole('button', { name: 'Reset' })[0]
			fireEvent.click(resetButton)

			expect(mockOnReset).toHaveBeenCalled()
		})
	})
})
