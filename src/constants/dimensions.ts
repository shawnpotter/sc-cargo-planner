// @/constants/dimensions.ts
/**
 * A mapping of voxel volume (as a number) to its corresponding dimensions.
 * Each key represents the total number of voxels, and the value is a tuple
 * of three numbers: [width, height, depth].
 */
export const voxelDimensionsMap: { [key: number]: [number, number, number] } = {
	1: [1, 1, 1],
	2: [2, 1, 1],
	4: [2, 1, 2],
	8: [2, 2, 2],
	16: [4, 2, 2],
	24: [6, 2, 2],
	32: [8, 2, 2],
}
