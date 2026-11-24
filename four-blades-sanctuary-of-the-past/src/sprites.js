/**
 * Procedural 16-bit Pixel Art Tile & Sprite Renderer.
 * Pre-renders static 16x16 tiles into an offscreen cache for smooth 60 FPS
 * and provides crisp pixel-art drawing functions for heroes, enemies, boss, and items.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const T = FB.TILES;
  const TS = FB.TILE_SIZE;

  class SpriteRenderer {
    constructor() {
      this.tileCache = new Map();
      this.built = false;
    }

    init() {
      if (this.built) return;
      this.built = true;
      for (const key of Object.keys(T)) {
        const id = T[key];
        this.tileCache.set(id, this._createTileCanvas(id));
      }
    }

    _makeCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }

    _px(ctx, x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    }

    _createTileCanvas(id) {
      const c = this._makeCanvas(TS, TS);
      const ctx = c.getContext('2d');
      const px = (x, y, w, h, col) => this._px(ctx, x, y, w, h, col);

      const drawGrassBase = () => {
        px(0, 0, 16, 16, '#4da342');
        px(2, 3, 2, 1, '#5cb84d');
        px(10, 6, 2, 1, '#5cb84d');
        px(5, 12, 2, 1, '#5cb84d');
        px(12, 13, 2, 1, '#3e8c36');
        px(3, 8, 1, 2, '#3e8c36');
        px(13, 2, 1, 1, '#68c957');
      };

      const drawDungeonFloor = () => {
        px(0, 0, 16, 16, '#39465c');
        px(0, 0, 16, 1, '#495975');
        px(0, 0, 1, 16, '#495975');
        px(0, 15, 16, 1, '#293345');
        px(15, 0, 1, 16, '#293345');
        px(7, 1, 1, 14, '#2f3a4f');
        px(1, 7, 14, 1, '#2f3a4f');
        px(3, 3, 2, 2, '#43526b');
        px(10, 10, 2, 2, '#43526b');
      };

      switch (id) {
        case T.GRASS:
          drawGrassBase();
          break;

        case T.GRASS_FLOWERS:
          drawGrassBase();
          px(3, 4, 2, 2, '#fff3b0');
          px(4, 3, 1, 1, '#ffd166');
          px(10, 10, 2, 2, '#fff3b0');
          px(11, 9, 1, 1, '#ff7b7b');
          px(12, 4, 2, 2, '#b8f2e6');
          break;

        case T.PATH:
          px(0, 0, 16, 16, '#c7a46b');
          px(2, 2, 3, 2, '#d6b67c');
          px(10, 5, 3, 2, '#b8945c');
          px(4, 11, 4, 2, '#d6b67c');
          px(12, 12, 2, 2, '#a8844c');
          px(7, 7, 2, 1, '#e0c48e');
          break;

        case T.TREE:
          drawGrassBase();
          // Trunk shadow & trunk
          px(4, 12, 8, 4, '#2f5e28');
          px(5, 10, 6, 5, '#6b4226');
          px(6, 11, 2, 4, '#875534');
          // Lush ALttP rounded canopy
          px(2, 1, 12, 10, '#1f5e2c');
          px(1, 3, 14, 7, '#277335');
          px(3, 2, 10, 7, '#349141');
          px(4, 2, 6, 4, '#4eb552');
          px(5, 3, 3, 2, '#73d46a');
          px(2, 9, 12, 2, '#1b4f25');
          break;

        case T.BUSH:
          drawGrassBase();
          px(2, 11, 12, 4, '#2a5926');
          px(2, 3, 12, 10, '#22692c');
          px(1, 5, 14, 7, '#2d8237');
          px(3, 3, 10, 6, '#3ea145');
          px(4, 4, 4, 3, '#63c75a');
          px(9, 5, 3, 2, '#56ba4e');
          px(5, 9, 2, 1, '#1d5726');
          px(10, 9, 2, 1, '#1d5726');
          break;

        case T.WATER:
          px(0, 0, 16, 16, '#2774b5');
          px(2, 3, 5, 1, '#4ea3e0');
          px(9, 8, 5, 1, '#4ea3e0');
          px(3, 12, 4, 1, '#75c4f5');
          break;

        case T.BRIDGE:
          px(0, 0, 16, 16, '#2774b5');
          px(0, 1, 16, 14, '#8f5d32');
          px(0, 1, 16, 2, '#69401f');
          px(0, 13, 16, 2, '#69401f');
          for (let x = 0; x < 16; x += 4) {
            px(x, 3, 3, 10, '#a8703e');
            px(x + 3, 3, 1, 10, '#69401f');
            px(x + 1, 4, 1, 1, '#d1985c');
          }
          break;

        case T.STONE_WALL:
          px(0, 0, 16, 16, '#6e7680');
          px(0, 0, 16, 3, '#97a1ad');
          px(1, 4, 6, 5, '#828b96');
          px(8, 4, 7, 5, '#7a838e');
          px(0, 10, 9, 5, '#757e8a');
          px(10, 10, 6, 5, '#828b96');
          px(0, 15, 16, 1, '#495059');
          break;

        case T.CLIFF:
          px(0, 0, 16, 16, '#876340');
          px(0, 0, 16, 3, '#57a846');
          px(0, 3, 16, 2, '#b38859');
          px(2, 6, 5, 8, '#735233');
          px(9, 6, 5, 8, '#6b4b2e');
          px(0, 14, 16, 2, '#4d3520');
          break;

        case T.STAIRS_UP:
          px(0, 0, 16, 16, '#8c8373');
          for (let y = 0; y < 16; y += 4) {
            px(1, y, 14, 2, '#bfb5a1');
            px(1, y + 2, 14, 2, '#6e6659');
          }
          px(0, 0, 1, 16, '#524b40');
          px(15, 0, 1, 16, '#524b40');
          break;

        case T.DUNGEON_FLOOR:
          drawDungeonFloor();
          break;

        case T.DUNGEON_WALL:
          // Ornate ALttP palace blue-slate brick wall with golden trim
          px(0, 0, 16, 16, '#23314d');
          px(0, 0, 16, 3, '#4e6c9c');
          px(0, 3, 16, 1, '#c9a64c');
          px(1, 5, 6, 4, '#32486e');
          px(8, 5, 7, 4, '#2d4163');
          px(0, 10, 9, 4, '#2b3e5e');
          px(10, 10, 6, 4, '#32486e');
          px(0, 14, 16, 2, '#162033');
          break;

        case T.DUNGEON_CARPET:
          px(0, 0, 16, 16, '#7d2432');
          px(0, 0, 16, 1, '#d4af37');
          px(0, 15, 16, 1, '#d4af37');
          px(2, 3, 12, 10, '#942b3c');
          px(6, 6, 4, 4, '#b8394d');
          break;

        case T.PIT:
          px(0, 0, 16, 16, '#0d1017');
          px(0, 0, 16, 2, '#1b2230');
          px(0, 0, 2, 16, '#1b2230');
          px(3, 3, 10, 10, '#07090d');
          break;

        case T.DOOR_OPEN:
          drawDungeonFloor();
          px(0, 0, 2, 16, '#c9a64c');
          px(14, 0, 2, 16, '#c9a64c');
          px(2, 2, 12, 12, '#4d5d7a');
          break;

        case T.DOOR_LOCKED:
          px(0, 0, 16, 16, '#59412b');
          px(1, 1, 14, 14, '#7a593b');
          px(0, 0, 16, 2, '#c9a64c');
          px(0, 14, 16, 2, '#3d2b1b');
          // Keyhole plate
          px(5, 4, 6, 8, '#e3be59');
          px(7, 6, 2, 2, '#1e1610');
          px(7, 8, 2, 3, '#1e1610');
          break;

        case T.DOOR_BOSS:
          px(0, 0, 16, 16, '#4a1728');
          px(1, 1, 14, 14, '#701f39');
          px(0, 0, 16, 2, '#f2c94c');
          px(0, 14, 16, 2, '#f2c94c');
          // Golden horned skull crest
          px(4, 3, 8, 9, '#f2c94c');
          px(5, 5, 2, 2, '#290d16');
          px(9, 5, 2, 2, '#290d16');
          px(7, 8, 2, 3, '#290d16');
          px(3, 2, 2, 2, '#fff1a8');
          px(11, 2, 2, 2, '#fff1a8');
          break;

        case T.DOOR_BARRED:
          px(0, 0, 16, 16, '#23314d');
          for (let x = 2; x <= 12; x += 3) {
            px(x, 1, 2, 14, '#9eaab8');
            px(x, 1, 1, 14, '#cbd5e0');
          }
          px(1, 4, 14, 2, '#697585');
          px(1, 10, 14, 2, '#697585');
          break;

        case T.CRACKED_WALL:
          px(0, 0, 16, 16, '#23314d');
          px(0, 0, 16, 3, '#4e6c9c');
          px(1, 4, 14, 10, '#32486e');
          // Bold dark bombable crack pattern
          px(7, 2, 2, 4, '#0c111c');
          px(6, 5, 2, 4, '#0c111c');
          px(8, 7, 3, 2, '#0c111c');
          px(5, 9, 2, 5, '#0c111c');
          px(9, 9, 2, 4, '#0c111c');
          px(7, 6, 1, 1, '#ffd166');
          break;

        case T.POT:
          drawDungeonFloor();
          px(3, 12, 10, 3, '#1f2736');
          px(4, 3, 8, 10, '#9e6238');
          px(3, 5, 10, 7, '#b57445');
          px(5, 2, 6, 2, '#d49461');
          px(5, 4, 6, 1, '#63381c');
          px(5, 6, 2, 4, '#d49461');
          break;

        case T.BLOCK_PUSH:
          drawDungeonFloor();
          px(1, 1, 14, 14, '#6a7a94');
          px(1, 1, 14, 2, '#9eb0cc');
          px(1, 13, 14, 2, '#3d495e');
          px(3, 3, 10, 10, '#556580');
          // Carved emblem
          px(6, 5, 4, 6, '#c9a64c');
          px(5, 6, 6, 4, '#c9a64c');
          px(7, 7, 2, 2, '#556580');
          break;

        case T.SWITCH_FLOOR:
          drawDungeonFloor();
          px(2, 2, 12, 12, '#6b7280');
          px(3, 3, 10, 10, '#9ca3af');
          px(4, 4, 8, 8, '#d97706');
          px(5, 5, 6, 6, '#f59e0b');
          break;

        case T.SWITCH_FLOOR_ON:
          drawDungeonFloor();
          px(2, 2, 12, 12, '#374151');
          px(4, 4, 8, 8, '#15803d');
          px(5, 5, 6, 6, '#4ade80');
          break;

        case T.TORCH_UNLIT:
          drawDungeonFloor();
          px(4, 6, 8, 8, '#4a5568');
          px(3, 5, 10, 3, '#718096');
          px(5, 6, 6, 2, '#1a202c');
          px(6, 13, 4, 2, '#2d3748');
          break;

        case T.TORCH_LIT:
          drawDungeonFloor();
          px(4, 6, 8, 8, '#4a5568');
          px(3, 5, 10, 3, '#718096');
          px(5, 2, 6, 5, '#f97316');
          px(6, 1, 4, 4, '#facc15');
          px(7, 3, 2, 2, '#fef08a');
          break;

        case T.SPIKES:
          drawDungeonFloor();
          for (let sx = 2; sx <= 10; sx += 6) {
            for (let sy = 2; sy <= 10; sy += 6) {
              px(sx + 1, sy, 2, 4, '#cbd5e1');
              px(sx, sy + 2, 4, 2, '#64748b');
              px(sx + 1, sy, 1, 2, '#ffffff');
            }
          }
          break;

        case T.CHEST_CLOSED:
          drawDungeonFloor();
          px(2, 3, 12, 11, '#784421');
          px(3, 4, 10, 9, '#a6602d');
          px(2, 3, 12, 2, '#e6b84c');
          px(2, 8, 12, 1, '#4a2811');
          px(6, 7, 4, 3, '#ffd166');
          px(7, 8, 2, 1, '#3b210d');
          break;

        case T.CHEST_OPEN:
          drawDungeonFloor();
          px(2, 2, 12, 5, '#5c3317');
          px(3, 3, 10, 3, '#261409');
          px(2, 7, 12, 7, '#8c4f23');
          px(2, 7, 12, 1, '#e6b84c');
          px(6, 8, 4, 2, '#ffd166');
          break;

        case T.BIG_CHEST_CLOSED:
          drawDungeonFloor();
          px(1, 2, 14, 13, '#701a28');
          px(2, 3, 12, 11, '#a82339');
          px(1, 2, 14, 2, '#ffd166');
          px(1, 13, 14, 2, '#ffd166');
          px(1, 2, 2, 13, '#ffd166');
          px(13, 2, 2, 13, '#ffd166');
          px(6, 6, 4, 4, '#fff0a6');
          px(7, 7, 2, 2, '#5c121e');
          break;

        case T.BIG_CHEST_OPEN:
          drawDungeonFloor();
          px(1, 1, 14, 6, '#4d101b');
          px(3, 2, 10, 4, '#1a0609');
          px(1, 7, 14, 8, '#8a1c2e');
          px(1, 7, 14, 2, '#ffd166');
          px(1, 13, 14, 2, '#ffd166');
          break;

        case T.CRYSTAL_BLUE:
          drawDungeonFloor();
          px(5, 11, 6, 3, '#475569');
          px(5, 3, 6, 9, '#2563eb');
          px(6, 2, 4, 9, '#60a5fa');
          px(7, 3, 2, 4, '#dbeafe');
          break;

        case T.CRYSTAL_RED:
          drawDungeonFloor();
          px(5, 11, 6, 3, '#475569');
          px(5, 3, 6, 9, '#dc2626');
          px(6, 2, 4, 9, '#f87171');
          px(7, 3, 2, 4, '#fee2e2');
          break;

        case T.GATE_BLUE_UP:
          drawDungeonFloor();
          px(2, 2, 12, 12, '#1d4ed8');
          px(3, 3, 10, 10, '#3b82f6');
          px(4, 4, 8, 3, '#93c5fd');
          px(2, 12, 12, 2, '#1e3a8a');
          break;

        case T.GATE_BLUE_DOWN:
          drawDungeonFloor();
          px(3, 3, 10, 10, '#1e3a8a');
          px(4, 4, 8, 8, '#1e293b');
          break;

        case T.GATE_RED_UP:
          drawDungeonFloor();
          px(2, 2, 12, 12, '#b91c1c');
          px(3, 3, 10, 10, '#ef4444');
          px(4, 4, 8, 3, '#fca5a5');
          px(2, 12, 12, 2, '#7f1d1d');
          break;

        case T.GATE_RED_DOWN:
          drawDungeonFloor();
          px(3, 3, 10, 10, '#7f1d1d');
          px(4, 4, 8, 8, '#1e293b');
          break;

        case T.PORTAL_DUNGEON:
          px(0, 0, 16, 16, '#4f5966');
          px(2, 2, 12, 14, '#111827');
          px(1, 0, 14, 3, '#c9a64c');
          px(4, 5, 8, 11, '#070a12');
          px(6, 6, 4, 2, '#4ea8de');
          break;

        case T.PORTAL_OVERWORLD:
          drawDungeonFloor();
          px(2, 2, 12, 12, '#d4af37');
          px(4, 4, 8, 8, '#4ea8de');
          px(6, 6, 4, 4, '#e0f2fe');
          break;

        case T.SIGN:
          drawGrassBase();
          px(6, 10, 4, 5, '#6e4323');
          px(2, 3, 12, 8, '#8a552c');
          px(3, 4, 10, 6, '#b57643');
          px(4, 5, 8, 1, '#5e371a');
          px(4, 7, 6, 1, '#5e371a');
          break;

        case T.FAIRY_POOL:
          px(0, 0, 16, 16, '#38bdf8');
          px(2, 2, 12, 12, '#7dd3fc');
          px(5, 5, 6, 6, '#e0f2fe');
          break;

        case T.PEDESTAL:
          drawGrassBase();
          px(2, 3, 12, 11, '#7a8494');
          px(3, 4, 10, 9, '#a5b0c2');
          px(5, 6, 6, 5, '#d4af37');
          break;

        case T.ROCK_CRACKED:
          drawGrassBase();
          px(2, 3, 12, 11, '#596069');
          px(3, 2, 10, 10, '#7c848f');
          px(4, 3, 6, 4, '#9ba3ad');
          // Dark crack
          px(7, 4, 2, 3, '#1e2229');
          px(6, 7, 3, 2, '#1e2229');
          px(8, 9, 2, 3, '#1e2229');
          break;

        case T.STATUE:
          drawDungeonFloor();
          px(3, 10, 10, 5, '#64748b');
          px(4, 3, 8, 9, '#94a3b8');
          px(5, 2, 6, 4, '#cbd5e1');
          px(6, 4, 1, 1, '#1e293b');
          px(9, 4, 1, 1, '#1e293b');
          px(6, 7, 4, 3, '#d4af37');
          break;

        case T.TRIFORCE_ALTAR:
          drawDungeonFloor();
          px(1, 2, 14, 13, '#3b4a69');
          px(2, 3, 12, 11, '#5b6f99');
          // Golden Triforce triangle crest
          px(7, 4, 2, 2, '#fde047');
          px(6, 6, 4, 2, '#facc15');
          px(4, 8, 3, 3, '#facc15');
          px(9, 8, 3, 3, '#facc15');
          px(7, 9, 2, 2, '#eab308');
          break;

        case T.PORTAL_SHOP:
          // Cozy shop doorway with crimson awning & golden rupee emblem
          px(0, 0, 16, 16, '#6e4323');
          px(0, 0, 16, 4, '#b91c1c');
          px(1, 1, 14, 2, '#ef4444');
          px(6, 1, 4, 2, '#fde047');
          px(2, 4, 12, 12, '#1e1610');
          px(4, 6, 8, 10, '#2e2118');
          px(6, 8, 4, 5, '#4ade80');
          break;

        case T.SHOP_FLOOR:
          px(0, 0, 16, 16, '#7a5230');
          px(0, 0, 16, 1, '#5c3b20');
          px(0, 8, 16, 1, '#5c3b20');
          px(7, 1, 1, 7, '#634024');
          px(12, 9, 1, 7, '#634024');
          px(2, 3, 4, 1, '#8f623c');
          px(5, 11, 5, 1, '#8f623c');
          break;

        case T.SHOP_EXIT:
          px(0, 0, 16, 16, '#7a5230');
          px(1, 2, 14, 12, '#991b1b');
          px(2, 3, 12, 10, '#dc2626');
          px(3, 4, 10, 1, '#facc15');
          px(3, 11, 10, 1, '#facc15');
          break;

        case T.SHOP_COUNTER:
          px(0, 0, 16, 16, '#5c3b20');
          px(0, 1, 16, 6, '#b57643');
          px(0, 1, 16, 2, '#d49461');
          px(0, 7, 16, 8, '#7a4b26');
          px(0, 14, 16, 2, '#3d2513');
          break;

        case T.MERCHANT:
          px(0, 0, 16, 16, '#7a5230');
          // Cozy shopkeeper in ruby robe with golden trim & beard
          px(3, 7, 10, 8, '#991b1b');
          px(5, 7, 6, 8, '#dc2626');
          px(7, 8, 2, 7, '#facc15');
          px(4, 2, 8, 6, '#f6c79c');
          px(3, 0, 10, 3, '#7e22ce');
          px(5, 1, 6, 1, '#fde047');
          px(5, 4, 1, 2, '#111827');
          px(10, 4, 1, 2, '#111827');
          px(5, 6, 6, 3, '#e2e8f0'); // Beard
          break;

        case T.POST_LATCH:
          // Iron-banded wooden Hookshot Latch Post with golden bullseye cap
          px(0, 0, 16, 16, '#463854');
          px(4, 11, 8, 4, '#241b2e');
          px(5, 4, 6, 10, '#8f5d32');
          px(6, 4, 2, 10, '#b57b48');
          px(4, 3, 8, 3, '#94a3b8');
          px(6, 4, 4, 2, '#fde047');
          px(4, 9, 8, 2, '#64748b');
          break;

        case T.DARK_GRASS:
          px(0, 0, 16, 16, '#463854');
          px(2, 3, 2, 1, '#584769');
          px(10, 7, 2, 1, '#584769');
          px(5, 12, 2, 1, '#362a42');
          px(12, 13, 2, 1, '#6b4d6e');
          break;

        case T.DARK_TREE:
          px(0, 0, 16, 16, '#463854');
          px(4, 12, 8, 4, '#261b30');
          px(5, 10, 6, 5, '#47302c');
          px(2, 1, 12, 10, '#4f1d38');
          px(1, 3, 14, 7, '#6b2546');
          px(3, 2, 10, 7, '#873256');
          px(4, 3, 5, 3, '#a84768');
          break;

        case T.DARK_WATER:
          px(0, 0, 16, 16, '#5c1d38');
          px(2, 3, 5, 1, '#8c2d52');
          px(9, 8, 5, 1, '#8c2d52');
          px(3, 12, 4, 1, '#be4b72');
          break;

        case T.DARK_PATH:
          px(0, 0, 16, 16, '#6e5c78');
          px(2, 2, 3, 2, '#826e8c');
          px(10, 6, 3, 2, '#5c4b66');
          px(5, 11, 4, 2, '#826e8c');
          break;

        case T.PORTAL_DARK:
          px(0, 0, 16, 16, '#362a42');
          px(2, 2, 12, 12, '#6b21a8');
          px(4, 4, 8, 8, '#a855f7');
          px(6, 6, 4, 4, '#f3e8ff');
          break;

        case T.PORTAL_FROST:
          px(0, 0, 16, 16, '#334155');
          px(1, 0, 14, 3, '#7dd3fc');
          px(2, 3, 12, 13, '#0c4a6e');
          px(4, 5, 8, 11, '#082f49');
          px(6, 6, 4, 3, '#bae6fd');
          break;

        case T.ICE_FLOOR:
          px(0, 0, 16, 16, '#67c8eb');
          px(0, 0, 16, 1, '#bae6fd');
          px(0, 0, 1, 16, '#bae6fd');
          px(0, 15, 16, 1, '#3898bd');
          px(15, 0, 1, 16, '#3898bd');
          px(3, 3, 4, 1, '#e0f2fe');
          px(4, 4, 2, 1, '#ffffff');
          px(9, 10, 4, 1, '#bae6fd');
          break;

        default:
          drawGrassBase();
      }
      return c;
    }

    drawTile(ctx, id, dx, dy, time) {
      if (!this.built) this.init();
      const cached = this.tileCache.get(id);
      if (cached) {
        ctx.drawImage(cached, dx, dy);
      }

      // Dynamic animated accents for water, swaying flowers, torches, crystals, portals, ice, altar
      if (id === T.WATER || id === T.DARK_WATER) {
        const wave = Math.floor(time * 3 + dx * 0.08 + dy * 0.04) % 6;
        const crest = Math.sin(time * 3.5 + dx * 0.1) > 0.4 ? 1 : 0;
        ctx.fillStyle = id === T.DARK_WATER ? 'rgba(244, 114, 182, 0.35)' : 'rgba(210, 240, 255, 0.42)';
        ctx.fillRect(dx + 1 + wave, dy + 4, 4, 1);
        ctx.fillRect(dx + 10 - wave, dy + 11, 4, 1);
        if (crest) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(dx + 4 + (wave % 3) * 2, dy + 7, 2, 1);
        }
      } else if (id === T.PORTAL_DARK) {
        const r1 = 4 + Math.sin(time * 6) * 2;
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx + 8, dy + 8, r1, time * 3, time * 3 + Math.PI * 1.4);
        ctx.stroke();
      } else if (id === T.ICE_FLOOR) {
        if (Math.floor(time * 5 + dx * 0.1 + dy * 0.1) % 9 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(dx + 5, dy + 5, 2, 1);
        }
      } else if (id === T.GRASS_FLOWERS) {
        const sway = Math.round(Math.sin(time * 2.8 + dx * 0.12 + dy * 0.1) * 1);
        if (sway !== 0) {
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(dx + 3 + sway, dy + 4, 2, 1);
          ctx.fillStyle = '#ff7b7b';
          ctx.fillRect(dx + 11 - sway, dy + 9, 1, 1);
        }
      } else if (id === T.TORCH_LIT) {
        const f = Math.floor(time * 12 + dx + dy) % 4;
        const ox = f === 1 ? 1 : f === 3 ? -1 : 0;
        const h = f % 2 === 0 ? 5 : 6;
        // Layered dancing flame tongue
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(dx + 5, dy + 6 - h, 6, h);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(dx + 6 + ox, dy + 6 - h - 1, 4, h - 1);
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(dx + 7, dy + 4, 2, 2);
        // Rising ember spark
        const emberY = (Math.floor(time * 18 + dx * 3) % 7);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
        ctx.fillRect(dx + 7 + (emberY % 2 === 0 ? 1 : -1), dy + 2 - emberY, 1, 1);
        // Warm radial glow
        const glowR = 16 + Math.sin(time * 10 + dx) * 2;
        ctx.fillStyle = 'rgba(255, 175, 55, 0.16)';
        ctx.beginPath();
        ctx.arc(dx + 8, dy + 5, glowR, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === T.CRYSTAL_BLUE || id === T.CRYSTAL_RED) {
        const glint = Math.floor(time * 5 + dx) % 5 === 0;
        if (glint) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(dx + 6, dy + 3, 2, 2);
          ctx.fillRect(dx + 8, dy + 5, 1, 1);
        }
      } else if (id === T.CHEST_CLOSED || id === T.BIG_CHEST_CLOSED) {
        const twinkle = Math.floor(time * 4 + dx * 0.2) % 6 === 0;
        if (twinkle) {
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(dx + 7, dy + 3, 2, 1);
          ctx.fillRect(dx + 7, dy + 2, 1, 3);
        }
      } else if (id === T.FAIRY_POOL) {
        const pulse = Math.sin(time * 4 + dx * 0.2) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(224, 242, 254, ${0.22 + pulse * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dx + 8, dy + 8, 3 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + pulse * 0.5})`;
        ctx.fillRect(dx + 4, dy + 4 + Math.round(pulse), 2, 2);
        ctx.fillRect(dx + 10, dy + 9 - Math.round(pulse), 2, 2);
      } else if (id === T.TRIFORCE_ALTAR) {
        const glow = Math.sin(time * 5) * 0.14 + 0.26;
        ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
        ctx.beginPath();
        ctx.arc(dx + 8, dy + 8, 17 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
        ctx.fill();
        // Rising golden motes
        const moteY = Math.floor(time * 16 + dx) % 10;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(dx + 4 + (moteY % 3) * 3, dy + 11 - moteY, 1, 2);
      }
    }

    drawHero(ctx, hero, time) {
      const p = hero.profile;

      // 1. Render Pegasus Dash afterimage trail behind hero!
      if (hero.afterimages && hero.afterimages.length > 0 && !hero.downed) {
        for (const ghost of hero.afterimages) {
          const alpha = Math.max(0, (ghost.life / ghost.maxLife) * 0.45);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.tunicLight;
          ctx.beginPath();
          ctx.arc(Math.round(ghost.x), Math.round(ghost.y), 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(ghost.x - 2), Math.round(ghost.y - 2), 4, 4);
          ctx.restore();
        }
      }

      // Compute lunge offset during sword slash (extra deep lunge on Combo Hit 3 Thrust!) or pushing
      const dv = FB.DIR_VEC[hero.dir] || FB.DIR_VEC[0];
      let lungeX = 0;
      let lungeY = 0;
      if (hero.swordTimer > 0) {
        const prog = 1 - hero.swordTimer / FB.CONFIG.SWORD_DURATION;
        const mag = hero.comboStep === 2 ? 4.8 : 2.6;
        const thrust = Math.sin(prog * Math.PI) * mag;
        lungeX = dv.x * thrust;
        lungeY = dv.y * thrust;
      } else if (hero.pushing) {
        lungeX = dv.x * 1.5;
        lungeY = dv.y * 1.5;
      }

      const x = Math.round(hero.x - 8 + lungeX);
      const y = Math.round(hero.y - 10 + lungeY);

      ctx.save();

      // Golden Parry Counter Aura
      if (hero.parryFlash > 0) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 11 + (0.4 - hero.parryFlash) * 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Spirit Clone shimmering rune aura & anchor ring
      if (hero.isClone) {
        ctx.globalAlpha = 0.78 + Math.sin(time * 10) * 0.1;
        if (hero.cloneHold) {
          ctx.strokeStyle = 'rgba(103, 232, 249, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(hero.x, hero.y + 4, 9 + Math.sin(time * 6) * 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (hero.invuln > 0 && Math.floor(time * 24) % 2 === 0) {
        ctx.globalAlpha = 0.48;
      }

      // Ground shadow (stretches slightly when lunging or rolling)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      ctx.fillRect(Math.round(hero.x - 5), Math.round(hero.y + 4), 10, 3);

      // Downed / Ghost state in Multiplayer
      if (hero.downed) {
        const bob = Math.sin(time * 6) * 2.5;
        const tail = Math.sin(time * 10) * 1.5;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 4, y + 2 + bob, 8, 9);
        ctx.fillRect(x + 5 + tail, y + 10 + bob, 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5, y + 5 + bob, 2, 2);
        ctx.fillRect(x + 9, y + 5 + bob, 2, 2);
        // Revive ring progress
        if (hero.reviveProgress > 0) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hero.x, hero.y, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hero.reviveProgress);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      // Pegasus Roll / Somersault Dash Pose!
      if (hero.dashTimer > 0) {
        const prog = 1 - hero.dashTimer / FB.CONFIG.DASH_DURATION;
        const spinAng = prog * Math.PI * 2 * (hero.dashDx < 0 ? -1 : 1);
        ctx.save();
        ctx.translate(Math.round(hero.x), Math.round(hero.y - 1));
        ctx.rotate(spinAng);
        // Curled tucked hero ball
        ctx.fillStyle = p.tunicDark;
        ctx.fillRect(-6, -5, 12, 10);
        ctx.fillStyle = p.tunic;
        ctx.fillRect(-5, -4, 10, 8);
        ctx.fillStyle = p.cap;
        ctx.fillRect(-4, -6, 8, 4);
        ctx.fillStyle = p.accent;
        ctx.fillRect(-2, -1, 4, 2);
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(-5, 3, 4, 2);
        ctx.fillRect(1, 3, 4, 2);
        ctx.restore();
        ctx.restore();
        return;
      }

      // Spin-charge golden aura & orbiting glint sparks
      if (hero.spinCharge > 0.16) {
        const ready = hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME;
        const pct = Math.min(1, hero.spinCharge / FB.CONFIG.SPIN_CHARGE_TIME);
        const pulse = Math.floor(time * 18) % 2;
        ctx.strokeStyle = ready ? (pulse ? '#fde047' : '#ffffff') : 'rgba(253, 224, 71, 0.55)';
        ctx.lineWidth = ready ? 1.8 : 1;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 8 + pct * 3 + (ready ? pulse : 0), 0, Math.PI * 2);
        ctx.stroke();
        if (ready) {
          for (let i = 0; i < 3; i++) {
            const sa = time * 9 + (i * Math.PI * 2) / 3;
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fde047';
            ctx.fillRect(hero.x + Math.cos(sa) * 11 - 1, hero.y + Math.sin(sa) * 11 - 1, 2, 2);
          }
        }
      }

      // Determine effective facing direction (rapidly spins during Spin Attack!)
      let drawDir = hero.dir;
      if (hero.spinTimer > 0) {
        const spinOrder = [FB.DIRS.DOWN, FB.DIRS.RIGHT, FB.DIRS.UP, FB.DIRS.LEFT];
        const prog = 1 - hero.spinTimer / FB.CONFIG.SPIN_DURATION;
        drawDir = spinOrder[Math.floor(prog * 6) % 4];
      } else if (hero.celebrateTimer > 0) {
        drawDir = FB.DIRS.DOWN;
      }

      // 4-frame expressive stride cycle + subtle idle breathing
      const frame = hero.moving ? Math.floor(hero.walkPhase) % 4 : 0;
      const idleBreath = !hero.moving && hero.swordTimer <= 0 ? (Math.sin(time * 3.6 + hero.index) > 0.65 ? -0.5 : 0) : 0;
      const bobY = (frame === 1 || frame === 3 ? -1 : 0) + idleBreath;
      const leftFootY = frame === 1 ? -1.5 : frame === 3 ? 1 : 0;
      const rightFootY = frame === 3 ? -1.5 : frame === 1 ? 1 : 0;
      const hemShift = frame === 1 ? -1 : frame === 3 ? 1 : 0;

      // Boots with 4-frame alternating stride
      ctx.fillStyle = '#4a2e19';
      if (drawDir === FB.DIRS.LEFT || drawDir === FB.DIRS.RIGHT) {
        const stride = frame === 1 ? 2 : frame === 3 ? -2 : 0;
        ctx.fillRect(x + 4 + stride, y + 13, 3, 2);
        ctx.fillRect(x + 9 - stride, y + 13, 3, 2);
      } else {
        ctx.fillRect(x + 4, Math.round(y + 13 + leftFootY), 3, 2);
        ctx.fillRect(x + 9, Math.round(y + 13 + rightFootY), 3, 2);
      }

      // Tunic body with animated skirt hem & sash
      ctx.fillStyle = p.tunicDark;
      ctx.fillRect(x + 3, Math.round(y + 7 + bobY), 10, 7);
      ctx.fillStyle = p.tunic;
      ctx.fillRect(x + 4, Math.round(y + 7 + bobY), 8, 6);
      // Subtle tunic highlight & moving hem fold
      ctx.fillStyle = p.tunicLight;
      ctx.fillRect(x + 5, Math.round(y + 7 + bobY), 3, 3);
      ctx.fillStyle = p.tunicDark;
      ctx.fillRect(x + 7 + hemShift, Math.round(y + 12 + bobY), 2, 2);
      // Belt & golden buckle
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(x + 4, Math.round(y + 11 + bobY), 8, 1);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 7, Math.round(y + 11 + bobY), 2, 1);

      // Animated Arms (celebrate / carrying overhead / push brace / walking swing)
      ctx.fillStyle = p.skin;
      if (hero.celebrateTimer > 0 || hero.carrying) {
        // Both arms raised overhead!
        ctx.fillRect(x + 2, Math.round(y + 1 + bobY), 2, 6);
        ctx.fillRect(x + 12, Math.round(y + 1 + bobY), 2, 6);
      } else if (hero.pushing) {
        // Leaning braced hands
        ctx.fillRect(x + 2 + dv.x * 2, Math.round(y + 8 + dv.y * 2), 2, 3);
        ctx.fillRect(x + 12 + dv.x * 2, Math.round(y + 8 + dv.y * 2), 2, 3);
      } else {
        const armSwing = frame === 1 ? -1 : frame === 3 ? 1 : 0;
        ctx.fillRect(x + 2, Math.round(y + 9 + bobY + armSwing), 2, 2);
        ctx.fillRect(x + 12, Math.round(y + 9 + bobY - armSwing), 2, 2);
      }

      // Head, Hair & Animated Pointed Hylian Cap
      ctx.fillStyle = p.skin;
      ctx.fillRect(x + 4, Math.round(y + 2 + bobY), 8, 6);

      const capBounce = hero.moving ? (frame % 2 === 0 ? 0 : 1) : 0;

      if (drawDir === FB.DIRS.UP) {
        // Back of hair & fluttering long cap tail
        ctx.fillStyle = p.hair;
        ctx.fillRect(x + 4, Math.round(y + 5 + bobY), 8, 3);
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 3, Math.round(y + 0 + bobY), 10, 5);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 5, Math.round(y + 1 + bobY), 5, 2);
        // Pointed cap tail swaying on back
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 6 + hemShift, Math.round(y + 4 + bobY + capBounce), 4, 4);
      } else {
        // Cap crown + expressive fluttering tail
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 3, Math.round(y + 0 + bobY), 10, 3);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 5, Math.round(y + 0 + bobY), 5, 2);
        if (drawDir === FB.DIRS.LEFT) {
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 11, Math.round(y + 1 + bobY + capBounce), 4, 3);
          ctx.fillRect(x + 13, Math.round(y + 3 + bobY + capBounce), 2, 2);
        } else if (drawDir === FB.DIRS.RIGHT) {
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 1, Math.round(y + 1 + bobY + capBounce), 4, 3);
          ctx.fillRect(x + 1, Math.round(y + 3 + bobY + capBounce), 2, 2);
        } else {
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 11, Math.round(y + 2 + bobY + capBounce), 3, 3);
        }
        // Hair bangs & sideburns
        ctx.fillStyle = p.hair;
        ctx.fillRect(x + 4, Math.round(y + 3 + bobY), 8, 2);
        ctx.fillRect(x + 3, Math.round(y + 4 + bobY), 1, 2);
        ctx.fillRect(x + 12, Math.round(y + 4 + bobY), 1, 2);
        // Eyes (subtle blink every ~3.5 seconds when idle!)
        const blinking = !hero.moving && hero.swordTimer <= 0 && Math.floor(time * 8 + hero.index * 3) % 28 === 0;
        ctx.fillStyle = '#1a1a2e';
        const eyeH = blinking ? 1 : 2;
        if (drawDir === FB.DIRS.DOWN) {
          ctx.fillRect(x + 5, Math.round(y + 5 + bobY), 1, eyeH);
          ctx.fillRect(x + 10, Math.round(y + 5 + bobY), 1, eyeH);
        } else if (drawDir === FB.DIRS.LEFT) {
          ctx.fillRect(x + 5, Math.round(y + 5 + bobY), 1, eyeH);
        } else if (drawDir === FB.DIRS.RIGHT) {
          ctx.fillRect(x + 10, Math.round(y + 5 + bobY), 1, eyeH);
        }
      }

      // Ornate Hylian Shield / Mirror Shield on off-hand
      if (hero.celebrateTimer <= 0 && hero.spinTimer <= 0 && !hero.carrying) {
        const isMirror = !!hero.mirrorShield;
        const shieldColor = isMirror ? '#fde047' : '#e5be53';
        const shieldInner = isMirror ? '#dc2626' : p.tunicDark;
        const sheen = isMirror && Math.floor(time * 6 + hero.index) % 4 === 0 ? '#ffffff' : '#fef08a';
        if (drawDir === FB.DIRS.DOWN) {
          ctx.fillStyle = shieldColor;
          ctx.fillRect(x + 11, Math.round(y + 8 + bobY), 4, 5);
          ctx.fillStyle = shieldInner;
          ctx.fillRect(x + 12, Math.round(y + 9 + bobY), 2, 3);
          ctx.fillStyle = sheen;
          ctx.fillRect(x + 12, Math.round(y + 9 + bobY), 1, 2);
        } else if (drawDir === FB.DIRS.LEFT) {
          ctx.fillStyle = shieldColor;
          ctx.fillRect(x + 2, Math.round(y + 8 + bobY), 3, 5);
          ctx.fillStyle = shieldInner;
          ctx.fillRect(x + 2, Math.round(y + 9 + bobY), 2, 3);
        } else if (drawDir === FB.DIRS.RIGHT) {
          ctx.fillStyle = shieldColor;
          ctx.fillRect(x + 11, Math.round(y + 8 + bobY), 3, 5);
          ctx.fillStyle = shieldInner;
          ctx.fillRect(x + 12, Math.round(y + 9 + bobY), 2, 3);
        }
      }

      // Render Overhead Carried Object (Pot, Bomb, Stunned Enemy!)
      if (hero.carrying) {
        const cy = Math.round(y - 7 + bobY);
        if (hero.carrying.kind === 'pot') {
          ctx.fillStyle = '#9e6238';
          ctx.fillRect(x + 4, cy, 8, 8);
          ctx.fillStyle = '#b57445';
          ctx.fillRect(x + 3, cy + 2, 10, 5);
          ctx.fillStyle = '#d49461';
          ctx.fillRect(x + 5, cy - 1, 6, 2);
        } else if (hero.carrying.kind === 'bomb') {
          const b = hero.carrying.ref;
          const urgent = b && b.life < 0.45 && Math.floor(time * 22) % 2 === 0;
          ctx.fillStyle = urgent ? '#ef4444' : '#312e81';
          ctx.beginPath();
          ctx.arc(hero.x, cy + 4, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.fillRect(hero.x, cy - 3, 2, 2);
        }
      }

      // Item Use Visual Pose (Drawn Bow / Glowing Ember Rod)
      if (hero.itemAnimTimer > 0 && hero.swordTimer <= 0 && hero.spinTimer <= 0) {
        const ix = hero.x + dv.x * 8;
        const iy = hero.y + dv.y * 8;
        if (hero.lastItemUsed === FB.ITEMS.BOW) {
          const ang = Math.atan2(dv.y, dv.x);
          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate(ang);
          ctx.strokeStyle = '#d4a359';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-2, 0, 6, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-1, -5);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-1, 5);
          ctx.stroke();
          ctx.restore();
        } else if (hero.lastItemUsed === FB.ITEMS.FIREROD) {
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hero.x + dv.x * 3, hero.y + dv.y * 3);
          ctx.lineTo(ix + dv.x * 4, iy + dv.y * 4);
          ctx.stroke();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ix + dv.x * 5, iy + dv.y * 5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Iconic ALttP Overhead Item-Get Celebration Beam!
      if (hero.celebrateTimer > 0) {
        const glow = Math.sin(time * 14) * 0.15 + 0.35;
        ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
        ctx.beginPath();
        ctx.arc(hero.x, y - 4, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hero.celebrateColor || '#fde047';
        ctx.fillRect(hero.x - 3, y - 7, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hero.x - 1, y - 6, 2, 2);
      }

      // Lush Layered Sword Slash & Whirlwind Spin Attack!
      if (hero.spinTimer > 0) {
        const prog = 1 - hero.spinTimer / FB.CONFIG.SPIN_DURATION;
        const angle = prog * Math.PI * 2.6;
        // Outer tunic-tinted whirlwind trail
        ctx.strokeStyle = p.tunicLight;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 19, angle - 2.2, angle);
        ctx.stroke();
        // Inner golden gleam arc
        ctx.globalAlpha = 0.92;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 17, angle - 1.5, angle);
        ctx.stroke();
        // Gleaming blade & tip flare
        const bx = hero.x + Math.cos(angle) * 21;
        const by = hero.y + Math.sin(angle) * 21;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hero.x + Math.cos(angle) * 4, hero.y + Math.sin(angle) * 4);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(bx - 2, by - 2, 4, 4);
      } else if (hero.swordTimer > 0) {
        const prog = Math.max(0, Math.min(1, 1 - hero.swordTimer / FB.CONFIG.SWORD_DURATION));
        let baseAngle = Math.PI / 2;
        if (hero.dir === FB.DIRS.UP) baseAngle = -Math.PI / 2;
        else if (hero.dir === FB.DIRS.LEFT) baseAngle = Math.PI;
        else if (hero.dir === FB.DIRS.RIGHT) baseAngle = 0;

        const ox = hero.x + lungeX;
        const oy = hero.y + lungeY;
        const step = hero.comboStep || 0;

        if (step === 2) {
          // ======================================================
          // COMBO HIT 3: HEROIC PIERCING THRUST FINISHER!
          // ======================================================
          const thrustCurve = prog < 0.35 ? prog / 0.35 : 1 - (prog - 0.35) / 0.65 * 0.45;
          const reach = 11 + thrustCurve * 13; // Up to 24px gleaming thrust!
          const bx = ox + Math.cos(baseAngle) * reach;
          const by = oy + Math.sin(baseAngle) * reach;
          const perpX = -Math.sin(baseAngle);
          const perpY = Math.cos(baseAngle);

          // Twin V-wake golden-white shockwave energy cones
          ctx.save();
          ctx.globalAlpha = Math.max(0.15, 1 - prog * 0.85);
          ctx.strokeStyle = p.tunicLight;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(ox + Math.cos(baseAngle) * 7 + perpX * 8, oy + Math.sin(baseAngle) * 7 + perpY * 8);
          ctx.moveTo(bx, by);
          ctx.lineTo(ox + Math.cos(baseAngle) * 7 - perpX * 8, oy + Math.sin(baseAngle) * 7 - perpY * 8);
          ctx.stroke();

          // Inner bright golden energy lance aura
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(baseAngle) * 5, oy + Math.sin(baseAngle) * 5);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.restore();

          // Gleaming steel core + diamond star burst at tip
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(baseAngle) * 4, oy + Math.sin(baseAngle) * 4);
          ctx.lineTo(bx, by);
          ctx.stroke();

          // Crossguard
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(baseAngle) * 6 + perpX * 3.5, oy + Math.sin(baseAngle) * 6 + perpY * 3.5);
          ctx.lineTo(ox + Math.cos(baseAngle) * 6 - perpX * 3.5, oy + Math.sin(baseAngle) * 6 - perpY * 3.5);
          ctx.stroke();

          // Tip star flare
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(Math.round(bx) - 3, Math.round(by) - 1, 7, 2);
          ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 3, 2, 7);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 3, 3);
        } else {
          // ======================================================
          // COMBO HIT 1 (Forehand) & HIT 2 (Backhand Reverse Cross-Cut)
          // ======================================================
          const reverse = step === 1;
          const eased = 1 - Math.pow(1 - prog, 3); // Ultra-snappy ease-out!
          const halfArc = 1.25;
          const startA = reverse ? baseAngle + halfArc : baseAngle - halfArc;
          const sweep = (reverse ? -1 : 1) * eased * (halfArc * 2);
          const a = startA + sweep;

          // Determine arc bounds for ctx.arc (always draw along sweep direction)
          const trailLen = 1.55;
          const trailStart = reverse ? Math.min(startA, a + trailLen) : Math.max(startA, a - trailLen);
          const innerTrailStart = reverse ? Math.min(startA, a + 1.05) : Math.max(startA, a - 1.05);

          ctx.save();
          // Band 1: Wide outer crescent smear (tunic highlight for Hit 1, cyan-silver for Hit 2)
          ctx.globalAlpha = Math.max(0.12, (1 - prog * 0.72) * 0.58);
          ctx.strokeStyle = reverse ? '#67e8f9' : p.tunicLight;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(ox, oy, 15.5, trailStart, a, reverse);
          ctx.stroke();

          // Band 2: Golden-warm energy ribbon
          ctx.globalAlpha = Math.max(0.2, (1 - prog * 0.6) * 0.8);
          ctx.strokeStyle = reverse ? '#bae6fd' : '#fde047';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(ox, oy, 17, innerTrailStart, a, reverse);
          ctx.stroke();

          // Band 3: Pure white razor leading edge
          ctx.globalAlpha = Math.max(0.25, 1 - prog * 0.55);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(ox, oy, 18.5, reverse ? Math.min(startA, a + 0.65) : Math.max(startA, a - 0.65), a, reverse);
          ctx.stroke();
          ctx.restore();

          // Tapered Steel Blade + Bevel + Crossguard
          const bx = ox + Math.cos(a) * 18.5;
          const by = oy + Math.sin(a) * 18.5;
          const perpX = -Math.sin(a);
          const perpY = Math.cos(a);

          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 4, oy + Math.sin(a) * 4);
          ctx.lineTo(bx, by);
          ctx.stroke();

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 5, oy + Math.sin(a) * 5);
          ctx.lineTo(ox + Math.cos(a) * 16, oy + Math.sin(a) * 16);
          ctx.stroke();

          // Golden Crossguard bar
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 5.5 + perpX * 3, oy + Math.sin(a) * 5.5 + perpY * 3);
          ctx.lineTo(ox + Math.cos(a) * 5.5 - perpX * 3, oy + Math.sin(a) * 5.5 - perpY * 3);
          ctx.stroke();

          // Tip gleam spark at peak velocity
          if (prog < 0.65) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 3, 3);
          }
        }
      }

      // Small Player tag indicator above head in multiplayer
      if (hero.showTag) {
        ctx.fillStyle = 'rgba(10, 14, 24, 0.76)';
        ctx.fillRect(hero.x - 6, y - 9, 12, 6);
        ctx.fillStyle = hero.isClone ? '#67e8f9' : p.uiColor;
        ctx.font = 'bold 5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hero.isClone ? 'SP' : `P${hero.index + 1}`, hero.x, y - 4.5);
      }

      ctx.restore();
    }

    drawEnemy(ctx, e, time) {
      const x = Math.round(e.x - e.w / 2);
      const y = Math.round(e.y - e.h / 2);
      const flash = e.hurtTimer > 0 && Math.floor(time * 26) % 2 === 0;
      const step4 = Math.floor(e.walkPhase || time * 7) % 4;
      const bob = step4 === 1 || step4 === 3 ? -1 : 0;

      ctx.save();

      // Ground shadow (offset slightly lower for flying Keese/Boss)
      const shadowY = e.flying ? y + e.h + 1 : y + e.h - 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.fillRect(x + 2, shadowY, e.w - 4, 3);

      if (e.stunTimer > 0) {
        ctx.translate(Math.sin(time * 42) * 1.4, 0);
      }

      switch (e.type) {
        case 'octorok': {
          // Squash & stretch scuttle + cheek-puff telegraph before firing!
          const puff = e.shootTimer < 0.35 ? 1 : 0;
          const sx = step4 % 2 === 1 ? 1 : 0;
          const sy = step4 % 2 === 1 ? -1 : 0;
          ctx.fillStyle = flash ? '#ffffff' : '#d9483b';
          ctx.fillRect(x + 1 - puff, y + 2 + sy, 14 + puff * 2, 10 - sy);
          ctx.fillStyle = flash ? '#fff' : '#f27263';
          ctx.fillRect(x + 3, y + 3 + sy, 10, 4);
          // 4 wiggling tentacles
          ctx.fillStyle = flash ? '#fff' : '#a82c22';
          ctx.fillRect(x + 1, y + 11 + (step4 === 0 ? 1 : 0), 3, 3);
          ctx.fillRect(x + 5, y + 11 + (step4 === 2 ? 1 : 0), 3, 3);
          ctx.fillRect(x + 8, y + 11 + (step4 === 1 ? 1 : 0), 3, 3);
          ctx.fillRect(x + 12, y + 11 + (step4 === 3 ? 1 : 0), 3, 3);
          // Expressive eyes & puffing snout
          ctx.fillStyle = '#fff';
          ctx.fillRect(x + 4, y + 5 + sy, 2, 2);
          ctx.fillRect(x + 10, y + 5 + sy, 2, 2);
          ctx.fillStyle = '#111';
          ctx.fillRect(x + 5, y + 6 + sy, 1, 1);
          ctx.fillRect(x + 10, y + 6 + sy, 1, 1);
          ctx.fillStyle = puff ? '#fef08a' : '#facc15';
          ctx.fillRect(x + 6 - puff, y + 9 + sx * 0.5, 4 + puff * 2, 3);
          break;
        }

        case 'soldier':
        case 'red_soldier': {
          const isRed = e.type === 'red_soldier';
          const armor = flash ? '#ffffff' : isRed ? '#c93434' : '#357a4b';
          const helm = flash ? '#ffffff' : isRed ? '#f05454' : '#4fa66a';
          const plume = isRed ? '#fde047' : '#a7f3d0';
          const footL = step4 === 1 ? -1 : step4 === 3 ? 1 : 0;
          const footR = -footL;
          // Marching boots
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 4, y + 12 + footL, 3, 2);
          ctx.fillRect(x + 9, y + 12 + footR, 3, 2);
          // Body armor + pauldrons
          ctx.fillStyle = armor;
          ctx.fillRect(x + 3, y + 6 + bob, 10, 7);
          ctx.fillStyle = helm;
          ctx.fillRect(x + 2, y + 6 + bob, 2, 4);
          ctx.fillRect(x + 12, y + 6 + bob, 2, 4);
          // Helmet + bobbing plume crest
          ctx.fillStyle = plume;
          ctx.fillRect(x + 6 + (step4 % 2), y - 1 + bob, 4, 2);
          ctx.fillStyle = helm;
          ctx.fillRect(x + 3, y + 1 + bob, 10, 6);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 4, y + 4 + bob, 8, 2);
          // Glowing visor eyes
          ctx.fillStyle = '#fde047';
          ctx.fillRect(x + 5, y + 4 + bob, 2, 1);
          ctx.fillRect(x + 9, y + 4 + bob, 2, 1);
          // Animated thrusting spear with parry telegraph & active lunge!
          const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
          const telegraph = e.telegraphTimer > 0;
          const lunging = e.lungeTimer > 0;
          const thrust = telegraph
            ? 8
            : lunging
              ? 18
              : Math.sin(time * 9 + e.x) * 2 + 12;
          ctx.strokeStyle = '#8b5a2b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + bob);
          ctx.lineTo(e.x + dv.x * (thrust - 3), e.y + bob + dv.y * (thrust - 3));
          ctx.stroke();
          ctx.strokeStyle = telegraph ? '#fde047' : lunging ? '#ffffff' : '#e2e8f0';
          ctx.lineWidth = lunging ? 2.5 : 2;
          ctx.beginPath();
          ctx.moveTo(e.x + dv.x * (thrust - 4), e.y + bob + dv.y * (thrust - 4));
          ctx.lineTo(e.x + dv.x * (thrust + 2), e.y + bob + dv.y * (thrust + 2));
          ctx.stroke();
          if (telegraph) {
            const tx = Math.round(e.x + dv.x * (thrust + 2));
            const ty = Math.round(e.y + bob + dv.y * (thrust + 2));
            ctx.fillStyle = Math.floor(time * 24) % 2 === 0 ? '#ffffff' : '#fde047';
            ctx.fillRect(tx - 2, ty, 5, 1);
            ctx.fillRect(tx, ty - 2, 1, 5);
          } else if (lunging) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(e.x + dv.x * 6, e.y + bob + dv.y * 6);
            ctx.lineTo(e.x + dv.x * (thrust + 4), e.y + bob + dv.y * (thrust + 4));
            ctx.stroke();
          }
          break;
        }

        case 'keese': {
          // Smooth 4-stage wing-flap cycle + vertical flight swoop
          const flap = Math.floor(time * 14 + e.x) % 4;
          const flyY = Math.sin(time * 7 + e.y) * 2.5 - 2;
          const wingY = flap === 0 ? -3 : flap === 1 ? -1 : flap === 2 ? 2 : 0;
          const wingH = flap === 2 ? 5 : 4;
          ctx.fillStyle = flash ? '#fff' : '#312e81';
          ctx.fillRect(x + 5, Math.round(y + 4 + flyY), 6, 6);
          // Bat ears
          ctx.fillRect(x + 5, Math.round(y + 2 + flyY), 2, 2);
          ctx.fillRect(x + 9, Math.round(y + 2 + flyY), 2, 2);
          // Flapping wings
          ctx.fillStyle = flash ? '#fff' : '#4f46e5';
          ctx.fillRect(x - 1, Math.round(y + 4 + flyY + wingY), 6, wingH);
          ctx.fillRect(x + 11, Math.round(y + 4 + flyY + wingY), 6, wingH);
          ctx.fillStyle = '#3730a3';
          ctx.fillRect(x, Math.round(y + 6 + flyY + wingY), 4, 2);
          ctx.fillRect(x + 12, Math.round(y + 6 + flyY + wingY), 4, 2);
          // Glowing eyes
          ctx.fillStyle = '#fde047';
          ctx.fillRect(x + 6, Math.round(y + 6 + flyY), 1, 1);
          ctx.fillRect(x + 9, Math.round(y + 6 + flyY), 1, 1);
          break;
        }

        case 'stalfos': {
          const rattle = step4 === 1 ? -1 : step4 === 3 ? 1 : 0;
          const telegraph = e.telegraphTimer > 0;
          const lunging = e.lungeTimer > 0;
          const windup = telegraph ? -5 : e.shootTimer < 0.35 ? -3 : 0;
          // Rattling bone legs
          ctx.fillStyle = flash ? '#fff' : '#cbd5e1';
          ctx.fillRect(x + 5, y + 12 + rattle, 2, 3);
          ctx.fillRect(x + 9, y + 12 - rattle, 2, 3);
          // Skull with bobbing jaw
          ctx.fillStyle = flash ? '#ffffff' : '#f1f5f9';
          ctx.fillRect(x + 4, y + 1 + bob, 8, 5);
          ctx.fillRect(x + 5, y + 5 + bob + (step4 % 2), 6, 2);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 5, y + 3 + bob, 2, 2);
          ctx.fillRect(x + 9, y + 3 + bob, 2, 2);
          // Ribcage
          ctx.fillStyle = flash ? '#fff' : '#cbd5e1';
          ctx.fillRect(x + 5, y + 7 + bob, 6, 5);
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 6, y + 8 + bob, 4, 1);
          ctx.fillRect(x + 6, y + 10 + bob, 4, 1);
          // Raised buckler & swinging blade/bone arm
          ctx.fillStyle = '#b45309';
          ctx.fillRect(x + 1, y + 6 + bob, 3, 6);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 2, y + 8 + bob, 1, 2);
          ctx.fillStyle = telegraph ? '#fde047' : '#f8fafc';
          ctx.fillRect(x + 12, y + 3 + bob + windup + (step4 % 2), 2, 8);
          if (telegraph) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 11, y + 2 + bob + windup, 4, 1);
            ctx.fillRect(x + 12, y + 1 + bob + windup, 2, 4);
          } else if (lunging) {
            const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
            const ba = Math.atan2(dv.y, dv.x);
            ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 13, ba - 0.9, ba + 0.9);
            ctx.stroke();
          }
          break;
        }

        case 'knight': {
          // Heavy Darknut / Armored Knight with flowing cape, parry telegraph & broadsword slash!
          const stompL = step4 === 1 ? -1 : 0;
          const stompR = step4 === 3 ? -1 : 0;
          const capeSway = Math.round(Math.sin(time * 7 + e.x));
          const telegraph = e.telegraphTimer > 0;
          const lunging = e.lungeTimer > 0;
          // Flowing crimson cape behind
          ctx.fillStyle = flash ? '#fff' : '#991b1b';
          ctx.fillRect(x + 2 + capeSway, y + 6 + bob, 14, 9);
          // Heavy greaves
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 3, y + 14 + stompL, 4, 3);
          ctx.fillRect(x + 11, y + 14 + stompR, 4, 3);
          // Plate armor & helmet
          ctx.fillStyle = flash ? '#ffffff' : '#475569';
          ctx.fillRect(x + 2, y + 3 + bob, 14, 12);
          ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
          ctx.fillRect(x + 3, y + 0 + bob, 12, 6);
          // Golden crown crest
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 6, y - 1 + bob, 6, 2);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 4, y + 4 + bob, 10, 2);
          // Glowing crimson eyes
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x + 6, y + 4 + bob, 2, 2);
          ctx.fillRect(x + 10, y + 4 + bob, 2, 2);
          // Golden Tower Shield + Broadsword
          ctx.fillStyle = '#eab308';
          ctx.fillRect(x + 0, y + 5 + bob, 5, 10);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 1, y + 6 + bob, 1, 7);
          const swordLift = telegraph ? -5 : (step4 % 2) * 2;
          ctx.fillStyle = telegraph ? '#fde047' : '#e2e8f0';
          ctx.fillRect(x + 15, y + 2 + bob + swordLift, 2, 11);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 14, y + 10 + bob + swordLift, 4, 2);
          if (telegraph) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 14, y + 1 + bob + swordLift, 5, 1);
            ctx.fillRect(x + 16, y - 1 + bob + swordLift, 1, 5);
          } else if (lunging) {
            const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
            const ba = Math.atan2(dv.y, dv.x);
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 16, ba - 1.0, ba + 1.0);
            ctx.stroke();
          }
          break;
        }

        case 'boss':
          this._drawBoss(ctx, e, time, flash);
          break;

        case 'frost_boss':
          this._drawFrostBoss(ctx, e, time, flash);
          break;
      }

      // Orbiting twin stun stars
      if (e.stunTimer > 0) {
        for (let i = 0; i < 2; i++) {
          const sa = time * 13 + i * Math.PI;
          const sx = e.x + Math.cos(sa) * 7;
          const sy = y - 3 + Math.sin(sa) * 2.5;
          ctx.fillStyle = i === 0 ? '#fde047' : '#ffffff';
          ctx.fillRect(sx - 1, sy - 1, 2, 2);
        }
      }

      ctx.restore();
    }

    _drawBoss(ctx, b, time, flash) {
      // Shadow Wraith Vaalor — Animated dark tendrils, arcane halo, expressive eye & Phase II lightning!
      const bob = Math.sin(time * 4.5) * 3.5;
      const cx = b.x;
      const cy = b.y + bob;
      const enraged = b.phase === 2;
      const telegraph = b.bossState === 'orbit' && b.stateTimer < 0.45;

      // Swirling arcane rune halo behind body
      ctx.save();
      ctx.strokeStyle = enraged ? 'rgba(244, 63, 94, 0.5)' : 'rgba(139, 92, 246, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 21 + Math.sin(time * 8) * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Rippling dark shadow cloak tendrils underneath
      ctx.fillStyle = enraged ? 'rgba(88, 28, 135, 0.72)' : 'rgba(20, 12, 45, 0.7)';
      for (let i = -2; i <= 2; i++) {
        const tx = cx + i * 5;
        const wave = Math.sin(time * 10 + i * 1.4) * 3;
        ctx.fillRect(tx - 2, cy + 8, 4, 9 + wave);
      }

      // Charge telegraph glow right before firing volley/dashing!
      if (telegraph) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.32)';
        ctx.beginPath();
        ctx.arc(cx, cy, 23 + Math.sin(time * 32) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main armored dark body
      ctx.fillStyle = flash ? '#ffffff' : enraged ? '#581c87' : '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      // Phase II crackling lightning arcs!
      if (enraged && Math.floor(time * 16) % 2 === 0) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;
        const a1 = time * 7;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * 13, cy + Math.sin(a1) * 13);
        ctx.lineTo(cx + Math.cos(a1 + 0.4) * 19, cy + Math.sin(a1 + 0.4) * 19);
        ctx.lineTo(cx + Math.cos(a1 + 0.8) * 15, cy + Math.sin(a1 + 0.8) * 15);
        ctx.stroke();
      }

      // Golden royal horns / crown spikes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 12, cy - 16, 4, 6);
      ctx.fillRect(cx + 8, cy - 16, 4, 6);
      ctx.fillRect(cx - 3, cy - 19, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 1, cy - 18, 2, 3);

      // Giant expressive sorcerer eye (blinks briefly & dilates on dash!)
      const blinking = Math.floor(time * 5) % 24 === 0 && b.bossState === 'orbit';
      const eyeH = blinking ? 2 : 8;
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(cx - 8, cy - eyeH / 2, 16, eyeH);
      if (!blinking) {
        const lookX = Math.cos(b.lookAngle || 0) * 3.2;
        const lookY = Math.sin(b.lookAngle || 0) * 1.5;
        ctx.fillStyle = telegraph ? '#facc15' : enraged ? '#ef4444' : '#7c3aed';
        ctx.fillRect(cx - 3 + lookX, cy - 3 + lookY, 6, 6);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 1 + lookX, cy - 1.5 + lookY, 2, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2 + lookX, cy - 2 + lookY, 1, 1);
      }

      // Animated mini-eyed orbiting dark shield orbs
      if (b.orbs) {
        for (const orb of b.orbs) {
          if (!orb.alive) continue;
          const ox = cx + Math.cos(orb.angle) * orb.radius;
          const oy = cy + Math.sin(orb.angle) * orb.radius;
          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.beginPath();
          ctx.arc(ox, oy, 8 + Math.sin(time * 12 + orb.angle) * 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(ox, oy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(ox - 1, oy - 1, 2, 2);
        }
      }
      ctx.restore();
    }

    _drawFrostBoss(ctx, b, time, flash) {
      // Frost Sovereign Glacior — Segmented Crystalline Cryo-Wyrm!
      const enraged = b.phase === 2;
      const telegraph = b.bossState === 'telegraph';
      const bob = Math.sin(time * 5.2) * 2.5;
      const cx = b.x;
      const cy = b.y + bob;

      ctx.save();

      // 1. Trailing Crystalline Body Segments (tail -> neck)
      if (b.segments && b.segments.length > 0) {
        for (let i = b.segments.length - 1; i >= 0; i--) {
          const seg = b.segments[i];
          const sr = seg.r || Math.max(5, 11 - i);
          const sy = seg.y + Math.sin(time * 6 + i * 0.9) * 1.5;

          // Subtle ground shadow under segment
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.arc(seg.x, sy + sr + 3, sr * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Glacial outer aura
          ctx.fillStyle = enraged ? 'rgba(56, 189, 248, 0.34)' : 'rgba(125, 211, 252, 0.22)';
          ctx.beginPath();
          ctx.arc(seg.x, sy, sr + 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Crystalline armor scale
          ctx.fillStyle = flash ? '#ffffff' : i % 2 === 0 ? '#0284c7' : '#0369a1';
          ctx.beginPath();
          ctx.arc(seg.x, sy, sr, 0, Math.PI * 2);
          ctx.fill();

          // Shimmering ice spine crest
          ctx.fillStyle = flash ? '#ffffff' : i === b.segments.length - 1 ? '#fde047' : '#bae6fd';
          ctx.fillRect(Math.round(seg.x - sr * 0.45), Math.round(sy - sr * 0.45), Math.max(3, Math.round(sr * 0.9)), 3);
        }
      }

      // 2. Phase II Blizzard Aura & Charge Telegraph Ring
      if (enraged) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + Math.sin(time * 10) * 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (telegraph) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy, 22 + Math.sin(time * 34) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Cryo-Wyrm Horned Head
      ctx.fillStyle = flash ? '#ffffff' : enraged ? '#0c4a6e' : '#075985';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      // Faceted crystalline brow plate
      ctx.fillStyle = flash ? '#ffffff' : '#38bdf8';
      ctx.fillRect(cx - 10, cy - 9, 20, 8);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - 6, cy - 8, 12, 3);

      // Jagged Frost Crown Horns
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(cx - 13, cy - 16, 4, 8);
      ctx.fillRect(cx + 9, cy - 16, 4, 8);
      ctx.fillRect(cx - 3, cy - 19, 6, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 12, cy - 15, 2, 4);
      ctx.fillRect(cx + 10, cy - 15, 2, 4);
      ctx.fillRect(cx - 1, cy - 18, 2, 5);

      // Crystalline Jaw Tusks
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(cx - 8, cy + 8, 3, 5);
      ctx.fillRect(cx + 5, cy + 8, 3, 5);

      // Fierce Tracking Eyes
      const lookX = Math.cos(b.lookAngle || 0) * 2.2;
      const lookY = Math.sin(b.lookAngle || 0) * 1.2;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 8, cy - 2, 6, 5);
      ctx.fillRect(cx + 2, cy - 2, 6, 5);
      ctx.fillStyle = telegraph ? '#fde047' : enraged ? '#f43f5e' : '#38bdf8';
      ctx.fillRect(cx - 6 + lookX, cy - 1 + lookY, 3, 3);
      ctx.fillRect(cx + 4 + lookX, cy - 1 + lookY, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6 + lookX, cy - 1 + lookY, 1, 1);
      ctx.fillRect(cx + 4 + lookX, cy - 1 + lookY, 1, 1);

      ctx.restore();
    }

    drawPickup(ctx, item, time) {
      const bob = Math.sin(time * 6 + item.x) * 1.8;
      const x = Math.round(item.x);
      const y = Math.round(item.y + bob);

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(x - 3, item.y + 4, 6, 2);

      switch (item.kind) {
        case 'rupee_green':
        case 'rupee_blue':
        case 'rupee_red':
        case 'rupee_purple': {
          const colors = {
            rupee_green: ['#22c55e', '#86efac', '#15803d'],
            rupee_blue: ['#3b82f6', '#93c5fd', '#1d4ed8'],
            rupee_red: ['#ef4444', '#fca5a5', '#b91c1c'],
            rupee_purple: ['#a855f7', '#e9d5ff', '#7e22ce'],
          }[item.kind];
          // Subtle faceted rotation width pulse
          const wScale = 0.75 + Math.abs(Math.cos(time * 4 + item.x)) * 0.25;
          const rw = Math.max(2, Math.round(4 * wScale));
          ctx.fillStyle = colors[0];
          ctx.beginPath();
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x + rw, y - 1);
          ctx.lineTo(x + rw, y + 3);
          ctx.lineTo(x, y + 6);
          ctx.lineTo(x - rw, y + 3);
          ctx.lineTo(x - rw, y - 1);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = colors[1];
          ctx.fillRect(x - 1, y - 3, 2, 5);
          // Periodic diamond glint
          if (Math.floor(time * 6 + item.x) % 7 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 1, y - 4, 2, 2);
          }
          break;
        }
        case 'heart': {
          const beat = Math.sin(time * 10 + item.x) > 0.55 ? 1 : 0;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 4 - beat * 0.5, y - 2, 3 + beat * 0.5, 3);
          ctx.fillRect(x + 1, y - 2, 3 + beat * 0.5, 3);
          ctx.fillRect(x - 3, y, 6, 3 + beat * 0.5);
          ctx.fillRect(x - 1, y + 3, 2, 2);
          ctx.fillStyle = '#fecaca';
          ctx.fillRect(x - 3, y - 1, 1, 1);
          break;
        }

        case 'heart_container': {
          const pulse = Math.sin(time * 6) * 0.15 + 0.3;
          ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 6, y - 4, 12, 9);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 5, y - 3, 4, 4);
          ctx.fillRect(x + 1, y - 3, 4, 4);
          ctx.fillRect(x - 4, y, 8, 4);
          ctx.fillRect(x - 2, y + 4, 4, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 4, y - 2, 2, 1);
          break;
        }

        case 'fairy': {
          const wing = Math.sin(time * 28) * 2;
          const hoverX = Math.sin(time * 4 + item.y) * 2;
          const fx = Math.round(x + hoverX);
          ctx.fillStyle = 'rgba(244, 114, 182, 0.28)';
          ctx.beginPath();
          ctx.arc(fx, y, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.fillRect(fx - 6, Math.round(y - 2 - wing), 4, 3);
          ctx.fillRect(fx + 2, Math.round(y - 2 - wing), 4, 3);
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(fx, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx - 1, y - 1, 2, 2);
          break;
        }

        case 'key': {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 2, y - 5, 4, 4);
          ctx.fillRect(x - 1, y - 1, 2, 6);
          ctx.fillRect(x + 1, y + 2, 2, 1);
          ctx.fillRect(x + 1, y + 4, 2, 1);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(x - 1, y - 4, 2, 2);
          if (Math.floor(time * 6) % 4 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 2, y - 5, 1, 2);
          }
          break;
        }

        case 'item_pedestal': {
          const meta = FB.ITEM_META[item.itemId] || { color: '#facc15' };
          // Rotating radiant pedestal halo
          const halo = 7 + Math.sin(time * 5) * 1.5;
          ctx.fillStyle = 'rgba(253, 224, 71, 0.24)';
          ctx.beginPath();
          ctx.arc(x, y, halo, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 6, time * 2, time * 2 + Math.PI * 1.3);
          ctx.stroke();

          // Distinct pixel-art mini-item icon floating above pedestal!
          if (item.itemId === FB.ITEMS.BOOMERANG) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(x - 4, y - 3, 7, 2);
            ctx.fillRect(x - 4, y - 3, 2, 7);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(x - 4, y - 3, 2, 2);
          } else if (item.itemId === FB.ITEMS.BOMB) {
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.arc(x, y + 1, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(x - 1, y - 4, 2, 2);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(x, y - 5, 2, 2);
          } else if (item.itemId === FB.ITEMS.BOW) {
            ctx.strokeStyle = '#d4a359';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x - 1, y, 4.5, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x, y + 4);
            ctx.stroke();
          } else if (item.itemId === FB.ITEMS.FIREROD) {
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x - 1, y - 2, 2, 7);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x, y - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 1, y - 4, 2, 2);
          } else if (item.itemId === FB.ITEMS.HOOKSHOT) {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x - 1, y - 2, 2, 6);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(x - 4, y - 3, 8, 2);
            ctx.fillRect(x - 4, y - 5, 2, 3);
            ctx.fillRect(x + 2, y - 5, 2, 3);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(x - 1, y - 4, 2, 2);
          } else if (item.itemId === FB.ITEMS.MIRROR) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(x - 3, y - 5, 6, 8);
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(x - 2, y - 4, 4, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 1, y - 3, 2, 3);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(x - 1, y + 3, 2, 3);
          } else {
            ctx.fillStyle = meta.color;
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }
      ctx.restore();
    }

    drawShopItem(ctx, col, row, catalogItem, time) {
      const cx = col * TS + 8;
      const cy = row * TS + 6 + Math.sin(time * 5 + col) * 1.4;

      ctx.save();
      // Glow halo
      ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      if (catalogItem.id === 'heal') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 4, cy - 2, 3, 3);
        ctx.fillRect(cx + 1, cy - 2, 3, 3);
        ctx.fillRect(cx - 3, cy, 6, 3);
        ctx.fillRect(cx - 1, cy + 3, 2, 2);
      } else if (catalogItem.id === 'potion') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 2, cy - 5, 4, 2);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
        ctx.fillStyle = '#fda4af';
        ctx.fillRect(cx - 2, cy - 2, 2, 3);
      } else if (catalogItem.id === 'mirror_shield') {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 4, cy - 4, 8, 9);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cx - 3, cy - 3, 6, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2, cy - 2, 2, 4);
      } else if (catalogItem.id === 'tempered_sword') {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy + 4);
        ctx.lineTo(cx + 4, cy - 4);
        ctx.stroke();
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(cx - 4, cy + 1, 4, 2);
      }

      // Crisp Price Tag below pedestal
      const tagY = row * TS + 18;
      ctx.fillStyle = 'rgba(9, 14, 24, 0.85)';
      ctx.fillRect(cx - 10, tagY - 5, 20, 7);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 5.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${catalogItem.cost}R`, cx, tagY + 0.5);
      ctx.restore();
    }
  }

  FB.sprites = new SpriteRenderer();
})(window);
