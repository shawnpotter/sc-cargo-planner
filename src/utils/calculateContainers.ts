// @/utils/calculateContainers.ts

/**
 * Hauling modes for different cargo loading strategies.
 */
export enum HaulingMode {
	CONTRACT = 'CONTRACT', // Prioritizes fitting to remaining quantity
	COMMODITY = 'COMMODITY', // Prioritizes using maximum container size
}

/**
 * Calculates the optimal container size based on hauling mode and remaining quantity.
 *
 * @param maxContainerSize - The maximum container size allowed
 * @param remainingQuantity - The remaining quantity to be transported
 * @param haulingMode - The hauling mode that determines container sizing strategy
 * @returns The optimal container size to use
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
