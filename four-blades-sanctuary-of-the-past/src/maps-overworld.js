/**
 * Light Overworld Region (4 Interconnected Zones).
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  FB.registerMapRegion((parseGrid) => ({
    ow_start: {
      id: 'ow_start',
      name: 'Sanctuary Courtyard',
      area: 'overworld',
      gx: 0,
      gy: 1,
      mirrorTarget: 'dw_start',
      exits: {
        north: 'ow_palace',
        west: 'ow_woods',
        east: 'ow_river',
      },
      portals: [{ col: 16, row: 1, targetRoom: 'ow_shop', targetCol: 10, targetRow: 10 }],
      grid: parseGrid([
        'TTTTTTTTTppTTTTSSSTT',
        'T..,....pppp...S$S,T',
        'T..bb...p..p...ppp.T',
        'T..bb...p??p...pbb.T',
        'T....I..pppp..Ip...T',
        'T.......pppp...p...T',
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
          text: 'FOUR BLADES SANCTUARY: Claim Boomerang & Bombs, visit the Shop to the NE for Upgrades, then enter the Palace North!',
        },
        {
          col: 10,
          row: 3,
          text: 'TIP: Tap Attack for a 3-Hit Combo! Press F (P1) to Lift & Throw pots, bombs, stunned foes & teammates! Press Q for Solo Spirit Clone!',
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

    ow_shop: {
      id: 'ow_shop',
      name: 'Sanctuary Merchant Shop',
      area: 'overworld',
      gx: 1,
      gy: 0,
      exits: {},
      portals: [
        { col: 9, row: 11, targetRoom: 'ow_start', targetCol: 16, targetRow: 2 },
        { col: 10, row: 11, targetRoom: 'ow_start', targetCol: 16, targetRow: 2 },
      ],
      shopItems: [
        { col: 5, row: 6, catalogId: 'heal' },
        { col: 8, row: 6, catalogId: 'potion' },
        { col: 11, row: 6, catalogId: 'mirror_shield' },
        { col: 14, row: 6, catalogId: 'tempered_sword' },
      ],
      grid: parseGrid([
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
      ]),
      enemies: [],
    },

    ow_woods: {
      id: 'ow_woods',
      name: 'Whispering Woods',
      area: 'overworld',
      gx: -1,
      gy: 1,
      mirrorTarget: 'dw_woods',
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
      mirrorTarget: 'dw_river',
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
      mirrorTarget: 'dw_spire_approach',
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
  }));
})(window);
