/**
 * Act II — Dungeon #2: Frost Spire (7 Handcrafted Rooms).
 * Features slippery ice floors, sliding ice blocks, dynamic darkness torch vault,
 * Hookshot chasm puzzles, and the Final Boss: Frost Sovereign Glacior (Cryo-Wyrm).
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  FB.registerMapRegion((parseGrid) => ({
    fs_entry: {
      id: 'fs_entry',
      name: 'Frost Spire — Glacial Foyer',
      area: 'frost',
      gx: 0,
      gy: 0,
      exits: {
        west: 'fs_ice_blocks',
        north: 'fs_dark_hall',
      },
      portals: [
        { col: 9, row: 11, targetRoom: 'dw_spire_approach', targetCol: 9, targetRow: 3 },
        { col: 10, row: 11, targetRoom: 'dw_spire_approach', targetCol: 10, targetRow: 3 },
      ],
      locks: {
        north: { id: 'lock_fs_north', type: 'frost_small' },
      },
      grid: parseGrid([
        '#########LL#########',
        '#t______iiii______t#',
        '#__A____iiii____A__#',
        '#_______iiii_______#',
        '#__o____iiii____o__#',
        '#_______iiii_______#',
        'Diiiiiiiiiiii______#',
        'Diiiiiiiiiiii______#',
        '#_______iiii_______#',
        '#__o____iiii____o__#',
        '#__t____iiii____t__#',
        '#________OO________#',
        '####################',
      ]),
      enemies: [
        { type: 'keese', col: 5, row: 4 },
        { type: 'stalfos', col: 14, row: 6 },
      ],
    },

    fs_ice_blocks: {
      id: 'fs_ice_blocks',
      name: 'Frost Spire — Sliding Glacier',
      area: 'frost',
      gx: -1,
      gy: 0,
      exits: {
        east: 'fs_entry',
        north: 'fs_hookshot',
      },
      puzzle: {
        type: 'switches',
        unlockDoor: 'north',
        spawnChest: {
          col: 15,
          row: 2,
          reward: 'frost_small_key',
          label: 'Frost Key! Unlocks the Glacial Foyer seal.',
        },
      },
      grid: parseGrid([
        '#########XX#########',
        '#t___iiiiiiiiii___t#',
        '#____iiiiiiiiii____#',
        '#__A_iiiiisiiii_A__#',
        '#____iiiiiiiiii____#',
        '#____iiPiiiAiii____#',
        '#____iiiiiiiiii____D',
        '#____iiiiiiiiii____D',
        '#____iiPiiiAiii____#',
        '#__A_iiiiisiiii_A__#',
        '#__o_iiiiiiiiii_o__#',
        '#t___iiiiiiiiii___t#',
        '####################',
      ]),
      enemies: [
        { type: 'keese', col: 13, row: 4 },
        { type: 'red_soldier', col: 12, row: 8 },
      ],
    },

    fs_hookshot: {
      id: 'fs_hookshot',
      name: 'Frost Spire — Chasm of Chains',
      area: 'frost',
      gx: -1,
      gy: -1,
      exits: {
        south: 'fs_ice_blocks',
        east: 'fs_dark_hall',
      },
      pedestals: [{ col: 4, row: 10, itemId: FB.ITEMS.HOOKSHOT }],
      chests: [
        {
          col: 3,
          row: 2,
          reward: 'rupee_100',
          label: 'Glacial Treasury! +100 Rupees & Full Heal!',
        },
      ],
      grid: parseGrid([
        '####################',
        '#t___   ____   ___t#',
        '#__C_   __&_   ____#',
        '#__&_   ____   _&__#',
        '#____   ____   ____#',
        '#____          ____#',
        '#____          ____D',
        '#____   ____   ____D',
        '#____   __&_   ____#',
        '#__&_   ____   _&__#',
        '#___I   ____   __o_#',
        '#t________________t#',
        '#########DD#########',
      ]),
      enemies: [
        { type: 'keese', col: 9, row: 4 },
        { type: 'stalfos', col: 16, row: 6 },
        { type: 'keese', col: 6, row: 9 },
      ],
    },

    fs_dark_hall: {
      id: 'fs_dark_hall',
      name: 'Frost Spire — Pitch-Black Vault',
      area: 'frost',
      gx: 0,
      gy: -1,
      isDark: true,
      exits: {
        south: 'fs_entry',
        west: 'fs_hookshot',
        east: 'fs_miniboss',
        north: 'fs_ante',
      },
      puzzle: {
        type: 'torches',
        unlockDoor: 'east',
        spawnChest: {
          col: 15,
          row: 2,
          reward: 'heart_container',
          label: 'Spire Heart Container! All heroes gain +1 Max Heart!',
        },
      },
      pedestals: [{ col: 10, row: 6, itemId: FB.ITEMS.FIREROD }],
      grid: parseGrid([
        '#########DD#########',
        '#__________________#',
        '#___u__________u___#',
        '#______iiiiii______#',
        '#______iA__Ai______#',
        '#______iiiiii______#',
        'D________I_________X',
        'D__________________X',
        '#______iiiiii______#',
        '#______iA__Ai______#',
        '#___u__________u___#',
        '#___o__________o___#',
        '#########DD#########',
      ]),
      enemies: [
        { type: 'keese', col: 5, row: 4 },
        { type: 'stalfos', col: 14, row: 5 },
        { type: 'red_soldier', col: 6, row: 9 },
      ],
    },

    fs_miniboss: {
      id: 'fs_miniboss',
      name: 'Hall of the Frost Guard',
      area: 'frost',
      gx: 1,
      gy: -1,
      exits: {
        west: 'fs_dark_hall',
      },
      puzzle: {
        type: 'defeat_all',
        spawnBigChest: {
          col: 15,
          row: 6,
          reward: 'frost_boss_key',
          label: 'THE FROST BOSS KEY! Ascend to face Frost Sovereign Glacior!',
        },
      },
      grid: parseGrid([
        '####################',
        '#t___iiiiiiiiii___t#',
        '#__A_iiiiiiiiii_A__#',
        '#____iiiiiiiiii____#',
        '#__*_iiiiiiiiii_*__#',
        '#____iiiiiiiiii____#',
        'D____iiiiiiiiii____#',
        'D____iiiiiiiiii____#',
        '#____iiiiiiiiii____#',
        '#__*_iiiiiiiiii_*__#',
        '#__o_iiiiiiiiii_o__#',
        '#t___iiiiiiiiii___t#',
        '####################',
      ]),
      enemies: [
        { type: 'knight', col: 12, row: 4 },
        { type: 'knight', col: 12, row: 8 },
        { type: 'stalfos', col: 8, row: 4 },
        { type: 'stalfos', col: 8, row: 8 },
      ],
    },

    fs_ante: {
      id: 'fs_ante',
      name: 'Frozen Sanctum',
      area: 'frost',
      gx: 0,
      gy: -2,
      exits: {
        south: 'fs_dark_hall',
        north: 'fs_boss',
      },
      locks: {
        north: { id: 'lock_fs_boss', type: 'frost_boss' },
      },
      grid: parseGrid([
        '#########BB#########',
        '#t______iiii______t#',
        '#__A____iiii____A__#',
        '#_______iiii_______#',
        '#__o____iiii____o__#',
        '#_______iiii_______#',
        '#__t____iiii____t__#',
        '#_______iiii_______#',
        '#__o____iiii____o__#',
        '#_______iiii_______#',
        '#__A____iiii____A__#',
        '#t______iiii______t#',
        '#########DD#########',
      ]),
      enemies: [],
      fairyPots: true,
    },

    fs_boss: {
      id: 'fs_boss',
      name: 'Crown of the Frost Spire',
      area: 'frost',
      gx: 0,
      gy: -3,
      isBossRoom: true,
      exits: {
        south: 'fs_ante',
      },
      grid: parseGrid([
        '####################',
        '#t________________t#',
        '#__A_iiiiiiiiii_A__#',
        '#____iiiiiiiiii____#',
        '#____iiiiiiiiii____#',
        '#____iiiiiiiiii____#',
        '#____iiiiiiiiii____#',
        '#____iiiiiiiiii____#',
        '#____iiiiiiiiii____#',
        '#__o_iiiiiiiiii_o__#',
        '#__A____________A__#',
        '#t________________t#',
        '#########DD#########',
      ]),
      enemies: [{ type: 'frost_boss', col: 10, row: 4 }],
    },
  }));
})(window);
