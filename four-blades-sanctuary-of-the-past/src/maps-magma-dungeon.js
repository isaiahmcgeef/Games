/**
 * Phase 4 — Dungeon #4: Magma Citadel (6 Variable & Thin Obsidian Volcanic Rooms).
 * Boss: Forge Titan Ignis Rex (magma_boss) -> Magma Medallion.
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
    mg_entry: {
      id: 'mg_entry',
      name: 'Magma Citadel — Obsidian Gate',
      area: 'magma',
      gx: 0,
      gy: 0,
      exits: {
        east: { target: 'mg_catwalk', targetCol: 1, targetRow: 5 },
        north: { target: 'mg_forge', targetCol: 13, targetRow: 14 },
      },
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_mountain_ridge', targetCol: 15, targetRow: 3 },
        { col: 10, row: 11, targetRoom: 'ow_mountain_ridge', targetCol: 16, targetRow: 3 },
      ],
      locks: {
        north: { id: 'lock_mg_north', type: 'magma_small' },
      },
      grid: parseGrid(
        makeRows(20, [
          '#########LL#########',
          '#t______rrrr______t#',
          '#__!!___rrrr___!!__#',
          '#__!!___rrrr___!!__#',
          '#_______rrrr_______#',
          '#__o____rrrrrrrrrrrD',
          '#_______rrrrrrrrrrrD',
          '#__o____rrrr_______#',
          '#__!!___rrrr___!!__#',
          '#__!!___rrrr___!!__#',
          '#__t____rrrr____t__#',
          '#________OO________#',
          '####################',
        ])
      ),
      enemies: [
        { type: 'red_soldier', col: 6, row: 5 },
        { type: 'keese', col: 14, row: 4 },
      ],
    },

    // THIN 34x11 HORIZONTAL VOLCANIC LAVA CATWALK & HOOKSHOT CHASM!
    mg_catwalk: {
      id: 'mg_catwalk',
      name: 'Magma Citadel — Molten Catwalk',
      area: 'magma',
      gx: 1,
      gy: 0,
      exits: {
        west: { target: 'mg_entry', targetCol: 18, targetRow: 6 },
        north: { target: 'mg_vault', targetCol: 10, targetRow: 11 },
      },
      grid: parseGrid(
        makeRows(34, [
          '###########################DD#####',
          '#t!!!!!____!!!!!____!!!!!______tt#',
          '#_!!!!!_&_!!!!!!_&_!!!!!!________#',
          '#_!!!!!____!!!!!____!!!!!____oo__#',
          'D______====_____====_____________#',
          'D______====_____====_____________#',
          '#_!!!!!____!!!!!____!!!!!________#',
          '#_!!!!!_&_!!!!!!_&_!!!!!!____A___#',
          '#_!!!!!____!!!!!____!!!!!________#',
          '#t!!!!!____!!!!!____!!!!!______tt#',
          '##################################',
        ])
      ),
      enemies: [
        { type: 'keese', col: 9, row: 3 },
        { type: 'wizzrobe', col: 18, row: 5 },
        { type: 'stalfos', col: 28, row: 5 },
      ],
    },

    mg_vault: {
      id: 'mg_vault',
      name: 'Magma Citadel — Brazier Vault',
      area: 'magma',
      gx: 1,
      gy: -1,
      exits: {
        south: { target: 'mg_catwalk', targetCol: 28, targetRow: 1 },
        west: { target: 'mg_forge', targetCol: 24, targetRow: 8 },
      },
      puzzle: {
        type: 'torches',
        unlockDoor: 'west',
        spawnChest: {
          col: 10,
          row: 2,
          reward: 'magma_small_key',
          label: 'Magma Key! Unlocks the Obsidian Gatehouse seal.',
        },
      },
      grid: parseGrid(
        makeRows(20, [
          '####################',
          '#__________________#',
          '#___u__________u___#',
          '#______!!!!!!______#',
          '#__________________#',
          '#__________________#',
          'X____rrrrrrrrrr____#',
          'X____rrrrrrrrrr____#',
          '#__________________#',
          '#___u__________u___#',
          '#__o____________o__#',
          '#__________________#',
          '#########DD#########',
        ])
      ),
      enemies: [
        { type: 'chuchu', col: 6, row: 6 },
        { type: 'wizzrobe', col: 14, row: 6 },
      ],
    },

    mg_forge: {
      id: 'mg_forge',
      name: 'Magma Citadel — Crucible Hall',
      area: 'magma',
      gx: 0,
      gy: -1,
      exits: {
        south: { target: 'mg_entry', targetCol: 10, targetRow: 1 },
        east: { target: 'mg_vault', targetCol: 1, targetRow: 6 },
        north: { target: 'mg_ante', targetCol: 10, targetRow: 11 },
      },
      puzzle: {
        type: 'defeat_all',
        spawnBigChest: {
          col: 13,
          row: 3,
          reward: 'magma_boss_key',
          label: 'MAGMA BOSS KEY! Unlocks the Caldera of Forge Titan Ignis Rex!',
        },
      },
      grid: parseGrid(
        makeRows(26, [
          '############DD############',
          '#t______________________t#',
          '#__!!________________!!__#',
          '#__!!________________!!__#',
          '#______rrrrrrrrrrrr______#',
          '#______rrrrrrrrrrrr______#',
          '#______rr________rr______#',
          '#______rr___!!___rr______D',
          '#______rr___!!___rr______D',
          '#______rr________rr______#',
          '#______rrrrrrrrrrrr______#',
          '#______rrrrrrrrrrrr______#',
          '#__!!________________!!__#',
          '#__o__________________o__#',
          '#t______________________t#',
          '############DD############',
        ])
      ),
      enemies: [
        { type: 'knight', col: 9, row: 6 },
        { type: 'knight', col: 17, row: 6 },
        { type: 'beamos', col: 13, row: 11 },
        { type: 'wizzrobe', col: 13, row: 5 },
      ],
    },

    mg_ante: {
      id: 'mg_ante',
      name: "Magma Citadel — Titan's Threshold",
      area: 'magma',
      gx: 0,
      gy: -2,
      fairyPots: true,
      exits: {
        south: { target: 'mg_forge', targetCol: 13, targetRow: 1 },
        north: { target: 'mg_boss', targetCol: 12, targetRow: 14 },
      },
      locks: {
        north: { id: 'lock_mg_boss', type: 'magma_boss' },
      },
      grid: parseGrid(
        makeRows(20, [
          '#########BB#########',
          '#t______rrrr______t#',
          '#__!!___rrrr___!!__#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#_______rrrr_______#',
          '#__!!___rrrr___!!__#',
          '#_______rrrr_______#',
          '#__o____rrrr____o__#',
          '#t______rrrr______t#',
          '#_______rrrr_______#',
          '#########DD#########',
        ])
      ),
      enemies: [],
    },

    mg_boss: {
      id: 'mg_boss',
      name: 'Magma Citadel — Heart of the Caldera',
      area: 'magma',
      gx: 0,
      gy: -3,
      isBossRoom: true,
      exits: {
        south: { target: 'mg_ante', targetCol: 10, targetRow: 1 },
      },
      grid: parseGrid(
        makeRows(24, [
          '########################',
          '#t____________________t#',
          '#__!!______________!!__#',
          '#__!!______________!!__#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#______rrrrrrrrrr______#',
          '#__!!______________!!__#',
          '#__!!______________!!__#',
          '#t____________________t#',
          '#______________________#',
          '###########DD###########',
        ])
      ),
      enemies: [{ type: 'magma_boss', col: 12, row: 6 }],
    },
  }));
})(window);
