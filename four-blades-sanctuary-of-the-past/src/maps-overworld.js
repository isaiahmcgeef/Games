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
        south: { target: 'ow_haven', targetCol: 17, targetRow: 1 },
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
        'T..bbb..pppp..bbb..T',
        'TTTTTTTTTppTTTTTTTTT',
      ]),
      signs: [
        {
          col: 9,
          row: 3,
          text: 'FOUR BLADES SANCTUARY: Claim Boomerang & Bombs! South leads to Sanctuary Haven Village, Desert & Peaks; North leads to Palace #1!',
        },
        {
          col: 10,
          row: 3,
          text: 'TIP: Press M anytime for the World Map & Quest Journal! Tap Attack for a 3-Hit Combo, F to Lift/Throw, Q for Solo Spirit Clone!',
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
        south: { target: 'ow_deepwoods', targetCol: 14, targetRow: 1 },
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
        'T....,,..pp....,,..T',
        'TTTTTTTTTppTTTTTTTTT',
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
      heartPieces: [{ id: 'hp_woods', col: 2, row: 1 }],
      enemies: [
        { type: 'octorok', col: 8, row: 3 },
        { type: 'chuchu', col: 15, row: 3 },
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
        east: { target: 'ow_lake', targetCol: 1, targetRow: 7 },
        south: { target: 'ow_ravine', targetCol: 6, targetRow: 1 },
      },
      grid: parseGrid([
        'TTTTTTTTTTTTTTTTTTTT',
        'T..FF..~....SS..I.ST',
        'T..FF..~....SS..p.ST',
        'T..pp..~..1..SggSSST',
        'T..pp..~.....pppp..T',
        'T..pp..~.....p.....T',
        'ppppp===pppppppppppp',
        'ppppp===pppppppppppp',
        'T..b...~..p........T',
        'T..b...~..pppp.....T',
        'T......~..pp.p..o..T',
        'T..,..~~~.pp.,,....T',
        'TTTTTTTTTTppTTTTTTTT',
      ]),
      pedestals: [{ col: 16, row: 1, itemId: FB.ITEMS.BOW }],
      heartPieces: [{ id: 'hp_river', col: 2, row: 11 }],
      enemies: [
        { type: 'soldier', col: 12, row: 7 },
        { type: 'chuchu', col: 11, row: 10 },
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
