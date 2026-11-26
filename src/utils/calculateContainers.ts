export enum HaulingMode {
	CONTRACT = 'CONTRACT',
	COMMODITY = 'COMMODITY',
}

export const STANDARD_CONTAINER_SIZES = [32, 24, 16, 8, 4, 2, 1]

/** Returns zero when no supported container fits the remaining quantity. */
export function calculateOptimalContainerSize(
	maxContainerSize: number,
	remainingQuantity: number,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Both hauling modes use standard sizes; retain the existing call signature.
	_haulingMode: HaulingMode,
): number {
	if (!Number.isFinite(maxContainerSize) || !Number.isFinite(remainingQuantity)) return 0
	return STANDARD_CONTAINER_SIZES.find(
		(size) => size <= maxContainerSize && size <= remainingQuantity,
	) ?? 0
}
