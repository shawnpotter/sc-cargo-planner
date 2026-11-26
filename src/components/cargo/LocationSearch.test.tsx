import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocationSearch } from '@/components/cargo/LocationSearch'

const locations = vi.hoisted(() => [
	{
		name: 'Area18',
		type: 'ORBITAL_STATION',
		coordinates: { x: 0, y: 0, z: 0 },
	},
])

vi.mock('@/providers/MapDataProvider', () => ({
	useMapData: () => ({ locations }),
}))

afterEach(cleanup)

describe('LocationSearch external value', () => {
	it('applies external resets immediately and does not restore an old query', () => {
		const { rerender } = render(<LocationSearch value='' />)
		const input = screen.getByRole('combobox')

		fireEvent.change(input, { target: { value: 'Typed query' } })
		expect(input).toHaveValue('Typed query')

		rerender(<LocationSearch value='Area18' />)
		expect(input).toHaveValue('Area18')

		rerender(<LocationSearch value='' />)
		expect(input).toHaveValue('')
	})
})
