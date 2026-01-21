// @/utils/calculateContainers.ts

/**
 * Hauling modes for different cargo loading strategies.
 */
export enum HaulingMode {
	CONTRACT = 'CONTRACT', // Prioritizes fitting to remaining quantity
	COMMODITY = 'COMMODITY', // Prioritizes using maximum container size
}

/**
 * Calculates the optimal container size for hauling based on the maximum allowed container size,
 * the remaining quantity to be hauled, and the hauling mode.
 *
 * - For `HaulingMode.COMMODITY`, selects the largest standard container size that does not exceed
 *   both the maximum container size and the remaining quantity.
 * - For contract hauling, finds the largest container size (starting from `maxContainerSize`)
 *   that fits within the remaining quantity by repeatedly halving the size.
 *
 * @param maxContainerSize - The maximum allowed container size.
 * @param remainingQuantity - The quantity left to be hauled.
 * @param haulingMode - The mode of hauling, which determines the selection strategy.
 * @returns The optimal container size to use for the current hauling operation.
 */
export function calculateOptimalContainerSize(
	maxContainerSize: number,
	remainingQuantity: number,
	haulingMode: HaulingMode
): number {
	// Standard container sizes in descending order
	const standardSizes = [32, 24, 16, 8, 4, 2, 1]

	if (haulingMode === HaulingMode.COMMODITY) {
		// For commodity hauling, use the largest possible container size
		// Find the largest standard size that's <= max container size and <= remaining quantity
		return (
			standardSizes.find(
				(size) => size <= maxContainerSize && size <= remainingQuantity
			) ?? 1
		) // Default to 1 if no valid size found
	} else {
		// Contract hauling: Find largest container size that fits the remaining quantity
		let containerSize = maxContainerSize

		while (containerSize > remainingQuantity) {
			containerSize = containerSize / 2
		}

		return containerSize
	}
}
