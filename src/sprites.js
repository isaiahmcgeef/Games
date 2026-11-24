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

      // Dynamic animated accents for water, torches, fairy pool, altar
      if (id === T.WATER) {
        const wave = Math.floor(time * 2.5 + dx * 0.05) % 4;
        ctx.fillStyle = 'rgba(210, 240, 255, 0.35)';
        ctx.fillRect(dx + 2 + wave, dy + 4, 4, 1);
        ctx.fillRect(dx + 10 - wave, dy + 11, 4, 1);
      } else if (id === T.TORCH_LIT) {
        const flick = Math.floor(time * 11 + dx + dy) % 2;
        ctx.fillStyle = flick ? '#facc15' : '#fb923c';
        ctx.fillRect(dx + 6 + flick, dy + 1, 3, 3);
        ctx.fillStyle = 'rgba(255, 180, 60, 0.16)';
        ctx.beginPath();
        ctx.arc(dx + 8, dy + 6, 15 + flick * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === T.FAIRY_POOL) {
        const pulse = Math.sin(time * 4 + dx) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + pulse * 0.4})`;
        ctx.fillRect(dx + 4, dy + 4, 2, 2);
        ctx.fillRect(dx + 10, dy + 9, 2, 2);
      } else if (id === T.TRIFORCE_ALTAR) {
        const glow = Math.sin(time * 5) * 0.12 + 0.22;
        ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
        ctx.beginPath();
        ctx.arc(dx + 8, dy + 8, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawHero(ctx, hero, time) {
      const x = Math.round(hero.x - 8);
      const y = Math.round(hero.y - 10);
      const p = hero.profile;

      ctx.save();
      if (hero.isClone) {
        ctx.globalAlpha = 0.72 + Math.sin(time * 10) * 0.1;
      } else if (hero.invuln > 0 && Math.floor(time * 22) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.fillRect(x + 3, y + 14, 10, 3);

      // Downed / Ghost state in Multiplayer (can be revived by teammates!)
      if (hero.downed) {
        const bob = Math.sin(time * 6) * 2;
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 4, y + 3 + bob, 8, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5, y + 5 + bob, 2, 2);
        ctx.fillRect(x + 9, y + 5 + bob, 2, 2);
        // Revive ring progress
        if (hero.reviveProgress > 0) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hero.x, hero.y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hero.reviveProgress);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      const walk = hero.moving ? Math.floor(time * 10) % 2 : 0;
      const bobY = walk ? -1 : 0;

      // Spin-charge golden aura
      if (hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME) {
        const pulse = Math.floor(time * 16) % 2;
        ctx.strokeStyle = pulse ? '#fde047' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Boots
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(x + 4, y + 13 + (walk ? 0 : 1), 3, 2);
      ctx.fillRect(x + 9, y + 13 + (walk ? 1 : 0), 3, 2);

      // Tunic body
      ctx.fillStyle = p.tunicDark;
      ctx.fillRect(x + 3, y + 7 + bobY, 10, 7);
      ctx.fillStyle = p.tunic;
      ctx.fillRect(x + 4, y + 7 + bobY, 8, 6);
      // Belt
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(x + 4, y + 11 + bobY, 8, 1);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 7, y + 11 + bobY, 2, 1);

      // Head & Hair & Hero Cap
      ctx.fillStyle = p.skin;
      ctx.fillRect(x + 4, y + 2 + bobY, 8, 6);

      if (hero.dir === FB.DIRS.UP) {
        // Back of cap & hair
        ctx.fillStyle = p.hair;
        ctx.fillRect(x + 4, y + 5 + bobY, 8, 3);
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 3, y + 0 + bobY, 10, 5);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 5, y + 1 + bobY, 5, 2);
      } else {
        // Cap top + side tail
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 3, y + 0 + bobY, 10, 3);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 5, y + 0 + bobY, 5, 2);
        if (hero.dir === FB.DIRS.LEFT) {
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 11, y + 1 + bobY, 3, 3);
        } else if (hero.dir === FB.DIRS.RIGHT) {
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 2, y + 1 + bobY, 3, 3);
        } else {
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 11, y + 2 + bobY, 2, 3);
        }
        // Hair bangs
        ctx.fillStyle = p.hair;
        ctx.fillRect(x + 4, y + 3 + bobY, 8, 2);
        // Eyes
        ctx.fillStyle = '#1a1a2e';
        if (hero.dir === FB.DIRS.DOWN) {
          ctx.fillRect(x + 5, y + 5 + bobY, 1, 2);
          ctx.fillRect(x + 10, y + 5 + bobY, 1, 2);
        } else if (hero.dir === FB.DIRS.LEFT) {
          ctx.fillRect(x + 5, y + 5 + bobY, 1, 2);
        } else if (hero.dir === FB.DIRS.RIGHT) {
          ctx.fillRect(x + 10, y + 5 + bobY, 1, 2);
        }
      }

      // Shield on off-hand
      const shieldColor = '#d4af37';
      const shieldInner = p.tunicDark;
      if (hero.dir === FB.DIRS.DOWN) {
        ctx.fillStyle = shieldColor;
        ctx.fillRect(x + 11, y + 8 + bobY, 4, 5);
        ctx.fillStyle = shieldInner;
        ctx.fillRect(x + 12, y + 9 + bobY, 2, 3);
      } else if (hero.dir === FB.DIRS.LEFT) {
        ctx.fillStyle = shieldColor;
        ctx.fillRect(x + 2, y + 8 + bobY, 3, 5);
      } else if (hero.dir === FB.DIRS.RIGHT) {
        ctx.fillStyle = shieldColor;
        ctx.fillRect(x + 11, y + 8 + bobY, 3, 5);
      }

      // Sword slash or Spin Attack arc!
      if (hero.spinTimer > 0) {
        const prog = 1 - hero.spinTimer / FB.CONFIG.SPIN_DURATION;
        const angle = prog * Math.PI * 2.4;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 18, angle - 1.4, angle);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hero.x, hero.y);
        ctx.lineTo(hero.x + Math.cos(angle) * 20, hero.y + Math.sin(angle) * 20);
        ctx.stroke();
      } else if (hero.swordTimer > 0) {
        const prog = 1 - hero.swordTimer / FB.CONFIG.SWORD_DURATION;
        let baseAngle = Math.PI / 2;
        if (hero.dir === FB.DIRS.UP) baseAngle = -Math.PI / 2;
        else if (hero.dir === FB.DIRS.LEFT) baseAngle = Math.PI;
        else if (hero.dir === FB.DIRS.RIGHT) baseAngle = 0;

        const sweep = (prog - 0.5) * 1.9;
        const a = baseAngle + sweep;

        // Glowing slash arc
        ctx.strokeStyle = 'rgba(255, 250, 200, 0.72)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 15, baseAngle - 0.9, a);
        ctx.stroke();

        // Blade
        const bx = hero.x + Math.cos(a) * 16;
        const by = hero.y + Math.sin(a) * 16;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hero.x + Math.cos(a) * 4, hero.y + Math.sin(a) * 4);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // Gold hilt
        ctx.fillStyle = '#facc15';
        ctx.fillRect(hero.x + Math.cos(a) * 5 - 1.5, hero.y + Math.sin(a) * 5 - 1.5, 3, 3);
      }

      // Small Player tag indicator above head in multiplayer
      if (hero.showTag) {
        ctx.fillStyle = 'rgba(10, 14, 24, 0.72)';
        ctx.fillRect(hero.x - 6, y - 8, 12, 6);
        ctx.fillStyle = hero.isClone ? '#67e8f9' : p.uiColor;
        ctx.font = 'bold 5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hero.isClone ? 'SP' : `P${hero.index + 1}`, hero.x, y - 3.5);
      }

      ctx.restore();
    }

    drawEnemy(ctx, e, time) {
      const x = Math.round(e.x - e.w / 2);
      const y = Math.round(e.y - e.h / 2);
      const flash = e.hurtTimer > 0 && Math.floor(time * 25) % 2 === 0;
      const anim = Math.floor(time * 8) % 2;

      ctx.save();
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.fillRect(x + 2, y + e.h - 2, e.w - 4, 3);

      if (e.stunTimer > 0) {
        ctx.translate(Math.sin(time * 40) * 1.2, 0);
      }

      switch (e.type) {
        case 'octorok':
          ctx.fillStyle = flash ? '#ffffff' : '#d9483b';
          ctx.fillRect(x + 2, y + 2, 12, 10);
          ctx.fillStyle = flash ? '#fff' : '#f27263';
          ctx.fillRect(x + 4, y + 3, 8, 4);
          // Tentacles
          ctx.fillStyle = flash ? '#fff' : '#b83227';
          ctx.fillRect(x + 2, y + 11 + anim, 3, 3);
          ctx.fillRect(x + 11, y + 11 + (1 - anim), 3, 3);
          // Eyes & Snout
          ctx.fillStyle = '#fff';
          ctx.fillRect(x + 4, y + 5, 2, 2);
          ctx.fillRect(x + 10, y + 5, 2, 2);
          ctx.fillStyle = '#111';
          ctx.fillRect(x + 5, y + 6, 1, 1);
          ctx.fillRect(x + 10, y + 6, 1, 1);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 6, y + 9, 4, 3);
          break;

        case 'soldier':
        case 'red_soldier': {
          const isRed = e.type === 'red_soldier';
          const armor = flash ? '#ffffff' : isRed ? '#c93434' : '#357a4b';
          const helm = flash ? '#ffffff' : isRed ? '#f05454' : '#4fa66a';
          // Body armor
          ctx.fillStyle = armor;
          ctx.fillRect(x + 3, y + 6, 10, 8);
          // Helmet
          ctx.fillStyle = helm;
          ctx.fillRect(x + 3, y + 1, 10, 6);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 4, y + 4, 8, 2);
          // Glowing visor eyes
          ctx.fillStyle = '#fde047';
          ctx.fillRect(x + 5, y + 4, 2, 1);
          ctx.fillRect(x + 9, y + 4, 2, 1);
          // Spear pointing in facing direction
          const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + dv.x * 13, e.y + dv.y * 13);
          ctx.stroke();
          break;
        }

        case 'keese': {
          const wingY = anim ? -2 : 2;
          ctx.fillStyle = flash ? '#fff' : '#312e81';
          ctx.fillRect(x + 5, y + 4, 6, 6);
          ctx.fillStyle = flash ? '#fff' : '#4f46e5';
          ctx.fillRect(x, y + 4 + wingY, 5, 4);
          ctx.fillRect(x + 11, y + 4 + wingY, 5, 4);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 6, y + 6, 1, 1);
          ctx.fillRect(x + 9, y + 6, 1, 1);
          break;
        }

        case 'stalfos':
          ctx.fillStyle = flash ? '#ffffff' : '#e2e8f0';
          ctx.fillRect(x + 4, y + 1, 8, 6); // Skull
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 5, y + 3, 2, 2);
          ctx.fillRect(x + 9, y + 3, 2, 2);
          ctx.fillStyle = flash ? '#fff' : '#cbd5e1';
          ctx.fillRect(x + 5, y + 7, 6, 6); // Ribs
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 6, y + 9, 4, 1);
          ctx.fillRect(x + 6, y + 11, 4, 1);
          // Shield & Sword
          ctx.fillStyle = '#b45309';
          ctx.fillRect(x + 1, y + 7, 3, 5);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(x + 12, y + 4 + anim, 2, 7);
          break;

        case 'knight':
          // Heavy Darknut / Armored Knight
          ctx.fillStyle = flash ? '#ffffff' : '#475569';
          ctx.fillRect(x + 1, y + 2, 16, 14);
          ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
          ctx.fillRect(x + 3, y + 0, 12, 6);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 6, y + 0, 6, 2);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 4, y + 4, 10, 2);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x + 6, y + 4, 2, 2);
          ctx.fillRect(x + 10, y + 4, 2, 2);
          // Greatshield
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(x + 1, y + 6, 4, 8);
          break;

        case 'boss':
          this._drawBoss(ctx, e, time, flash);
          break;
      }

      // Stun stars
      if (e.stunTimer > 0) {
        ctx.fillStyle = '#fde047';
        const sx = e.x + Math.cos(time * 12) * 6;
        const sy = y - 3 + Math.sin(time * 12) * 2;
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }

      ctx.restore();
    }

    _drawBoss(ctx, b, time, flash) {
      // Shadow Wraith Vaalor — iconic Four Swords Vaati-inspired floating dark eye sorcerer!
      const bob = Math.sin(time * 4) * 3;
      const cx = b.x;
      const cy = b.y + bob;

      // Dark swirling cloak/aura
      ctx.fillStyle = 'rgba(20, 12, 40, 0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 20 + Math.sin(time * 8) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Main armored dark body
      ctx.fillStyle = flash ? '#ffffff' : b.phase === 2 ? '#581c87' : '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      // Golden royal horns / crown spikes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 12, cy - 16, 4, 6);
      ctx.fillRect(cx + 8, cy - 16, 4, 6);
      ctx.fillRect(cx - 3, cy - 18, 6, 5);

      // Giant central eye
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(cx - 8, cy - 4, 16, 8);
      ctx.fillStyle = b.phase === 2 ? '#ef4444' : '#7c3aed';
      const lookX = Math.cos(b.lookAngle || 0) * 3;
      const lookY = Math.sin(b.lookAngle || 0) * 1.5;
      ctx.fillRect(cx - 3 + lookX, cy - 3 + lookY, 6, 6);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 1 + lookX, cy - 1 + lookY, 2, 3);

      // Orbiting dark shield orbs
      if (b.orbs) {
        for (const orb of b.orbs) {
          if (!orb.alive) continue;
          const ox = cx + Math.cos(orb.angle) * orb.radius;
          const oy = cy + Math.sin(orb.angle) * orb.radius;
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(ox, oy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawPickup(ctx, item, time) {
      const bob = Math.sin(time * 6 + item.x) * 1.6;
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
            rupee_green: ['#22c55e', '#86efac'],
            rupee_blue: ['#3b82f6', '#93c5fd'],
            rupee_red: ['#ef4444', '#fca5a5'],
            rupee_purple: ['#a855f7', '#e9d5ff'],
          }[item.kind];
          ctx.fillStyle = colors[0];
          ctx.beginPath();
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x + 4, y - 1);
          ctx.lineTo(x + 4, y + 3);
          ctx.lineTo(x, y + 6);
          ctx.lineTo(x - 4, y + 3);
          ctx.lineTo(x - 4, y - 1);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = colors[1];
          ctx.fillRect(x - 1, y - 3, 2, 5);
          break;
        }
        case 'heart':
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 4, y - 2, 3, 3);
          ctx.fillRect(x + 1, y - 2, 3, 3);
          ctx.fillRect(x - 3, y, 6, 3);
          ctx.fillRect(x - 1, y + 3, 2, 2);
          ctx.fillStyle = '#fecaca';
          ctx.fillRect(x - 3, y - 1, 1, 1);
          break;

        case 'heart_container':
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 6, y - 4, 12, 9);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 5, y - 3, 4, 4);
          ctx.fillRect(x + 1, y - 3, 4, 4);
          ctx.fillRect(x - 4, y, 8, 4);
          ctx.fillRect(x - 2, y + 4, 4, 2);
          break;

        case 'fairy': {
          const wing = Math.floor(time * 18) % 2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(x - 6, y - 2 - wing, 4, 3);
          ctx.fillRect(x + 2, y - 2 - wing, 4, 3);
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 1, y - 1, 2, 2);
          break;
        }

        case 'key':
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 2, y - 5, 4, 4);
          ctx.fillRect(x - 1, y - 1, 2, 6);
          ctx.fillRect(x + 1, y + 2, 2, 1);
          ctx.fillRect(x + 1, y + 4, 2, 1);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(x - 1, y - 4, 2, 2);
          break;

        case 'item_pedestal': {
          const meta = FB.ITEM_META[item.itemId] || { color: '#facc15' };
          ctx.fillStyle = meta.color;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(meta.short[0], x, y + 2);
          break;
        }
      }
      ctx.restore();
    }
  }

  FB.sprites = new SpriteRenderer();
})(window);
