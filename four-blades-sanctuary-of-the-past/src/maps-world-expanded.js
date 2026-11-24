/**
 * Phase 3 Hyrule-Scale World Expansion (14 Variable-Size & Thin Scrolling Rooms):
 * - 3 Distinct Biome Villages: Sanctuary Haven (36x22), Oasis Bazaar (24x16), Emberwatch Outpost (24x16)
 * - Village Interiors: Haven Inn, Haven Blacksmith, Sanctuary Arena, Oasis Apothecary, Emberwatch Smithy
 * - 6 Scrolling & Thin Wilderness Biomes: Emerald Deepwoods (28x18), Thin Ravine (12x22),
 *   Sapphire Lakefront (34x15), Sunscorched Desert (36x20), Thin Crag-Peak Ascent (14x24), Death-Peak Ridge (34x18)
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  // Helper to ensure every row matches the declared width cleanly
  function makeRows(cols, rows) {
    return rows.map((line) =>
      line.length === cols ? line : line.length < cols ? line.padEnd(cols, line[line.length - 1] || '.') : line.slice(0, cols)
    );
  }

  FB.registerMapRegion((parseGrid) => ({
    // =========================================================================
    // VILLAGE #1: SANCTUARY HAVEN (36x22 Scrolling Grassland Hub)
    // =========================================================================
    ow_haven: {
      id: 'ow_haven',
      name: 'Sanctuary Haven Village',
      area: 'village',
      gx: 0,
      gy: 2,
      exits: {
        north: { target: 'ow_start', targetCol: 10, targetRow: 11 },
        west: { target: 'ow_deepwoods', targetCol: 26, targetRow: 9 },
        east: { target: 'ow_ravine', targetCol: 1, targetRow: 11 },
        south: { target: 'ow_desert', targetCol: 17, targetRow: 1 },
      },
      portals: [
        { col: 7, row: 6, targetRoom: 'ow_haven_inn', targetCol: 10, targetRow: 10 },
        { col: 28, row: 6, targetRoom: 'ow_haven_smith', targetCol: 10, targetRow: 10 },
        { col: 28, row: 16, targetRoom: 'ow_arena', targetCol: 12, targetRow: 13 },
      ],
      grid: parseGrid(
        makeRows(36, [
          'TTTTTTTTTTTTTTTTppTTTTTTTTTTTTTTTTTT',
          'T..,....,,.....pppp.....,,....,,...T',
          'T..UUUUUUU.....pppp....UUUUUUU.....T',
          'T..UUUUUUU.....pppp....UUUUUUU.....T',
          'T..HHHHHHH.....pppp....HHHHHHH.....T',
          'T..HHHHHHH..N..pppp....HHHHHHH.....T',
          'T..HHHeHHH.....pppp..N.HHHeHHH.....T',
          'T....kkk.......kkkk.......kkk......T',
          'T...kkkkkkkkkkkkkkkkkkkkkkkkkk.....T',
          'T..kkkkkkkkkkkkkkkkkkkkkkkkkkkk....T',
          'ppppppkkkkkkkkkkQQkkkkkkkkkkpppppppp',
          'ppppppkkkkkkkkkkQQkkkkkkkkkkpppppppp',
          'T..kkkkkkkkkkkkkkkkkkkkkkkkkkkk....T',
          'T...kkkkkkkkk?kkkkkkNkkkkkkkkk.....T',
          'T......kkk.....pppp....SSSSSSS.....T',
          'T..bb..kkk.....pppp....S00000S.....T',
          'T..bb...o......pppp....SS000SS.....T',
          'T..,...........pppp......ppp.......T',
          'T.....,,...N...pppp......ppp..bb...T',
          'T..bbb.........pppp..o........bb...T',
          'T..............pppp................T',
          'TTTTTTTTTTTTTTTTppTTTTTTTTTTTTTTTTTT',
        ])
      ),
      signs: [
        {
          col: 13,
          row: 13,
          text: 'SANCTUARY HAVEN: Inn (NW, free heal), Master Blacksmith (NE), Sanctuary Arena (SE). West: Deepwoods | East: Ravine & Peaks | South: Sunscorched Desert!',
        },
      ],
      npcs: [
        {
          col: 12,
          row: 5,
          text: 'ELDER ROWAN: Welcome to Sanctuary Haven! Touch the crystal fountain or rest inside our Inn anytime to restore full hearts for free.',
        },
        {
          col: 21,
          row: 6,
          text: 'APPRENTICE BROM: Master Blacksmith Dain inside forges the Golden Master Blade and brews Pegasus Oil for lightning-fast dashes!',
        },
        {
          col: 20,
          row: 13,
          text: 'SCOUT LYRA: Rumor speaks of four Sovereign Medallions — Shadow in the North Palace, Solar in the South Desert, Frost in the Dark World, and Magma atop Death-Peak!',
        },
        {
          col: 11,
          row: 18,
          text: 'CARAVANNER ZALE: Heading south into the Sunscorched Desert? Visit Oasis Bazaar to the west for Grip Sandals & Blue Elixir!',
        },
      ],
      enemies: [],
    },

    ow_haven_inn: {
      id: 'ow_haven_inn',
      name: 'Sanctuary Haven Inn',
      area: 'shop',
      gx: 0,
      gy: 10,
      exits: {},
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_haven', targetCol: 7, targetRow: 7 },
        { col: 10, row: 11, targetRoom: 'ow_haven', targetCol: 7, targetRow: 7 },
      ],
      grid: parseGrid(
        makeRows(20, [
          'SSSSSSSSSSSSSSSSSSSS',
          'SffffffffffffffffffS',
          'SftffffffNffffffftfS',
          'SffWWWWWWWWWWWWWWffS',
          'SffffffffffffffffffS',
          'SffffrffffffffrffffS',
          'SffffrffffffffrffffS',
          'SffffffffffffffffffS',
          'SfoffffffffffffffofS',
          'SftffffffppfffffftfS',
          'SffffffffppffffffffS',
          'SffffffffvvffffffffS',
          'SSSSSSSSSSSSSSSSSSSS',
        ])
      ),
      npcs: [
        {
          col: 9,
          row: 2,
          heals: true,
          text: 'INNKEEPER MARA: Rest easy, Heroes! Your hearts are completely restored. May the Four Blades guide you!',
        },
      ],
      enemies: [],
    },

    ow_haven_smith: {
      id: 'ow_haven_smith',
      name: 'Haven Master Blacksmith',
      area: 'shop',
      gx: 1,
      gy: 10,
      merchantText: 'BLACKSMITH DAIN: Finest steel in the realm! Step up to any pedestal to forge the Golden Master Blade or buy Pegasus Oil!',
      exits: {},
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_haven', targetCol: 28, targetRow: 7 },
        { col: 10, row: 11, targetRoom: 'ow_haven', targetCol: 28, targetRow: 7 },
      ],
      shopItems: [
        { col: 5, row: 6, catalogId: 'heal' },
        { col: 8, row: 6, catalogId: 'potion' },
        { col: 11, row: 6, catalogId: 'pegasus_oil' },
        { col: 14, row: 6, catalogId: 'golden_blade' },
      ],
      grid: parseGrid(
        makeRows(20, [
          'SSSSSSSSSSSSSSSSSSSS',
          'SffffffffffffffffffS',
          'SftffffffMffffffftfS',
          'SffWWWWWWWWWWWWWWffS',
          'SffffffffffffffffffS',
          'SffffffffffffffffffS',
          'SffffIffIffIffIffffS',
          'SffffffffffffffffffS',
          'SffffffffffffffffffS',
          'SfoffffffffffffffofS',
          'SftffffffppfffffftfS',
          'SffffffffvvffffffffS',
          'SSSSSSSSSSSSSSSSSSSS',
        ])
      ),
      enemies: [],
    },

    ow_arena: {
      id: 'ow_arena',
      name: 'Sanctuary Battle Arena',
      area: 'dungeon',
      gx: 2,
      gy: 10,
      exits: {},
      portals: [
        { col: 11, row: 14, targetRoom: 'ow_haven', targetCol: 28, targetRow: 17 },
        { col: 12, row: 14, targetRoom: 'ow_haven', targetCol: 28, targetRow: 17 },
      ],
      grid: parseGrid(
        makeRows(24, [
          '########################',
          '#t____________________t#',
          '#_____N__________N_____#',
          '#__A________________A__#',
          '#______________________#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______________________#',
          '#__A________________A__#',
          '#__o________________o__#',
          '#t____________________t#',
          '#__________OO__________#',
          '########################',
        ])
      ),
      npcs: [
        {
          col: 6,
          row: 2,
          arenaMode: 'gauntlet',
          text: 'ARENA MASTER VEX: Step forward to test your blades in the 5-Wave Sanctuary Gauntlet!',
        },
        {
          col: 17,
          row: 2,
          arenaMode: 'boss_rush',
          text: 'SOVEREIGN KEEPER: Unite all 4 Sovereign Medallions to unlock the Four Sovereigns Boss Rush!',
        },
      ],
      enemies: [],
    },

    // =========================================================================
    // EMERALD DEEPWOODS (28x18 Wide Scrolling Ancient Forest)
    // =========================================================================
    ow_deepwoods: {
      id: 'ow_deepwoods',
      name: 'Emerald Deepwoods',
      area: 'overworld',
      gx: -1,
      gy: 2,
      exits: {
        north: { target: 'ow_woods', targetCol: 10, targetRow: 11 },
        east: { target: 'ow_haven', targetCol: 1, targetRow: 11 },
      },
      grid: parseGrid(
        makeRows(28, [
          'TTTTTTTTTTTTTppTTTTTTTTTTTTT',
          'T..C..T.....pppp.....,,....T',
          'T.....T..b..pppp..bb.......T',
          'T..p..T.....pppp..bb..o....T',
          'TTTRTTT.....pppp...........T',
          'T..p........pppp....TTT....T',
          'T..ppppppppppppp....TTT....T',
          'T..p........pppp...........T',
          'T..p...bb...pppppppppppppppp',
          'T..p...bb...pppppppppppppppp',
          'T..p........pppp......bb...T',
          'T..pppp.....pppp..,........T',
          'T.....p.....pppp.....TTT...T',
          'T..o..p..,..pppp.....TTT...T',
          'T.....pppppppppp...........T',
          'T..bb....,,.......bb....o..T',
          'T..........................T',
          'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        ])
      ),
      chests: [
        {
          col: 3,
          row: 1,
          reward: 'rupee_100',
          label: 'Deepwoods Emerald Stash! +100 Rupees & Full Heal!',
        },
      ],
      heartPieces: [{ id: 'hp_deepwoods', col: 2, row: 2 }],
      enemies: [
        { type: 'chuchu', col: 9, row: 6 },
        { type: 'soldier', col: 18, row: 10 },
        { type: 'octorok', col: 22, row: 14 },
        { type: 'red_soldier', col: 10, row: 14 },
      ],
    },

    // =========================================================================
    // THIN WHISPERING RAVINE (12x22 Thin Vertical Scrolling Canyon!)
    // =========================================================================
    ow_ravine: {
      id: 'ow_ravine',
      name: 'Whispering Ravine',
      area: 'overworld',
      gx: 1,
      gy: 2,
      exits: {
        north: { target: 'ow_river', targetCol: 10, targetRow: 11 },
        west: { target: 'ow_haven', targetCol: 34, targetRow: 11 },
        east: { target: 'ow_mountain_ascent', targetCol: 1, targetRow: 18 },
      },
      grid: parseGrid(
        makeRows(12, [
          'SSSSSppSSSSS',
          'S|||pppp|||S',
          'S~~~pppp~~~S',
          'S..pppppp..S',
          'S..p....p..S',
          'S..p.bb.p..S',
          'S..pppppp..S',
          'S~~~~==~~~~S',
          'S~~~~==~~~~S',
          'S..pppppp..S',
          'pppppppp...S',
          'pppppppp...S',
          'S..p...p...S',
          'S..p...ppppp',
          'S..p...ppppp',
          'S..p.o.p...S',
          'S..ppppp...S',
          'S....p..b..S',
          'S..,.p..b..S',
          'S....p.o...S',
          'S..bb......S',
          'SSSSSSSSSSSS',
        ])
      ),
      enemies: [
        { type: 'octorok', col: 4, row: 5 },
        { type: 'soldier', col: 7, row: 11 },
        { type: 'stalfos', col: 5, row: 17 },
      ],
    },

    // =========================================================================
    // SAPPHIRE LAKEFRONT (34x15 Wide Panoramic Water & Timber Docks)
    // =========================================================================
    ow_lake: {
      id: 'ow_lake',
      name: 'Sapphire Lakefront',
      area: 'overworld',
      gx: 2,
      gy: 1,
      exits: {
        west: { target: 'ow_river', targetCol: 18, targetRow: 6 },
      },
      grid: parseGrid(
        makeRows(34, [
          'SSSSSSSSS||||||SSSSSSSSS||||||SSSS',
          'T..,,,...~~~~~~...,,,...~~~~~~...T',
          'T..bb....~~~~~~...~~~...~~~~~~...T',
          'T........~~~~~~~~~~~~~~~~~~~~~~~.T',
          'T..pppp..~~~~~~..&..C..~~~~~~~~~.T',
          'T..p..p..~~~~~~........~~~~~~~~~.T',
          'ppppppp..~~~~~~..&.....~~~~~~~~~.T',
          'ppppppyyyyyyyyy~~~~~~~~~~yyyyy...T',
          'T..p..yyyyyyyyy~~~~~~~~~~yyyyy...T',
          'T..p..p..~~~~~~&~~~~~~~~&~~~~~~~.T',
          'T..pppp..~~~~~~~~~~~~~~~~~~~~~~~.T',
          'T..o.....~~~~~~...,,,...~~~~~~~~.T',
          'T....,,..~~~~~~..bb.....~~..o..~.T',
          'T.........................,,,....T',
          'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        ])
      ),
      chests: [
        {
          col: 20,
          row: 4,
          reward: 'rupee_100',
          label: 'Sapphire Island Chest! +100 Rupees & Full Heal!',
        },
      ],
      heartPieces: [{ id: 'hp_lake', col: 19, row: 5 }],
      enemies: [
        { type: 'octorok', col: 6, row: 3 },
        { type: 'chuchu', col: 10, row: 7 },
        { type: 'keese', col: 22, row: 6 },
        { type: 'red_soldier', col: 27, row: 8 },
      ],
    },

    // =========================================================================
    // SUNSCORCHED DESERT (36x20 Massive Scrolling Golden Dunes + Temple Gate)
    // =========================================================================
    ow_desert: {
      id: 'ow_desert',
      name: 'Sunscorched Desert',
      area: 'desert',
      gx: 0,
      gy: 3,
      exits: {
        north: { target: 'ow_haven', targetCol: 17, targetRow: 20 },
        west: { target: 'ow_oasis', targetCol: 22, targetRow: 8 },
      },
      portals: [],
      grid: parseGrid(
        makeRows(36, [
          'nnnnnnnnnnnnnnnnjjnnnnnnnnnnnnnnnnnn',
          'naaaaaaaaaaaaaajjjjaaaaaaaaaaaaaaaan',
          'naaaxaaaaaaaanajjjjanaaaaaaxaaaaaaan',
          'naaaaaaaaaaaanajjjjanaaaaaaaaaaaaaan',
          'naaaaaannaaaanaajjaanaaaaaannaaaaaan',
          'naaaaaaaaaaaaaaajjaaaaaaaaaaaaaaaa.n',
          'naaaxaaaaaaaaaaajjaaaaaaaaannnaaaaan',
          'naaaaaaaaaaaaaajjjjaaaaaaaanGGnaaaan',
          'naaaanaaaaaaaaajjjjaaaaaaaajjjjaaaan',
          'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjaaaan',
          'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjaaaan',
          'naaaanaaaaaaaaajjjjaaaaaaaaaaaaaaaan',
          'naaaaaaaaaaaaaajjjjaaaaaxaaaaaaaaaan',
          'naaaaaaxaaaaaaaajjaaaaaaaaaaaanaaaan',
          'naaannaaaaaaaaaajjaaaaaan&naaaaaaaan',
          'naaaaaaaaaaaoaaajjaaaaaanaaaaaaaaaan',
          'naaaaaaxaaaaaaaajjjjjjjjjjjjaaaaaaan',
          'naaaaaaaaaaaaaaaaaoaaaaaaaaaaxaaaaan',
          'naaanaaaaaaaaaaaaaaaaaaaaaaaaanaaaan',
          'nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn',
        ])
      ),
      signs: [],
      heartPieces: [{ id: 'hp_desert', col: 28, row: 15 }],
      enemies: [
        { type: 'octorok', col: 8, row: 5 },
        { type: 'stalfos', col: 17, row: 10 },
        { type: 'red_soldier', col: 24, row: 10 },
        { type: 'wizzrobe', col: 14, row: 15 },
        { type: 'chuchu', col: 26, row: 16 },
      ],
    },

    // =========================================================================
    // VILLAGE #2: OASIS BAZAAR (24x16 Desert Trading Village)
    // =========================================================================
    ow_oasis: {
      id: 'ow_oasis',
      name: 'Oasis Bazaar Village',
      area: 'desert',
      gx: -1,
      gy: 3,
      exits: {
        east: { target: 'ow_desert', targetCol: 1, targetRow: 10 },
      },
      portals: [
        { col: 15, row: 5, targetRoom: 'ow_oasis_shop', targetCol: 10, targetRow: 10 },
      ],
      grid: parseGrid(
        makeRows(24, [
          'nnnnnnnnnnnnnnnnnnnnnnnn',
          'naaFFFaaaaaaaUUUUUUUaaan',
          'naaFFFaaaaaaaUUUUUUUaaan',
          'naaFFFaaNaaaaHHHHHHHaaan',
          'naajjjaaaaaaaHHHHHHHaaan',
          'naajjjaaaaaaaHHHeHHHaaan',
          'naajjjjjjjjjjjjjjjjaaaan',
          'naajjjjjjjjjjjjjjjjjjjjj',
          'naajjjj?jjjjjjjjjjjjjjjj',
          'naajjjjjjNjjjjjjjjjaaaan',
          'naaaxaaaajjjaaaaaaxaaaan',
          'naaaoaaaajjjaaaaaaoaaaan',
          'naaaaaaaaajjjjjjaaaaaaan',
          'naaanaaaaaaaaaaanaaaaaan',
          'naaaaaaaaaaaaaaaaaaaaaan',
          'nnnnnnnnnnnnnnnnnnnnnnnn',
        ])
      ),
      signs: [
        {
          col: 7,
          row: 8,
          text: 'OASIS BAZAAR: Refresh yourself in the Oasis Spring (NW) or step into the Apothecary (NE) for Grip Sandals & Blue Elixir!',
        },
      ],
      npcs: [
        {
          col: 8,
          row: 3,
          heals: true,
          text: 'OASIS KEEPER NADIA: Drink deeply from the cool Oasis Spring! All heroes are restored to full hearts!',
        },
        {
          col: 9,
          row: 9,
          text: 'SCHOLAR FARID: Sunspire Temple lies east across the dunes! Beware Beamos laser statues — only Bombs can shatter them!',
        },
      ],
      enemies: [],
    },

    ow_oasis_shop: {
      id: 'ow_oasis_shop',
      name: 'Oasis Apothecary & Bazaar',
      area: 'shop',
      gx: -1,
      gy: 10,
      merchantText: 'APOTHECARY ZARA: Welcome! Grip Sandals stop icy slipping and boost stride; Blue Elixir saves you from lethal blows!',
      exits: {},
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_oasis', targetCol: 15, targetRow: 6 },
        { col: 10, row: 11, targetRoom: 'ow_oasis', targetCol: 15, targetRow: 6 },
      ],
      shopItems: [
        { col: 5, row: 6, catalogId: 'heal' },
        { col: 8, row: 6, catalogId: 'potion' },
        { col: 11, row: 6, catalogId: 'grip_sandals' },
        { col: 14, row: 6, catalogId: 'blue_elixir' },
      ],
      grid: parseGrid(
        makeRows(20, [
          'SSSSSSSSSSSSSSSSSSSS',
          'SffffffffffffffffffS',
          'SftffffffMffffffftfS',
          'SffWWWWWWWWWWWWWWffS',
          'SffffffffffffffffffS',
          'SffffffffffffffffffS',
          'SffffIffIffIffIffffS',
          'SffffffffffffffffffS',
          'SffffffffffffffffffS',
          'SfoffffffffffffffofS',
          'SftffffffppfffffftfS',
          'SffffffffvvffffffffS',
          'SSSSSSSSSSSSSSSSSSSS',
        ])
      ),
      enemies: [],
    },

    // =========================================================================
    // THIN CRAG-PEAK ASCENT (14x24 Thin Vertical Volcanic Switchback!)
    // =========================================================================
    ow_mountain_ascent: {
      id: 'ow_mountain_ascent',
      name: 'Crag-Peak Ascent',
      area: 'mountain',
      gx: 2,
      gy: 2,
      exits: {
        west: { target: 'ow_ravine', targetCol: 10, targetRow: 14 },
        north: { target: 'ow_mountain_ridge', targetCol: 8, targetRow: 16 },
      },
      grid: parseGrid(
        makeRows(14, [
          'JJJJJJmmJJJJJJ',
          'JmmmmmmmmmmmmJ',
          'JmmJJJJJJmmmmJ',
          'JmmJ!!!!JmmmmJ',
          'JmmmmmmmmmmJJJ',
          'JJJJmmmmmmmmmJ',
          'J!!JmmmmJJmmmJ',
          'JmmmmmmmJJmmmJ',
          'JmmJJmmmmmmmmJ',
          'JmmJJmm!!mmmmJ',
          'Jmmmmmm!!mmmmJ',
          'JmmmmmmmmJJJJJ',
          'JmmmJJmmmmmmmJ',
          'JmmmJJmmmmm!!J',
          'Jmmmmmmmmmm!!J',
          'JJJJmmmmmmmmmJ',
          'JmmmmmmmmJJmmJ',
          'mmmmmmmmmJJmmJ',
          'mmmmmmmmmJJmmJ',
          'JmmmmmmmmmmmmJ',
          'Jmmommmmmmom.J',
          'JmmmmmmmmmmmmJ',
          'JmmJJmmmmJJmmJ',
          'JJJJJJJJJJJJJJ',
        ])
      ),
      enemies: [
        { type: 'keese', col: 6, row: 5 },
        { type: 'stalfos', col: 8, row: 11 },
        { type: 'red_soldier', col: 6, row: 18 },
      ],
    },

    // =========================================================================
    // DEATH-PEAK RIDGE (34x18 Wide Volcanic Highlands + Magma Citadel Gate)
    // =========================================================================
    ow_mountain_ridge: {
      id: 'ow_mountain_ridge',
      name: 'Death-Peak Ridge',
      area: 'mountain',
      gx: 2,
      gy: 0,
      exits: {
        south: { target: 'ow_mountain_ascent', targetCol: 7, targetRow: 1 },
        east: { target: 'ow_emberwatch', targetCol: 1, targetRow: 8 },
      },
      portals: [],
      grid: parseGrid(
        makeRows(34, [
          'JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ',
          'JmmmmmmmmmmJJJ99JJJmmmmmmmmmmmmmmJ',
          'Jmm!!!!mmmmJJm99mJJmmmm!!!!mmmmmmJ',
          'Jmm!!!!mmmmmmmmmmmmmmmm!!!!mm&mmmJ',
          'Jmmmmmmmmmmmmm==mmmmmmm!!!!mmmmmmJ',
          'JmmmmmmJJmmmmm==mmmmmmm!!!!mmmmmmJ',
          'JmmmmmmJJmmmmmmmmmmmmmm!!!!mmmmmmJ',
          'JmmmmmmmmmmmmmJJmmmmmmmmmmmmmmmmmJ',
          'Jmmmmm==mmmmmmJJmmmmmmmmmmmmmmmmmm',
          'Jmmmmm==mmmmmmmmmmmmmmmmmmmmmmmmmm',
          'Jmm!!!!mmmmmmmJJmmmmmmmJJmmmmmmmmJ',
          'Jmm!!!!mmmmmmmJJmmmmmmmJJmmmmmmmmJ',
          'Jmmmmmmmmmmmmmmmmmmmmmmmmmm!!mmmmJ',
          'JmmmmommmmmmmmJJmmmmmmmmmmm!!mmmmJ',
          'JmmmmmmmmmmmmmJJmmmmmmmmmmmmmmmmmJ',
          'JmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmJ',
          'JmmmmmmmmmJJmmmmmmmmmmmmmmmmmmmmmJ',
          'JJJJJJJJmmJJJJJJJJJJJJJJJJJJJJJJJJ',
        ])
      ),
      heartPieces: [{ id: 'hp_mountain', col: 30, row: 3 }],
      enemies: [
        { type: 'knight', col: 15, row: 8 },
        { type: 'beamos', col: 11, row: 4 },
        { type: 'wizzrobe', col: 22, row: 9 },
        { type: 'stalfos', col: 10, row: 14 },
      ],
    },

    // =========================================================================
    // VILLAGE #3: EMBERWATCH OUTPOST (24x16 Volcanic Highland Village)
    // =========================================================================
    ow_emberwatch: {
      id: 'ow_emberwatch',
      name: 'Emberwatch Outpost',
      area: 'mountain',
      gx: 3,
      gy: 0,
      exits: {
        west: { target: 'ow_mountain_ridge', targetCol: 32, targetRow: 9 },
      },
      portals: [
        { col: 16, row: 5, targetRoom: 'ow_emberwatch_smith', targetCol: 10, targetRow: 10 },
      ],
      grid: parseGrid(
        makeRows(24, [
          'JJJJJJJJJJJJJJJJJJJJJJJJ',
          'JmmmzzzmmmmmmUUUUUUUmmmJ',
          'JmmmzzzmmNmmmUUUUUUUmmmJ',
          'JmmmzzzmmmmmmHHHHHHHmmmJ',
          'JmmmmmmmmmmmmHHHHHHHmmmJ',
          'JmmmmmmmmmmmmHHHeHHHmmmJ',
          'JmmmmkkkkkkkmmmmmmmmmmmJ',
          'mmmmkkkkkkkkkkkmmmmmmmmJ',
          'mmmmkkkk?kkkkkkmmmmmmmmJ',
          'JmmmmkkkkkkkmmNmmmmmmmmJ',
          'JmmommmmmmmmmmmmmmmommmJ',
          'JmmmmmmJJmmmmmmJJmmmmmmJ',
          'Jmmmmmm!!mmmmmm!!mmmmmmJ',
          'JmmmmmmmmmmmmmmmmmmmmmmJ',
          'JmmmmmmmmmmmmmmmmmmmmmmJ',
          'JJJJJJJJJJJJJJJJJJJJJJJJ',
        ])
      ),
      signs: [
        {
          col: 8,
          row: 8,
          text: 'EMBERWATCH OUTPOST: Soak in the steaming Hot Springs (NW) to heal! Visit the Highland Smithy (NE) for Hero Mail Armor & Blast Powder!',
        },
      ],
      npcs: [
        {
          col: 9,
          row: 2,
          heals: true,
          text: 'WARDEN KORA: The volcanic Hot Springs soothe even the fiercest burns. Rest well before challenging the Magma Citadel!',
        },
        {
          col: 14,
          row: 9,
          text: 'FORGEMASTER TORIN: Ignis Rex dwells inside the Magma Citadel west of here. Wear Hero Mail Armor and pack Blast Powder!',
        },
      ],
      enemies: [],
    },

    ow_emberwatch_smith: {
      id: 'ow_emberwatch_smith',
      name: 'Emberwatch Highland Smithy',
      area: 'shop',
      gx: 3,
      gy: 10,
      merchantText: "HIGHLAND SMITH BORIN: Hero's Mail Armor cuts incoming blows, and Blast Powder supercharges your Bombs!",
      exits: {},
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_emberwatch', targetCol: 16, targetRow: 6 },
        { col: 10, row: 11, targetRoom: 'ow_emberwatch', targetCol: 16, targetRow: 6 },
      ],
      shopItems: [
        { col: 5, row: 6, catalogId: 'heal' },
        { col: 8, row: 6, catalogId: 'potion' },
        { col: 11, row: 6, catalogId: 'blast_powder' },
        { col: 14, row: 6, catalogId: 'hero_mail' },
      ],
      grid: parseGrid(
        makeRows(20, [
          'SSSSSSSSSSSSSSSSSSSS',
          'SffffffffffffffffffS',
          'SftffffffMffffffftfS',
          'SffWWWWWWWWWWWWWWffS',
          'SffffffffffffffffffS',
          'SffffffffffffffffffS',
          'SffffIffIffIffIffffS',
          'SffffffffffffffffffS',
          'SffffffffffffffffffS',
          'SfoffffffffffffffofS',
          'SftffffffppfffffftfS',
          'SffffffffvvffffffffS',
          'SSSSSSSSSSSSSSSSSSSS',
        ])
      ),
      enemies: [],
    },
  }));
})(window);
