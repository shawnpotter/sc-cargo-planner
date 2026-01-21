// Regex patterns for parsing contracts

export const LOCATION_PATTERNS = [
	/HD(MS|PC)-[A-Za-z]+/, // HDMS-Hadley, HDPC-Farnesway
	/HO(MS|PC)-[A-Za-z]+/, // HOMS-Thedus, HOPC-Farnesway
	/S\dLD\d{2}/, // S4LD01, etc.
]

export const RANK_PATTERNS = [
	/(?:^[-—\s]*)?([A-Za-z]+)\s+Rank\s*[-—]/im, // Optional leading dashes, "Experienced Rank - "
	/(?:^[-—\s]*)?([A-Za-z]+)\s*[-—]\s*[A-Za-z]/im, // Optional leading dashes, "Experienced - "
]

export const CONTAINER_PATTERNS = [
	/(\d+)\s*SCU\s+or\s+smaller/i,
	/(\d+)\s*SCU\s+in\s+size/i,
	/bigger\s+than\s+(\d+)\s*SCU/i, // "bigger than 4 SCU"
	/containers.*?(\d+)\s*SCU/i,
	/must\s+not\s+exceed\s+(\d+)\s*SCU/i,
	/expect.*?(\d+)\s*SCU\s+or\s+smaller/i, // "Expect the containers to all be 4 SCU or smaller"
	/all\s+be\s+(\d+)\s*SCU/i, // "all be 4 SCU"
	/containers?\s+(?:to\s+)?(?:all\s+)?be\s+(\d+)\s*SCU/i, // "containers be 4 SCU"
	/container.*?(?:be|is|are)\s+(\d+)\s*SCU/i, // "container to be 4 SCU"
	/(\d+)\s*SCU.*?container/i, // "4 SCU container" or similar
	/has\s+some\s+(\d+)\s*['"]?\s*SCU/i, // "has some 4 SCU" or "has some 4 'SCU"
	/some\s+(\d+)\s*['"]?\s*SCU\s+or\s+smaller/i, // "some 4 SCU or smaller" or "some 4 'SCU or smaller"
]

export const PAYOUT_PATTERNS = [
	// Pattern 1: Standard format with optional currency symbol
	/Reward\s*[¤©^x"H*@&§A]*\s*(\d{1,3}(?:[,\s]\d{3})+)/i,

	// Pattern 2: Handle "Reward [any char] [number]" - ignores single char between Reward and number
	/Reward\s+.\s+(\d{1,3}(?:[,\s]\d{3})+)/i,

	// Pattern 3: Numbers without commas but with spaces (5+ digits)
	/Reward\s*[¤©^x"H*@&§A]*\s*(\d{5,})/i,

	// Pattern 4: More flexible - skip any non-digit characters and find the first large number
	/Reward[^\d]*(\d{1,3}(?:[,\s]\d{3})+)/i,

	// Pattern 5: Catch-all for any 5+ digit number after Reward
	/Reward[^\d]*(\d{5,})/i,
]

export const ORIGIN_PATTERNS = [
	// Pattern for "waiting at" which is common in delivery contracts
	/waiting\s+at\s+(?:a\s+)?(?:freight\s+elevator\s+)?(?:in\s+)?([^.]+?)(?:\s+above|\s+on|\.|$)/i,

	// Other existing patterns
	/folks\s+at\s+([A-Z][A-Z0-9-]+)\s+on/i,
	/from\s+a?\s*freight\s+elevator\s+at\s+([^.]+?)(?:\s+above|\s+on|\.|$)/i,
	/going\s+from\s+a?\s*freight\s+elevator\s+at\s+([^.]+?)(?:\s+above|\s+on|\.|$)/i,
	/going\s+from\s+([^.]+?)(?:\s+to|\.|$)/i,
	/haul.*?from\s+([^.]+?)(?:\s+to|\.|$)/i,
]

export const COLLECT_PATTERNS = [
	// Capture the whole remainder of the line after "from" and normalize it.
	/(?:^|\n)\s*(?:◇\s*)?Collect\s+[\s\S]*?\s+from\s+([^\n]+?)(?:\n|$)/gim,
]

export const DELIVERY_PATTERN =
	/(?:◇\s*)?Deliver\s*[!|l1iI:;,.\s]*\d+\/(\d+)\s+SCU\s+of\s+([^.]+?)\s+to\s+([^.©\n]+?)(?:\.|©|$)/gi

export const COLLECT_PATTERN =
	/(?:◇\s*)?Collect\s*[!|l1iI:;,.\s]*([^from]+?)\s+from\s+([^.\n]+?)(?:\.|$)/gi

// Standard container sizes for validation
export const STANDARD_CONTAINER_SIZES = new Set([1, 2, 4, 8, 16, 24, 32, 96])
