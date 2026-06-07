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
})
