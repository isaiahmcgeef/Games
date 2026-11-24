/**
 * Phase 4 — Dungeon #3: Sunspire Desert Temple (6 Variable & Thin Sandstone Rooms).
 * Boss: Solar Sentinel Solkar (desert_boss) -> Solar Medallion.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  function makeRows(cols, rows) {
    return rows.map((line) =>
      line.length === cols ? line : line.length < cols ? line.padEnd(cols, '#') : line.slice(0, cols)
    );
  }

  FB.registerMapRegion((parseGrid) => ({
    ds_entry: {
      id: 'ds_entry',
      name: 'Sunspire Temple — Solar Foyer',
      area: 'desert_dungeon',
      gx: 0,
      gy: 0,
      exits: {
        west: { target: 'ds_corridor', targetCol: 10, targetRow: 18 },
        north: { target: 'ds_hall', targetCol: 13, targetRow: 13 },
      },
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_desert', targetCol: 28, targetRow: 8 },
        { col: 10, row: 11, targetRoom: 'ow_desert', targetCol: 29, targetRow: 8 },
      ],
      locks: {
        north: { id: 'lock_ds_north', type: 'desert_small' },
      },
      grid: parseGrid(
        makeRows(20, [
          '#########LL#########',
          '#t______rrrr______t#',
          '#__A____rrrr____A__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          'Drrrrrrrrrrr_______#',
          'Drrrrrrrrrrr_______#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#__t____rrrr____t__#',
          '#________OO________#',
          '####################',
        ])
      ),
      enemies: [
        { type: 'stalfos', col: 5, row: 4 },
        { type: 'chuchu', col: 14, row: 7 },
      ],
    },

    // THIN 12x22 VERTICAL BEAMOS LASER CORRIDOR!
    ds_corridor: {
      id: 'ds_corridor',
      name: 'Sunspire — Beamos Colonnade',
      area: 'desert_dungeon',
      gx: -1,
      gy: 0,
      exits: {
        east: { target: 'ds_entry', targetCol: 1, targetRow: 6 },
        north: { target: 'ds_switches', targetCol: 10, targetRow: 11 },
      },
      grid: parseGrid(
        makeRows(12, [
          '#####DD#####',
          '#t________t#',
          '#___rrrr___#',
          '#__A____A__#',
          '#___rrrr___#',
          '#____oo____#',
          '#___rrrr___#',
          '#__A____A__#',
          '#___rrrr___#',
          '#___****___#',
          '#___rrrr___#',
          '#__A____A__#',
          '#___rrrr___#',
          '#____oo____#',
          '#___rrrr___#',
          '#__A____A__#',
          '#___rrrr___#',
          '#___rrrr___D',
          '#___rrrr___D',
          '#__o____o__#',
          '#t________t#',
          '############',
        ])
      ),
      enemies: [
        { type: 'beamos', col: 6, row: 4 },
        { type: 'beamos', col: 5, row: 12 },
        { type: 'wizzrobe', col: 6, row: 16 },
      ],
    },

    ds_switches: {
      id: 'ds_switches',
      name: 'Sunspire — Chamber of Seals',
      area: 'desert_dungeon',
      gx: -1,
      gy: -1,
      exits: {
        south: { target: 'ds_corridor', targetCol: 6, targetRow: 1 },
        east: { target: 'ds_hall', targetCol: 1, targetRow: 7 },
      },
      puzzle: {
        type: 'switches',
        unlockDoor: 'east',
        spawnChest: {
          col: 15,
          row: 2,
          reward: 'desert_small_key',
          label: 'Sunspire Key! Unlocks the Solar Foyer northern door.',
        },
      },
      grid: parseGrid(
        makeRows(20, [
          '####################',
          '#t________________t#',
          '#__A____________A__#',
          '#_____s______s_____#',
          '#__________________#',
          '#_____P______P_____#',
          '#__________________X',
          '#__________________X',
          '#__________________#',
          '#__o____________o__#',
          '#t________________t#',
          '#__________________#',
          '#########DD#########',
        ])
      ),
      enemies: [
        { type: 'red_soldier', col: 9, row: 5 },
        { type: 'chuchu', col: 13, row: 8 },
      ],
    },

    ds_hall: {
      id: 'ds_hall',
      name: 'Sunspire — Hall of Mirrors',
      area: 'desert_dungeon',
      gx: 0,
      gy: -1,
      exits: {
        south: { target: 'ds_entry', targetCol: 10, targetRow: 1 },
        west: { target: 'ds_switches', targetCol: 18, targetRow: 6 },
        north: { target: 'ds_ante', targetCol: 10, targetRow: 11 },
      },
      puzzle: {
        type: 'defeat_all',
        spawnBigChest: {
          col: 13,
          row: 3,
          reward: 'desert_boss_key',
          label: 'SOLAR BOSS KEY! Unlocks the Sanctum of Solar Sentinel Solkar!',
        },
      },
      grid: parseGrid(
        makeRows(26, [
          '############DD############',
          '#t______________________t#',
          '#___A________________A___#',
          '#________________________#',
          '#______rrrrrrrrrrrr______#',
          '#______rrrrrrrrrrrr______#',
          'D______rr__A__A__rr______#',
          'D______rr________rr______#',
          '#______rr__A__A__rr______#',
          '#______rrrrrrrrrrrr______#',
          '#______rrrrrrrrrrrr______#',
          '#___o________________o___#',
          '#___A________________A___#',
          '#t______________________t#',
          '############DD############',
        ])
      ),
      enemies: [
        { type: 'wizzrobe', col: 8, row: 5 },
        { type: 'wizzrobe', col: 18, row: 5 },
        { type: 'knight', col: 13, row: 10 },
        { type: 'chuchu', col: 6, row: 11 },
      ],
    },

    ds_ante: {
      id: 'ds_ante',
      name: 'Sunspire — Solar Threshold',
      area: 'desert_dungeon',
      gx: 0,
      gy: -2,
      fairyPots: true,
      exits: {
        south: { target: 'ds_hall', targetCol: 13, targetRow: 1 },
        north: { target: 'ds_boss', targetCol: 12, targetRow: 14 },
      },
      locks: {
        north: { id: 'lock_ds_boss', type: 'desert_boss' },
      },
      grid: parseGrid(
        makeRows(20, [
          '#########BB#########',
          '#t______rrrr______t#',
          '#__A____rrrr____A__#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          '#__A____rrrr____A__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#t______rrrr______t#',
          '#_______rrrr_______#',
          '#########DD#########',
        ])
      ),
      enemies: [],
    },

    ds_boss: {
      id: 'ds_boss',
      name: 'Sunspire — Solar Sanctum',
      area: 'desert_dungeon',
      gx: 0,
      gy: -3,
      isBossRoom: true,
      exits: {
        south: { target: 'ds_ante', targetCol: 10, targetRow: 1 },
      },
      grid: parseGrid(
        makeRows(24, [
          '########################',
          '#t____________________t#',
          '#___A______________A___#',
          '#______________________#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______________________#',
          '#___A______________A___#',
          '#t____________________t#',
          '#______________________#',
          '###########DD###########',
        ])
      ),
      enemies: [{ type: 'desert_boss', col: 12, row: 6 }],
    },
  }));
})(window);
