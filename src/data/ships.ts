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
		modelPath: '/ship models/AEGIS-Avenger.glb',
		modelScale: 0.1,
		modelPosition: { x: 0.5, y: 1.4, z: -1.5 },
	},
	{
		name: 'Intrepid',
		cargoGrids: [
			{
				//LEFT
				width: 1,
				length: 4,
				height: 1,
				position: { x: -3.2, y: 0, z: 0 },
			},
			{
				//RIGHT
				width: 1,
				length: 4,
				height: 1,
				position: { x: 3.20, y: 0, z: 0 },
			},
		],
		totalCapacity: 8,
		modelPath: '/ship models/CRUSADER-Intrepid.glb',
		modelScale: 0.0075,
		modelPosition: { x: 0, y: 1.4, z: -2.35 },
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
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
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
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
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
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
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
		modelPath: '/ship models/RSI-Zeus-Mk2-ES.glb',
		modelScale: 0.006,
		modelPosition: { x: 1.5, y: 1.45, z: -2.8 },
	},
	{
		name: 'Prowler Utility',
		cargoGrids: [
			// RIGHT
			{
				width: 2,
				length: 8,
				height: 2,
				position: { x: 2, y: -0.13, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI + (15 * Math.PI / 180) }, //195 degrees
			},
			// LEFT
			{
				width: 2,
				length: 8,
				height: 2,
				position: { x: -2, y: -0.39, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI - (15 * Math.PI / 180) }, //165 degrees
			},
		],
		totalCapacity: 32,
		modelPath: '/ship models/ESPR-Prowler-Utility.glb',
		modelScale: 0.0125,
		modelPosition: { x: -0.45, y: 2.2, z: 6.4 },
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
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
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
		totalCapacity: 46,
		modelPath: '/ship models/DRAKE-Cutlass-Black.glb',
		modelScale: 0.01,
		modelPosition: { x: 8.8, y: 3.1, z: -9.55 },
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
		modelPath: '/ship models/CRUSADER-C1-Spirit.glb',
		modelScale: 0.008,
		modelPosition: { x: 0.5, y: 1.8, z: 3.05 },
	},
	{
		name: 'Mercury Star Runner',
		cargoGrids: [
			{
				//SMUGGLING COMPARTMENT
				width: 1,
				length: 3,
				height: 2,
				position: { x: 7.5, y: 0, z: 3 },
			},
			{
				//MAIN BAY
				width: 6,
				length: 6,
				height: 3,
				position: { x: 0, y: 0, z: 0 },
			},
		],
		totalCapacity: 114,
		modelPath: '/ship models/CRUSADER-Mercury-StarRunner.glb',
		modelScale: 0.01,
		modelPosition: { x: 2.55, y: 1.25, z: -3.3 },
	},
	{
		name: 'Hull-A',
		cargoGrids: [
			{
				//TOP RIGHT
				width: 2,
				length: 4,
				height: 2,
				position: { x: -1.8, y: 3, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI / 2 }, // 90 degrees
			},
			{
				//BOTTOM RIGHT
				width: 2,
				length: 4,
				height: 2,
				position: { x: -1.8, y: 0.6, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI / 2 }, // 90 degrees
			},
			{
				//TOP LEFT
				width: 2,
				length: 4,
				height: 2,
				position: { x: 2.5, y: 4, z: 0 },
				rotation: { x: 0, y: 0, z: -Math.PI / 2 }, // -90 degrees
			},
			{
				//BOTTOM LEFT
				width: 2,
				length: 4,
				height: 2,
				position: { x: 2.5, y: 1.6, z: 0 },
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
				position: { x: 1, y: 0, z: 0.7 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 0.4, y: 0, z: -5.1 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 2.6, y: 0, z: -5.1 },
			},
		],
		totalCapacity: 66,
		modelPath: '/ship models/MISC-Freelancer.glb',
		modelScale: 0.01,
		modelPosition: { x: 1.5, y: 1.2, z: -3.1 },
	},
	{
		name: 'Corsair',
		cargoGrids: [
			{
				width: 4,
				length: 9,
				height: 2,
			},
		],
		totalCapacity: 72,
		modelPath: '/ship models/DRAKE-Corsair.glb',
		modelScale: 0.01,
		modelPosition: { x: 8.8, y: 3.1, z: -9.55 },
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
		modelPath: '/ship models/RSI-Constellation-Phoenix.glb',
		modelScale: 0.011,
		modelPosition: { x: 2.05, y: 4.15, z: -0.05 },
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
		modelPath: '/ship models/RSI-Constellation-Andromeda.glb',
		modelScale: 0.011,
		modelPosition: { x: 1.55, y: 4.15, z: -0.05 },
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
		modelPath: '/ship models/RSI-Constellation-Aquila.glb',
		modelScale: 0.011,
		modelPosition: { x: 1.55, y: 0.9, z: -1.8 },
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
				position: { x: 0, y: 0, z: -6.2 },
			},
			{
				width: 1,
				length: 2,
				height: 3,
				position: { x: 3, y: 0, z: -6.2 },
			},
		],
		totalCapacity: 120,
		modelPath: '/ship models/MISC-Freelancer-Max.glb',
		modelScale: 0.008,
		modelPosition: { x: 1.45, y: 2.25, z: -2.7 },
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
				position: { x: 1, y: 3.1, z: 17.5 },
			},
		],
		totalCapacity: 174,
		modelPath: '/ship models/RSI-Constellation-Taurus.glb',
		modelScale: 0.009,
		modelPosition: { x: 1.5, y: 3.2, z: 0 },
	},
	{
		name: 'Asgard',
		cargoGrids: [
			{
				//FRONT
				width: 5,
				length: 9,
				height: 4,
			},
		],
		totalCapacity: 180,
		modelPath: '/ship models/ANVIL-Asgard.glb',
		modelScale: 0.0065,
		modelPosition: { x: 2.05, y: 3.55, z: 0 },
	},
	{
		name: 'RAFT',
		cargoGrids: [
			{
				//FRONT
				width: 8,
				length: 12,
				height: 2,
				rotation: { x: 0, y: 0, z: Math.PI }, //180 degrees
			},
		],
		totalCapacity: 192,
		modelPath: '/ship models/ARGO-RAFT.glb',
		modelScale: 0.009,
		modelPosition: { x: -3.6, y: 0.65, z: -3.2 },
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
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
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
		modelPath: '/ship models/MISC-Starlancer-MAX.glb',
		modelScale: 0.799,
		modelPosition: { x: 1.1, y: 5, z: -11.05 },
	},
	{
		name: 'MOTH',
		cargoGrids: [
			// EXTERNAL CARGO GRIDS
			//RIGHT
			{
				width: 8,
				length: 12,
				height: 4,
				position: { x: -2, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: Math.PI / 2 }, // 90 degrees
			},
			//LEFT
			{
				width: 8,
				length: 12,
				height: 4,
				position: { x: 9, y: 7, z: 0 },
				rotation: { x: 0, y: 0, z: -Math.PI / 2 }, // -90 degrees
			},
			//CENTER
			{
				width: 8,
				length: 8,
				height: 2,
				position: { x: 0, y: 0, z: 14 },
			}
		],
		totalCapacity: 225,
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
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
		modelPath: '/ship models/MISC-Starfarer.glb',
		modelScale: 0.005,
		modelPosition: { x: 2, y: 3.9, z: 8.85 },
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
				position: { x: -3, y: 0, z: 6.6 },
			},
			// Center
			{
				width: 4,
				length: 3,
				height: 2,
				position: { x: 0, y: 0, z: 6.6 },
			},
			// Right
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: 5, y: 0, z: 6.6 },
			},
			// Rear
			// Left
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: -3, y: 0, z: 13.2 },
			},
			// Center
			{
				width: 4,
				length: 3,
				height: 2,
				position: { x: 0, y: 0, z: 13.2 },
			},
			// Right
			{
				width: 2,
				length: 4,
				height: 4,
				position: { x: 5, y: 0, z: 13.2 },
			},
		],
		totalCapacity: 456,
		modelPath: '/ship models/ANVIL-Carrack.glb',
		modelScale: 0.0075,
		modelPosition: { x: 1.55, y: 8.2, z: 3.6 },
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
		modelPath: '/ship models/CRUSADER-M2.glb',
		modelScale: 0.01,
		modelPosition: { x: 3.65, y: -8.1, z: -6.75 },
	},
	{
		name: 'Polaris',
		cargoGrids: [
			{
				width: 6,
				length: 12,
				height: 4,
				position: { x: 3, y: 0, z: 0 },
			},
			{
				width: 6,
				length: 12,
				height: 4,
				position: { x: -5, y: 0, z: 0 },
			},
		],
		totalCapacity: 576,
		modelPath: '/ship models/RSI-Polaris.glb',
		modelScale: 0.022,
		modelPosition: { x: 1.5, y: 6.8, z: 10.9 },
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
				position: { x: 15.5, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: 11.5, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: 11.5, y: 0, z: 6 },
			},
			//BAY 2
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: 8.4, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: 4.4, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: 4.4, y: 0, z: 6 },
			},
			//BAY 3
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: 0.9, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: -3.1, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: -3.1, y: 0, z: 6 },
			},
			//BAY 4
			{
				width: 1,
				length: 5,
				height: 4,
				position: { x: -6.3, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 6,
				height: 4,
				position: { x: -10.3, y: 0, z: 0 },
			},
			{
				width: 4,
				length: 1,
				height: 2,
				position: { x: -10.3, y: 0, z: 6 },
			},
			//BOW
			//BAY 5
			{
				width: 2,
				length: 5,
				height: 2,
				position: { x: -14.4, y: 0, z: 1.1 },
			},
			{
				width: 4,
				length: 5,
				height: 3,
				position: { x: -18.4, y: 0, z: 1.1 },
			},
		],
		totalCapacity: 576,
		modelPath: '/ship models/DRAKE-Caterpillar.glb',
		modelScale: 0.0073,
		modelPosition: { x: 16.1, y: 2.4, z: 0.95 },
		modelRotation: { x: 0, y: 1.575, z: 0 },
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
		modelPath: '/ship models/CRUSADER-C2.glb',
		modelScale: 0.01,
		modelPosition: { x: 3.75, y: 4.7, z: -0.8 },
	},
	{
		name: 'Hull-C',
		cargoGrids: [
			{
				//FRONT TOP
				width: 12,
				length: 8,
				height: 6,
				position: { x: 0, y: 10.5, z: 1.4 },
				rotation: { x: Math.PI / 2, y: Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//REAR TOP
				width: 12,
				length: 8,
				height: 6,
				position: { x: 7, y: 10.5, z: 0 },
				rotation: { x: -Math.PI / 2, y: -Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//FRONT BOTTOM
				width: 12,
				length: 8,
				height: 6,
				position: { x: 0, y: -10.5, z: 1.4 },
				rotation: { x: Math.PI / 2, y: Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//REAR BOTTOM
				width: 12,
				length: 8,
				height: 6,
				position: { x: 7, y: -10.5, z: 0 },
				rotation: { x: -Math.PI / 2, y: -Math.PI / 2, z: 0 }, // 90 degrees
			},
			{
				//FRONT RIGHT
				width: 12,
				length: 8,
				height: 6,
				position: { x: 9, y: 9, z: 1.4 },
				rotation: { x: Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
			{
				//REAR RIGHT
				width: 12,
				length: 8,
				height: 6,
				position: { x: 9, y: 2, z: 0 },
				rotation: { x: -Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
			{
				//FRONT LEFT
				width: 12,
				length: 8,
				height: 6,
				position: { x: -13, y: 9, z: 1.4 },
				rotation: { x: Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
			{
				//REAR LEFT
				width: 12,
				length: 8,
				height: 6,
				position: { x: -13, y: 2, z: 0 },
				rotation: { x: -Math.PI / 2, y: 0, z: 0 }, // 90 degrees
			},
		],
		totalCapacity: 4608,
	},
	{
		name: 'Hammerhead',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/AEGIS-Hammerhead.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Reclaimer',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/AEGIS-Reclaimer.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Idris M',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/AEGS-Idris-M.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Idris P',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/AEGS-Idris-P.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Valkyrie',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/ANVIL-Valkyrie.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Mole',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/ARGO-MOLE.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Clipper',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/Drake-Clipper.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Cutter',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/Drake-Cutter.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Golem OX',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/Drake-Golem-OX.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Ironclad',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/Drake-Ironclad.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Shiv',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/GREY-Shiv.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Hull-B',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/MISC-HullB.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Starlancer TAC',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/MISC-Starlancer-TAC.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Perseus',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/RSI-Perseus.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
	{
		name: 'Zeus MkII CL',
		cargoGrids: [
			{
				width: 0,
				length: 0,
				height: 0,
			},
		],
		totalCapacity: 0,
		modelPath: '/ship models/RSI-Zeus-Mk2-CL.glb',
		modelScale: 0.01,
		modelPosition: { x: 0, y: 0, z: 0 },
	},
]
