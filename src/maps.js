/**
 * Handcrafted Interconnected Overworld (4 zones) & Palace of the Four Blades Dungeon (9 rooms).
 * Uses a deterministic 20x13 ASCII map parser so every doorway aligns cleanly.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const T = FB.TILES;

  const CHAR_TO_TILE = {
    '.': T.GRASS,
    ',': T.GRASS_FLOWERS,
    'p': T.PATH,
    'T': T.TREE,
    'b': T.BUSH,
    '~': T.WATER,
    '=': T.BRIDGE,
    'S': T.STONE_WALL,
    'c': T.CLIFF,
    '^': T.STAIRS_UP,
    '_': T.DUNGEON_FLOOR,
    '#': T.DUNGEON_WALL,
    'r': T.DUNGEON_CARPET,
    ' ': T.PIT,
    'D': T.DOOR_OPEN,
    'L': T.DOOR_LOCKED,
    'B': T.DOOR_BOSS,
    'X': T.DOOR_BARRED,
    '%': T.CRACKED_WALL,
    'o': T.POT,
    'P': T.BLOCK_PUSH,
    's': T.SWITCH_FLOOR,
    't': T.TORCH_LIT,
    'u': T.TORCH_UNLIT,
    '*': T.SPIKES,
    'C': T.CHEST_CLOSED,
    'K': T.BIG_CHEST_CLOSED,
    '1': T.CRYSTAL_BLUE,
    '2': T.CRYSTAL_RED,
    'g': T.GATE_BLUE_UP,
    'h': T.GATE_RED_DOWN,
    'E': T.PORTAL_DUNGEON,
    'O': T.PORTAL_OVERWORLD,
    '?': T.SIGN,
    'F': T.FAIRY_POOL,
    'I': T.PEDESTAL,
    'R': T.ROCK_CRACKED,
    'A': T.STATUE,
    'Z': T.TRIFORCE_ALTAR,
  };

  function parseGrid(rows) {
    const grid = [];
    for (let r = 0; r < FB.ROOM_ROWS; r++) {
      const line = rows[r] || '';
      const row = [];
      for (let c = 0; c < FB.ROOM_COLS; c++) {
        const ch = line[c] || '.';
        row.push(CHAR_TO_TILE[ch] !== undefined ? CHAR_TO_TILE[ch] : T.GRASS);
      }
      grid.push(row);
    }
    return grid;
  }

  function createWorldData() {
    const rooms = {
      // ============================================================
      // OVERWORLD (4 Connected Zones)
      // ============================================================
      ow_start: {
        id: 'ow_start',
        name: 'Sanctuary Courtyard',
        area: 'overworld',
        gx: 0,
        gy: 1,
        exits: {
          north: 'ow_palace',
          west: 'ow_woods',
          east: 'ow_river',
        },
        grid: parseGrid([
          'TTTTTTTTTppTTTTTTTTT',
          'T..,....pppp....,.,T',
          'T..bb...p..p...bb..T',
          'T..bb...p??p...bb..T',
          'T....I..pppp..I....T',
          'T.......pppp.......T',
          'pppppppppppppppppppp',
          'pppppppppppppppppppp',
          'T..bb...pppp...bb..T',
          'T..o....p,,p....o..T',
          'T....,..pppp..,....T',
          'T..bbb........bbb..T',
          'TTTTTTTTTTTTTTTTTTTT',
        ]),
        signs: [
          {
            col: 9,
            row: 3,
            text: 'FOUR BLADES SANCTUARY: Claim the Boomerang & Bombs on the pedestals, explore East & West, then enter the Palace to the North!',
          },
          {
            col: 10,
            row: 3,
            text: 'TIP: Hold Attack to charge a Whirlwind Spin! Solo players can press Q (or Tab) to summon a Spirit Clone for co-op switches!',
          },
        ],
        pedestals: [
          { col: 5, row: 4, itemId: FB.ITEMS.BOOMERANG },
          { col: 14, row: 4, itemId: FB.ITEMS.BOMB },
        ],
        enemies: [
          { type: 'octorok', col: 4, row: 10 },
          { type: 'octorok', col: 15, row: 10 },
        ],
      },

      ow_woods: {
        id: 'ow_woods',
        name: 'Whispering Woods',
        area: 'overworld',
        gx: -1,
        gy: 1,
        exits: {
          east: 'ow_start',
        },
        grid: parseGrid([
          'TTTTTTTTTTTTTTTTTTTT',
          'T..C..T....,....bb.T',
          'T..I..T..bb....bbb.T',
          'T..p..T...........,T',
          'TTTRTTT...pppp.....T',
          'T..p......p..p....pT',
          'T..pppppppp..ppppppp',
          'T......b.....ppppppp',
          'T..,..bbb..p....,..T',
          'T......b...p..bb...T',
          'T..o.......p...o...T',
          'T....,,........,,..T',
          'TTTTTTTTTTTTTTTTTTTT',
        ]),
        pedestals: [{ col: 3, row: 2, itemId: FB.ITEMS.FIREROD }],
        chests: [
          {
            col: 3,
            row: 1,
            reward: 'heart_container',
            label: 'Heart Container! All heroes gain +1 Max Heart!',
          },
        ],
        enemies: [
          { type: 'octorok', col: 8, row: 3 },
          { type: 'soldier', col: 12, row: 9 },
          { type: 'octorok', col: 4, row: 9 },
        ],
      },

      ow_river: {
        id: 'ow_river',
        name: 'River Shrine & Fairy Spring',
        area: 'overworld',
        gx: 1,
        gy: 1,
        exits: {
          west: 'ow_start',
        },
        grid: parseGrid([
          'TTTTTTTTTTTTTTTTTTTT',
          'T..FF..~....SS..I.ST',
          'T..FF..~....SS..p.ST',
          'T..pp..~..1..SggSSST',
          'T..pp..~.....pppp..T',
          'T..pp..~.....p.....T',
          'ppppp===pppppp..bb.T',
          'ppppp===pppppp..bb.T',
          'T..b...~..p........T',
          'T..b...~..pppp.....T',
          'T......~.....p..o..T',
          'T..,..~~~....,,....T',
          'TTTTTTTTTTTTTTTTTTTT',
        ]),
        pedestals: [{ col: 16, row: 1, itemId: FB.ITEMS.BOW }],
        enemies: [
          { type: 'soldier', col: 12, row: 7 },
          { type: 'red_soldier', col: 14, row: 10 },
          { type: 'octorok', col: 3, row: 10 },
        ],
      },

      ow_palace: {
        id: 'ow_palace',
        name: 'Palace of the Four Blades',
        area: 'overworld',
        gx: 0,
        gy: 0,
        exits: {
          south: 'ow_start',
        },
        portals: [
          { col: 9, row: 2, targetRoom: 'dg_entry', targetCol: 9, targetRow: 10 },
          { col: 10, row: 2, targetRoom: 'dg_entry', targetCol: 10, targetRow: 10 },
        ],
        grid: parseGrid([
          'SSSSSSSSSSSSSSSSSSSS',
          'SS...S..SSSS..S...SS',
          'S..A.S..SEES..S.A..S',
          'S....S..pppp..S....S',
          'S.t..c..^^^^..c..t.S',
          'S....c..pppp..c....S',
          'T..b....pppp....b..T',
          'T..bb...pppp...bb..T',
          'T....,..pppp..,....T',
          'T..o....pppp....o..T',
          'T.......pppp.......T',
          'T..,....pppp....,.,T',
          'TTTTTTTTTppTTTTTTTTT',
        ]),
        enemies: [
          { type: 'soldier', col: 5, row: 7 },
          { type: 'red_soldier', col: 14, row: 7 },
          { type: 'octorok', col: 10, row: 5 },
        ],
      },

      // ============================================================
      // DUNGEON: PALACE OF THE FOUR BLADES (9 Rooms)
      // ============================================================
      dg_entry: {
        id: 'dg_entry',
        name: 'Palace Entrance Hall',
        area: 'dungeon',
        gx: 0,
        gy: 0,
        exits: {
          north: 'dg_hub',
          west: 'dg_west_sw',
          east: 'dg_east_bar',
        },
        portals: [
          { col: 9, row: 11, targetRoom: 'ow_palace', targetCol: 9, targetRow: 3 },
          { col: 10, row: 11, targetRoom: 'ow_palace', targetCol: 10, targetRow: 3 },
        ],
        locks: {
          east: { id: 'lock_east', type: 'small' },
        },
        grid: parseGrid([
          '#########DD#########',
          '#t______rrrr______t#',
          '#__A____rrrr____A__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          'DrrrrrrrrrrrrrrrrrrL',
          'DrrrrrrrrrrrrrrrrrrL',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#__t____rrrr____t__#',
          '#________OO________#',
          '####################',
        ]),
        enemies: [{ type: 'keese', col: 5, row: 4 }, { type: 'keese', col: 14, row: 4 }],
      },

      dg_west_sw: {
        id: 'dg_west_sw',
        name: 'Chamber of Scales',
        area: 'dungeon',
        gx: -1,
        gy: 0,
        exits: {
          east: 'dg_entry',
          north: 'dg_nw_vault',
        },
        puzzle: {
          type: 'switches',
          unlockDoor: 'north',
          spawnChest: {
            col: 4,
            row: 2,
            reward: 'small_key',
            label: 'Small Key! Unlocks a sealed palace door.',
          },
        },
        grid: parseGrid([
          '#########XX#########',
          '#t________________t#',
          '#_________________o#',
          '#___A____s____A___o#',
          '#__________________#',
          '#______P___________#',
          '#__________________D',
          '#__________________D',
          '#______P___________#',
          '#___A____s____A____#',
          '#__o_______________#',
          '#t________________t#',
          '####################',
        ]),
        enemies: [
          { type: 'keese', col: 6, row: 4 },
          { type: 'keese', col: 13, row: 8 },
          { type: 'soldier', col: 11, row: 6 },
        ],
      },

      dg_nw_vault: {
        id: 'dg_nw_vault',
        name: 'Crystal Chasm',
        area: 'dungeon',
        gx: -1,
        gy: -1,
        exits: {
          south: 'dg_west_sw',
          east: 'dg_hub',
        },
        grid: parseGrid([
          '####################',
          '#t____  ____  ____t#',
          '#_C___  _1__  ___o_#',
          '#ggggg  ____  _____#',
          '#_____  ____  _____#',
          '#___====____====___#',
          '#___====____====___D',
          '#______  __  ______D',
          '#__*___  __  ___*__#',
          '#______  __  ______#',
          '#__o___      ___o__#',
          '#t________________t#',
          '#########DD#########',
        ]),
        chests: [
          {
            col: 2,
            row: 2,
            reward: 'rupee_50',
            label: 'Treasure Vault! +50 Rupees & Fairy Blessing!',
          },
        ],
        enemies: [
          { type: 'keese', col: 9, row: 4 },
          { type: 'stalfos', col: 15, row: 5 },
          { type: 'keese', col: 5, row: 9 },
        ],
      },

      dg_hub: {
        id: 'dg_hub',
        name: 'Hall of the Four Blades',
        area: 'dungeon',
        gx: 0,
        gy: -1,
        exits: {
          south: 'dg_entry',
          west: 'dg_nw_vault',
          east: 'dg_ne_torch',
          north: 'dg_ante',
        },
        locks: {
          east: { id: 'lock_ne', type: 'small' },
        },
        grid: parseGrid([
          '#########DD#########',
          '#t______rrrr______t#',
          '#__A____rrrr____A__#',
          '#___*___rrrr___*___#',
          '#_______rrrr_______#',
          '#_______rrrr_______#',
          'DrrrrrrrrrrrrrrrrrrL',
          'DrrrrrrrrrrrrrrrrrrL',
          '#_______rrrr_______#',
          '#___*___rrrr___*___#',
          '#__o____rrrr____o__#',
          '#t______rrrr______t#',
          '#########DD#########',
        ]),
        enemies: [
          { type: 'red_soldier', col: 5, row: 4 },
          { type: 'red_soldier', col: 14, row: 4 },
          { type: 'stalfos', col: 10, row: 8 },
        ],
      },

      dg_east_bar: {
        id: 'dg_east_bar',
        name: "Guards' Barracks",
        area: 'dungeon',
        gx: 1,
        gy: 0,
        exits: {
          west: 'dg_entry',
          north: 'dg_ne_torch',
        },
        puzzle: {
          type: 'defeat_all',
          unlockDoor: 'north',
          spawnChest: {
            col: 9,
            row: 2,
            reward: 'small_key',
            label: 'Small Key! Opens the Sanctum of Embers.',
          },
        },
        grid: parseGrid([
          '#########XX#########',
          '#t____________#___t#',
          '#__A__________#_C_o#',
          '#_____________#____#',
          '#____*___*____#____#',
          '#_____________%____#',
          'D_____________%____#',
          'D_____________#____#',
          '#____*___*____#____#',
          '#_____________#____#',
          '#__o_____o____#___o#',
          '#t____________#___t#',
          '####################',
        ]),
        chests: [
          {
            col: 16,
            row: 2,
            reward: 'rupee_100',
            label: 'Secret Treasury! +100 Rupees & Full Heal!',
          },
        ],
        enemies: [
          { type: 'soldier', col: 6, row: 3 },
          { type: 'red_soldier', col: 11, row: 6 },
          { type: 'stalfos', col: 7, row: 9 },
        ],
      },

      dg_ne_torch: {
        id: 'dg_ne_torch',
        name: 'Sanctum of Embers',
        area: 'dungeon',
        gx: 1,
        gy: -1,
        exits: {
          west: 'dg_hub',
          south: 'dg_east_bar',
          east: 'dg_bosskey',
        },
        puzzle: {
          type: 'torches',
          unlockDoor: 'east',
        },
        pedestals: [{ col: 10, row: 6, itemId: FB.ITEMS.FIREROD }],
        grid: parseGrid([
          '####################',
          '#t________________t#',
          '#___u__________u___#',
          '#__________________#',
          '#_______A__A_______#',
          '#__________________#',
          'D________I_________X',
          'D__________________X',
          '#_______A__A_______#',
          '#__________________#',
          '#___u__________u___#',
          '#t__o__________o__t#',
          '#########DD#########',
        ]),
        enemies: [
          { type: 'keese', col: 5, row: 4 },
          { type: 'keese', col: 14, row: 4 },
          { type: 'red_soldier', col: 13, row: 8 },
        ],
      },

      dg_bosskey: {
        id: 'dg_bosskey',
        name: 'Vault of the Sovereign',
        area: 'dungeon',
        gx: 2,
        gy: -1,
        exits: {
          west: 'dg_ne_torch',
        },
        puzzle: {
          type: 'defeat_all',
          spawnBigChest: {
            col: 14,
            row: 6,
            reward: 'boss_key',
            label: 'THE BOSS KEY! Now unlock the Throne of the Four Seals!',
          },
        },
        grid: parseGrid([
          '####################',
          '#t________________t#',
          '#__A_____rr_____A__#',
          '#________rr________#',
          '#____*___rr___*____#',
          '#________rr________#',
          'Drrrrrrrrrrrrrrrr__#',
          'Drrrrrrrrrrrrrrrr__#',
          '#________rr________#',
          '#____*___rr___*____#',
          '#__o_____rr_____o__#',
          '#t________________t#',
          '####################',
        ]),
        enemies: [
          { type: 'knight', col: 12, row: 4 },
          { type: 'knight', col: 12, row: 8 },
          { type: 'stalfos', col: 8, row: 6 },
        ],
      },

      dg_ante: {
        id: 'dg_ante',
        name: 'Antechamber of Seals',
        area: 'dungeon',
        gx: 0,
        gy: -2,
        exits: {
          south: 'dg_hub',
          north: 'dg_boss',
        },
        locks: {
          north: { id: 'lock_boss', type: 'boss' },
        },
        grid: parseGrid([
          '#########BB#########',
          '#t______rrrr______t#',
          '#__A____rrrr____A__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          '#__t____rrrr____t__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          '#__A____rrrr____A__#',
          '#t______rrrr______t#',
          '#########DD#########',
        ]),
        enemies: [],
        fairyPots: true,
      },

      dg_boss: {
        id: 'dg_boss',
        name: 'Throne of the Four Seals',
        area: 'dungeon',
        gx: 0,
        gy: -3,
        isBossRoom: true,
        exits: {
          south: 'dg_ante',
        },
        grid: parseGrid([
          '####################',
          '#t________________t#',
          '#__A____________A__#',
          '#__________________#',
          '#______rrrrrr______#',
          '#______rrrrrr______#',
          '#______rrrrrr______#',
          '#______rrrrrr______#',
          '#______rrrrrr______#',
          '#__o____________o__#',
          '#__A____________A__#',
          '#t________________t#',
          '#########DD#########',
        ]),
        enemies: [{ type: 'boss', col: 10, row: 4 }],
      },
    };

    // Normalize runtime state per room
    for (const id of Object.keys(rooms)) {
      const r = rooms[id];
      r.visited = id === 'ow_start';
      r.cleared = false;
      r.puzzleSolved = false;
      r.openedChests = new Set();
      r.claimedPedestals = new Set();
      r.destroyedTiles = new Set();
      r.crystalState = 'blue'; // 'blue' = blue gates up, red gates down
    }

    return rooms;
  }

  FB.createWorldData = createWorldData;
})(window);
