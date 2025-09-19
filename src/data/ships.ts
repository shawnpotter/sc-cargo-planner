// @/data/ships.ts
import { Ship } from '@/constants/types'

// All rotations are in radians (Math.PI/2 = 90 degrees)
export const ships: Ship[] = [
	{
		name: 'Avenger Titan',
		cargoGrids: [
			{
				width: 2,
				length: 4,
				height: 1,
				position: { x: 0, y: 0, z: 0 },
			},
		],
		totalCapacity: 8,
	},
	{
		name: 'Intrepid',
		cargoGrids: [
			{
				//LEFT
				width: 1,
				length: 4,
				height: 1,
				position: { x: -2, y: 0, z: 0 },
			},
			{
				//RIGHT
				width: 1,
				length: 4,
				height: 1,
				position: { x: 2, y: 0, z: 0 },
			},
		],
		totalCapacity: 8,
	},
	{
		name: 'SRV',
		cargoGrids: [
			{
				width: 4,
				length: 3,
				height: 1,
				position: { x: 0, y: 0, z: 0 },
			},
		],
		totalCapacity: 12,
	},
	{
		name: 'MPUV-T',
		cargoGrids: [
			{
				width: 2,
				length: 4,
				height: 2,
				position: { x: 0, y: 0, z: 0 },
			},
		],
		totalCapacity: 16,
	},
	{
		name: 'Nomad',
		cargoGrids: [
			{
				width: 3,
				length: 4,
				height: 2,
				position: { x: 0, y: 0, z: 0 },
			},
		],
		totalCapacity: 24,
	},
	{
		name: 'Zeus MkII ES',
		cargoGrids: [
			{
				width: 4,
				length: 6,
				height: 2,
			},
		],
		totalCapacity: 32,
	},
	{
		name: 'Freelancer DUR/MIS',
		cargoGrids: [
			{
				width: 2,
				length: 4,
				height: 3,
				position: { x: 1, y: 0, z: 0 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 0, y: 0, z: -3 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 3, y: 0, z: -3 },
			},
		],
		totalCapacity: 36,
	},
	{
		name: 'Cutlass Black',
		cargoGrids: [
			{
				//Front
				width: 4,
				length: 5,
				height: 2,
				position: { x: -2, y: 0, z: -4 },
			},
			{
				//Rear
				width: 1,
				length: 3,
				height: 2,
				position: { x: -0.5, y: 0, z: 3 },
			},
		],
		totalCapacity: 64,
	},
	{
		name: 'C1 Spirit',
		cargoGrids: [
			{
				//LEFT
				width: 2,
				length: 8,
				height: 2,
				position: { x: -2, y: 0, z: 0 },
			},
			{
				//RIGHT
				width: 2,
				length: 8,
				height: 2,
				position: { x: 2, y: 0, z: 0 },
			},
		],
		totalCapacity: 64,
	},
	{
		name: 'Mercury Star Runner',
		cargoGrids: [
			{
				//SMUGGLING COMPARTMENT
				width: 1,
				length: 3,
				height: 2,
				position: { x: 7, y: 0, z: 3 },
			},
			{
				//MAIN BAY
				width: 6,
				length: 6,
				height: 3,
				position: { x: 0, y: 0, z: 0 },
			},
		],
		totalCapacity: 64,
	},
	{
		name: 'Hull-A',
		cargoGrids: [
			{
				//TOP RIGHT
				width: 2,
				length: 4,
				height: 2,
				position: { x: -1, y: 3, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI / 2 }, // 90 degrees
			},
			{
				//BOTTOM RIGHT
				width: 2,
				length: 4,
				height: 2,
				position: { x: -1, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI / 2 }, // 90 degrees
			},
			{
				//TOP LEFT
				width: 2,
				length: 4,
				height: 2,
				position: { x: 1, y: 4, z: 0 },
				rotation: { x: 0, y: 0, z: -Math.PI / 2 }, // -90 degrees
			},
			{
				//BOTTOM LEFT
				width: 2,
				length: 4,
				height: 2,
				position: { x: 1, y: 1, z: 0 },
				rotation: { x: 0, y: 0, z: -Math.PI / 2 }, // -90 degrees
			},
		],
		totalCapacity: 64,
	},
	{
		name: 'Freelancer',
		cargoGrids: [
			{
				width: 2,
				length: 9,
				height: 3,
				position: { x: 1, y: 0, z: 0 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 0, y: 0, z: -3 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 3, y: 0, z: -3 },
			},
		],
		totalCapacity: 66,
	},
	{
		name: 'Freelancer MAX',
		cargoGrids: [
			{
				width: 4,
				length: 9,
				height: 3,
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 0, y: 0, z: -3 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 3, y: 0, z: -3 },
			},
		],
		totalCapacity: 120,
	},
	{
		name: 'Corsair',
		cargoGrids: [
			{
				width: 4,
				length: 6,
				height: 3,
			},
		],
		totalCapacity: 72,
	},
	{
		name: 'Constellation Phoenix',
		cargoGrids: [
			{
				width: 5,
				length: 8,
				height: 2,
			},
		],
		totalCapacity: 80,
	},
	{
		name: 'Constellation Andromeda',
		cargoGrids: [
			{
				width: 4,
				length: 8,
				height: 3,
			},
		],
		totalCapacity: 96,
	},
	{
		name: 'Constellation Aquila',
		cargoGrids: [
			{
				width: 4,
				length: 8,
				height: 3,
			},
		],
		totalCapacity: 96,
	},
	{
		name: 'Constellation Taurus',
		cargoGrids: [
			{
				width: 4,
				length: 14,
				height: 3,
			},
			{
				width: 2,
				length: 3,
				height: 1,
				position: { x: 1, y: 2, z: 15 },
			},
		],
		totalCapacity: 174,
	},
	{
		name: 'RAFT',
		cargoGrids: [
			{
				//FRONT
				width: 8,
				length: 12,
				height: 2,
				position: { x: 3, y: 2, z: -7 },
				rotation: { x: 0, y: 0, z: Math.PI }, //180 degrees
			},
		],
		totalCapacity: 192,
	},
	{
		name: 'A2 Hercules',
		cargoGrids: [
			{
				width: 6,
				length: 18,
				height: 2,
			},
		],
		totalCapacity: 216,
	},
	{
		name: 'Starlancer MAX',
		cargoGrids: [
			// Rear Left
			{
				width: 2,
				length: 8,
				height: 3,
				position: { x: -2, y: 0, z: 7 },
			},
			// Rear Right
			{
				width: 2,
				length: 8,
				height: 3,
				position: { x: 3, y: 0, z: 7 },
			},
			//Front Left
			{
				width: 2,
				length: 16,
				height: 2,
				position: { x: -1, y: 0, z: -12 },
			},
			// Front Right
			{
				width: 2,
				length: 16,
				height: 2,
				position: { x: 2, y: 0, z: -12 },
			},
		],
		totalCapacity: 224,
	},
	{
		name: 'Starfarer',
		cargoGrids: [
			{
				//CENTER
				width: 5,
				length: 7,
				height: 5,
				position: { x: 0, y: 0, z: 0 },
			},
			{
				//LEFT
				width: 2,
				length: 5,
				height: 5,
				position: { x: -4, y: 0, z: 0 },
			},
			{
				width: 2,
				length: 2,
				height: 2,
				position: { x: -4, y: 0, z: 5 },
			},
			{
				//RIGHT
				width: 2,
				length: 5,
				height: 5,
				position: { x: 7, y: 0, z: 0 },
			},
			{
				width: 2,
				length: 2,
				height: 2,
				position: { x: 7, y: 0, z: 5 },
			},
		],
		totalCapacity: 291,
	},
	{
		name: 'Carrack',
		cargoGrids: [
			// Front
			// Left
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: -3, y: 0, z: 0 },
			},
			// Center
			{
				width: 4,
				length: 3,
				height: 2,
				position: { x: 0, y: 0, z: 0 },
			},
			// Right
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: 5, y: 0, z: 0 },
			},
			// Center
			// Left
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: -3, y: 0, z: 6 },
			},
			// Center
			{
				width: 4,
				length: 3,
				height: 2,
				position: { x: 0, y: 0, z: 6 },
			},
			// Right
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: 5, y: 0, z: 6 },
			},
			// Rear
			// Left
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: -3, y: 0, z: 12 },
			},
			// Center
			{
				width: 4,
				length: 3,
				height: 2,
				position: { x: 0, y: 0, z: 12 },
			},
			// Right
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: 5, y: 0, z: 12 },
			},
		],
		totalCapacity: 456,
	},
	{
		name: 'M2 Hercules',
		cargoGrids: [
			{
				width: 8,
				length: 15,
				height: 3,
			},
			{
				width: 6,
				length: 9,
				height: 3,
				position: { x: 1, y: 0, z: -12 },
			},
		],
		totalCapacity: 522,
	},
	{
		name: 'Polaris',
		cargoGrids: [
			{
				width: 6,
				length: 12,
				height: 4,
				position: { x: 4, y: 0, z: 0 },
			},
			{
				width: 6,
				length: 12,
				height: 4,
				position: { x: -6, y: 0, z: 0 },
			},
		],
		totalCapacity: 576,
	},
	{
		name: 'Caterpillar',
		cargoGrids: [
			//STERN
			//BAY 1
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: 14, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: 10, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: 10, y: 0, z: 6 },
			},
			//BAY 2
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: 8, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: 4, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: 4, y: 0, z: 6 },
			},
			//BAY 3
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: 2, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: -2, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: -2, y: 0, z: 6 },
			},
			//BAY 4
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: -4, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: -8, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: -8, y: 0, z: 6 },
			},
			//BOW
			//BAY 5
			{
				width: 2,
				length: 5,
				height: 2,
				position: { x: -11, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 5,
				height: 3,
				position: { x: -15, y: 0, z: 0 },
			},
		],
		totalCapacity: 576,
	},
	{
		name: 'C2 Hercules',
		cargoGrids: [
			{
				width: 8,
				length: 15,
				height: 4,
			},
			{
				width: 6,
				length: 9,
				height: 4,
				position: { x: 1, y: 0, z: -12 },
			},
		],
		totalCapacity: 696,
	},
	{
		name: 'Hull-C',
		cargoGrids: [
			{
				//FRONT TOP
				width: 12,
				length: 8,
				height: 6,
				position: { x: -2, y: 8, z: 5 },
				rotation: { x: Math.PI / 2, y: Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//REAR TOP
				width: 12,
				length: 8,
				height: 6,
				position: { x: 5, y: 8, z: 0 },
				rotation: { x: -Math.PI / 2, y: -Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//FRONT BOTTOM
				width: 12,
				length: 8,
				height: 6,
				position: { x: -2, y: -14, z: 5 },
				rotation: { x: Math.PI / 2, y: Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//REAR BOTTOM
				width: 12,
				length: 8,
				height: 6,
				position: { x: 5, y: -14, z: 0 },
				rotation: { x: -Math.PI / 2, y: -Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//FRONT RIGHT
				width: 12,
				length: 8,
				height: 6,
				position: { x: 6, y: 6, z: 5 },
				rotation: { x: Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
			{
				//REAR RIGHT
				width: 12,
				length: 8,
				height: 6,
				position: { x: 6, y: -1, z: 0 },
				rotation: { x: -Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
			{
				//FRONT LEFT
				width: 12,
				length: 8,
				height: 6,
				position: { x: -14, y: 6, z: 5 },
				rotation: { x: Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
			{
				//REAR LEFT
				width: 12,
				length: 8,
				height: 6,
				position: { x: -14, y: -1, z: 0 },
				rotation: { x: -Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
		],
		totalCapacity: 4608,
	},
]
