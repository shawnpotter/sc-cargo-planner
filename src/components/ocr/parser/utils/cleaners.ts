/**
 * Clean OCR output text by applying a set of heuristic replacements.
 */
export const cleanOCRText = (text: string): string => {
	return (
		text
			// Fix common OCR mistakes with depot names
			.replaceAll(/S4LDO([0I])/gi, 'S4LD01')
			.replaceAll(/S4LD00/gi, 'S4LD01') // Fix S4LD00 -> S4LD01
			.replaceAll(/S4LD0([0I])/gi, 'S4LD01') // Fix S4LD0I/S4LD0O -> S4LD01
			.replaceAll(/S4LD([0O])1/gi, 'S4LD01') // Fix S4LDO1 -> S4LD01
			.replaceAll(/O(?=\d)/g, '0')
			.replaceAll(/(?<=\d)O/g, '0')
			.replaceAll(/(?<=S\d)O(?=\d)/g, '0')
			.replaceAll(/\bl\b/g, '1')
			.replaceAll(/\bI\b/g, '1')
			// Fix OCR confusing D and O in station names
			.replaceAll(/HO(MS|PC)/g, 'HD$1') // HOMS -> HDMS, HOPC -> HDPC

			// Normalize custom bullet characters to the expected marker.
			// Replace various characters that OCR might read as the custom bullet point
			// Common misreads include: ©, <, •, ·, ◆, ♦, ○, □, ■, ▪, ▫, ▸, ▹, ►, ▻, and standalone symbols at line start
			.replaceAll(/^[©<•·◆♦○□■▪▫▸▹►▻]\s+/gm, '◇ ')
			.replaceAll(/\n[©<•·◆♦○□■▪▫▸▹►▻]\s+/g, '\n◇ ')

			// Normalize currency symbols in reward lines.
			// Replace various symbols that might be the ¤ currency symbol
			// Only replace the FIRST non-whitespace character after "Reward" if it's NOT a digit
			// Common misreads before numbers: ©, x, ", H, A, *, @, &, §, ^
			.replaceAll(/Reward\s*([©x"H*@&§^A])\s+(?=\d)/gi, 'Reward ¤ ')

			// Normalize keyword tokens with trailing OCR punctuation noise.
			// Handle "Deliver" with trailing punctuation/misreads
			.replaceAll(/Deliver[!1iI:;,.\s]+(?=\d)/gi, 'Deliver ')
			.replaceAll(/Collect[!1iI:;,.\s]+(?=\d|\w)/gi, 'Collect ')

			// Clean up other common OCR artifacts
			.replaceAll(/©/g, '') // Remove remaining © symbols
			.replaceAll(/<(?!\d)/g, '') // Remove < unless followed by digit (for patterns like <3)
			.replaceAll(/\|(?!\s*$)/g, '') // Remove | unless at end of line
			.replaceAll(/A\s+(\d)/g, '^ $1') // Fix "Reward A 160,250" to "Reward ^ 160,250"

			// Clean up visual noise indicators (trailing slashes, backslashes after periods)
			.replaceAll(/\.\s*[/\\|]+\s*$/gm, '.')
			.replaceAll(/\.\s*[/\\|]+\s+/g, '. ')
	)
}

/**
 * Normalize collect origin strings from OCR
 */
export const normalizeCollectOrigin = (raw: string): string => {
	return (
		raw
			// Drop leading/trailing whitespace first
			.trim()
			// Remove trailing punctuation
			.replaceAll(/[.\s|!]+$/g, '')
			// Remove common trailing OCR markers like ". 1" or ". I" or "|"
			.replaceAll(/\s*[.|!]\s*[0-9Il|]{1,3}\s*$/g, '')
			// Remove trailing standalone digits/roman-I-ish tokens
			.replaceAll(/\s+[0-9Il|]{1,3}\s*$/g, '')
			// Collapse whitespace
			.replaceAll(/\s+/g, ' ')
			.trim()
	)
}
