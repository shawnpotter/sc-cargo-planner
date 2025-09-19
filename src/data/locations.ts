// @/data/locations.ts
export interface Location {
	name: string
	coordinates: {
		x: number
		y: number
		z: number
	}
	type:
		| 'PLANET'
		| 'MOON'
		| 'SURFACE_LOCATION'
		| 'ORBITAL_STATION'
		| 'LAGRANGE_POINT_STATION'
		| 'STAR'
	parentObject?: string // Optional property for parent planet name
	requiresPlanetaryVisit?: boolean
	isSelectable?: boolean // Add this property to control dropdown visibility
}

/* Blank Location Entry
	{
		name: '',
		coordinates: {
			x: 0,
			y: 0,
			z: 0,
		},
		type: '',
		parentObject: '',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},

*/

export const locations: Location[] = [
	{
		name: 'Microtech',
		coordinates: {
			x: 22462098871.183636,
			y: 37185749678.426445,
			z: 189.686578,
		},
		type: 'PLANET',
		parentObject: 'Stanton',
		isSelectable: false, // This will exclude it from dropdowns
	},
	{
		name: 'Sakura Sun Goldenrod Workcenter',
		coordinates: {
			x: 22462755084.700535,
			y: 37185085699.044678,
			z: -343308.506814,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Microtech Logistics Depot S4LD01',
		coordinates: {
			x: 22462094548.509617,
			y: 37186745733.850815,
			z: -19162.979761,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Port Tressler',
		coordinates: {
			x: 22462205878.764145,
			y: 37186518701.029022,
			z: 809025.374179,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Microtech',
		isSelectable: true,
	},
	{
		name: 'New Babbage Interstellar Spaceport',
		coordinates: {
			x: 22462186204.056824,
			y: 37186416555.455673,
			z: 736667.670429,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Graycat Complex-A',
		coordinates: {
			x: 22461710841.947369,
			y: 37185987264.541504,
			z: -895197.032031,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Microtech Logistics Depot S4LD13',
		coordinates: {
			x: 22462875241.786415,
			y: 37185397997.735977,
			z: 505640.973205,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Covalex Distribution Center S4DC05',
		coordinates: {
			x: 22461744884.780231,
			y: 37186639942.701118,
			z: -290382.846904,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Rayari Deltana Research Outpost',
		coordinates: {
			x: 22461308008.650204,
			y: 37185199310.97097,
			z: 316613.735807,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Euterpe',
		coordinates: {
			x: 22488108163.051502,
			y: 37081120286.133965,
			z: -219.241315,
		},
		type: 'MOON',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Devlin Scrap and Salavage',
		coordinates: {
			x: 22487975352.074718,
			y: 37081287258.037018,
			z: 26030.510019,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Euterpe',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Calliope',
		coordinates: {
			x: 22398367419.85246,
			y: 37168838490.53669,
			z: 358.985138,
		},
		type: 'MOON',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Rayari Anvik Research Outpost',
		coordinates: {
			x: 22398178240.683895,
			y: 37168722784.700752,
			z: 84748.394731,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Calliope',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Rayari Kaltag Research Outpost',
		coordinates: {
			x: 22398405108.254574,
			y: 37169042897.656616,
			z: -124531.500245,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Calliope',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Shubin Mining Facility SMCa-6',
		coordinates: {
			x: 22398162210.901531,
			y: 37168959538.875969,
			z: 24938.134259,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Calliope',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Shubin Mining Facility SMCa-8',
		coordinates: {
			x: 22398245412.599316,
			y: 37169037851.47142,
			z: -58408.864002,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Calliope',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},

	{
		name: 'MIC-L1 Shallow Frontier',
		coordinates: {
			x: 20215827021.553913,
			y: 33467069489.411396,
			z: -1177.982188,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Microtech',
		isSelectable: true,
	},
	{
		name: 'MIC-L2 Long Forest',
		coordinates: {
			x: 24713774878.330624,
			y: 40912934468.957329,
			z: -10634838.051544,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Microtech',
		isSelectable: true,
	},
	{
		name: 'MIC-L3 Endless Odyssey',
		coordinates: {
			x: -22452218987.977844,
			y: -37179922702.854362,
			z: -10590375.485732,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'MIC-L4 Red Crossroads Station',
		coordinates: {
			x: -20968720737.28299,
			y: 38056058405.033363,
			z: -11799125.531424,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'MIC-L5 Modern Icarus Station',
		coordinates: {
			x: 43448556702.784599,
			y: -857710340.468562,
			z: -7822829.551176,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Microtech',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Clio',
		coordinates: {
			x: 22476730279.67316,
			y: 37091013077.63828,
			z: -155.004205,
		},
		type: 'MOON',
		parentObject: 'Microtech',
		isSelectable: false,
	},
	{
		name: 'Rayari McGrath Research Outpost',
		coordinates: {
			x: 22476391445.423996,
			y: 37091007719.11998,
			z: -18866.354067,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Clio',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	// ArcCorp Locations
	{
		name: 'ArcCorp',
		coordinates: {
			x: 18587650376.045067,
			y: -22151916721.44251,
			z: -202.099465,
		},
		type: 'PLANET',
		parentObject: 'Stanton',
		isSelectable: false,
	},
	{
		name: 'ARC-L1 Wide Forest Station',
		coordinates: {
			x: 16729220324.519104,
			y: -19942047862.309566,
			z: 2239762.51318,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'ArcCorp',
		isSelectable: true,
	},
	{
		name: 'ARC-L2 Lively Pathway Station',
		coordinates: {
			x: 20451005373.630585,
			y: -24368054012.594452,
			z: -293868.513239,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'ArcCorp',
		isSelectable: true,
	},
	{
		name: 'ARC-L3 Modern Express Station',
		coordinates: {
			x: -25045525910.308506,
			y: 14463255477.911743,
			z: -1893364.889323,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'ArcCorp',
		isSelectable: true,
	},
	{
		name: 'ARC-L4 Faint Glen Station',
		coordinates: {
			x: 28476142410.667683,
			y: 5018900748.785149,
			z: 961122.648867,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'ArcCorp',
		isSelectable: true,
	},
	{
		name: 'ARC-L5 Yellow Core Station',
		coordinates: {
			x: -9895750972.197021,
			y: -27175156484.664516,
			z: 883823.759706,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'ArcCorp',
		isSelectable: true,
	},
	{
		name: 'Baijini Point',
		coordinates: {
			x: 18587450096.799168,
			y: -22151108865.989548,
			z: -359252.365124,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'ArcCorp',
		isSelectable: true,
	},
	{
		name: 'Riker Memorial Spaceport',
		coordinates: {
			x: 18587258501.305077,
			y: -22151279684.787693,
			z: -263019.201775,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'ArcCorp',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Lyria',
		coordinates: {
			x: 18703607512.34731,
			y: -22121649165.61217,
			z: -178.506973,
		},
		type: 'MOON',
		parentObject: 'ArcCorp',
		requiresPlanetaryVisit: true,
		isSelectable: false,
	},
	{
		name: 'Shubin Mining Facility SAL-2',
		coordinates: {
			x: 18703447303.775642,
			y: -22121645907.425655,
			z: 156683.989558,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Lyria',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Shubin Mining Facility SAL-5',
		coordinates: {
			x: 18703547691.963818,
			y: -22121760680.435688,
			z: 185873.45032,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Lyria',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Wala',
		coordinates: {
			x: 18379647648.25526,
			y: -22000466949.60188,
			z: 160.939181,
		},
		type: 'MOON',
		parentObject: 'ArcCorp',
		requiresPlanetaryVisit: true,
		isSelectable: false,
	},
	{
		name: "Samson & Son's Salvage Center",
		coordinates: {
			x: 18379823860.94754,
			y: -22000244853.645741,
			z: 19150.32226,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Wala',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},

	//Crusader Locations
	{
		name: 'Crusader',
		coordinates: {
			x: -18962225944.56563,
			y: -2664986201.807711,
			z: 214.735757,
		},
		type: 'PLANET',
		parentObject: 'Stanton',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'Seraphim Station',
		coordinates: {
			x: -18964927289.476105,
			y: -2670333599.825945,
			z: 5566118.502445,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Crusader',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'August Dunlow Spaceport',
		coordinates: {
			x: -18963922761.029148,
			y: -2670036282.67027,
			z: 5280649.894216,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Crusader',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Cellin',
		coordinates: {
			x: -18987612573.68256,
			y: -2709008659.838031,
			z: -285.322058,
		},
		type: 'MOON',
		parentObject: 'Crusader',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'Hickes Research Outpost',
		coordinates: {
			x: -18987624588.16856,
			y: -2709008714.159236,
			z: -260354.827158,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Cellin',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Terra Mills HydroFarm',
		coordinates: {
			x: -18987663184.247841,
			y: -2708919768.451767,
			z: 239066.510469,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Cellin',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Daymar',
		coordinates: {
			x: -18930536977.572266,
			y: -2610156259.190408,
			z: 235.237555,
		},
		type: 'MOON',
		parentObject: 'Crusader',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'ArcCorp Mining Area 141',
		coordinates: {
			x: -18930708915.960083,
			y: -2610223537.512774,
			z: -232764.773131,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Daymar',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Shubin Mining Facility SCD-1',
		coordinates: {
			x: -18930409379.290203,
			y: -2610012782.983427,
			z: 221307.909748,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Daymar',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: "Brio's Breaker Yard",
		coordinates: {
			x: -18930369191.357857,
			y: -2610326750.124108,
			z: 173893.489122,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Daymar',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Yela',
		coordinates: {
			x: -19022913811.687923,
			y: -2614000544.998554,
			z: 70.950909,
		},
		type: 'MOON',
		parentObject: 'Crusader',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'Grim Hex',
		coordinates: {
			x: -19022231664.884396,
			y: -2613953716.92162,
			z: -2189.75,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Yela',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Deakins Research Outpost',
		coordinates: {
			x: -19022750869.440769,
			y: -2613730906.287911,
			z: 13237.292015,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Yela',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'ArcCorp Mining Area 157',
		coordinates: {
			x: -19023129739.886398,
			y: -2614060648.649191,
			z: 220322.933733,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Yela',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'CRU-L1 Ambitious Dream Station',
		coordinates: {
			x: -17068753067.194717,
			y: -2399484301.569084,
			z: -18589.580956,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Crusader',
		isSelectable: true,
	},
	{
		name: 'CRU-L4 Shallow Fields Station',
		coordinates: {
			x: -7173768200.836102,
			y: -17750056433.556202,
			z: -2173917.335261,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Crusader',
		isSelectable: true,
	},
	{
		name: 'CRU-L5 Beautiful Glen Station',
		coordinates: {
			x: -11785014129.882797,
			y: 15091217911.80024,
			z: -2795690.70569,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Crusader',
		isSelectable: true,
	},
	// Hurston Locations
	{
		name: 'Hurston',
		coordinates: {
			x: 12850471316.57551,
			y: 2135.310385,
			z: 12.422936,
		},
		type: 'PLANET',
		parentObject: 'Stanton',
		isSelectable: false,
	},
	{
		name: 'Everus Harbor',
		coordinates: {
			x: 12849543808.699183,
			y: 488285.982021,
			z: 496144.418,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Hurston',
		isSelectable: true,
	},
	{
		name: 'Teasa Spaceport',
		coordinates: {
			x: 12851127203.905716,
			y: 483217.797877,
			z: 565284.865758,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDPC-Farnesway',
		coordinates: {
			x: 12850351859.414003,
			y: 98837.098172,
			z: 989559.670544,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDPC-Cassillo',
		coordinates: {
			x: 12851256735.89612,
			y: -605605.3068,
			z: -1541.433212,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Pinewood',
		coordinates: {
			x: 12849712206.121107,
			y: 651623.076461,
			z: 149846.229364,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Hadley',
		coordinates: {
			x: 12849729716.395996,
			y: 451714.738024,
			z: -518474.962869,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Thedus',
		coordinates: {
			x: 12850355283.013517,
			y: -990452.484264,
			z: 101492.834672,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Edmond',
		coordinates: {
			x: 12850310128.44619,
			y: 770045.217064,
			z: 620970.822798,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Sakura Sun Magnolia Workcenter',
		coordinates: {
			x: 12851289692.152641,
			y: -327572.369692,
			z: -446947.911636,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Covalex Distrubtion Center S1DC06',
		coordinates: {
			x: 12849903144.177992,
			y: -495138.491514,
			z: 671472.40037,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Reclamation & Disposal Orinth',
		coordinates: {
			x: 12849845464.755562,
			y: 506704.76717,
			z: 607748.137966,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Magda',
		coordinates: {
			x: 12792756579.757433,
			y: 74493178.302505,
			z: 328.867785,
		},
		type: 'MOON',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'HDMS-Hahn',
		coordinates: {
			x: 12792695784.600222,
			y: -74791739.335424,
			z: 95214.113918,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Magda',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Perlman',
		coordinates: {
			x: 12792471577.909569,
			y: -74226780.932083,
			z: -116764.291162,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Magda',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Aberdeen',
		coordinates: {
			x: 12905757798.940798,
			y: 40952538.620226,
			z: 215.626387,
		},
		type: 'MOON',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'HDMS-Anderson',
		coordinates: {
			x: 12905583846.886797,
			y: 41010143.511407,
			z: 206944.876255,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Aberdeen',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Norgaard',
		coordinates: {
			x: 12905516633.35206,
			y: 40944729.124916,
			z: 132087.610209,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Aberdeen',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Arial',
		coordinates: {
			x: 12892674397.492691,
			y: 31477757.255813,
			z: 331.719821,
		},
		type: 'MOON',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'HDMS-Lathan',
		coordinates: {
			x: 12893014214.114399,
			y: -31475076.259443,
			z: 55870.863944,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Arial',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Bezdek',
		coordinates: {
			x: 12892687272.888596,
			y: -31711884.275895,
			z: 251554.599752,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Arial',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'Ita',
		coordinates: {
			x: 12830339093.7791,
			y: 114981521.688699,
			z: 137.575918,
		},
		type: 'MOON',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
	{
		name: 'HDMS-Woodruff',
		coordinates: {
			x: 12829947737.473194,
			y: 114892025.891365,
			z: 210389.392391,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Ita',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HDMS-Ryder',
		coordinates: {
			x: 12830510296.522255,
			y: 114886791.66621,
			z: 73674.319487,
		},
		type: 'SURFACE_LOCATION',
		parentObject: 'Ita',
		requiresPlanetaryVisit: true,
		isSelectable: true,
	},
	{
		name: 'HUR-L1 Green Glade Station',
		coordinates: {
			x: 11561409892.649874,
			y: -248771.529342,
			z: -482668.675576,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'HUR-L2 Faithful Dream Station',
		coordinates: {
			x: 14139637855.747574,
			y: -1963409.748783,
			z: -530524.245962,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'HUR-L3 Thundering Express Station',
		coordinates: {
			x: -12844744193.538008,
			y: 1553722.464754,
			z: 1335007.217963,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'HUR-L4 Melodic Fields Station',
		coordinates: {
			x: 6427626864.104088,
			y: 11124765196.768656,
			z: 667740.035747,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'HUR-L5 High Course Station',
		coordinates: {
			x: 6425735818.058785,
			y: -11128345420.938297,
			z: -842525.043225,
		},
		type: 'LAGRANGE_POINT_STATION',
		parentObject: 'Hurston',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	// Gateway locations
	{
		name: 'Terra Gateway',
		coordinates: {
			x: 51118171199.602074,
			y: -5269991749.509356,
			z: -4339546845.511043,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Stanton',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Magnus Gateway',
		coordinates: {
			x: -62284230641.014549,
			y: 23467600279.299519,
			z: 20198394772.913158,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Stanton',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	{
		name: 'Pyro Gateway',
		coordinates: {
			x: 3310460817.715726,
			y: -27979391329.693916,
			z: -2676295454.781141,
		},
		type: 'ORBITAL_STATION',
		parentObject: 'Stanton',
		requiresPlanetaryVisit: false,
		isSelectable: true,
	},
	//Star
	{
		name: 'Stanton',
		coordinates: {
			x: 0,
			y: 0,
			z: 0,
		},
		type: 'STAR',
		parentObject: 'Stanton',
		requiresPlanetaryVisit: false,
		isSelectable: false,
	},
]

// Helper function to get only selectable locations for dropdowns
export const getSelectableLocations = () =>
	locations.filter((loc) => loc.isSelectable)
