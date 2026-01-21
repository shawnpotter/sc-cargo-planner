// @/components/ocr/parser/parseContract.ts
import { ParsedContract } from '@/components/ocr/parser/types'
import { cleanOCRText } from './utils/cleaners'
import { parseLeftColumn, parseRightColumn } from './parsers/columnParsers'

/**
 * Main entry point for parsing a contract's OCR text.
 */
export function parseContractText(
	leftText: string,
	rightText: string
): ParsedContract {
	console.log('=== Starting Contract Parse ===')

	const result: ParsedContract = {}

	// Clean the text first
	const cleanedLeft = cleanOCRText(leftText)
	const cleanedRight = cleanOCRText(rightText)

	// Parse LEFT column
	parseLeftColumn(cleanedLeft, result)

	// Parse RIGHT column
	parseRightColumn(cleanedRight, result)

	console.log('Final parsed result:', JSON.stringify(result, null, 2))
	console.log('=== Parse Complete ===')

	return result
}
