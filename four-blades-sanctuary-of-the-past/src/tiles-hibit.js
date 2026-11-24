/**
 * Hi-Bit 32x32 Pixel-Art Tile, Biome, Auto-Tiling & 2.5D Shadow Renderer.
 * Pre-bakes entire rooms onto a 640x416 offscreen canvas for locked 60 FPS
 * with 4-6 deterministic pixel variants per terrain, neighbor-aware edges,
 * dedicated Frost Spire / Dark World / Palace / Shop tilesets, and live animated accents.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const T = FB.TILES;
  const HT = 32; // Native Hi-Bit tile size (32x32 pixels)

  const SHADOW_CASTERS = new Set([
    T.TREE,
    T.DARK_TREE,
    T.STONE_WALL,
    T.CLIFF,
    T.DUNGEON_WALL,
    T.CRACKED_WALL,
    T.DOOR_LOCKED,
    T.DOOR_BOSS,
    T.DOOR_BARRED,
    T.STATUE,
    T.BLOCK_PUSH,
    T.CHEST_CLOSED,
    T.CHEST_OPEN,
    T.BIG_CHEST_CLOSED,
    T.BIG_CHEST_OPEN,
    T.SHOP_COUNTER,
    T.ROCK_CRACKED,
  ]);

  const WALKABLE_SHADOW_RECEIVERS = new Set([
    T.GRASS,
    T.GRASS_FLOWERS,
    T.PATH,
    T.DUNGEON_FLOOR,
    T.DUNGEON_CARPET,
    T.ICE_FLOOR,
    T.DARK_GRASS,
    T.DARK_PATH,
    T.SHOP_FLOOR,
    T.SHOP_EXIT,
    T.DOOR_OPEN,
    T.BRIDGE,
    T.SWITCH_FLOOR,
    T.SWITCH_FLOOR_ON,
    T.SPIKES,
    T.STAIRS_UP,
    T.PORTAL_OVERWORLD,
    T.TRIFORCE_ALTAR,
  ]);

  class HiBitTileRenderer {
    strSeed(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    hash(seed, col, row) {
      let h = (seed ^ Math.imul(col + 17, 374761393) ^ Math.imul(row + 31, 668265263)) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return (h ^ (h >>> 16)) >>> 0;
    }

    _px(ctx, ox, oy, x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, w, h);
    }

    _tileAt(grid, col, row) {
      if (row < 0 || row >= FB.ROOM_ROWS || col < 0 || col >= FB.ROOM_COLS) return null;
      return grid[row][col];
    }

    /**
     * Pre-bake the entire static 640x416 room (underlays, auto-tiled terrain,
     * biome walls/props, and 2.5D directional cast shadows) onto roomCtx.
     */
    bakeRoom(ctx, room) {
      if (!room || !room.grid) return;
      const grid = room.grid;
      const area = room.area || 'overworld';
      const seed = this.strSeed(room.id || area);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, FB.RENDER_W, FB.RENDER_H);

      // Pass 1: Draw all 32x32 tiles with neighbor awareness & deterministic variants
      for (let r = 0; r < FB.ROOM_ROWS; r++) {
        for (let c = 0; c < FB.ROOM_COLS; c++) {
          const id = grid[r][c];
          const h = this.hash(seed, c, r);
          this._drawTileHiBit(ctx, id, c * HT, r * HT, c, r, grid, area, h);
        }
      }

      // Pass 2: 2.5D Directional Cast Shadows onto adjacent walkable tiles (south & east)
      for (let r = 0; r < FB.ROOM_ROWS; r++) {
        for (let c = 0; c < FB.ROOM_COLS; c++) {
          const id = grid[r][c];
          if (!WALKABLE_SHADOW_RECEIVERS.has(id)) continue;
          const ox = c * HT;
          const oy = r * HT;

          const north = this._tileAt(grid, c, r - 1);
          const west = this._tileAt(grid, c - 1, r);
          const nw = this._tileAt(grid, c - 1, r - 1);

          const castN = north !== null && SHADOW_CASTERS.has(north);
          const castW = west !== null && SHADOW_CASTERS.has(west);
          const castNW = nw !== null && SHADOW_CASTERS.has(nw);

          if (castN) {
            ctx.fillStyle = 'rgba(7, 11, 22, 0.30)';
            ctx.fillRect(ox, oy, HT, 5);
            ctx.fillStyle = 'rgba(7, 11, 22, 0.14)';
            ctx.fillRect(ox, oy + 5, HT, 3);
          }
          if (castW) {
            ctx.fillStyle = 'rgba(7, 11, 22, 0.22)';
            ctx.fillRect(ox, oy + (castN ? 5 : 0), 4, HT - (castN ? 5 : 0));
            ctx.fillStyle = 'rgba(7, 11, 22, 0.10)';
            ctx.fillRect(ox + 4, oy + (castN ? 5 : 0), 2, HT - (castN ? 5 : 0));
          }
          if (!castN && !castW && castNW) {
            ctx.fillStyle = 'rgba(7, 11, 22, 0.18)';
            ctx.fillRect(ox, oy, 5, 5);
          }
        }
      }
    }

    /**
     * Draw biome-matched walkable floor beneath props (pots, bushes, chests, statues, etc.)
     */
    _drawBiomeFloor(ctx, ox, oy, area, h) {
      if (area === 'overworld') {
        this._drawGrass(ctx, ox, oy, h);
      } else if (area === 'darkworld') {
        this._drawDarkGrass(ctx, ox, oy, h);
      } else if (area === 'frost') {
        this._drawFrostFloor(ctx, ox, oy, h);
      } else if (area === 'shop') {
        this._drawShopFloor(ctx, ox, oy, h);
      } else {
        this._drawDungeonFloor(ctx, ox, oy, h);
      }
    }

    _drawGrass(ctx, ox, oy, h) {
      const px = (x, y, w, h2, col) => this._px(ctx, ox, oy, x, y, w, h2, col);
      const v = h % 6;
      // Rich hue-shifted ALttP/Minish Cap emerald grass base
      px(0, 0, 32, 32, '#449e40');
      // Subtle organic dappled light/shade blobs
      if (v === 0 || v === 3) {
        px(2, 4, 10, 6, '#4ca946');
        px(18, 16, 11, 8, '#3d913b');
      } else if (v === 1 || v === 4) {
        px(14, 3, 12, 7, '#4ca946');
        px(4, 20, 10, 7, '#3d913b');
      } else {
        px(6, 10, 14, 10, '#49a644');
      }

      // Detailed pixel grass tufts (3-pixel V-shaped blades with cool shadows & sunlit tips)
      const drawTuft = (tx, ty) => {
        px(tx, ty + 2, 5, 1, '#2b6e32');
        px(tx + 1, ty, 1, 2, '#6ed056');
        px(tx + 3, ty + 1, 1, 1, '#5bc24d');
        px(tx + 4, ty - 1, 1, 3, '#7de062');
      };

      drawTuft(3 + (h % 5), 5 + ((h >> 3) % 5));
      drawTuft(18 + ((h >> 5) % 6), 19 + ((h >> 8) % 6));

      if (v === 1) {
        // Tiny clover cluster
        px(8, 22, 2, 2, '#6ad054');
        px(10, 21, 2, 2, '#82e667');
        px(9, 23, 2, 2, '#327c36');
      } else if (v === 2) {
        // Warm mossy pebble pair
        px(22, 8, 4, 3, '#337a37');
        px(22, 7, 3, 2, '#8fa691');
        px(23, 7, 1, 1, '#b8ccb9');
        px(7, 25, 3, 2, '#7d9480');
      } else if (v === 4) {
        // Extra sunlit dew flecks & blade tuft
        drawTuft(11, 12);
        px(26, 6, 1, 1, '#a9f279');
        px(5, 27, 1, 1, '#a9f279');
      } else if (v === 5) {
        // Tiny yellow wildbud
        px(14, 23, 2, 2, '#2d7033');
        px(14, 22, 2, 1, '#fde047');
        px(24, 11, 2, 2, '#5cc44e');
      }
    }

    _drawDarkGrass(ctx, ox, oy, h) {
      const px = (x, y, w, h2, col) => this._px(ctx, ox, oy, x, y, w, h2, col);
      const v = h % 5;
      px(0, 0, 32, 32, '#413152');
      if (v % 2 === 0) {
        px(3, 4, 12, 8, '#4a385e');
        px(17, 18, 12, 9, '#372847');
      } else {
        px(15, 5, 11, 8, '#4a385e');
        px(5, 20, 10, 7, '#372847');
      }

      // Twisted twilight grass blades
      const drawBlade = (tx, ty) => {
        px(tx, ty + 2, 5, 1, '#261a33');
        px(tx + 1, ty, 1, 2, '#694e82');
        px(tx + 3, ty - 1, 1, 3, '#7e598c');
      };
      drawBlade(4 + (h % 6), 6 + ((h >> 3) % 5));
      drawBlade(19 + ((h >> 6) % 6), 21 + ((h >> 9) % 5));

      if (v === 1) {
        // Glowing twilight spore-bud
        px(10, 23, 3, 2, '#281936');
        px(11, 21, 2, 2, '#c084fc');
        px(11, 21, 1, 1, '#f3e8ff');
      } else if (v === 3) {
        // Cracked dark slate pebble
        px(21, 9, 4, 3, '#291d36');
        px(21, 8, 3, 2, '#6d5d7d');
        px(22, 8, 1, 1, '#9482a6');
      }
    }

    _drawDungeonFloor(ctx, ox, oy, h) {
      const px = (x, y, w, h2, col) => this._px(ctx, ox, oy, x, y, w, h2, col);
      const v = h % 6;
      // Rich Palace of the Four Seals sapphire-slate flagstones
      px(0, 0, 32, 32, '#344157');
      // 4 beveled sub-stones per 32x32 tile with staggered mortar
      const splitX = v % 2 === 0 ? 15 : 17;
      const splitY = v < 3 ? 15 : 17;
      // Outer light/dark bevels
      px(0, 0, 32, 1, '#4a5c7a');
      px(0, 0, 1, 32, '#4a5c7a');
      px(0, 31, 32, 1, '#212a3b');
      px(31, 0, 1, 32, '#212a3b');
      // Inner mortar cross
      px(splitX, 1, 2, 30, '#252f42');
      px(1, splitY, 30, 2, '#252f42');
      // Inner bevel highlights
      px(splitX + 2, 1, 1, splitY - 1, '#445570');
      px(1, splitY + 2, splitX - 1, 1, '#445570');
      px(splitX + 2, splitY + 2, 30 - splitX - 2, 1, '#445570');

      // Subtle per-stone shade variation
      px(2, 2, splitX - 3, splitY - 3, v === 1 ? '#3a4861' : '#36445c');
      px(splitX + 3, splitY + 3, 28 - splitX, 28 - splitY, v === 2 ? '#313d52' : '#39475e');

      if (v === 1 || v === 4) {
        // Hairline weathered crack
        px(6, 5, 3, 1, '#202838');
        px(8, 6, 2, 2, '#202838');
        px(9, 8, 2, 1, '#202838');
      } else if (v === 2) {
        // Corner moss tuft
        px(2, 26, 4, 3, '#2d5a47');
        px(3, 25, 2, 2, '#3f7d61');
      } else if (v === 5) {
        // Subtle ancient carved tile dimple
        px(21, 7, 4, 4, '#2d394d');
        px(22, 8, 2, 2, '#465773');
      }
    }

    _drawFrostFloor(ctx, ox, oy, h) {
      const px = (x, y, w, h2, col) => this._px(ctx, ox, oy, x, y, w, h2, col);
      const v = h % 6;
      // Dedicated Frost Spire glacial blue-silver stonework
      px(0, 0, 32, 32, '#2a4663');
      px(0, 0, 32, 1, '#5882ab');
      px(0, 0, 1, 32, '#4d769e');
      px(0, 31, 32, 1, '#192d42');
      px(31, 0, 1, 32, '#192d42');

      const splitX = v % 2 === 0 ? 15 : 16;
      const splitY = v < 3 ? 16 : 14;
      px(splitX, 1, 2, 30, '#1c324a');
      px(1, splitY, 30, 2, '#1c324a');
      px(splitX + 2, 1, 1, splitY - 1, '#466f96');
      px(1, splitY + 2, 30, 1, '#466f96');

      px(2, 2, splitX - 3, splitY - 3, v === 0 ? '#315273' : '#2d4b69');
      px(splitX + 3, splitY + 3, 28 - splitX, 28 - splitY, '#26405c');

      if (v === 1 || v === 4) {
        // Frost dust patch along stone seam
        px(4, 3, 6, 2, '#8bbfe3');
        px(5, 2, 3, 1, '#cfeaff');
        px(20, 22, 5, 2, '#7ab1d9');
      } else if (v === 2) {
        // Hairline glacial fissure
        px(21, 5, 2, 3, '#142436');
        px(22, 8, 3, 1, '#142436');
        px(21, 5, 1, 2, '#8ac6ed');
      } else if (v === 5) {
        // Crystalline frost speckle
        px(8, 22, 2, 2, '#9cd4f5');
        px(9, 22, 1, 1, '#e0f2fe');
      }
    }

    _drawShopFloor(ctx, ox, oy, h) {
      const px = (x, y, w, h2, col) => this._px(ctx, ox, oy, x, y, w, h2, col);
      const v = h % 4;
      // Warm sunlit oak planks with grain & iron nail-heads
      px(0, 0, 32, 32, '#825733');
      for (let py = 0; py < 32; py += 8) {
        px(0, py, 32, 1, '#52331b');
        px(0, py + 1, 32, 1, '#996940');
        px(0, py + 7, 32, 1, '#6b4527');
        const joint = ((py * 5 + v * 9) % 24) + 4;
        px(joint, py + 1, 1, 7, '#52331b');
        px(joint - 2, py + 3, 1, 1, '#3b2413'); // nail head
        px(joint + 2, py + 5, 1, 1, '#3b2413');
        px((joint + 10) % 26, py + 3, 5, 1, '#91633b'); // grain
      }
    }

    _drawTileHiBit(ctx, id, ox, oy, col, row, grid, area, h) {
      const px = (x, y, w, h2, colr) => this._px(ctx, ox, oy, x, y, w, h2, colr);
      const isFrost = area === 'frost';
      const isDark = area === 'darkworld';

      const n = this._tileAt(grid, col, row - 1);
      const s = this._tileAt(grid, col, row + 1);
      const w = this._tileAt(grid, col - 1, row);
      const e = this._tileAt(grid, col + 1, row);

      switch (id) {
        case T.GRASS:
          this._drawGrass(ctx, ox, oy, h);
          break;

        case T.GRASS_FLOWERS: {
          this._drawGrass(ctx, ox, oy, h);
          // 4-variant multi-colored outlined wildflower clusters
          const palettes = [
            ['#fff3b0', '#f59e0b', '#fb7185'],
            ['#fef08a', '#38bdf8', '#f472b6'],
            ['#fde047', '#ffffff', '#fb923c'],
            ['#e0f2fe', '#c084fc', '#fde047'],
          ];
          const pal = palettes[h % 4];
          const drawFlower = (fx, fy, petal, center) => {
            px(fx + 1, fy + 4, 2, 2, '#225e2c'); // stem/leaf
            px(fx, fy + 1, 4, 2, petal);
            px(fx + 1, fy, 2, 4, petal);
            px(fx + 1, fy + 1, 2, 2, center);
          };
          drawFlower(5 + (h % 3), 6 + ((h >> 2) % 3), pal[0], pal[1]);
          drawFlower(19 + ((h >> 4) % 4), 18 + ((h >> 6) % 4), pal[2], '#fef08a');
          drawFlower(22 - (h % 3), 6 + ((h >> 3) % 3), pal[1], '#ffffff');
          break;
        }

        case T.PATH:
        case T.DARK_PATH: {
          const dark = id === T.DARK_PATH;
          const base = dark ? '#6e5a7a' : '#c9a66b';
          const light = dark ? '#867094' : '#dfc189';
          const shade = dark ? '#564561' : '#ad8952';
          const darkEdge = dark ? '#3e3047' : '#8a6939';
          const turfCol = dark ? '#413152' : '#449e40';
          const turfDark = dark ? '#2a1e38' : '#2c7532';

          px(0, 0, 32, 32, base);
          // Flagstone/cobble-dirt sandy texture with 4 variants
          const v = h % 4;
          px(3 + v, 4, 8, 5, light);
          px(18 - v, 8, 9, 5, shade);
          px(6, 19 + (v % 3), 10, 5, light);
          px(20, 22 - (v % 3), 7, 5, shade);
          px(13, 13, 5, 3, light);
          // Tiny scattered pebbles
          px(5 + v * 2, 14, 2, 2, darkEdge);
          px(5 + v * 2, 14, 1, 1, light);
          px(23 - v, 16, 2, 2, darkEdge);

          // Neighbor-aware auto-tiling: soft rounded grassy/turf edges where path meets non-path!
          const isPathLike = (t) =>
            t === null ||
            t === T.PATH ||
            t === T.DARK_PATH ||
            t === T.BRIDGE ||
            t === T.STAIRS_UP ||
            t === T.PORTAL_DUNGEON ||
            t === T.PORTAL_SHOP ||
            t === T.PORTAL_FROST ||
            t === T.PORTAL_DARK ||
            t === T.ROCK_CRACKED;

          const edgeN = !isPathLike(n);
          const edgeS = !isPathLike(s);
          const edgeW = !isPathLike(w);
          const edgeE = !isPathLike(e);

          if (edgeN) {
            px(0, 0, 32, 3, turfCol);
            px(0, 3, 32, 1, turfDark);
            for (let gx = 2; gx < 30; gx += 6) px(gx + (h % 2), 3, 3, 2, turfCol);
          }
          if (edgeS) {
            px(0, 29, 32, 3, turfCol);
            px(0, 28, 32, 1, turfDark);
            for (let gx = 3; gx < 30; gx += 7) px(gx, 27, 3, 2, turfCol);
          }
          if (edgeW) {
            px(0, 0, 3, 32, turfCol);
            px(3, 0, 1, 32, turfDark);
            for (let gy = 3; gy < 29; gy += 6) px(3, gy, 2, 3, turfCol);
          }
          if (edgeE) {
            px(29, 0, 3, 32, turfCol);
            px(28, 0, 1, 32, turfDark);
            for (let gy = 2; gy < 29; gy += 7) px(27, gy, 2, 3, turfCol);
          }
          // Rounded outer corners
          if (edgeN && edgeW) px(0, 0, 6, 6, turfCol);
          if (edgeN && edgeE) px(26, 0, 6, 6, turfCol);
          if (edgeS && edgeW) px(0, 26, 6, 6, turfCol);
          if (edgeS && edgeE) px(26, 26, 6, 6, turfCol);
          break;
        }

        case T.TREE:
        case T.DARK_TREE: {
          const dark = id === T.DARK_TREE;
          if (dark) this._drawDarkGrass(ctx, ox, oy, h);
          else this._drawGrass(ctx, ox, oy, h);

          const v = h % 4;
          const outline = dark ? '#1a0a1f' : '#14381d';
          const cDark = dark ? '#471734' : '#1b5929';
          const cMid = dark ? '#692147' : '#267835';
          const cLight = dark ? '#8c315b' : '#3ca145';
          const cHi = dark ? '#b84b76' : '#6ed45e';
          const trunkDark = dark ? '#2e1c1c' : '#4a2b18';
          const trunkMid = dark ? '#4a2e2b' : '#734427';
          const trunkHi = dark ? '#63413b' : '#965c36';

          // Ground shadow & gnarled roots
          px(5, 24, 22, 6, 'rgba(10, 18, 12, 0.36)');
          px(10, 19, 12, 10, outline);
          px(11, 20, 10, 8, trunkDark);
          px(12, 20, 6, 8, trunkMid);
          px(13, 21, 3, 6, trunkHi);
          // Flared roots
          px(9, 26, 4, 3, trunkDark);
          px(19, 26, 4, 3, trunkDark);

          // Layered lush 32x32 canopy silhouette with 4 slight cluster shifts
          const sx = v === 1 ? -1 : v === 2 ? 1 : 0;
          px(4 + sx, 2, 24, 19, outline);
          px(2 + sx, 6, 28, 13, outline);
          px(5 + sx, 3, 22, 17, cDark);
          px(3 + sx, 7, 26, 11, cDark);
          // Mid-tone leaf clusters
          px(5 + sx, 4, 21, 13, cMid);
          px(4 + sx, 7, 24, 9, cMid);
          // Bright sunlit upper canopy pillows
          px(6 + sx, 4, 13, 8, cLight);
          px(16 + sx, 6, 10, 7, cLight);
          px(9 + sx, 11, 12, 5, cLight);
          // Crisp top leaf specular highlights
          px(8 + sx, 5, 7, 4, cHi);
          px(18 + sx, 7, 5, 3, cHi);
          px(10 + sx, 6, 3, 2, dark ? '#d96c96' : '#98f078');
          // Underside leaf-clump shadow scallops
          px(6 + sx, 16, 4, 3, cDark);
          px(13 + sx, 17, 6, 3, cDark);
          px(21 + sx, 16, 4, 3, cDark);
          // Dark World eerie glowing amber tree-eye on variant 3!
          if (dark && v === 3) {
            px(12, 12, 2, 2, '#fde047');
            px(18, 12, 2, 2, '#fde047');
          }
          break;
        }

        case T.BUSH: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const v = h % 4;
          const outline = isDark ? '#1c0f26' : '#133d1b';
          const bDark = isDark ? '#422254' : '#1d6127';
          const bMid = isDark ? '#5e3275' : '#2d8536';
          const bLight = isDark ? '#7d4699' : '#45b049';
          const bHi = isDark ? '#a66bc2' : '#7ae068';

          // Soft shadow
          px(4, 23, 24, 6, 'rgba(0, 0, 0, 0.30)');
          // Outlined rounded leafy bush
          px(4, 6, 24, 20, outline);
          px(2, 10, 28, 14, outline);
          px(5, 7, 22, 18, bDark);
          px(3, 11, 26, 12, bDark);
          px(5, 7, 22, 14, bMid);
          px(4, 10, 24, 9, bMid);
          // Leaf cluster highlights
          px(7, 8, 9, 6, bLight);
          px(17, 9, 8, 6, bLight);
          px(10, 14, 11, 5, bLight);
          px(9, 9, 5, 3, bHi);
          px(19, 10, 4, 2, bHi);
          // Leaf notch accents
          px(9, 19, 3, 2, bDark);
          px(19, 19, 3, 2, bDark);
          // Occasional colorful wild berries on variants 1 & 3!
          if (v === 1) {
            px(11, 13, 2, 2, '#fb7185');
            px(20, 15, 2, 2, '#fb7185');
          } else if (v === 3) {
            px(14, 11, 2, 2, '#fde047');
            px(21, 14, 2, 2, '#fde047');
          }
          break;
        }

        case T.WATER:
        case T.DARK_WATER: {
          const dark = id === T.DARK_WATER;
          const deep = dark ? '#541833' : '#1e69ad';
          const shallow = dark ? '#752346' : '#2d84cc';
          const bank = dark ? '#36233b' : '#7d5f3c';
          const bankHi = dark ? '#54385c' : '#a88456';
          const rimDark = dark ? '#1f1024' : '#3d2c1b';

          px(0, 0, 32, 32, deep);
          // Subtle deep ripple bands
          px(4, 6, 10, 2, shallow);
          px(17, 15, 11, 2, shallow);
          px(6, 24, 9, 2, shallow);

          const isWaterLike = (t) => t === null || t === T.WATER || t === T.DARK_WATER || t === T.BRIDGE;
          const landN = !isWaterLike(n);
          const landS = !isWaterLike(s);
          const landW = !isWaterLike(w);
          const landE = !isWaterLike(e);

          // Neighbor-aware earthen/rocky shorelines + shallow water shelf!
          if (landN) {
            px(0, 0, 32, 4, bank);
            px(0, 0, 32, 1, bankHi);
            px(0, 4, 32, 2, rimDark);
            px(0, 6, 32, 3, shallow);
          }
          if (landS) {
            px(0, 28, 32, 4, bank);
            px(0, 27, 32, 1, rimDark);
            px(0, 24, 32, 3, shallow);
          }
          if (landW) {
            px(0, 0, 4, 32, bank);
            px(4, 0, 1, 32, rimDark);
            px(5, 0, 3, 32, shallow);
          }
          if (landE) {
            px(28, 0, 4, 32, bank);
            px(27, 0, 1, 32, rimDark);
            px(24, 0, 3, 32, shallow);
          }
          break;
        }

        case T.BRIDGE: {
          // Draw water underneath + detailed 32x32 planked wooden bridge with railings & posts
          px(0, 0, 32, 32, isDark ? '#541833' : '#1e69ad');
          px(0, 2, 32, 28, '#4a2b14');
          px(0, 4, 32, 24, '#8c5a30');
          // Top & bottom timber guardrails
          px(0, 2, 32, 4, '#6b401e');
          px(0, 2, 32, 1, '#b87d48');
          px(0, 26, 32, 4, '#593317');
          px(0, 26, 32, 1, '#9e6838');
          // Individual weathered wooden planks with nail heads
          for (let bx = 0; bx < 32; bx += 6) {
            px(bx, 6, 5, 20, bx % 12 === 0 ? '#a86e3d' : '#9c6436');
            px(bx + 5, 6, 1, 20, '#4f2e15');
            px(bx + 1, 7, 3, 2, '#c48952');
            px(bx + 2, 8, 1, 1, '#3d2210');
            px(bx + 2, 23, 1, 1, '#3d2210');
          }
          break;
        }

        case T.STONE_WALL: {
          const v = h % 4;
          const southFloor = s !== null && WALKABLE_SHADOW_RECEIVERS.has(s);
          // Crisp outlined cobblestone fortress masonry
          px(0, 0, 32, 32, '#5a6370');
          // Top cornice cap
          px(0, 0, 32, 5, '#9aa5b5');
          px(0, 0, 32, 2, '#bcc7d6');
          px(0, 5, 32, 2, '#3d444f');
          // Staggered stone blocks
          const blocks = [
            [1, 8, 13, 9],
            [16, 8, 15, 9],
            [0, 19, 9, 10],
            [11, 19, 13, 10],
            [26, 19, 6, 10],
          ];
          for (let i = 0; i < blocks.length; i++) {
            const [bx, by, bw, bh] = blocks[i];
            px(bx, by, bw, bh, (i + v) % 2 === 0 ? '#778291' : '#6c7685');
            px(bx, by, bw, 2, '#929dad');
            px(bx, by + bh - 1, bw, 1, '#444b57');
          }
          if (southFloor) {
            px(0, 29, 32, 3, '#2d333d');
          }
          if (v === 2) {
            // Subtle ivy/moss drape on stone wall
            px(4, 5, 5, 6, '#36753c');
            px(5, 6, 3, 3, '#52a655');
          }
          break;
        }

        case T.CLIFF: {
          // Lush grassy cliff overhang + striated rocky earth face
          px(0, 0, 32, 32, '#7d5a38');
          px(0, 0, 32, 6, '#489e40');
          px(0, 0, 32, 2, '#6fd158');
          px(0, 6, 32, 3, '#2a6b2d');
          px(0, 9, 32, 3, '#b88b5a');
          // Vertical rock strata ribs
          px(2, 12, 8, 16, '#6e4d2f');
          px(3, 13, 5, 13, '#8c6540');
          px(12, 12, 9, 16, '#634429');
          px(13, 13, 6, 13, '#825c39');
          px(23, 12, 7, 16, '#6e4d2f');
          px(24, 13, 4, 13, '#8c6540');
          px(0, 28, 32, 4, '#3d2817');
          break;
        }

        case T.STAIRS_UP: {
          px(0, 0, 32, 32, '#756d5f');
          for (let sy = 0; sy < 32; sy += 6) {
            px(2, sy, 28, 2, '#cfc4b0');
            px(2, sy + 2, 28, 2, '#a39986');
            px(2, sy + 4, 28, 2, '#575045');
          }
          px(0, 0, 3, 32, '#453f36');
          px(29, 0, 3, 32, '#453f36');
          px(1, 0, 1, 32, '#9c927f');
          px(30, 0, 1, 32, '#9c927f');
          break;
        }

        case T.DUNGEON_FLOOR:
          if (isFrost) this._drawFrostFloor(ctx, ox, oy, h);
          else this._drawDungeonFloor(ctx, ox, oy, h);
          break;

        case T.DUNGEON_WALL: {
          const v = h % 4;
          const southFloor = s !== null && WALKABLE_SHADOW_RECEIVERS.has(s);
          if (isFrost) {
            // Dedicated Frost Spire Glacial Masonry Wall + Hanging Icicles!
            px(0, 0, 32, 32, '#13314d');
            px(0, 0, 32, 6, '#5ca4d6');
            px(0, 0, 32, 2, '#bae6fd');
            px(0, 6, 32, 2, '#e0f2fe'); // crystalline cornice trim
            // Faceted glacial bricks
            const bricks = [
              [1, 9, 14, 9],
              [17, 9, 14, 9],
              [0, 20, 10, 9],
              [12, 20, 12, 9],
              [26, 20, 6, 9],
            ];
            for (let i = 0; i < bricks.length; i++) {
              const [bx, by, bw, bh] = bricks[i];
              px(bx, by, bw, bh, (i + v) % 2 === 0 ? '#1d4c73' : '#184063');
              px(bx, by, bw, 2, '#3b7eb0');
              px(bx, by + bh - 1, bw, 1, '#0d2236');
            }
            // Hanging crystalline pixel icicles along south-facing ledges!
            if (southFloor) {
              px(0, 29, 32, 3, '#0a1c2e');
              const icicles = [4, 11, 19, 26];
              for (let i = 0; i < icicles.length; i++) {
                const ix = icicles[i] + ((v + i) % 2);
                const len = 4 + ((v + i) % 3) * 2;
                px(ix, 26, 3, Math.min(6, len), '#7dd3fc');
                px(ix + 1, 26, 1, Math.min(6, len), '#f0f9ff');
              }
            }
          } else {
            // Palace of the Four Seals Royal Sapphire Masonry + Gold Trim
            px(0, 0, 32, 32, '#1c2840');
            px(0, 0, 32, 6, '#486899');
            px(0, 0, 32, 2, '#698ec4');
            px(0, 6, 32, 2, '#d4af4c'); // Golden palace molding
            px(0, 7, 32, 1, '#8f7024');
            const bricks = [
              [1, 9, 14, 9],
              [17, 9, 14, 9],
              [0, 20, 11, 9],
              [13, 20, 12, 9],
              [27, 20, 5, 9],
            ];
            for (let i = 0; i < bricks.length; i++) {
              const [bx, by, bw, bh] = bricks[i];
              px(bx, by, bw, bh, (i + v) % 2 === 0 ? '#2b4063' : '#253857');
              px(bx, by, bw, 2, '#3d5885');
              px(bx, by + bh - 1, bw, 1, '#151e30');
            }
            if (southFloor) {
              px(0, 29, 32, 3, '#111826');
            }
            if (v === 3) {
              // Subtle weathered crack
              px(20, 12, 2, 4, '#131b2b');
              px(21, 15, 3, 2, '#131b2b');
            }
          }
          break;
        }

        case T.DUNGEON_CARPET: {
          // Connected royal crimson carpet with neighbor-aware gold embroidery fringe!
          px(0, 0, 32, 32, '#7d2030');
          px(2, 2, 28, 28, '#96273a');
          // Subtle woven diamond motif
          px(14, 10, 4, 12, '#ab2f44');
          px(10, 14, 12, 4, '#ab2f44');
          px(14, 14, 4, 4, '#c73e55');

          if (n !== T.DUNGEON_CARPET) {
            px(0, 0, 32, 3, '#e0b84c');
            px(0, 3, 32, 1, '#54141f');
          }
          if (s !== T.DUNGEON_CARPET) {
            px(0, 29, 32, 3, '#e0b84c');
            px(0, 28, 32, 1, '#54141f');
          }
          if (w !== T.DUNGEON_CARPET) {
            px(0, 0, 3, 32, '#e0b84c');
            px(3, 0, 1, 32, '#54141f');
          }
          if (e !== T.DUNGEON_CARPET) {
            px(29, 0, 3, 32, '#e0b84c');
            px(28, 0, 1, 32, '#54141f');
          }
          break;
        }

        case T.PIT: {
          // Deep abyssal chasm with 3D neighbor-aware stone drop ledges!
          px(0, 0, 32, 32, '#07090f');
          const rimCol = isFrost ? '#1e3f5c' : '#253147';
          const rimDrop = isFrost ? '#102438' : '#141c2b';
          if (n !== null && n !== T.PIT) {
            px(0, 0, 32, 4, rimCol);
            px(0, 4, 32, 5, rimDrop);
            // Vertical brick seams along drop face
            for (let rx = 7; rx < 32; rx += 8) px(rx, 0, 1, 9, '#090c14');
          }
          if (w !== null && w !== T.PIT) {
            px(0, 0, 4, 32, rimDrop);
          }
          if (e !== null && e !== T.PIT) {
            px(28, 0, 4, 32, rimDrop);
          }
          if (s !== null && s !== T.PIT) {
            px(0, 29, 32, 3, rimDrop);
          }
          break;
        }

        case T.DOOR_OPEN: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const trim = isFrost ? '#7dd3fc' : '#d4af4c';
          const trimDark = isFrost ? '#0c4a6e' : '#785a1a';
          px(0, 0, 4, 32, trim);
          px(4, 0, 1, 32, trimDark);
          px(28, 0, 4, 32, trim);
          px(27, 0, 1, 32, trimDark);
          px(5, 4, 22, 24, isFrost ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 235, 160, 0.08)');
          break;
        }

        case T.DOOR_LOCKED: {
          const woodDark = isFrost ? '#164e63' : '#4a3320';
          const woodMid = isFrost ? '#0e7490' : '#755336';
          const trim = isFrost ? '#bae6fd' : '#e0b84c';
          px(0, 0, 32, 32, '#141824');
          px(1, 1, 30, 30, woodDark);
          px(3, 3, 26, 26, woodMid);
          px(1, 1, 30, 4, trim);
          px(1, 27, 30, 4, woodDark);
          // Ornate metallic lock plate & keyhole
          px(10, 8, 12, 16, '#1c1917');
          px(11, 9, 10, 14, isFrost ? '#7dd3fc' : '#f2c94c');
          px(12, 10, 8, 3, '#fef9c3');
          px(14, 12, 4, 4, '#141210');
          px(15, 16, 2, 5, '#141210');
          break;
        }

        case T.DOOR_BOSS: {
          const bgDark = isFrost ? '#082f49' : '#3d1020';
          const bgMid = isFrost ? '#0369a1' : '#6e1c36';
          const gold = isFrost ? '#7dd3fc' : '#facc15';
          const hi = isFrost ? '#f0f9ff' : '#fef08a';
          px(0, 0, 32, 32, '#140c14');
          px(1, 1, 30, 30, bgDark);
          px(3, 3, 26, 26, bgMid);
          px(1, 1, 30, 4, gold);
          px(1, 27, 30, 4, gold);
          // Sculpted horned Sovereign skull crest
          px(7, 5, 18, 20, '#140c14');
          px(8, 6, 16, 18, gold);
          px(6, 4, 4, 5, hi);
          px(22, 4, 4, 5, hi);
          px(10, 11, 4, 4, '#1a0910');
          px(18, 11, 4, 4, '#1a0910');
          px(11, 12, 2, 2, '#ef4444');
          px(19, 12, 2, 2, '#ef4444');
          px(14, 17, 4, 5, '#1a0910');
          break;
        }

        case T.DOOR_BARRED: {
          px(0, 0, 32, 32, isFrost ? '#0f2942' : '#1b263b');
          for (let bx = 4; bx <= 24; bx += 6) {
            px(bx, 1, 4, 30, '#475569');
            px(bx, 1, 2, 30, '#cbd5e1');
            px(bx + 3, 1, 1, 30, '#1e293b');
          }
          px(1, 7, 30, 4, '#64748b');
          px(1, 7, 30, 1, '#e2e8f0');
          px(1, 21, 30, 4, '#64748b');
          px(1, 21, 30, 1, '#e2e8f0');
          break;
        }

        case T.CRACKED_WALL: {
          // Draw dungeon wall + bold jagged bombable fissure with subtle golden tell
          this._drawTileHiBit(ctx, T.DUNGEON_WALL, ox, oy, col, row, grid, area, h);
          px(14, 5, 4, 7, '#090d16');
          px(12, 10, 4, 7, '#090d16');
          px(16, 14, 6, 4, '#090d16');
          px(10, 17, 4, 10, '#090d16');
          px(18, 18, 4, 9, '#090d16');
          px(14, 12, 2, 2, '#fde047');
          break;
        }

        case T.POT: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const v = h % 3;
          // Outlined 32x32 ceramic amphora pot with specular sheen & rim
          px(6, 23, 20, 6, 'rgba(0, 0, 0, 0.34)');
          px(7, 5, 18, 22, '#24140b');
          px(5, 10, 22, 14, '#24140b');
          px(8, 6, 16, 20, isFrost ? '#3b7396' : '#8c5129');
          px(6, 11, 20, 12, isFrost ? '#4f8db3' : '#ad693b');
          // Decorative glaze band
          px(6, 16, 20, 3, isFrost ? '#bae6fd' : v === 1 ? '#d4af4c' : '#733e1c');
          // Lip & hollow opening
          px(9, 4, 14, 5, '#24140b');
          px(10, 5, 12, 3, isFrost ? '#7dd3fc' : '#d69763');
          px(11, 8, 10, 2, '#3d1f0d');
          // Specular ceramic highlight
          px(9, 12, 4, 7, isFrost ? '#e0f2fe' : '#e3aa78');
          px(10, 13, 2, 4, '#ffffff');
          break;
        }

        case T.BLOCK_PUSH: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const outline = '#141b29';
          const body = isFrost ? '#3b82b8' : '#5e6f8c';
          const hi = isFrost ? '#bae6fd' : '#a8bbd6';
          const dark = isFrost ? '#163d61' : '#323f54';
          const inner = isFrost ? '#256396' : '#4a5a75';
          const rune = isFrost ? '#e0f2fe' : '#e0b84c';

          px(2, 2, 28, 28, outline);
          px(3, 3, 26, 26, body);
          px(3, 3, 26, 4, hi);
          px(3, 3, 4, 26, hi);
          px(3, 25, 26, 4, dark);
          px(25, 3, 4, 26, dark);
          px(7, 7, 18, 18, inner);
          // Carved four-pointed sanctuary emblem
          px(13, 9, 6, 14, rune);
          px(9, 13, 14, 6, rune);
          px(14, 14, 4, 4, inner);
          break;
        }

        case T.SWITCH_FLOOR:
        case T.SWITCH_FLOOR_ON: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const on = id === T.SWITCH_FLOOR_ON;
          px(4, 4, 24, 24, '#18202e');
          px(5, 5, 22, 22, on ? '#334155' : '#64748b');
          px(7, 7, 18, 18, on ? '#15803d' : '#b45309');
          px(9, 9, 14, 14, on ? '#4ade80' : '#f59e0b');
          px(11, 10, 8, 3, on ? '#bbf7d0' : '#fef08a');
          break;
        }

        case T.TORCH_UNLIT:
        case T.TORCH_LIT: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          // Ornate wrought-iron / frosted stone brazier
          px(7, 25, 18, 5, 'rgba(0, 0, 0, 0.34)');
          px(8, 11, 16, 17, '#111827');
          px(6, 10, 20, 7, '#111827');
          px(9, 12, 14, 15, isFrost ? '#2b587a' : '#475569');
          px(7, 11, 18, 5, isFrost ? '#7dd3fc' : '#94a3b8');
          px(9, 12, 14, 3, '#1e293b'); // coal bowl
          px(11, 17, 4, 9, isFrost ? '#5293bd' : '#64748b');
          px(10, 24, 12, 3, '#1e293b');
          if (id === T.TORCH_LIT) {
            px(11, 11, 10, 3, '#ea580c');
            px(13, 10, 6, 3, '#fde047');
          }
          break;
        }

        case T.SPIKES: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const pts = [
            [4, 4],
            [18, 4],
            [4, 18],
            [18, 18],
          ];
          for (const [sx, sy] of pts) {
            px(sx + 1, sy + 7, 8, 3, '#1e293b');
            px(sx + 2, sy + 4, 6, 4, '#64748b');
            px(sx + 3, sy + 1, 4, 5, '#cbd5e1');
            px(sx + 4, sy, 2, 4, '#ffffff');
          }
          break;
        }

        case T.CHEST_CLOSED:
        case T.CHEST_OPEN: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const open = id === T.CHEST_OPEN;
          px(4, 24, 24, 5, 'rgba(0, 0, 0, 0.36)');
          px(4, 5, 24, 23, '#1c1008');
          if (!open) {
            px(5, 6, 22, 21, '#7a4522');
            px(6, 7, 20, 19, '#a6602d');
            px(5, 6, 22, 4, '#eab308');
            px(6, 7, 20, 2, '#fef08a');
            px(5, 16, 22, 2, '#3b200d');
            px(12, 13, 8, 7, '#1c1008');
            px(13, 14, 6, 5, '#fde047');
            px(15, 16, 2, 2, '#3b200d');
          } else {
            px(5, 4, 22, 10, '#4f2b14');
            px(7, 6, 18, 7, '#1c0f07');
            px(5, 14, 22, 13, '#8c4f23');
            px(5, 14, 22, 2, '#eab308');
            px(13, 16, 6, 4, '#fde047');
          }
          break;
        }

        case T.BIG_CHEST_CLOSED:
        case T.BIG_CHEST_OPEN: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const open = id === T.BIG_CHEST_OPEN;
          const trim = isFrost ? '#7dd3fc' : '#facc15';
          const body = isFrost ? '#0369a1' : '#9e1f36';
          const dark = isFrost ? '#082f49' : '#5e1120';
          px(2, 25, 28, 5, 'rgba(0, 0, 0, 0.40)');
          px(2, 3, 28, 26, '#14090d');
          if (!open) {
            px(3, 4, 26, 24, dark);
            px(5, 6, 22, 20, body);
            px(3, 4, 26, 4, trim);
            px(3, 24, 26, 4, trim);
            px(3, 4, 4, 24, trim);
            px(25, 4, 4, 24, trim);
            px(12, 12, 8, 8, '#14090d');
            px(13, 13, 6, 6, '#fef08a');
            px(15, 15, 2, 2, dark);
          } else {
            px(3, 2, 26, 12, dark);
            px(6, 5, 20, 7, '#14060a');
            px(3, 14, 26, 14, body);
            px(3, 14, 26, 3, trim);
            px(3, 25, 26, 3, trim);
          }
          break;
        }

        case T.CRYSTAL_BLUE:
        case T.CRYSTAL_RED: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const blue = id === T.CRYSTAL_BLUE;
          px(9, 22, 14, 6, '#1e293b');
          px(10, 21, 12, 5, '#475569');
          // Faceted tall crystal orb
          px(10, 5, 12, 18, '#0f172a');
          px(11, 6, 10, 16, blue ? '#1d4ed8' : '#b91c1c');
          px(12, 5, 8, 15, blue ? '#3b82f6' : '#ef4444');
          px(13, 6, 5, 9, blue ? '#93c5fd' : '#fca5a5');
          px(14, 7, 2, 5, '#ffffff');
          break;
        }

        case T.GATE_BLUE_UP:
        case T.GATE_RED_UP: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const blue = id === T.GATE_BLUE_UP;
          px(3, 3, 26, 26, '#0f172a');
          px(4, 4, 24, 24, blue ? '#1e40af' : '#991b1b');
          px(6, 6, 20, 18, blue ? '#3b82f6' : '#ef4444');
          px(8, 7, 16, 5, blue ? '#93c5fd' : '#fca5a5');
          px(4, 24, 24, 4, blue ? '#172554' : '#450a0a');
          break;
        }

        case T.GATE_BLUE_DOWN:
        case T.GATE_RED_DOWN: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const blue = id === T.GATE_BLUE_DOWN;
          px(5, 5, 22, 22, blue ? '#1e3a8a' : '#7f1d1d');
          px(8, 8, 16, 16, '#1e293b');
          break;
        }

        case T.PORTAL_DUNGEON: {
          // Grand stone palace archway with gilded lintel & deep shadow doorway
          px(0, 0, 32, 32, '#475569');
          px(1, 0, 30, 6, '#d4af4c');
          px(2, 1, 28, 3, '#fef08a');
          px(4, 6, 24, 26, '#0b101c');
          px(7, 9, 18, 23, '#04060d');
          px(12, 11, 8, 4, '#38bdf8');
          break;
        }

        case T.PORTAL_OVERWORLD: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          px(3, 3, 26, 26, '#1e293b');
          px(4, 4, 24, 24, '#d4af4c');
          px(7, 7, 18, 18, '#38bdf8');
          px(11, 11, 10, 10, '#e0f2fe');
          break;
        }

        case T.SIGN: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          px(7, 24, 18, 5, 'rgba(0, 0, 0, 0.30)');
          px(12, 18, 8, 10, '#29160a');
          px(13, 19, 6, 8, '#6e4323');
          px(4, 5, 24, 16, '#29160a');
          px(5, 6, 22, 14, '#8c562c');
          px(7, 8, 18, 10, '#ba7b47');
          px(9, 10, 14, 2, '#5c3518');
          px(9, 14, 10, 2, '#5c3518');
          break;
        }

        case T.FAIRY_POOL: {
          px(0, 0, 32, 32, '#0284c7');
          px(3, 3, 26, 26, '#38bdf8');
          px(7, 7, 18, 18, '#7dd3fc');
          px(11, 11, 10, 10, '#e0f2fe');
          break;
        }

        case T.PEDESTAL: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          px(4, 5, 24, 22, '#1e293b');
          px(5, 6, 22, 20, '#64748b');
          px(7, 8, 18, 16, '#94a3b8');
          px(10, 11, 12, 10, '#eab308');
          px(12, 13, 8, 6, '#fef08a');
          break;
        }

        case T.ROCK_CRACKED: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          px(4, 23, 24, 6, 'rgba(0, 0, 0, 0.32)');
          px(4, 6, 24, 21, '#1e2229');
          px(6, 4, 20, 22, '#1e2229');
          px(5, 7, 22, 19, '#5a626e');
          px(7, 5, 18, 18, '#7d8694');
          px(9, 6, 11, 7, '#a6b0bf');
          // Jagged dark bombable crack
          px(14, 8, 3, 6, '#14181f');
          px(12, 13, 6, 3, '#14181f');
          px(16, 16, 3, 6, '#14181f');
          px(14, 13, 2, 2, '#fde047');
          break;
        }

        case T.STATUE: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          const sDark = isFrost ? '#164e63' : '#475569';
          const sMid = isFrost ? '#38bdf8' : '#94a3b8';
          const sHi = isFrost ? '#e0f2fe' : '#cbd5e1';
          const gem = isFrost ? '#fef08a' : '#eab308';
          px(5, 24, 22, 5, 'rgba(0, 0, 0, 0.35)');
          px(6, 19, 20, 9, '#141b29');
          px(7, 20, 18, 7, sDark);
          px(8, 5, 16, 17, '#141b29');
          px(9, 6, 14, 15, sMid);
          px(10, 4, 12, 8, sHi);
          px(12, 8, 2, 2, '#0f172a');
          px(18, 8, 2, 2, '#0f172a');
          px(12, 13, 8, 5, gem);
          break;
        }

        case T.TRIFORCE_ALTAR: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          px(2, 3, 28, 26, '#1e293b');
          px(3, 4, 26, 24, '#3b4e73');
          px(5, 6, 22, 20, '#5a73a3');
          // Crisp golden Triforce crest
          px(14, 8, 4, 4, '#fef08a');
          px(12, 12, 8, 4, '#facc15');
          px(8, 16, 6, 6, '#facc15');
          px(18, 16, 6, 6, '#facc15');
          px(14, 17, 4, 5, '#ca8a04');
          break;
        }

        case T.PORTAL_SHOP: {
          // Cozy shopfront doorway with striped crimson awning & hanging rupee sign
          px(0, 0, 32, 32, '#5c371d');
          for (let sx = 0; sx < 32; sx += 8) {
            px(sx, 0, 4, 9, '#dc2626');
            px(sx + 4, 0, 4, 9, '#fef3c7');
          }
          px(0, 9, 32, 2, '#7f1d1d');
          px(5, 11, 22, 21, '#1a120d');
          px(8, 14, 16, 18, '#291c14');
          px(13, 16, 6, 9, '#4ade80');
          px(14, 17, 2, 4, '#bbf7d0');
          break;
        }

        case T.SHOP_FLOOR:
          this._drawShopFloor(ctx, ox, oy, h);
          break;

        case T.SHOP_EXIT: {
          this._drawShopFloor(ctx, ox, oy, h);
          px(2, 4, 28, 24, '#7f1d1d');
          px(4, 6, 24, 20, '#dc2626');
          px(6, 8, 20, 2, '#fde047');
          px(6, 22, 20, 2, '#fde047');
          break;
        }

        case T.SHOP_COUNTER: {
          px(0, 0, 32, 32, '#3d2513');
          px(0, 2, 32, 12, '#ba7b47');
          px(0, 2, 32, 3, '#e0a570');
          px(0, 14, 32, 14, '#784824');
          px(0, 28, 32, 4, '#2e1b0d');
          break;
        }

        case T.MERCHANT: {
          this._drawShopFloor(ctx, ox, oy, h);
          // Outlined 32x32 cozy Sanctuary Merchant
          px(6, 14, 20, 16, '#1c1018');
          px(7, 15, 18, 14, '#991b1b');
          px(10, 15, 12, 14, '#dc2626');
          px(14, 16, 4, 13, '#facc15');
          px(8, 4, 16, 12, '#1c1018');
          px(9, 5, 14, 10, '#f6c79c');
          // Royal violet merchant cap with gold band
          px(6, 0, 20, 7, '#1c1018');
          px(7, 1, 18, 5, '#7e22ce');
          px(9, 3, 14, 2, '#fde047');
          // Expressive eyes & fluffy beard
          px(11, 8, 2, 3, '#111827');
          px(19, 8, 2, 3, '#111827');
          px(10, 12, 12, 6, '#e2e8f0');
          px(12, 13, 8, 3, '#ffffff');
          break;
        }

        case T.POST_LATCH: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          // Outlined iron-banded wooden Hookshot Latch Post with golden bullseye!
          px(7, 23, 18, 6, 'rgba(0, 0, 0, 0.36)');
          px(9, 6, 14, 22, '#1a1324');
          px(10, 8, 12, 19, '#85532b');
          px(11, 8, 4, 19, '#b57b48');
          // Iron top ring & bullseye
          px(8, 5, 16, 7, '#1a1324');
          px(9, 6, 14, 5, '#94a3b8');
          px(12, 7, 8, 3, '#fde047');
          px(14, 7, 4, 2, '#ffffff');
          // Lower iron band
          px(9, 18, 14, 4, '#64748b');
          px(10, 18, 5, 2, '#cbd5e1');
          break;
        }

        case T.DARK_GRASS:
          this._drawDarkGrass(ctx, ox, oy, h);
          break;

        case T.PORTAL_DARK: {
          this._drawBiomeFloor(ctx, ox, oy, area, h);
          px(4, 4, 24, 24, '#2e1065');
          px(7, 7, 18, 18, '#7e22ce');
          px(10, 10, 12, 12, '#c084fc');
          px(13, 13, 6, 6, '#faf5ff');
          break;
        }

        case T.PORTAL_FROST: {
          px(0, 0, 32, 32, '#1e3a5f');
          px(1, 0, 30, 6, '#7dd3fc');
          px(2, 1, 28, 3, '#f0f9ff');
          px(4, 6, 24, 26, '#082f49');
          px(8, 10, 16, 22, '#041826');
          px(12, 12, 8, 5, '#bae6fd');
          break;
        }

        case T.ICE_FLOOR: {
          const v = h % 5;
          // Gleaming multi-tone glacial crystal ice with neighbor-aware frosty edges!
          px(0, 0, 32, 32, '#5bc4eb');
          px(1, 1, 30, 30, v % 2 === 0 ? '#6fd0f2' : '#65c9ed');
          // Diagonal reflective ice sheen streaks
          px(5 + v, 5, 9, 2, '#bae6fd');
          px(7 + v, 7, 5, 2, '#e0f2fe');
          px(17 - v, 20, 8, 2, '#bae6fd');
          px(19 - v, 22, 4, 2, '#ffffff');
          // Subtle sub-surface ice crack on variants 2 & 4
          if (v === 2 || v === 4) {
            px(9, 14, 5, 1, '#3699bf');
            px(13, 15, 3, 2, '#3699bf');
          }
          // Beveled frosted rim wherever ice borders non-ice tiles
          if (n !== T.ICE_FLOOR) {
            px(0, 0, 32, 2, '#e0f2fe');
            px(0, 2, 32, 1, '#93dcf7');
          }
          if (w !== T.ICE_FLOOR) {
            px(0, 0, 2, 32, '#e0f2fe');
          }
          if (s !== T.ICE_FLOOR) {
            px(0, 30, 32, 2, '#2d84a8');
          }
          if (e !== T.ICE_FLOOR) {
            px(30, 0, 2, 32, '#2d84a8');
          }
          break;
        }

        default:
          this._drawBiomeFloor(ctx, ox, oy, area, h);
      }
    }

    /**
     * Live per-frame animated tile accents drawn at crisp 640x416 over the cached room canvas.
     */
    drawAnimatedTileAccents(ctx, room, time) {
      if (!room || !room.grid) return;
      const grid = room.grid;

      for (let r = 0; r < FB.ROOM_ROWS; r++) {
        for (let c = 0; c < FB.ROOM_COLS; c++) {
          const id = grid[r][c];
          const dx = c * HT;
          const dy = r * HT;

          if (id === T.WATER || id === T.DARK_WATER) {
            const wave = Math.floor(time * 3.2 + c * 1.4 + r * 0.7) % 10;
            const foam = Math.sin(time * 3.8 + c * 0.9 + r) > 0.35;
            ctx.fillStyle = id === T.DARK_WATER ? 'rgba(244, 114, 182, 0.38)' : 'rgba(210, 245, 255, 0.45)';
            ctx.fillRect(dx + 3 + wave, dy + 8, 8, 2);
            ctx.fillRect(dx + 19 - wave, dy + 22, 8, 2);
            if (foam) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
              ctx.fillRect(dx + 8 + (wave % 4) * 3, dy + 14, 4, 2);
            }
          } else if (id === T.GRASS_FLOWERS) {
            const sway = Math.round(Math.sin(time * 2.8 + c * 1.1 + r * 0.9));
            if (sway !== 0) {
              ctx.fillStyle = '#fff3b0';
              ctx.fillRect(dx + 6 + sway, dy + 7, 3, 2);
              ctx.fillStyle = '#fb7185';
              ctx.fillRect(dx + 20 - sway, dy + 19, 3, 2);
            }
          } else if (id === T.TORCH_LIT) {
            const f = Math.floor(time * 13 + c * 5 + r * 3) % 4;
            const ox = f === 1 ? 2 : f === 3 ? -2 : 0;
            const fh = f % 2 === 0 ? 10 : 12;
            // Multi-layered crisp pixel flame
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(dx + 10, dy + 13 - fh, 12, fh);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(dx + 12 + ox, dy + 12 - fh, 8, fh - 2);
            ctx.fillStyle = '#fefce8';
            ctx.fillRect(dx + 14, dy + 7, 4, 5);
            // Rising ember spark
            const ey = Math.floor(time * 20 + c * 7) % 14;
            ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
            ctx.fillRect(dx + 15 + (ey % 2 === 0 ? 2 : -2), dy + 5 - ey, 2, 2);
            // Warm flickering radial torchlight halo
            const glowR = 34 + Math.sin(time * 11 + c * 2) * 4;
            const grad = ctx.createRadialGradient(dx + 16, dy + 10, 4, dx + 16, dy + 10, glowR);
            grad.addColorStop(0, 'rgba(255, 190, 70, 0.24)');
            grad.addColorStop(1, 'rgba(255, 140, 20, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(dx + 16, dy + 10, glowR, 0, Math.PI * 2);
            ctx.fill();
          } else if (id === T.ICE_FLOOR) {
            if (Math.floor(time * 5 + c * 3 + r * 5) % 11 === 0) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(dx + 10, dy + 10, 4, 2);
              ctx.fillRect(dx + 11, dy + 9, 2, 4);
            }
          } else if (id === T.CRYSTAL_BLUE || id === T.CRYSTAL_RED) {
            const glint = Math.floor(time * 5 + c * 3) % 5 === 0;
            if (glint) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(dx + 13, dy + 7, 4, 2);
              ctx.fillRect(dx + 14, dy + 6, 2, 4);
            }
          } else if (id === T.CHEST_CLOSED || id === T.BIG_CHEST_CLOSED) {
            if (Math.floor(time * 4 + c * 3) % 7 === 0) {
              ctx.fillStyle = '#fef9c3';
              ctx.fillRect(dx + 14, dy + 6, 4, 2);
              ctx.fillRect(dx + 15, dy + 5, 2, 4);
            }
          } else if (id === T.PORTAL_DARK) {
            const r1 = 8 + Math.sin(time * 6) * 3.5;
            ctx.strokeStyle = 'rgba(233, 213, 255, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(dx + 16, dy + 16, r1, time * 3.2, time * 3.2 + Math.PI * 1.45);
            ctx.stroke();
          } else if (id === T.FAIRY_POOL) {
            const pulse = Math.sin(time * 4 + c) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(224, 242, 254, ${0.25 + pulse * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(dx + 16, dy + 16, 6 + pulse * 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.5})`;
            ctx.fillRect(dx + 9, dy + 8 + Math.round(pulse * 2), 3, 3);
            ctx.fillRect(dx + 20, dy + 18 - Math.round(pulse * 2), 3, 3);
          } else if (id === T.TRIFORCE_ALTAR) {
            const glow = Math.sin(time * 5) * 0.14 + 0.28;
            ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
            ctx.beginPath();
            ctx.arc(dx + 16, dy + 16, 32 + Math.sin(time * 4) * 4, 0, Math.PI * 2);
            ctx.fill();
            const moteY = Math.floor(time * 24 + c * 5) % 20;
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(dx + 8 + (moteY % 4) * 5, dy + 22 - moteY, 2, 4);
          }
        }
      }
    }
  }

  FB.hiTiles = new HiBitTileRenderer();
})(window);
