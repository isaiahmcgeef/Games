/**
 * Core constants, tile IDs, hero definitions, and game configuration.
 * Shared across all modules via window.FourBlades.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  FB.TILE_SIZE = 16;
  FB.ROOM_COLS = 20;
  FB.ROOM_ROWS = 13;
  FB.VIEW_W = FB.ROOM_COLS * FB.TILE_SIZE; // 320
  FB.VIEW_H = FB.ROOM_ROWS * FB.TILE_SIZE; // 208
  FB.SCALE = 3; // Crisp 3x pixel scaling -> 960x624 internal canvas

  FB.DIRS = {
    DOWN: 0,
    UP: 1,
    LEFT: 2,
    RIGHT: 3,
  };

  FB.DIR_VEC = [
    { x: 0, y: 1 },  // DOWN
    { x: 0, y: -1 }, // UP
    { x: -1, y: 0 }, // LEFT
    { x: 1, y: 0 },  // RIGHT
  ];

  // Tile types
  FB.TILES = {
    GRASS: 0,
    GRASS_FLOWERS: 1,
    PATH: 2,
    TREE: 3,
    BUSH: 4,
    WATER: 5,
    BRIDGE: 6,
    STONE_WALL: 7,
    CLIFF: 8,
    STAIRS_UP: 9,
    DUNGEON_FLOOR: 10,
    DUNGEON_WALL: 11,
    DUNGEON_CARPET: 12,
    PIT: 13,
    DOOR_OPEN: 14,
    DOOR_LOCKED: 15,
    DOOR_BOSS: 16,
    DOOR_BARRED: 17,
    CRACKED_WALL: 18,
    POT: 19,
    BLOCK_PUSH: 20,
    SWITCH_FLOOR: 21,
    SWITCH_FLOOR_ON: 22,
    TORCH_LIT: 23,
    TORCH_UNLIT: 24,
    SPIKES: 25,
    CHEST_CLOSED: 26,
    CHEST_OPEN: 27,
    BIG_CHEST_CLOSED: 28,
    BIG_CHEST_OPEN: 29,
    CRYSTAL_BLUE: 30,
    CRYSTAL_RED: 31,
    GATE_BLUE_UP: 32,
    GATE_BLUE_DOWN: 33,
    GATE_RED_UP: 34,
    GATE_RED_DOWN: 35,
    PORTAL_DUNGEON: 36,
    PORTAL_OVERWORLD: 37,
    SIGN: 38,
    FAIRY_POOL: 39,
    PEDESTAL: 40,
    ROCK_CRACKED: 41,
    STATUE: 42,
    TRIFORCE_ALTAR: 43,
    PORTAL_SHOP: 44,
    SHOP_EXIT: 45,
    SHOP_COUNTER: 46,
    MERCHANT: 47,
    SHOP_FLOOR: 48,
  };

  FB.SHOP_CATALOG = [
    {
      id: 'heal',
      name: 'Heart Refill',
      short: 'HEAL',
      cost: 15,
      color: '#ef4444',
      desc: 'Restores all of your hearts immediately.',
    },
    {
      id: 'potion',
      name: 'Red Potion',
      short: 'POTION',
      cost: 35,
      color: '#f43f5e',
      desc: 'Auto-revives you with full hearts upon taking fatal damage!',
    },
    {
      id: 'mirror_shield',
      name: 'Mirror Shield',
      short: 'SHIELD',
      cost: 60,
      color: '#facc15',
      desc: 'Reflects blocked enemy projectiles right back at foes!',
    },
    {
      id: 'tempered_sword',
      name: 'Tempered Blade',
      short: 'BLADE',
      cost: 80,
      color: '#fb923c',
      desc: '+1 Sword Damage and fires golden Sword Beams on Hit 3 at full health!',
    },
  ];

  FB.SOLID_TILES = new Set([
    FB.TILES.TREE,
    FB.TILES.BUSH,
    FB.TILES.WATER,
    FB.TILES.STONE_WALL,
    FB.TILES.CLIFF,
    FB.TILES.DUNGEON_WALL,
    FB.TILES.DOOR_LOCKED,
    FB.TILES.DOOR_BOSS,
    FB.TILES.DOOR_BARRED,
    FB.TILES.CRACKED_WALL,
    FB.TILES.POT,
    FB.TILES.BLOCK_PUSH,
    FB.TILES.TORCH_LIT,
    FB.TILES.TORCH_UNLIT,
    FB.TILES.CHEST_CLOSED,
    FB.TILES.CHEST_OPEN,
    FB.TILES.BIG_CHEST_CLOSED,
    FB.TILES.BIG_CHEST_OPEN,
    FB.TILES.CRYSTAL_BLUE,
    FB.TILES.CRYSTAL_RED,
    FB.TILES.GATE_BLUE_UP,
    FB.TILES.GATE_RED_UP,
    FB.TILES.SIGN,
    FB.TILES.ROCK_CRACKED,
    FB.TILES.STATUE,
    FB.TILES.SHOP_COUNTER,
    FB.TILES.MERCHANT,
  ]);

  // Projectiles can fly over water, pits, bushes, low obstacles
  FB.PROJECTILE_BLOCK_TILES = new Set([
    FB.TILES.TREE,
    FB.TILES.STONE_WALL,
    FB.TILES.CLIFF,
    FB.TILES.DUNGEON_WALL,
    FB.TILES.DOOR_LOCKED,
    FB.TILES.DOOR_BOSS,
    FB.TILES.DOOR_BARRED,
    FB.TILES.CRACKED_WALL,
    FB.TILES.STATUE,
  ]);

  FB.ITEMS = {
    BOOMERANG: 'boomerang',
    BOMB: 'bomb',
    BOW: 'bow',
    FIREROD: 'firerod',
  };

  FB.ITEM_META = {
    boomerang: {
      id: 'boomerang',
      name: 'Gale Boomerang',
      short: 'BOOM',
      desc: 'Stuns foes, grabs rupees & flips crystal switches.',
      color: '#4ea8de',
    },
    bomb: {
      id: 'bomb',
      name: 'Sanctuary Bombs',
      short: 'BOMB',
      desc: 'Blasts cracked walls, boulders & heavy armor.',
      color: '#5c6bc0',
    },
    bow: {
      id: 'bow',
      name: "Hero's Bow",
      short: 'BOW',
      desc: 'Pierces enemies & triggers switches from afar.',
      color: '#d4a359',
    },
    firerod: {
      id: 'firerod',
      name: 'Ember Rod',
      short: 'FIRE',
      desc: 'Hurls fireballs that ignite unlit braziers.',
      color: '#f25c54',
    },
  };

  // Four Swords Hero Color Palettes
  FB.HERO_PROFILES = [
    {
      index: 0,
      name: 'Green',
      title: 'Emerald Blade',
      tunic: '#2e9e4b',
      tunicDark: '#1c6b31',
      tunicLight: '#63d471',
      cap: '#38b556',
      accent: '#f4d35e',
      hair: '#d99a38',
      skin: '#f6c79c',
      uiColor: '#48c764',
    },
    {
      index: 1,
      name: 'Red',
      title: 'Ruby Blade',
      tunic: '#d63b3b',
      tunicDark: '#8f1f24',
      tunicLight: '#ff7070',
      cap: '#e04848',
      accent: '#ffd166',
      hair: '#c9802b',
      skin: '#f6c79c',
      uiColor: '#ef5350',
    },
    {
      index: 2,
      name: 'Blue',
      title: 'Sapphire Blade',
      tunic: '#2e77d0',
      tunicDark: '#1b4a8a',
      tunicLight: '#68b0ff',
      cap: '#3a86e8',
      accent: '#f4d35e',
      hair: '#e0ad48',
      skin: '#f6c79c',
      uiColor: '#42a5f5',
    },
    {
      index: 3,
      name: 'Violet',
      title: 'Amethyst Blade',
      tunic: '#8a4bc7',
      tunicDark: '#572887',
      tunicLight: '#bd85f7',
      cap: '#9a5bd9',
      accent: '#ffe066',
      hair: '#d99d3b',
      skin: '#f6c79c',
      uiColor: '#ab72e8',
    },
  ];

  FB.CONFIG = {
    PLAYER_SPEED: 74,
    DASH_SPEED: 158,
    DASH_DURATION: 0.17,
    DASH_COOLDOWN: 0.48,
    SWORD_DURATION: 0.13,
    SWORD_COOLDOWN: 0.145,
    SWORD_COMBO_WINDOW: 0.44,
    SPIN_CHARGE_TIME: 0.46,
    SPIN_DURATION: 0.3,
    INVULN_TIME: 0.85,
    START_MAX_HP: 12, // 6 full hearts (each heart = 2 HP)
    TRANSITION_TIME: 0.32,
  };
})(window);
