import { fireEvent, screen } from '@testing-library/react'

export function setJourneyStartLocation(location: string) {
	fireEvent.change(screen.getByLabelText('Search starting location...'), {
		target: { value: location },
	})
}

export function setContractOriginAndDestination(
	origin: string,
	destination: string,
) {
	const originInput = screen.getByLabelText(/Pickup Location/)
	fireEvent.change(originInput, { target: { value: origin } })
	const destinationInput = screen.getByLabelText('Search destination...')
	fireEvent.change(destinationInput, { target: { value: destination } })
}

export function addCargoToDraft(cargoType: string, quantity: number) {
	fireEvent.change(screen.getByLabelText('Cargo Type'), {
		target: { value: cargoType },
	})
	fireEvent.change(screen.getAllByPlaceholderText('Qty')[0], {
		target: { value: String(quantity) },
	})
	fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0])
}

export function addDraftToCurrentContract() {
	fireEvent.click(screen.getAllByRole('button', { name: 'Add to Contract' })[0])
}

export function saveCurrentContract() {
	fireEvent.click(screen.getByRole('button', { name: 'Save Contract' }))
}

export function buildBasicDeliveryDraft({
	startLocation,
	origin,
	destination,
	cargoType,
	quantity,
}: {
	startLocation: string
	origin: string
	destination: string
	cargoType: string
	quantity: number
}) {
	setJourneyStartLocation(startLocation)
	setContractOriginAndDestination(origin, destination)
	addCargoToDraft(cargoType, quantity)
}
