import { describe, expect, it } from 'vitest'
import {
	findBestLocationMatch,
	parseDestinationName,
} from '@/components/ocr/parser/utils/locationResolver'

describe('locationResolver aliases', () => {
	it('maps Area18 to Riker Memorial Spaceport', () => {
		expect(parseDestinationName('Area18')).toBe('Riker Memorial Spaceport')
		expect(findBestLocationMatch('Area18')).toBe('Riker Memorial Spaceport')
	})

	it('maps NB Int. Spaceport to New Babbage Interstellar Spaceport', () => {
		expect(parseDestinationName('NB Int. Spaceport')).toBe(
			'New Babbage Interstellar Spaceport',
		)
		expect(findBestLocationMatch('NB Int. Spaceport')).toBe(
			'New Babbage Interstellar Spaceport',
		)
	})

	it('corrects HDOPC OCR noise to HDPC location names', () => {
		expect(parseDestinationName('HDOPC-Farnesway')).toBe('HDPC-Farnesway')
		expect(findBestLocationMatch('HDOPC-Farnesway')).toBe('HDPC-Farnesway')
	})

	it('removes stray OCR number tokens inside location names', () => {
		expect(parseDestinationName('Sakura Sun Magnolia 1 Workcenter')).toBe(
			'Sakura Sun Magnolia Workcenter',
		)
		expect(findBestLocationMatch('Sakura Sun Magnolia 1 Workcenter')).toBe(
			'Sakura Sun Magnolia Workcenter',
		)
	})
})
