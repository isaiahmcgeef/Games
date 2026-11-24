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
  FB.VIEW_W = FB.ROOM_COLS * FB.TILE_SIZE; // 320 logical units
  FB.VIEW_H = FB.ROOM_ROWS * FB.TILE_SIZE; // 208 logical units
  FB.HI_RES_SCALE = 2; // Hi-Bit 32x32 pixel art per tile!
  FB.HI_TILE = FB.TILE_SIZE * FB.HI_RES_SCALE; // 32
  FB.RENDER_W = FB.VIEW_W * FB.HI_RES_SCALE; // 640
  FB.RENDER_H = FB.VIEW_H * FB.HI_RES_SCALE; // 416
  FB.SCALE = 3;

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
    POST_LATCH: 49,
    DARK_GRASS: 50,
    DARK_TREE: 51,
    DARK_WATER: 52,
    DARK_PATH: 53,
    PORTAL_DARK: 54,
    PORTAL_FROST: 55,
    ICE_FLOOR: 56,
    TOWN_COBBLE: 57,
    HOUSE_WALL: 58,
    HOUSE_ROOF: 59,
    PORTAL_HOUSE: 60,
    NPC_VILLAGER: 61,
    FOUNTAIN: 62,
    HOT_SPRING: 63,
    WATERFALL: 64,
    DOCK_WOOD: 65,
    SAND: 66,
    SAND_PATH: 67,
    CACTUS: 68,
    DESERT_RUIN: 69,
    PORTAL_DESERT: 70,
    MOUNTAIN_GROUND: 71,
    MOUNTAIN_ROCK: 72,
    LAVA: 73,
    PORTAL_MAGMA: 74,
    PORTAL_ARENA: 75,
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
    {
      id: 'golden_blade',
      name: 'Golden Master Blade',
      short: 'GOLD',
      cost: 110,
      color: '#fde047',
      desc: 'Haven Blacksmith forge! +2 Sword Damage and blazing Golden Sword Beams at full hearts!',
    },
    {
      id: 'pegasus_oil',
      name: 'Pegasus Oil',
      short: 'DASH',
      cost: 65,
      color: '#38bdf8',
      desc: 'Haven Blacksmith tonic! Cuts Dash cooldown by 45% and extends dash distance!',
    },
    {
      id: 'grip_sandals',
      name: 'Grip Sandals',
      short: 'GRIP',
      cost: 55,
      color: '#d97706',
      desc: 'Oasis Bazaar gear! Eliminates icy floor sliding and boosts walking speed by 12%!',
    },
    {
      id: 'blue_elixir',
      name: 'Blue Elixir',
      short: 'ELIXIR',
      cost: 75,
      color: '#0ea5e9',
      desc: 'Oasis Apothecary brew! Auto-revives with full hearts and 2.2s invulnerability!',
    },
    {
      id: 'hero_mail',
      name: "Hero's Mail Armor",
      short: 'MAIL',
      cost: 120,
      color: '#a855f7',
      desc: 'Emberwatch Highland forge! Reduces all incoming enemy damage by 1 heart unit!',
    },
    {
      id: 'blast_powder',
      name: 'Blast Powder',
      short: 'BLAST',
      cost: 70,
      color: '#f97316',
      desc: 'Emberwatch Highland blend! +50% Bomb blast radius and +3 Bomb damage!',
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
    FB.TILES.POST_LATCH,
    FB.TILES.DARK_TREE,
    FB.TILES.DARK_WATER,
    FB.TILES.HOUSE_WALL,
    FB.TILES.HOUSE_ROOF,
    FB.TILES.NPC_VILLAGER,
    FB.TILES.FOUNTAIN,
    FB.TILES.WATERFALL,
    FB.TILES.CACTUS,
    FB.TILES.DESERT_RUIN,
    FB.TILES.MOUNTAIN_ROCK,
    FB.TILES.LAVA,
  ]);

  // Projectiles can fly over water, lava, pits, bushes, low obstacles
  FB.PROJECTILE_BLOCK_TILES = new Set([
    FB.TILES.TREE,
    FB.TILES.DARK_TREE,
    FB.TILES.STONE_WALL,
    FB.TILES.CLIFF,
    FB.TILES.DUNGEON_WALL,
    FB.TILES.DOOR_LOCKED,
    FB.TILES.DOOR_BOSS,
    FB.TILES.DOOR_BARRED,
    FB.TILES.CRACKED_WALL,
    FB.TILES.STATUE,
    FB.TILES.HOUSE_WALL,
    FB.TILES.HOUSE_ROOF,
    FB.TILES.DESERT_RUIN,
    FB.TILES.MOUNTAIN_ROCK,
    FB.TILES.WATERFALL,
  ]);

  FB.ITEMS = {
    BOOMERANG: 'boomerang',
    BOMB: 'bomb',
    BOW: 'bow',
    FIREROD: 'firerod',
    HOOKSHOT: 'hookshot',
    MIRROR: 'mirror',
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
      desc: 'Hurls fireballs that ignite unlit braziers & melt frost.',
      color: '#f25c54',
    },
    hookshot: {
      id: 'hookshot',
      name: 'Grappling Hookshot',
      short: 'HOOK',
      desc: 'Zips you across pits & rivers to Latch Posts and stuns foes!',
      color: '#94a3b8',
    },
    mirror: {
      id: 'mirror',
      name: 'Magic Mirror',
      short: 'MIRR',
      desc: 'Warps between the Light & Dark Worlds (or escapes dungeons)!',
      color: '#c084fc',
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
