/**
 * Act II — Dark World Overworld (4 Mirrored Zones + Hookshot Shrine + Frost Spire Approach).
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  FB.registerMapRegion((parseGrid) => ({
    dw_start: {
      id: 'dw_start',
      name: 'Twilight Courtyard',
      area: 'darkworld',
      gx: 0,
      gy: 1,
      mirrorTarget: 'ow_start',
      exits: {
        north: 'dw_spire_approach',
        west: 'dw_woods',
        east: 'dw_river',
      },
      portals: [{ col: 10, row: 4, targetRoom: 'ow_start', targetCol: 10, targetRow: 5 }],
      grid: parseGrid([
        'YYYYYYYYYqqYYYYYYYYY',
        'YdddddddqqqqdddddddY',
        'YddAddddqddqddddAddY',
        'Ydddddddq??qdddddddY',
        'Ydddddddqq@qdddddddY',
        'YdddddddqqqqdddddddY',
        'qqqqqqqqqqqqqqqqqqqq',
        'qqqqqqqqqqqqqqqqqqqq',
        'YddoddddqqqqddddoddY',
        'YdddddddqddqdddddddY',
        'YdddddddqqqqdddddddY',
        'YddAAddddddddddAAddY',
        'YYYYYYYYYYYYYYYYYYYY',
      ]),
      signs: [
        {
          col: 9,
          row: 3,
          text: 'DARK WORLD: Seek the Grappling Hookshot in the Cursed Thicket (West), cross Crimson Rapids (East), and ascend to the Frost Spire (North)!',
        },
        {
          col: 10,
          row: 3,
          text: 'MAGIC MIRROR: Use your Magic Mirror (Item) anywhere outdoors to warp between Light & Dark Worlds!',
        },
      ],
      enemies: [
        { type: 'red_soldier', col: 5, row: 9 },
        { type: 'stalfos', col: 14, row: 9 },
      ],
    },

    dw_woods: {
      id: 'dw_woods',
      name: 'Cursed Thicket',
      area: 'darkworld',
      gx: -1,
      gy: 1,
      mirrorTarget: 'ow_woods',
      exits: {
        east: 'dw_start',
      },
      pedestals: [{ col: 4, row: 2, itemId: FB.ITEMS.HOOKSHOT }],
      grid: parseGrid([
        'YYYYYYYYYYYYYYYYYYYY',
        'YddAddddddddddddddYY',
        'YdddIdddddqqqqddddYY',
        'YddqqqqqqqqddqdddddY',
        'YddqYYYYYYYddqdddddY',
        'YddqdddddddddqdddddY',
        'Yddqqqqqqqqqqqqqqqqq',
        'Yddddddddddddqqqqqqq',
        'YddAdddddqqqqqdddddY',
        'YddodddddqdddddoddYY',
        'YddddddddqdddddddddY',
        'YddddddddddddddddddY',
        'YYYYYYYYYYYYYYYYYYYY',
      ]),
      enemies: [
        { type: 'stalfos', col: 9, row: 3 },
        { type: 'wizzrobe', col: 15, row: 4 },
        { type: 'chuchu', col: 14, row: 9 },
        { type: 'knight', col: 11, row: 7 },
        { type: 'red_soldier', col: 6, row: 9 },
      ],
    },

    dw_river: {
      id: 'dw_river',
      name: 'Crimson Rapids',
      area: 'darkworld',
      gx: 1,
      gy: 1,
      mirrorTarget: 'ow_river',
      exits: {
        west: 'dw_start',
      },
      chests: [
        {
          col: 15,
          row: 3,
          reward: 'heart_container',
          label: 'Dark World Heart Container! All heroes gain +1 Max Heart!',
        },
        {
          col: 15,
          row: 9,
          reward: 'rupee_100',
          label: 'Crimson Vault! +100 Rupees & Full Heal!',
        },
      ],
      heartPieces: [{ id: 'hp_dw_river', col: 16, row: 6 }],
      grid: parseGrid([
        'YYYYYYYYYYYYYYYYYYYY',
        'YdddddwwwddddddddddY',
        'YdddddwwwdddddAddddY',
        'Ydd&ddwwwdd&dddCdddY',
        'YddqddwwwddqdddddddY',
        'YddqddwwwddqdddddddY',
        'qqqqddwwwddqqqqddddY',
        'qqqqddwwwddqqqqddddY',
        'YddqddwwwddqdddddddY',
        'Ydd&ddwwwdd&dddCdddY',
        'YddoddwwwddodddddddY',
        'YdddddwwwddddddddddY',
        'YYYYYYYYYYYYYYYYYYYY',
      ]),
      enemies: [
        { type: 'keese', col: 8, row: 4 },
        { type: 'wizzrobe', col: 16, row: 5 },
        { type: 'stalfos', col: 13, row: 6 },
        { type: 'red_soldier', col: 13, row: 9 },
      ],
    },

    dw_spire_approach: {
      id: 'dw_spire_approach',
      name: 'Frozen Summit',
      area: 'darkworld',
      gx: 0,
      gy: 0,
      mirrorTarget: 'ow_palace',
      exits: {
        south: 'dw_start',
      },
      portals: [
        { col: 9, row: 2, targetRoom: 'fs_entry', targetCol: 9, targetRow: 10 },
        { col: 10, row: 2, targetRoom: 'fs_entry', targetCol: 10, targetRow: 10 },
      ],
      grid: parseGrid([
        'SSSSSSSSSSSSSSSSSSSS',
        'SSdddSddSSSSddSdddSS',
        'SddAdSddSVVSddSdAddS',
        'SddddSddqqqqddSddddS',
        'Sdtddcdd^^^^ddcddtdS',
        'SddddcddqqqqddcddodS',
        'YddiddddqqqqddddiddY',
        'YddiidddqqqqdddiiidY',
        'YdddddddqqqqdddddddY',
        'YddoddddqqqqddddoddY',
        'YdddddddqqqqdddddddY',
        'YdddddddqqqqdddddddY',
        'YYYYYYYYYqqYYYYYYYYY',
      ]),
      enemies: [
        { type: 'knight', col: 6, row: 7 },
        { type: 'knight', col: 13, row: 7 },
        { type: 'stalfos', col: 10, row: 5 },
      ],
    },
  }));
})(window);
