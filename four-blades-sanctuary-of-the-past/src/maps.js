/**
 * Shared ASCII Map Parser & Modular World Assembler.
 * Individual regions register builders on FB.mapBuilders (overworld, palace, darkworld, frost).
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const T = FB.TILES;

  FB.CHAR_TO_TILE = {
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
    '$': T.PORTAL_SHOP,
    'v': T.SHOP_EXIT,
    'W': T.SHOP_COUNTER,
    'M': T.MERCHANT,
    'f': T.SHOP_FLOOR,
  };

  FB.parseGrid = function parseGrid(rows) {
    const grid = [];
    for (let r = 0; r < FB.ROOM_ROWS; r++) {
      const line = rows[r] || '';
      const row = [];
      for (let c = 0; c < FB.ROOM_COLS; c++) {
        const ch = line[c] || '.';
        const tile = FB.CHAR_TO_TILE[ch];
        row.push(tile !== undefined ? tile : T.GRASS);
      }
      grid.push(row);
    }
    return grid;
  };

  FB.mapBuilders = FB.mapBuilders || [];

  FB.registerMapRegion = function registerMapRegion(builderFn) {
    FB.mapBuilders.push(builderFn);
  };

  FB.createWorldData = function createWorldData() {
    const rooms = {};
    for (const build of FB.mapBuilders) {
      const regionRooms = build(FB.parseGrid);
      Object.assign(rooms, regionRooms);
    }

    for (const id of Object.keys(rooms)) {
      const r = rooms[id];
      r.visited = id === 'ow_start';
      r.cleared = false;
      r.puzzleSolved = false;
      r.openedChests = new Set();
      r.claimedPedestals = new Set();
      r.destroyedTiles = new Set();
      r.crystalState = 'blue';
    }

    return rooms;
  };
})(window);
