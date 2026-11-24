/**
 * Main Game Engine: Loop, ALttP Corner-Nudging Physics, Combat, Sub-Items,
 * Puzzles, Multi-Room Transitions, Boss Battle, and Local 1-4 Player Co-op.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const T = FB.TILES;
  const TS = FB.TILE_SIZE;

  class Game {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = FB.RENDER_W;
      this.canvas.height = FB.RENDER_H;
      this.ctx.imageSmoothingEnabled = false;

      this.state = 'title'; // 'title' | 'playing' | 'paused' | 'gameover' | 'victory'
      this.selectedPlayerCount = 1;
      this.friendlyFire = false;

      this.time = 0;
      this.elapsedTime = 0;
      this.hitstop = 0;
      this.screenShake = 0;
      this.transitionTimer = 0;
      this.transitionOverlayAlpha = 0;

      this.rooms = null;
      this.room = null;
      this.humanHeroes = [];
      this.spiritClone = null;
      this.enemies = [];
      this.projectiles = [];
      this.pickups = [];
      this.particles = [];
      this.floatingTexts = [];
      this.ambientMotes = [];
      this.butterflies = [];

      this.smallKeys = 0;
      this.hasBossKey = false;
      this.frostSmallKeys = 0;
      this.hasFrostBossKey = false;
      this.desertSmallKeys = 0;
      this.hasDesertBossKey = false;
      this.magmaSmallKeys = 0;
      this.hasMagmaBossKey = false;
      this.unlockedLocks = new Set();
      this.bossDefeated = false;
      this.act1Cleared = false;
      this.frostBossDefeated = false;
      this.desertBossDefeated = false;
      this.magmaBossDefeated = false;
      this.heartPieces = 0;
      this.collectedHeartPieces = new Set();
      this.heroMode = false;
      this.activeSaveSlot = 0;
      this.activeDialog = null;
      this.dialogTimer = 0;
      this.hudTick = 0;
      this.camX = 0;
      this.camY = 0;
      this.slideTrans = null;
      this.prevViewCanvas = null;
      this.prevViewCtx = null;
      this.slowMoTimer = 0;
      this.mapOpen = false;
      this.roomCanvas = null;
      this.roomCtx = null;
      this.roomCacheKey = null;
      this.darkCanvas = null;
      this.darkCtx = null;
      this.lastFrameTime = performance.now();
    }

    init() {
      FB.sprites.init();
      FB.ui.init(this);
      FB.ui.renderSaveSlots(this);
      FB.ui.setOverlay('title');

      // Show animated Hi-Bit sanctuary courtyard behind title screen
      this.rooms = FB.createWorldData();
      this.room = this.rooms.ow_start;
      this.updateCamera(true);
      this.initRoomAtmosphere(this.room);

      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    get allHeroes() {
      return this.spiritClone ? [...this.humanHeroes, this.spiritClone] : this.humanHeroes;
    }

    get roomCols() {
      return this.room?.cols || this.room?.grid?.[0]?.length || FB.ROOM_COLS;
    }

    get roomRows() {
      return this.room?.rows || this.room?.grid?.length || FB.ROOM_ROWS;
    }

    get roomW() {
      return this.roomCols * TS;
    }

    get roomH() {
      return this.roomRows * TS;
    }

    updateCamera(snap = false, dt = 0.016) {
      if (!this.room) return;
      const rw = this.roomW;
      const rh = this.roomH;
      const live = this.humanHeroes.filter((h) => !h.downed);
      let cx = rw / 2;
      let cy = rh / 2;
      if (live.length > 0) {
        cx = live.reduce((s, h) => s + h.x, 0) / live.length;
        cy = live.reduce((s, h) => s + h.y, 0) / live.length;
      }

      const tx =
        rw <= FB.VIEW_W
          ? -(FB.VIEW_W - rw) / 2
          : Math.max(0, Math.min(rw - FB.VIEW_W, cx - FB.VIEW_W / 2));
      const ty =
        rh <= FB.VIEW_H
          ? -(FB.VIEW_H - rh) / 2
          : Math.max(0, Math.min(rh - FB.VIEW_H, cy - FB.VIEW_H / 2));

      if (snap) {
        this.camX = tx;
        this.camY = ty;
      } else {
        const f = Math.min(1, dt * 11);
        this.camX += (tx - this.camX) * f;
        this.camY += (ty - this.camY) * f;
      }

      // Soft co-op viewport tether in large scrolling rooms so teammates stay on-screen
      if (live.length > 1 && (rw > FB.VIEW_W || rh > FB.VIEW_H)) {
        const minX = Math.max(10, this.camX + 10);
        const maxX = Math.min(rw - 10, this.camX + FB.VIEW_W - 10);
        const minY = Math.max(10, this.camY + 10);
        const maxY = Math.min(rh - 10, this.camY + FB.VIEW_H - 10);
        for (const h of live) {
          if (h.x < minX) h.x = minX;
          if (h.x > maxX) h.x = maxX;
          if (h.y < minY) h.y = minY;
          if (h.y > maxY) h.y = maxY;
        }
      }
    }

    toggleMapDrawer(force) {
      if (this.state !== 'playing' && !this.mapOpen) return;
      this.mapOpen = force !== undefined ? !!force : !this.mapOpen;
      FB.audio.play('switch');
      if (FB.ui.renderMapDrawer) {
        FB.ui.renderMapDrawer(this, this.mapOpen);
      }
    }

    saveProgress() {
      if (!FB.saves || this.state === 'title') return;
      FB.saves.saveSlot(this.activeSaveSlot, this);
    }

    startNewGame(playerCount, opts = {}) {
      this.selectedPlayerCount = playerCount;
      if (opts.slotIndex !== undefined) {
        this.activeSaveSlot = opts.slotIndex;
      }
      if (opts.heroMode !== undefined) {
        this.heroMode = !!opts.heroMode;
      }
      FB.input.setPlayerCount(playerCount);

      this.rooms = FB.createWorldData();
      this.smallKeys = 0;
      this.hasBossKey = false;
      this.frostSmallKeys = 0;
      this.hasFrostBossKey = false;
      this.unlockedLocks = new Set();
      this.desertSmallKeys = 0;
      this.hasDesertBossKey = false;
      this.magmaSmallKeys = 0;
      this.hasMagmaBossKey = false;
      this.bossDefeated = false;
      this.act1Cleared = false;
      this.frostBossDefeated = false;
      this.desertBossDefeated = false;
      this.magmaBossDefeated = false;
      this.heartPieces = 0;
      this.collectedHeartPieces = new Set();
      this.elapsedTime = 0;
      this.spiritClone = null;
      this.activeDialog = null;
      this.dialogTimer = 0;

      // Spawn heroes around Sanctuary Courtyard center
      const spawnOffsets = [
        { x: 0, y: 0 },
        { x: 18, y: 0 },
        { x: -18, y: 0 },
        { x: 0, y: 16 },
      ];
      this.humanHeroes = [];
      for (let i = 0; i < playerCount; i++) {
        const off = spawnOffsets[i] || { x: 0, y: 0 };
        const h = new FB.Hero(i, 10 * TS + off.x, 7 * TS + off.y, false);
        h.showTag = playerCount > 1;
        this.humanHeroes.push(h);
      }

      this.enterRoom('ow_start', null);
      this.state = 'playing';
      this.saveProgress();
      FB.ui.setOverlay('none');
      FB.ui.showDialog(null);
      FB.ui.renderHUD(this);

      const modeLabel =
        playerCount === 1
          ? 'Solo Quest! Press Q anytime to summon your Four Swords Spirit Clone.'
          : `${playerCount}-Player Local Co-op Active! Collect rupees & conquer the Palace!`;
      this.showToast(modeLabel, 4.2);
    }

    loadSaveSlot(slotIndex, overridePlayerCount) {
      const data = FB.saves ? FB.saves.getSlot(slotIndex) : null;
      if (!data) {
        this.startNewGame(overridePlayerCount || this.selectedPlayerCount, { slotIndex });
        return false;
      }

      this.activeSaveSlot = slotIndex;
      const playerCount = Math.max(1, Math.min(4, overridePlayerCount || data.playerCount || 1));
      this.selectedPlayerCount = playerCount;
      FB.input.setPlayerCount(playerCount);

      this.rooms = FB.createWorldData();
      this.smallKeys = data.smallKeys || 0;
      this.hasBossKey = !!data.hasBossKey;
      this.frostSmallKeys = data.frostSmallKeys || 0;
      this.hasFrostBossKey = !!data.hasFrostBossKey;
      this.desertSmallKeys = data.desertSmallKeys || 0;
      this.hasDesertBossKey = !!data.hasDesertBossKey;
      this.magmaSmallKeys = data.magmaSmallKeys || 0;
      this.hasMagmaBossKey = !!data.hasMagmaBossKey;
      this.unlockedLocks = new Set(data.unlockedLocks || []);
      this.bossDefeated = !!data.bossDefeated;
      this.act1Cleared = !!data.act1Cleared;
      this.frostBossDefeated = !!data.frostBossDefeated;
      this.desertBossDefeated = !!data.desertBossDefeated;
      this.magmaBossDefeated = !!data.magmaBossDefeated;
      this.heartPieces = data.heartPieces || 0;
      this.collectedHeartPieces = new Set(data.collectedHeartPieces || []);
      this.heroMode = !!data.heroMode;
      this.friendlyFire = !!data.friendlyFire;
      this.elapsedTime = data.elapsedTime || 0;
      this.spiritClone = null;
      this.activeDialog = null;
      this.dialogTimer = 0;

      // Restore per-room state (visited, opened chests, claimed pedestals, solved puzzles, crystal state)
      for (const [id, st] of Object.entries(data.roomStates || {})) {
        const room = this.rooms[id];
        if (!room) continue;
        room.visited = !!st.visited;
        room.puzzleSolved = !!st.puzzleSolved;
        room.openedChests = new Set(st.openedChests || []);
        room.claimedPedestals = new Set(st.claimedPedestals || []);
        room.destroyedTiles = new Set(st.destroyedTiles || []);
        room.crystalState = st.crystalState || 'blue';

        // Reflect opened chests and solved puzzles on room grid
        if (room.puzzleSolved && room.puzzle) {
          if (room.puzzle.unlockDoor) this._openDoorTiles(room, room.puzzle.unlockDoor);
          if (room.puzzle.spawnChest) {
            const ch = room.puzzle.spawnChest;
            room.grid[ch.row][ch.col] = room.openedChests.has(`${ch.col},${ch.row}`)
              ? T.CHEST_OPEN
              : T.CHEST_CLOSED;
          }
          if (room.puzzle.spawnBigChest) {
            const ch = room.puzzle.spawnBigChest;
            room.grid[ch.row][ch.col] = room.openedChests.has(`${ch.col},${ch.row}`)
              ? T.BIG_CHEST_OPEN
              : T.BIG_CHEST_CLOSED;
          }
        }
        for (const key of room.openedChests) {
          const [cc, rr] = key.split(',').map(Number);
          if (room.grid[rr]?.[cc] === T.CHEST_CLOSED) room.grid[rr][cc] = T.CHEST_OPEN;
          if (room.grid[rr]?.[cc] === T.BIG_CHEST_CLOSED) room.grid[rr][cc] = T.BIG_CHEST_OPEN;
        }
        for (const key of room.destroyedTiles) {
          const [cc, rr] = key.split(',').map(Number);
          if (room.grid[rr]?.[cc] === T.CRACKED_WALL) room.grid[rr][cc] = this._floorTileForRoom(room, cc, rr, false);
          if (room.grid[rr]?.[cc] === T.ROCK_CRACKED) room.grid[rr][cc] = this._floorTileForRoom(room, cc, rr, true);
        }
      }

      // Restore heroes (syncing shared items/maxHp if playerCount changed!)
      const savedHeroes = data.heroes || [];
      const template = savedHeroes[0] || {};
      this.humanHeroes = [];
      for (let i = 0; i < playerCount; i++) {
        const sh = savedHeroes[i];
        const h = new FB.Hero(i, 10 * TS, 7 * TS, false);
        h.showTag = playerCount > 1;
        h.maxHp = sh ? sh.maxHp : template.maxHp || FB.CONFIG.START_MAX_HP;
        h.hp = sh ? Math.min(h.maxHp, Math.max(2, sh.hp)) : h.maxHp;
        h.rupees = sh ? sh.rupees || 0 : 0;
        h.kills = sh ? sh.kills || 0 : 0;
        h.revives = sh ? sh.revives || 0 : 0;
        h.items = sh && sh.items?.length ? [...sh.items] : template.items?.length ? [...template.items] : [FB.ITEMS.BOOMERANG];
        h.itemIdx = sh ? Math.min(sh.itemIdx || 0, h.items.length - 1) : 0;
        h.temperedSword = !!(sh ? sh.temperedSword : template.temperedSword);
        h.mirrorShield = !!(sh ? sh.mirrorShield : template.mirrorShield);
        h.potions = sh ? sh.potions || 0 : 0;
        h.goldenBlade = !!(sh ? sh.goldenBlade : template.goldenBlade);
        h.pegasusOil = !!(sh ? sh.pegasusOil : template.pegasusOil);
        h.gripSandals = !!(sh ? sh.gripSandals : template.gripSandals);
        h.blueElixir = !!(sh ? sh.blueElixir : false);
        h.heroMail = !!(sh ? sh.heroMail : template.heroMail);
        h.blastPowder = !!(sh ? sh.blastPowder : template.blastPowder);
        this.humanHeroes.push(h);
      }

      const targetRoom = this.rooms[data.roomId] ? data.roomId : 'ow_start';
      const tr = this.rooms[targetRoom];
      this.enterRoom(targetRoom, { col: Math.floor((tr.cols || 20) / 2), row: Math.floor((tr.rows || 13) / 2) });
      this.state = 'playing';
      FB.ui.setOverlay('none');
      FB.ui.showDialog(null);
      FB.ui.renderHUD(this);
      this.showToast(`Loaded Slot ${slotIndex + 1} — ${this.room.name}`, 3.0);
      return true;
    }

    setActivePlayerCount(newCount) {
      const count = Math.max(1, Math.min(4, newCount));
      if (count === this.humanHeroes.length) return;
      this.selectedPlayerCount = count;
      FB.input.setPlayerCount(count);

      const leader = this.humanHeroes[0];
      if (!leader) return;

      if (count > this.humanHeroes.length) {
        // Drop-In new teammates right beside P1 with synced shared items & maxHp!
        this.spiritClone = null;
        for (let i = this.humanHeroes.length; i < count; i++) {
          const h = new FB.Hero(i, leader.x + (i % 2 === 0 ? -14 : 14), leader.y, false);
          h.maxHp = leader.maxHp;
          h.hp = leader.maxHp;
          h.items = [...leader.items];
          h.itemIdx = leader.itemIdx;
          h.temperedSword = leader.temperedSword;
          h.mirrorShield = leader.mirrorShield;
          this.humanHeroes.push(h);
          this.spawnParticles(h.x, h.y, h.profile.uiColor, 10, 55, { shape: 'star' });
        }
      } else {
        // Drop-Out excess players cleanly
        this.humanHeroes = this.humanHeroes.slice(0, count);
      }

      for (const h of this.humanHeroes) {
        h.showTag = count > 1;
      }
      this.saveProgress();
      FB.ui.renderHUD(this);
      FB.ui.syncPausePlayerButtons(count);
      this.showToast(`Active Party updated to ${count} Player${count > 1 ? 's' : ''}!`, 2.5);
    }

    returnToTitle() {
      if (this.state === 'playing' || this.state === 'paused') {
        this.saveProgress();
      }
      this.state = 'title';
      FB.audio.stopMusic();
      FB.ui.showDialog(null);
      FB.ui.renderSaveSlots(this);
      FB.ui.setOverlay('title');
    }

    togglePause(forceState) {
      if (this.state !== 'playing' && this.state !== 'paused') return;
      const shouldPause = forceState !== undefined ? forceState : this.state === 'playing';
      this.state = shouldPause ? 'paused' : 'playing';
      if (shouldPause) {
        this.saveProgress();
        FB.ui.syncPausePlayerButtons(this.humanHeroes.length);
      }
      FB.ui.setOverlay(shouldPause ? 'paused' : 'none');
    }

    respawnFromGameOver() {
      // Respawn at Sanctuary Courtyard or Dungeon Entrance with full hearts, keeping progress!
      let targetId = 'ow_start';
      if (this.room?.area === 'dungeon') targetId = 'dg_entry';
      else if (this.room?.area === 'frost') targetId = 'fs_entry';
      else if (this.room?.area === 'darkworld') targetId = 'dw_start';
      for (const h of this.humanHeroes) {
        h.downed = false;
        h.hp = h.maxHp;
        h.invuln = 1.2;
      }
      this.enterRoom(targetId, { col: 10, row: 7 });
      this.state = 'playing';
      FB.ui.setOverlay('none');
      this.showToast('The Four Blades rekindle your spirit!', 3.0);
    }

    showToast(msg, duration = 3.2) {
      FB.ui.showToast(msg, duration);
    }

    showDialog(msg) {
      this.activeDialog = msg;
      this.dialogTimer = 0.25;
      FB.ui.showDialog(msg);
    }

    transitionToRoom(dir, exitSpec, triggerHero) {
      if (!exitSpec) return;
      const targetId = typeof exitSpec === 'string' ? exitSpec : exitSpec.target;
      const dest = this.rooms?.[targetId];
      if (!dest) return;

      // Capture outgoing 640x416 viewport snapshot for smooth Zelda-style camera slide!
      if (typeof document !== 'undefined' && this.canvas) {
        if (!this.prevViewCanvas) {
          this.prevViewCanvas = document.createElement('canvas');
          this.prevViewCanvas.width = FB.RENDER_W;
          this.prevViewCanvas.height = FB.RENDER_H;
          this.prevViewCtx = this.prevViewCanvas.getContext('2d');
        }
        if (this.prevViewCtx) {
          this.prevViewCtx.clearRect(0, 0, FB.RENDER_W, FB.RENDER_H);
          this.prevViewCtx.drawImage(this.canvas, 0, 0);
        }
      }

      const dCols = dest.cols || dest.grid?.[0]?.length || FB.ROOM_COLS;
      const dRows = dest.rows || dest.grid?.length || FB.ROOM_ROWS;
      let spawnPos = null;
      if (typeof exitSpec === 'object' && exitSpec.targetCol !== undefined && exitSpec.targetRow !== undefined) {
        spawnPos = { col: exitSpec.targetCol, row: exitSpec.targetRow };
      } else {
        const refCol = triggerHero ? triggerHero.x / TS : this.roomCols / 2;
        const refRow = triggerHero ? triggerHero.y / TS : this.roomRows / 2;
        const clampC = Math.max(1.5, Math.min(dCols - 2.5, Math.round(refCol)));
        const clampR = Math.max(1.5, Math.min(dRows - 2.5, Math.round(refRow)));
        if (dir === 'north') {
          spawnPos = { col: dCols === this.roomCols ? clampC : Math.floor(dCols / 2) - 0.5, row: dRows - 2 };
        } else if (dir === 'south') {
          spawnPos = { col: dCols === this.roomCols ? clampC : Math.floor(dCols / 2) - 0.5, row: 1 };
        } else if (dir === 'west') {
          spawnPos = { col: dCols - 2, row: dRows === this.roomRows ? clampR : Math.floor(dRows / 2) };
        } else {
          spawnPos = { col: 1, row: dRows === this.roomRows ? clampR : Math.floor(dRows / 2) };
        }
      }

      this.enterRoom(targetId, spawnPos, { slideDir: dir });
    }

    enterRoom(roomId, spawnPos, opts = {}) {
      const room = this.rooms[roomId];
      if (!room) return;

      this.room = room;
      room.visited = true;
      this.projectiles = [];
      this.pickups = [];
      this.particles = [];
      this.floatingTexts = [];
      this.enemies = [];
      this.roomCacheKey = null;

      const rW = this.roomW;
      const rH = this.roomH;

      // Reposition heroes cleanly
      if (spawnPos) {
        const offsets = [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: -12, y: 0 },
          { x: 0, y: 10 },
        ];
        this.humanHeroes.forEach((h, idx) => {
          const off = offsets[idx] || { x: 0, y: 0 };
          let nx = spawnPos.col * TS + TS / 2 + off.x;
          let ny = spawnPos.row * TS + TS / 2 + off.y;
          // Keep strictly inside safe room bounds
          nx = Math.max(TS * 1.4, Math.min(rW - TS * 1.4, nx));
          ny = Math.max(TS * 1.4, Math.min(rH - TS * 1.4, ny));
          h.x = nx;
          h.y = ny;
          h.safeX = nx;
          h.safeY = ny;
          h.activeBoomerang = null;
          h.activeHookshot = null;
          h.hookZipping = false;
          h.knockTimer = 0;
          if (h.downed) {
            // Auto-revive with 2 hearts on room transition so co-op stays snappy
            h.downed = false;
            h.hp = Math.min(h.maxHp, 4);
          }
        });
        if (this.spiritClone && this.humanHeroes[0]) {
          this.spiritClone.x = Math.max(TS * 1.4, this.humanHeroes[0].x - 14);
          this.spiritClone.y = this.humanHeroes[0].y;
          this.spiritClone.cloneHold = false;
        }
      }

      this.updateCamera(true);

      // Sync persistent locks
      if (room.locks) {
        for (const [dir, lock] of Object.entries(room.locks)) {
          if (this.unlockedLocks.has(lock.id)) {
            this._openDoorTiles(room, dir);
          }
        }
      }

      // Spawn pedestals
      if (room.pedestals) {
        for (const ped of room.pedestals) {
          const key = `${ped.col},${ped.row}`;
          if (!room.claimedPedestals.has(key)) {
            this.pickups.push(
              new FB.Pickup('item_pedestal', ped.col * TS + 8, ped.row * TS + 6, {
                itemId: ped.itemId,
              })
            );
          }
        }
      }

      // Spawn hidden Heart Pieces if not yet collected
      if (room.heartPieces) {
        for (const hp of room.heartPieces) {
          if (!this.collectedHeartPieces.has(hp.id)) {
            this.pickups.push(
              new FB.Pickup('heart_piece', hp.col * TS + 8, hp.row * TS + 8, {
                heartPieceId: hp.id,
              })
            );
          }
        }
      }

      // Spawn enemies unless this room's boss is defeated or combat puzzle already cleared
      const roomBossDefeated =
        (room.id === 'dg_boss' && this.bossDefeated) ||
        (room.id === 'fs_boss' && this.frostBossDefeated) ||
        (room.id === 'ds_boss' && this.desertBossDefeated) ||
        (room.id === 'mg_boss' && this.magmaBossDefeated);
      const shouldSpawnEnemies =
        room.enemies &&
        !roomBossDefeated &&
        !(room.puzzle && room.puzzle.type === 'defeat_all' && room.puzzleSolved);

      if (shouldSpawnEnemies) {
        for (const spec of room.enemies) {
          this.enemies.push(
            new FB.Enemy(
              spec.type,
              spec.col * TS + 8,
              spec.row * TS + 8,
              this.humanHeroes.length,
              room.area || 'overworld'
            )
          );
        }
      }

      // Open Dark World Rift in Sanctuary Courtyard once Act I is cleared!
      if (room.id === 'ow_start' && this.act1Cleared) {
        room.grid[5][10] = T.PORTAL_DARK;
        room.portals = room.portals || [];
        if (!room.portals.some((p) => p.targetRoom === 'dw_start')) {
          room.portals.push({ col: 10, row: 5, targetRoom: 'dw_start', targetCol: 10, targetRow: 5 });
        }
      }

      // Boss Room Lockdown, Boss Intro Title Cards & Unique Area BGM!
      const midC = Math.floor(this.roomCols / 2);
      const midR = Math.floor(this.roomRows / 2);
      if (room.isBossRoom && room.id === 'dg_boss' && !this.bossDefeated) {
        this._setDoorTiles(room, 'south', T.DOOR_BARRED);
        FB.audio.play('bossRoar');
        FB.audio.playMusic('boss');
        FB.ui.showBossIntro?.('PALACE OF THE FOUR SEALS', 'SHADOW WRAITH — VAALOR');
        this.showToast('SHADOW WRAITH VAALOR — Break its dark orbs to expose the core!', 4.2);
      } else if (room.isBossRoom && room.id === 'dg_boss' && this.bossDefeated) {
        this._openDoorTiles(room, 'south');
        room.grid[midR][midC - 1] = T.TRIFORCE_ALTAR;
        room.grid[midR][midC] = T.TRIFORCE_ALTAR;
      } else if (room.isBossRoom && room.id === 'fs_boss' && !this.frostBossDefeated) {
        this._setDoorTiles(room, 'south', T.DOOR_BARRED);
        FB.audio.play('bossRoar');
        FB.audio.playMusic('boss');
        FB.ui.showBossIntro?.('CROWN OF THE FROST SPIRE', 'FROST SOVEREIGN — GLACIOR');
        this.showToast('FROST SOVEREIGN GLACIOR — Melt or parry its fury to shatter the spire!', 4.5);
      } else if (room.isBossRoom && room.id === 'fs_boss' && this.frostBossDefeated) {
        this._openDoorTiles(room, 'south');
        room.grid[midR][midC - 1] = T.TRIFORCE_ALTAR;
        room.grid[midR][midC] = T.TRIFORCE_ALTAR;
      } else if (room.isBossRoom && room.id === 'ds_boss' && !this.desertBossDefeated) {
        this._setDoorTiles(room, 'south', T.DOOR_BARRED);
        FB.audio.play('bossRoar');
        FB.audio.playMusic('boss');
        FB.ui.showBossIntro?.('SUNSPIRE SANCTUM', 'SOLAR SENTINEL — SOLKAR');
        this.showToast('SOLAR SENTINEL SOLKAR — Reflect its solar beams to shatter its core!', 4.5);
      } else if (room.isBossRoom && room.id === 'ds_boss' && this.desertBossDefeated) {
        this._openDoorTiles(room, 'south');
        room.grid[midR][midC - 1] = T.TRIFORCE_ALTAR;
        room.grid[midR][midC] = T.TRIFORCE_ALTAR;
      } else if (room.isBossRoom && room.id === 'mg_boss' && !this.magmaBossDefeated) {
        this._setDoorTiles(room, 'south', T.DOOR_BARRED);
        FB.audio.play('bossRoar');
        FB.audio.playMusic('boss');
        FB.ui.showBossIntro?.('HEART OF THE CALDERA', 'FORGE TITAN — IGNIS REX');
        this.showToast('FORGE TITAN IGNIS REX — Parry its molten charges & strike true!', 4.5);
      } else if (room.isBossRoom && room.id === 'mg_boss' && this.magmaBossDefeated) {
        this._openDoorTiles(room, 'south');
        room.grid[midR][midC - 1] = T.TRIFORCE_ALTAR;
        room.grid[midR][midC] = T.TRIFORCE_ALTAR;
      } else if (room.id === 'ow_shop' || room.area === 'shop') {
        FB.audio.playMusic('shop');
      } else if (room.area === 'village') {
        FB.audio.playMusic('village');
      } else if (room.area === 'frost') {
        FB.audio.playMusic('frost');
      } else if (room.area === 'desert' || room.area === 'desert_dungeon') {
        FB.audio.playMusic('desert');
      } else if (room.area === 'mountain' || room.area === 'magma') {
        FB.audio.playMusic('mountain');
      } else if (room.area === 'darkworld') {
        FB.audio.playMusic('darkworld');
      } else {
        FB.audio.playMusic(room.area === 'dungeon' ? 'dungeon' : 'overworld');
      }

      this.initRoomAtmosphere(room);

      if (opts.slideDir && this.prevViewCanvas) {
        this.slideTrans = { dir: opts.slideDir, elapsed: 0, duration: 0.32 };
        this.transitionOverlayAlpha = 0;
      } else {
        this.slideTrans = null;
        this.transitionOverlayAlpha = 0.85;
      }

      if (this.state === 'playing') {
        this.saveProgress();
      }
      FB.ui.renderHUD(this);
    }

    _setDoorTiles(room, dir, tileId) {
      const cols = room.cols || room.grid[0].length;
      const rows = room.rows || room.grid.length;
      const mc = Math.floor(cols / 2);
      const mr = Math.floor(rows / 2);
      if (dir === 'north') {
        room.grid[0][mc - 1] = tileId;
        room.grid[0][mc] = tileId;
      } else if (dir === 'south') {
        room.grid[rows - 1][mc - 1] = tileId;
        room.grid[rows - 1][mc] = tileId;
      } else if (dir === 'west') {
        room.grid[mr][0] = tileId;
        if (room.grid[mr + 1]) room.grid[mr + 1][0] = tileId;
      } else if (dir === 'east') {
        room.grid[mr][cols - 1] = tileId;
        if (room.grid[mr + 1]) room.grid[mr + 1][cols - 1] = tileId;
      }
    }

    _openDoorTiles(room, dir) {
      this._setDoorTiles(room, dir, T.DOOR_OPEN);
    }

    _floorTileForRoom(room, col, row, isPath = false) {
      if (!room) return isPath ? T.PATH : T.GRASS;
      const area = room.area || 'overworld';
      const grid = room.grid;
      const countAdj = (tileId) => {
        let n = 0;
        if (grid[row - 1]?.[col] === tileId) n++;
        if (grid[row + 1]?.[col] === tileId) n++;
        if (grid[row]?.[col - 1] === tileId) n++;
        if (grid[row]?.[col + 1] === tileId) n++;
        return n;
      };
      if (area === 'darkworld') {
        if (isPath || countAdj(T.DARK_PATH) >= 2) return T.DARK_PATH;
        return T.DARK_GRASS;
      }
      if (area === 'shop' || room.id === 'ow_shop') return T.SHOP_FLOOR;
      if (area === 'village') {
        return countAdj(T.TOWN_COBBLE) >= 2 ? T.TOWN_COBBLE : isPath ? T.PATH : T.GRASS;
      }
      if (area === 'desert') {
        return isPath || countAdj(T.SAND_PATH) >= 2 ? T.SAND_PATH : T.SAND;
      }
      if (area === 'mountain') return T.MOUNTAIN_GROUND;
      if (area === 'frost') {
        return countAdj(T.ICE_FLOOR) >= 2 ? T.ICE_FLOOR : T.DUNGEON_FLOOR;
      }
      if (area === 'dungeon' || area === 'desert_dungeon' || area === 'magma') return T.DUNGEON_FLOOR;
      if (isPath || countAdj(T.PATH) >= 2) return T.PATH;
      return T.GRASS;
    }

    spawnPickup(kind, x, y, extra) {
      this.pickups.push(new FB.Pickup(kind, x, y, extra));
    }

    spawnParticles(x, y, color, count = 6, speed = 55, opts = {}) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.35 + Math.random() * 0.85) * speed;
        this.particles.push(
          new FB.Particle(
            x,
            y,
            Math.cos(a) * s,
            Math.sin(a) * s - (opts.gravity ? 22 : 0),
            color,
            (opts.life || 0.26) + Math.random() * 0.24,
            (opts.size || 1.6) + Math.random() * 1.4,
            opts
          )
        );
      }
    }

    spawnRing(x, y, color, maxRadius = 26, life = 0.28) {
      this.particles.push(
        new FB.Particle(x, y, 0, 0, color, life, 2, {
          shape: 'ring',
          maxRadius,
        })
      );
    }

    addFloatingText(x, y, text, color = '#fde047') {
      this.floatingTexts.push(new FB.FloatingText(x, y, text, color));
    }

    loop(now) {
      const rawDt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));
      this.time += dt;

      FB.input.pollGamepads();
      if (this.state === 'title') {
        FB.ui.updateGamepadBanner(FB.input.connectedPads.length);
      }

      if (FB.input.isMapPressed() && (this.state === 'playing' || this.mapOpen)) {
        this.toggleMapDrawer();
      } else if (FB.input.isPausePressed()) {
        if (this.mapOpen) {
          this.toggleMapDrawer(false);
        } else if (this.state === 'playing' || this.state === 'paused') {
          this.togglePause();
        }
      }

      if (this.state === 'playing' && !this.mapOpen) {
        this.update(dt);
      } else if (this.state === 'title') {
        this.updateAtmosphere(dt);
      }

      this.render();
      FB.input.endFrame();
      requestAnimationFrame(this.loop);
    }

    update(dt) {
      FB.ui.update(dt);
      if (this.transitionOverlayAlpha > 0) {
        this.transitionOverlayAlpha = Math.max(0, this.transitionOverlayAlpha - dt * 3.8);
      }
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 22);
      }

      // Smooth Zelda-style sliding-camera room transition (pauses gameplay cleanly for 0.32s)
      if (this.slideTrans) {
        this.slideTrans.elapsed += dt;
        if (this.slideTrans.elapsed >= this.slideTrans.duration) {
          this.slideTrans = null;
        }
        return;
      }

      // Signpost / Chest dialog pause
      if (this.activeDialog) {
        this.dialogTimer = Math.max(0, this.dialogTimer - dt);
        if (this.dialogTimer <= 0) {
          for (let i = 0; i < this.humanHeroes.length; i++) {
            const inp = FB.input.getPlayerInput(i);
            if (inp.attackPressed || inp.interactPressed || inp.dashPressed) {
              this.activeDialog = null;
              FB.ui.showDialog(null);
              break;
            }
          }
        }
        return;
      }

      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }

      // Dramatic slow-motion boss shatter flourish!
      let simDt = dt;
      if (this.slowMoTimer > 0) {
        this.slowMoTimer = Math.max(0, this.slowMoTimer - dt);
        simDt = dt * 0.28;
      }

      this.elapsedTime += dt;

      // Update Heroes
      for (let i = 0; i < this.humanHeroes.length; i++) {
        this.updateHero(this.humanHeroes[i], FB.input.getPlayerInput(i), simDt);
      }

      // Update Solo Spirit Clone if active
      if (this.spiritClone) {
        this.updateSpiritClone(simDt);
      }

      // Smooth live camera tracking + co-op tether
      this.updateCamera(false, dt);

      // Multiplayer revive check
      this.updateMultiplayerRevive(simDt);

      // Game over check (all human heroes downed)
      if (this.humanHeroes.every((h) => h.downed)) {
        this.state = 'gameover';
        FB.audio.stopMusic();
        FB.ui.setOverlay('gameover');
        return;
      }

      // Update Enemies, Projectiles, Pickups, Puzzles, Particles & Ambient Weather
      this.updateEnemies(simDt);
      this.updateProjectiles(simDt);
      this.updatePickups(simDt);
      this.updatePuzzles();
      this.updateParticles(simDt);
      this.updateAtmosphere(simDt);

      // Refresh HUD ~10 times/sec for smooth hearts/rupees/minimap
      this.hudTick += dt;
      if (this.hudTick >= 0.1) {
        this.hudTick = 0;
        FB.ui.renderHUD(this);
      }
    }

    updateHero(hero, inp, dt) {
      if (hero.invuln > 0) hero.invuln -= dt;
      if (hero.swordTimer > 0) hero.swordTimer -= dt;
      if (hero.swordCooldown > 0) hero.swordCooldown -= dt;
      if (hero.spinTimer > 0) hero.spinTimer -= dt;
      if (hero.dashTimer > 0) hero.dashTimer -= dt;
      if (hero.dashCooldown > 0) hero.dashCooldown -= dt;
      if (hero.itemCooldown > 0) hero.itemCooldown -= dt;
      if (hero.itemAnimTimer > 0) hero.itemAnimTimer -= dt;
      if (hero.celebrateTimer > 0) hero.celebrateTimer -= dt;
      if (hero.parryFlash > 0) hero.parryFlash -= dt;
      if (hero.streakTimer > 0) {
        hero.streakTimer -= dt;
        if (hero.streakTimer <= 0) hero.streakCount = 0;
      }
      if (hero.comboTimer > 0) {
        hero.comboTimer -= dt;
        if (hero.comboTimer <= 0) {
          hero.comboStep = 0;
        }
      }

      // Decay Pegasus Roll afterimages
      if (hero.afterimages && hero.afterimages.length > 0) {
        for (const g of hero.afterimages) g.life -= dt;
        hero.afterimages = hero.afterimages.filter((g) => g.life > 0);
      }

      if (hero.downed) return;

      // Being carried overhead by a teammate!
      if (hero.carriedBy) {
        hero.x = hero.carriedBy.x;
        hero.y = hero.carriedBy.y - 12;
        hero.moving = false;
        return;
      }

      // Flying through the air after being tossed by a teammate (sails over pits/water!)
      if (hero.thrownTimer > 0) {
        hero.thrownTimer -= dt;
        const nx = hero.x + hero.thrownVx * dt;
        const ny = hero.y + hero.thrownVy * dt;
        const blocked =
          nx < TS ||
          nx > this.roomW - TS ||
          ny < TS ||
          ny > this.roomH - TS ||
          this.isSolidAt(Math.floor(nx / TS), Math.floor(ny / TS), true);
        if (blocked) {
          hero.thrownTimer = 0;
          this.spawnParticles(hero.x, hero.y, '#e2e8f0', 6, 40, { shape: 'dust' });
        } else {
          hero.x = nx;
          hero.y = ny;
        }
        return;
      }

      // Solo Four Swords Spirit Clone toggle (Q / Tab)
      if (hero.index === 0 && this.humanHeroes.length === 1 && inp.clonePressed) {
        this.toggleSpiritClone();
      }

      // Dedicated Lift / Throw (or Shop Buy!)
      if (inp.grabPressed) {
        this.handleHeroGrabOrThrow(hero);
      }

      // Cycle sub-weapon
      if (inp.cyclePressed) {
        hero.cycleItem();
        FB.audio.play('switch');
        const meta = FB.ITEM_META[hero.currentItem];
        if (meta) {
          this.addFloatingText(hero.x, hero.y - 12, meta.short, meta.color);
        }
        FB.ui.renderHUD(this);
      }

      // Dash / Pegasus Roll (drops or blocks if carrying)
      if (inp.dashPressed && !hero.carrying && hero.dashCooldown <= 0 && hero.dashTimer <= 0) {
        let ddx = inp.dx;
        let ddy = inp.dy;
        if (ddx === 0 && ddy === 0) {
          const dv = FB.DIR_VEC[hero.dir];
          ddx = dv.x;
          ddy = dv.y;
        }
        const len = Math.hypot(ddx, ddy) || 1;
        hero.dashDx = ddx / len;
        hero.dashDy = ddy / len;
        hero.dashTimer = FB.CONFIG.DASH_DURATION * (hero.pegasusOil ? 1.25 : 1.0);
        hero.dashCooldown = FB.CONFIG.DASH_COOLDOWN * (hero.pegasusOil ? 0.55 : 1.0);
        hero.dashDustTick = 0;
        FB.audio.play('dash');
        this.spawnParticles(hero.x, hero.y + 4, hero.pegasusOil ? '#7dd3fc' : '#e2e8f0', 6, 38, { shape: 'dust' });
      }

      // Sword attack + Charge Spin Attack (if carrying, pressing attack throws!)
      if (inp.attackPressed && hero.swordCooldown <= 0 && hero.spinTimer <= 0) {
        if (hero.carrying) {
          this.handleHeroGrabOrThrow(hero);
          hero.swordCooldown = 0.2;
        } else if (this.tryInteract(hero)) {
          hero.swordCooldown = 0.22;
        } else {
          this.startSwordSwing(hero);
        }
      }

      if (inp.attackDown && !hero.carrying && hero.spinTimer <= 0) {
        hero.spinCharge += dt;
        if (hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME && !hero.spinReadyNotified) {
          hero.spinReadyNotified = true;
          FB.audio.play('charge');
          this.spawnParticles(hero.x, hero.y, '#fde047', 7, 45, { shape: 'star' });
          this.spawnRing(hero.x, hero.y, '#fde047', 18, 0.22);
        }
      } else {
        if (hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME && !hero.carrying) {
          this.startSpinAttack(hero);
        }
        hero.spinCharge = 0;
        hero.spinReadyNotified = false;
      }

      // Sub-Item use
      if (inp.itemPressed && !hero.carrying && hero.itemCooldown <= 0 && hero.currentItem) {
        this.useHeroItem(hero);
      }

      // Velocity calculation
      let vx = 0;
      let vy = 0;
      if (hero.knockTimer > 0) {
        hero.knockTimer -= dt;
        vx = hero.knockX;
        vy = hero.knockY;
      } else if (hero.dashTimer > 0) {
        vx = hero.dashDx * FB.CONFIG.DASH_SPEED;
        vy = hero.dashDy * FB.CONFIG.DASH_SPEED;
        hero.dashDustTick += dt;
        if (hero.dashDustTick >= 0.032) {
          hero.dashDustTick = 0;
          hero.afterimages.push({ x: hero.x, y: hero.y, life: 0.14, maxLife: 0.14 });
          this.spawnParticles(hero.x, hero.y + 4, '#e2e8f0', 1, 20, { shape: 'dust', life: 0.2 });
        }
      } else {
        const carryMult = hero.carrying ? 0.82 : 1.0;
        const gripMult = hero.gripSandals ? 1.12 : 1.0;
        const speedMult = (hero.spinCharge > 0.15 ? 0.65 : hero.swordTimer > 0 ? 0.5 : 1.0) * carryMult * gripMult;
        vx = inp.dx * FB.CONFIG.PLAYER_SPEED * speedMult;
        vy = inp.dy * FB.CONFIG.PLAYER_SPEED * speedMult;
        if (inp.dx !== 0 || inp.dy !== 0) {
          if (Math.abs(inp.dx) > Math.abs(inp.dy)) {
            hero.dir = inp.dx < 0 ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            hero.dir = inp.dy < 0 ? FB.DIRS.UP : FB.DIRS.DOWN;
          }
        }

        // Slippery Ice Floor momentum glide (negated by Oasis Bazaar Grip Sandals!)
        const underCol = Math.floor(hero.x / TS);
        const underRow = Math.floor(hero.y / TS);
        const onIce = this.room?.grid[underRow]?.[underCol] === T.ICE_FLOOR;
        if (onIce && !hero.hookZipping && !hero.gripSandals) {
          const blend = Math.min(1, dt * (inp.dx !== 0 || inp.dy !== 0 ? 3.8 : 2.1));
          hero.iceVx += (vx - hero.iceVx) * blend;
          hero.iceVy += (vy - hero.iceVy) * blend;
          if (Math.hypot(hero.iceVx, hero.iceVy) < 3 && inp.dx === 0 && inp.dy === 0) {
            hero.iceVx = 0;
            hero.iceVy = 0;
          }
          vx = hero.iceVx;
          vy = hero.iceVy;
          if (Math.hypot(vx, vy) > 25 && Math.random() < 0.18) {
            this.spawnParticles(hero.x, hero.y + 5, '#bae6fd', 1, 16, { shape: 'dust', life: 0.18, size: 1.6 });
          }
        } else {
          hero.iceVx = vx;
          hero.iceVy = vy;
        }
      }

      hero.moving = Math.hypot(vx, vy) > 4;
      if (hero.moving && hero.dashTimer <= 0) {
        hero.walkPhase += dt * 11.5;
      } else if (!hero.moving) {
        hero.walkPhase = 0;
      }
      hero.pushing = false;
      this.moveHeroWithCollision(hero, vx * dt, vy * dt, dt);
      if (hero.pushTimer > 0.04) {
        hero.pushing = true;
      }

      // Keep carried bomb or stunned enemy synced overhead!
      if (hero.carrying) {
        if (hero.carrying.kind === 'bomb') {
          const b = hero.carrying.ref;
          if (!b || !b.alive) {
            hero.carrying = null;
          } else {
            b.x = hero.x;
            b.y = hero.y - 12;
            b.vx = 0;
            b.vy = 0;
          }
        } else if (hero.carrying.kind === 'enemy') {
          const e = hero.carrying.ref;
          if (!e || !e.alive) {
            hero.carrying = null;
          } else {
            e.x = hero.x;
            e.y = hero.y - 12;
            e.stunTimer = Math.max(e.stunTimer, 0.25);
          }
        }
      }

      // Active sword / spin hitboxes
      if (hero.swordTimer > 0) {
        this.checkSwordHits(hero, false);
      } else if (hero.spinTimer > 0) {
        this.checkSwordHits(hero, true);
      }

      // Tile effects (pits, spikes, fairy pool, portals, room transitions, Triforce altar)
      this.checkHeroTileTriggers(hero, dt);
    }

    toggleSpiritClone() {
      const p1 = this.humanHeroes[0];
      if (!this.spiritClone) {
        this.spiritClone = new FB.Hero(2, p1.x - 14, p1.y, true);
        this.spiritClone.showTag = true;
        FB.audio.play('fairy');
        this.spawnParticles(this.spiritClone.x, this.spiritClone.y, '#67e8f9', 10, 55, { shape: 'star' });
        this.spawnRing(this.spiritClone.x, this.spiritClone.y, '#67e8f9', 18, 0.26);
        this.showToast('Spirit Clone summoned! Press Q to anchor it on switches, Q again to dismiss.', 2.8);
      } else if (!this.spiritClone.cloneHold) {
        this.spiritClone.cloneHold = true;
        FB.audio.play('switch');
        this.spawnRing(this.spiritClone.x, this.spiritClone.y + 4, '#67e8f9', 16, 0.25);
        this.addFloatingText(this.spiritClone.x, this.spiritClone.y - 10, 'HOLD', '#67e8f9');
      } else {
        this.spawnParticles(this.spiritClone.x, this.spiritClone.y, '#67e8f9', 8, 45, { shape: 'star' });
        this.spiritClone = null;
        FB.audio.play('dash');
      }
      FB.ui.renderHUD(this);
    }

    updateSpiritClone(dt) {
      const clone = this.spiritClone;
      const leader = this.humanHeroes[0];
      if (!clone || !leader || leader.downed) return;

      if (clone.swordTimer > 0) clone.swordTimer -= dt;
      if (clone.spinTimer > 0) clone.spinTimer -= dt;

      if (!clone.cloneHold) {
        const dv = FB.DIR_VEC[leader.dir];
        const targetX = leader.x - dv.x * 16;
        const targetY = leader.y - dv.y * 16;
        const dx = targetX - clone.x;
        const dy = targetY - clone.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          const spd = Math.min(FB.CONFIG.PLAYER_SPEED * 1.15, dist * 7);
          const vx = (dx / dist) * spd;
          const vy = (dy / dist) * spd;
          clone.moving = true;
          clone.walkPhase += dt * 11.5;
          clone.dir = leader.dir;
          this.moveHeroWithCollision(clone, vx * dt, vy * dt, dt);
        } else {
          clone.moving = false;
        }
      } else {
        clone.moving = false;
      }

      // Mirror leader sword swings & combo step!
      if (leader.swordTimer > FB.CONFIG.SWORD_DURATION - 0.03 && clone.swordTimer <= 0) {
        clone.dir = leader.dir;
        clone.comboStep = leader.comboStep;
        clone.swordTimer = FB.CONFIG.SWORD_DURATION;
        clone.swordHitSet = new Set();
      }
      if (clone.swordTimer > 0) {
        this.checkSwordHits(clone, false);
      }
    }

    updateMultiplayerRevive(dt) {
      if (this.humanHeroes.length < 2) return;
      for (const fallen of this.humanHeroes) {
        if (!fallen.downed) continue;
        let rescuer = null;
        for (const ally of this.humanHeroes) {
          if (ally === fallen || ally.downed) continue;
          if (Math.hypot(ally.x - fallen.x, ally.y - fallen.y) < 22) {
            rescuer = ally;
            break;
          }
        }
        if (rescuer) {
          fallen.reviveProgress += dt / 1.5;
          if (fallen.reviveProgress >= 1) {
            fallen.downed = false;
            fallen.hp = Math.ceil(fallen.maxHp * 0.5);
            fallen.invuln = 1.4;
            fallen.reviveProgress = 0;
            rescuer.revives += 1;
            FB.audio.play('revive');
            this.spawnParticles(fallen.x, fallen.y, '#fde047', 12, 65, { shape: 'star' });
            this.spawnRing(fallen.x, fallen.y, '#4ade80', 22, 0.3);
            this.addFloatingText(fallen.x, fallen.y - 10, 'REVIVED!', '#4ade80');
          }
        } else {
          fallen.reviveProgress = Math.max(0, fallen.reviveProgress - dt * 0.6);
        }
      }
    }

    startSwordSwing(hero) {
      if (hero.comboTimer > 0) {
        hero.comboStep = (hero.comboStep + 1) % 3;
      } else {
        hero.comboStep = 0;
      }
      hero.comboTimer = FB.CONFIG.SWORD_COMBO_WINDOW;
      hero.swordTimer = FB.CONFIG.SWORD_DURATION;
      hero.swordCooldown = FB.CONFIG.SWORD_COOLDOWN;
      hero.swordHitSet = new Set();

      const sfx = hero.comboStep === 2 ? 'sword3' : hero.comboStep === 1 ? 'sword2' : 'sword';
      FB.audio.play(sfx);

      // Extra golden spark burst on Combo Hit 3 (Heroic Thrust Finisher!)
      if (hero.comboStep === 2) {
        const dv = FB.DIR_VEC[hero.dir] || FB.DIR_VEC[0];
        this.spawnParticles(hero.x + dv.x * 16, hero.y + dv.y * 16, '#fde047', 6, 55, { shape: 'spark', life: 0.18 });

        // Full-Health Master Sword Beam (with Tempered Blade or Golden Master Blade!)
        if ((hero.temperedSword || hero.goldenBlade) && hero.hp >= hero.maxHp && !hero.isClone) {
          this.projectiles.push(
            new FB.Projectile({
              kind: 'beam',
              x: hero.x + dv.x * 14,
              y: hero.y + dv.y * 14,
              vx: dv.x * 235,
              vy: dv.y * 235,
              owner: hero,
              life: 0.95,
              damage: hero.goldenBlade ? 4 : 3,
              radius: 6,
            })
          );
          FB.audio.play('beam');
        }
      }
    }

    startSpinAttack(hero) {
      hero.spinTimer = FB.CONFIG.SPIN_DURATION;
      hero.swordCooldown = 0.36;
      hero.swordHitSet = new Set();

      // Check for Synced Four-Blade Hurricane Finisher with a nearby ally (or Spirit Clone!)
      const partner = this.allHeroes.find(
        (other) =>
          other !== hero &&
          !other.downed &&
          Math.hypot(other.x - hero.x, other.y - hero.y) < 56 &&
          (other.isClone || other.spinTimer > 0 || other.spinCharge > 0.2)
      );

      if (partner) {
        this.triggerFourBladeHurricane(hero, partner);
        return;
      }

      FB.audio.play('spin');
      this.spawnParticles(hero.x, hero.y, '#fde047', 10, 75, { shape: 'star' });
      this.spawnRing(hero.x, hero.y, '#fde047', 26, 0.3);
    }

    triggerFourBladeHurricane(hero, partner) {
      const cx = (hero.x + partner.x) * 0.5;
      const cy = (hero.y + partner.y) * 0.5;
      const radius = 52;
      partner.spinTimer = FB.CONFIG.SPIN_DURATION;

      FB.audio.play('hurricane');
      this.screenShake = Math.max(this.screenShake, 5);
      this.hitstop = Math.max(this.hitstop, 0.055);
      this.spawnRing(cx, cy, '#fde047', radius, 0.36);
      this.spawnRing(cx, cy, '#4ade80', radius - 10, 0.3);
      this.spawnParticles(cx, cy, '#fde047', 18, 105, { shape: 'star' });
      this.spawnParticles(cx, cy, '#67e8f9', 14, 90, { shape: 'spark' });
      this.addFloatingText(cx, cy - 14, 'FOUR-BLADE HURRICANE!', '#fde047');

      // Clear enemy projectiles in hurricane radius
      for (const p of this.projectiles) {
        if (p.alive && p.fromEnemy && Math.hypot(p.x - cx, p.y - cy) < radius) {
          p.alive = false;
          this.spawnParticles(p.x, p.y, '#fef08a', 4, 45, { shape: 'spark' });
        }
      }

      // Deal massive AoE damage to all enemies in range (pierces boss orbs!)
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - cx, e.y - cy) < radius + e.w * 0.5) {
          e.hit(6, cx, cy, hero, this, { ignoreOrbs: true, stun: 0.9 });
        }
      }
    }

    handleHeroGrabOrThrow(hero) {
      const dv = FB.DIR_VEC[hero.dir] || FB.DIR_VEC[0];

      // 1. If already carrying something -> THROW IT!
      if (hero.carrying) {
        const carried = hero.carrying;
        hero.carrying = null;
        FB.audio.play('throw');

        if (carried.kind === 'pot') {
          this.projectiles.push(
            new FB.Projectile({
              kind: 'thrown_pot',
              x: hero.x + dv.x * 8,
              y: hero.y + dv.y * 8,
              vx: dv.x * 195,
              vy: dv.y * 195,
              owner: hero,
              life: 0.45,
              damage: 4,
              radius: 6,
            })
          );
        } else if (carried.kind === 'bomb' && carried.ref && carried.ref.alive) {
          const b = carried.ref;
          b.x = hero.x + dv.x * 10;
          b.y = hero.y + dv.y * 10;
          b.vx = dv.x * 165;
          b.vy = dv.y * 165;
        } else if (carried.kind === 'enemy' && carried.ref && carried.ref.alive) {
          const e = carried.ref;
          this.projectiles.push(
            new FB.Projectile({
              kind: 'thrown_enemy',
              x: hero.x + dv.x * 10,
              y: hero.y + dv.y * 10,
              vx: dv.x * 185,
              vy: dv.y * 185,
              owner: hero,
              life: 0.42,
              damage: 4,
              radius: 8,
              payload: e,
            })
          );
        } else if (carried.kind === 'hero' && carried.ref) {
          const ally = carried.ref;
          ally.carriedBy = null;
          ally.x = hero.x + dv.x * 10;
          ally.y = hero.y + dv.y * 10;
          ally.thrownTimer = 0.28;
          ally.thrownVx = dv.x * 175;
          ally.thrownVy = dv.y * 175;
          ally.cloneHold = false;
        }
        return true;
      }

      // 2. Check Sanctuary Shop buy first if standing near shop pedestal
      if (this.tryBuyShopItem(hero)) {
        return true;
      }

      // 3. Lift live Bomb nearby
      for (const p of this.projectiles) {
        if (p.alive && p.kind === 'bomb' && Math.hypot(p.x - hero.x, p.y - hero.y) < 22) {
          hero.carrying = { kind: 'bomb', ref: p };
          FB.audio.play('lift');
          return true;
        }
      }

      // 4. Lift stunned non-boss Enemy nearby
      for (const e of this.enemies) {
        if (
          e.alive &&
          e.type !== 'boss' &&
          e.type !== 'frost_boss' &&
          e.stunTimer > 0 &&
          Math.hypot(e.x - hero.x, e.y - hero.y) < 24
        ) {
          hero.carrying = { kind: 'enemy', ref: e };
          FB.audio.play('lift');
          this.addFloatingText(hero.x, hero.y - 12, 'LIFT!', '#fde047');
          return true;
        }
      }

      // 5. Lift adjacent Pot tile
      const pc = Math.floor((hero.x + dv.x * 13) / TS);
      const pr = Math.floor((hero.y + dv.y * 13) / TS);
      if (pc >= 0 && pc < this.roomCols && pr >= 0 && pr < this.roomRows) {
        if (this.room.grid[pr][pc] === T.POT) {
          this.room.grid[pr][pc] = this._floorTileForRoom(this.room, pc, pr, false);
          hero.carrying = { kind: 'pot', ref: null };
          FB.audio.play('lift');
          return true;
        }
      }

      // 6. Lift Teammate or Solo Spirit Clone!
      for (const ally of this.allHeroes) {
        if (
          ally !== hero &&
          !ally.downed &&
          !ally.carriedBy &&
          !ally.carrying &&
          Math.hypot(ally.x - hero.x, ally.y - hero.y) < 20
        ) {
          hero.carrying = { kind: 'hero', ref: ally };
          ally.carriedBy = hero;
          FB.audio.play('lift');
          this.addFloatingText(hero.x, hero.y - 14, 'TOSS READY!', '#67e8f9');
          return true;
        }
      }

      return false;
    }

    dropCarried(hero) {
      if (!hero.carrying) return;
      const c = hero.carrying;
      hero.carrying = null;
      if (c.kind === 'hero' && c.ref) {
        c.ref.carriedBy = null;
        c.ref.x = hero.x;
        c.ref.y = hero.y;
      } else if (c.kind === 'pot') {
        FB.audio.play('pot');
        this.spawnParticles(hero.x, hero.y, '#d49461', 6, 55, { shape: 'spark', gravity: 130 });
      }
    }

    tryBuyShopItem(hero) {
      if (!this.room || !this.room.shopItems) return false;
      for (const slot of this.room.shopItems) {
        const sx = slot.col * TS + 8;
        const sy = slot.row * TS + 8;
        if (Math.hypot(hero.x - sx, hero.y - sy) < 22) {
          const item = FB.SHOP_CATALOG.find((c) => c.id === slot.catalogId);
          if (!item) return false;

          if (item.id === 'mirror_shield' && hero.mirrorShield) {
            this.showToast('You already wield the Mirror Shield!', 2.0);
            return true;
          }
          if (item.id === 'tempered_sword' && (hero.temperedSword || hero.goldenBlade)) {
            this.showToast('Your blade is already Tempered!', 2.0);
            return true;
          }
          if (item.id === 'golden_blade' && hero.goldenBlade) {
            this.showToast('You already wield the Golden Master Blade!', 2.0);
            return true;
          }
          if (item.id === 'pegasus_oil' && hero.pegasusOil) {
            this.showToast('Pegasus Oil is already active!', 2.0);
            return true;
          }
          if (item.id === 'grip_sandals' && hero.gripSandals) {
            this.showToast('You are already wearing Grip Sandals!', 2.0);
            return true;
          }
          if (item.id === 'blue_elixir' && hero.blueElixir) {
            this.showToast('You already carry a Blue Elixir!', 2.0);
            return true;
          }
          if (item.id === 'hero_mail' && hero.heroMail) {
            this.showToast("You are already wearing Hero's Mail Armor!", 2.0);
            return true;
          }
          if (item.id === 'blast_powder' && hero.blastPowder) {
            this.showToast('Blast Powder is already upgrading your Bombs!', 2.0);
            return true;
          }
          if (item.id === 'heal' && hero.hp >= hero.maxHp) {
            this.showToast('Your hearts are already full!', 1.8);
            return true;
          }
          if (item.id === 'potion' && hero.potions >= 2) {
            this.showToast('You can carry up to 2 Red Potions at once!', 2.0);
            return true;
          }
          if (hero.rupees < item.cost) {
            FB.audio.play('clink');
            this.showToast(`Need ${item.cost} Rupees for ${item.name} (you have ${hero.rupees}).`, 2.4);
            return true;
          }

          hero.rupees -= item.cost;
          if (item.id === 'heal') {
            hero.hp = hero.maxHp;
          } else if (item.id === 'potion') {
            hero.potions = (hero.potions || 0) + 1;
          } else if (item.id === 'mirror_shield') {
            for (const h of this.humanHeroes) h.mirrorShield = true;
          } else if (item.id === 'tempered_sword') {
            for (const h of this.humanHeroes) h.temperedSword = true;
          } else if (item.id === 'golden_blade') {
            for (const h of this.humanHeroes) {
              h.goldenBlade = true;
              h.temperedSword = true;
            }
          } else if (item.id === 'pegasus_oil') {
            for (const h of this.humanHeroes) h.pegasusOil = true;
          } else if (item.id === 'grip_sandals') {
            for (const h of this.humanHeroes) h.gripSandals = true;
          } else if (item.id === 'blue_elixir') {
            hero.blueElixir = true;
          } else if (item.id === 'hero_mail') {
            for (const h of this.humanHeroes) h.heroMail = true;
          } else if (item.id === 'blast_powder') {
            for (const h of this.humanHeroes) h.blastPowder = true;
          }

          hero.celebrateTimer = 1.0;
          hero.celebrateColor = item.color;
          FB.audio.play('buy');
          this.spawnParticles(sx, sy, item.color, 14, 65, { shape: 'star' });
          this.spawnRing(sx, sy, '#fde047', 22, 0.3);
          this.showDialog(`Purchased ${item.name}! ${item.desc}`);
          this.saveProgress();
          FB.ui.renderHUD(this);
          return true;
        }
      }
      return false;
    }

    tryInteract(hero) {
      if (this.tryBuyShopItem(hero)) return true;

      const dv = FB.DIR_VEC[hero.dir];
      const fx = hero.x + dv.x * 13;
      const fy = hero.y + dv.y * 13;
      const col = Math.floor(fx / TS);
      const row = Math.floor(fy / TS);
      if (col < 0 || col >= this.roomCols || row < 0 || row >= this.roomRows) return false;
      const tile = this.room.grid[row][col];

      // Signpost
      if (tile === T.SIGN && this.room.signs) {
        const sign = this.room.signs.find((s) => s.col === col && s.row === row);
        if (sign) {
          FB.audio.play('switch');
          this.showDialog(sign.text);
          return true;
        }
      }

      // Talking Villagers, Innkeepers & Arena Master!
      if (tile === T.NPC_VILLAGER) {
        const npc = this.room.npcs?.find((n) => n.col === col && n.row === row);
        if (npc?.arenaMode && this.interactArenaNpc) {
          return this.interactArenaNpc(npc, hero);
        }
        if (npc?.heals) {
          for (const h of this.humanHeroes) h.hp = h.maxHp;
          FB.audio.play('fairy');
          this.spawnParticles(hero.x, hero.y, '#7dd3fc', 14, 65, { shape: 'star' });
          this.addFloatingText(hero.x, hero.y - 10, 'RESTED!', '#7dd3fc');
          FB.ui.renderHUD(this);
        } else {
          FB.audio.play('switch');
        }
        this.showDialog(
          npc?.text ||
            'VILLAGER: Welcome, traveler! Explore the woods, lakes, desert, and volcanic peaks beyond Sanctuary Haven!'
        );
        return true;
      }

      // Village Fountain full heal!
      if (tile === T.FOUNTAIN) {
        for (const h of this.humanHeroes) h.hp = h.maxHp;
        FB.audio.play('fairy');
        this.spawnParticles(col * TS + 8, row * TS + 8, '#7dd3fc', 16, 70, { shape: 'star' });
        this.addFloatingText(hero.x, hero.y - 10, 'FULL HEAL!', '#7dd3fc');
        this.showToast('The crystal fountain restored all heroes to full hearts!', 2.4);
        FB.ui.renderHUD(this);
        return true;
      }

      // Merchant greeting
      if (tile === T.MERCHANT || tile === T.SHOP_COUNTER) {
        FB.audio.play('switch');
        this.showDialog(
          this.room.merchantText ||
            'SANCTUARY MERCHANT: Welcome, Heroes! Walk up to any pedestal and press Attack or F to purchase upgrades with your Rupees!'
        );
        return true;
      }

      // Chests
      if (tile === T.CHEST_CLOSED || tile === T.BIG_CHEST_CLOSED) {
        this.openChest(col, row, tile === T.BIG_CHEST_CLOSED, hero);
        return true;
      }

      return false;
    }

    openChest(col, row, isBig, hero) {
      this.room.grid[row][col] = isBig ? T.BIG_CHEST_OPEN : T.CHEST_OPEN;
      this.room.openedChests.add(`${col},${row}`);
      FB.audio.play('chest');
      this.spawnParticles(col * TS + 8, row * TS + 8, '#fde047', 16, 70, { shape: 'star' });
      this.spawnRing(col * TS + 8, row * TS + 8, '#fde047', 26, 0.35);

      let spec = null;
      if (this.room.chests) {
        spec = this.room.chests.find((c) => c.col === col && c.row === row);
      }
      if (!spec && this.room.puzzle?.spawnChest?.col === col && this.room.puzzle?.spawnChest?.row === row) {
        spec = this.room.puzzle.spawnChest;
      }
      if (!spec && this.room.puzzle?.spawnBigChest?.col === col && this.room.puzzle?.spawnBigChest?.row === row) {
        spec = this.room.puzzle.spawnBigChest;
      }

      const reward = spec ? spec.reward : 'rupee_50';
      let rewardColor = '#fde047';
      if (reward === 'small_key') {
        this.smallKeys += 1;
      } else if (reward === 'boss_key') {
        this.hasBossKey = true;
        rewardColor = '#f59e0b';
      } else if (reward === 'frost_small_key') {
        this.frostSmallKeys += 1;
        rewardColor = '#38bdf8';
      } else if (reward === 'frost_boss_key') {
        this.hasFrostBossKey = true;
        rewardColor = '#38bdf8';
      } else if (reward === 'heart_container') {
        rewardColor = '#ef4444';
        for (const h of this.humanHeroes) {
          h.maxHp += 2;
          h.hp = h.maxHp;
        }
      } else if (reward === 'rupee_50') {
        rewardColor = '#a855f7';
        hero.rupees += 50;
        for (const h of this.humanHeroes) h.heal(6);
      } else if (reward === 'rupee_100') {
        rewardColor = '#fde047';
        hero.rupees += 100;
        for (const h of this.humanHeroes) h.hp = h.maxHp;
      }

      if (hero) {
        hero.celebrateTimer = 1.1;
        hero.celebrateColor = rewardColor;
      }

      this.showDialog(spec ? spec.label : 'Found a Treasure Chest! +50 Rupees!');
      FB.ui.renderHUD(this);
    }

    useHeroItem(hero) {
      const item = hero.currentItem;
      const dv = FB.DIR_VEC[hero.dir];

      if (item === FB.ITEMS.BOOMERANG) {
        if (hero.activeBoomerang && hero.activeBoomerang.alive) return;
        const proj = new FB.Projectile({
          kind: 'boomerang',
          x: hero.x + dv.x * 8,
          y: hero.y + dv.y * 8,
          vx: dv.x * 165,
          vy: dv.y * 165,
          owner: hero,
          life: 0.42,
          damage: 1,
          radius: 6,
        });
        hero.activeBoomerang = proj;
        hero.itemCooldown = 0.25;
        hero.itemAnimTimer = 0.18;
        hero.lastItemUsed = item;
        this.projectiles.push(proj);
        FB.audio.play('boomerang');
      } else if (item === FB.ITEMS.BOMB) {
        const proj = new FB.Projectile({
          kind: 'bomb',
          x: hero.x + dv.x * 12,
          y: hero.y + dv.y * 12,
          vx: 0,
          vy: 0,
          owner: hero,
          life: 1.35,
          damage: 5,
          radius: 7,
        });
        hero.itemCooldown = 0.55;
        hero.itemAnimTimer = 0.18;
        hero.lastItemUsed = item;
        this.projectiles.push(proj);
        FB.audio.play('bombPlace');
      } else if (item === FB.ITEMS.BOW) {
        const proj = new FB.Projectile({
          kind: 'arrow',
          x: hero.x + dv.x * 10,
          y: hero.y + dv.y * 10,
          vx: dv.x * 230,
          vy: dv.y * 230,
          owner: hero,
          life: 1.2,
          damage: 3,
          radius: 4,
        });
        hero.itemCooldown = 0.34;
        hero.itemAnimTimer = 0.22;
        hero.lastItemUsed = item;
        this.projectiles.push(proj);
        FB.audio.play('arrow');
      } else if (item === FB.ITEMS.FIREROD) {
        const proj = new FB.Projectile({
          kind: 'fireball',
          x: hero.x + dv.x * 10,
          y: hero.y + dv.y * 10,
          vx: dv.x * 155,
          vy: dv.y * 155,
          owner: hero,
          life: 1.1,
          damage: 3,
          radius: 6,
        });
        hero.itemCooldown = 0.4;
        hero.itemAnimTimer = 0.24;
        hero.lastItemUsed = item;
        this.projectiles.push(proj);
        FB.audio.play('fire');
      } else if (item === FB.ITEMS.HOOKSHOT) {
        if (hero.activeHookshot && hero.activeHookshot.alive) return;
        const proj = new FB.Projectile({
          kind: 'hookshot',
          x: hero.x + dv.x * 8,
          y: hero.y + dv.y * 8,
          vx: dv.x * 260,
          vy: dv.y * 260,
          owner: hero,
          life: 0.46,
          damage: 2,
          radius: 5,
        });
        proj.latched = false;
        hero.activeHookshot = proj;
        hero.itemCooldown = 0.32;
        hero.itemAnimTimer = 0.28;
        hero.lastItemUsed = item;
        this.projectiles.push(proj);
        FB.audio.play('hookshot');
      } else if (item === FB.ITEMS.MIRROR) {
        hero.itemCooldown = 0.7;
        this.useMagicMirror(hero);
      }
    }

    _findSafeTileNear(room, targetCol, targetRow) {
      const cols = room.cols || room.grid?.[0]?.length || FB.ROOM_COLS;
      const rows = room.rows || room.grid?.length || FB.ROOM_ROWS;
      const clampC = Math.max(1, Math.min(cols - 2, Math.round(targetCol)));
      const clampR = Math.max(1, Math.min(rows - 2, Math.round(targetRow)));
      const isWalkable = (c, r) => {
        if (c < 1 || c >= cols - 1 || r < 1 || r >= rows - 1) return false;
        const t = room.grid[r][c];
        return !FB.SOLID_TILES.has(t) && t !== T.PIT && t !== T.SPIKES;
      };
      if (isWalkable(clampC, clampR)) return { col: clampC, row: clampR };
      for (let rad = 1; rad <= 8; rad++) {
        for (let dr = -rad; dr <= rad; dr++) {
          for (let dc = -rad; dc <= rad; dc++) {
            if (isWalkable(clampC + dc, clampR + dr)) {
              return { col: clampC + dc, row: clampR + dr };
            }
          }
        }
      }
      return { col: Math.floor(cols / 2), row: Math.floor(rows / 2) };
    }

    useMagicMirror(hero) {
      if (!this.room) return false;
      FB.audio.play('mirror');
      this.spawnRing(hero.x, hero.y, '#c084fc', 26, 0.35);
      this.spawnParticles(hero.x, hero.y, '#e9d5ff', 14, 70, { shape: 'star' });

      // Light World <-> Dark World mirrored warp!
      if (this.room.mirrorTarget && this.rooms[this.room.mirrorTarget]) {
        const destRoom = this.rooms[this.room.mirrorTarget];
        const curCol = Math.floor(hero.x / TS);
        const curRow = Math.floor(hero.y / TS);
        const safe = this._findSafeTileNear(destRoom, curCol, curRow);
        this.enterRoom(destRoom.id, safe);
        this.showToast(`Magic Mirror warped you to ${destRoom.name}!`, 2.6);
        return true;
      }

      // Inside dungeons -> classic ALttP escape to dungeon entrance!
      if (this.room.area === 'dungeon') {
        this.enterRoom('dg_entry', { col: 10, row: 9 });
        this.showToast('Magic Mirror returned you to the Palace Entrance!', 2.4);
        return true;
      }
      if (this.room.area === 'frost') {
        this.enterRoom('fs_entry', { col: 10, row: 9 });
        this.showToast('Magic Mirror returned you to the Frost Spire Entrance!', 2.4);
        return true;
      }

      this.showToast('The Magic Mirror shimmers softly here.', 2.0);
      return false;
    }

    completeAct1() {
      if (this.act1Cleared) {
        this.enterRoom('ow_start', { col: 10, row: 6 });
        return;
      }
      this.act1Cleared = true;
      for (const h of this.humanHeroes) {
        h.grantItem(FB.ITEMS.MIRROR);
        h.hp = h.maxHp;
        h.celebrateTimer = 1.4;
        h.celebrateColor = '#c084fc';
      }
      FB.audio.play('victory');
      this.enterRoom('ow_start', { col: 10, row: 6 });
      this.saveProgress();
      this.showDialog(
        'ACT I COMPLETE! Vaalor is vanquished and you claimed the MAGIC MIRROR! Use the Magic Mirror (Item) or step into the Dark Rift ahead to enter the Dark World, claim the Hookshot in Cursed Thicket (West), and conquer the Frost Spire (North)!'
      );
    }

    isSolidAt(col, row, flying = false) {
      if (col < 0 || col >= this.roomCols || row < 0 || row >= this.roomRows) return false;
      const tile = this.room.grid[row][col];
      if (flying) {
        return tile === T.DUNGEON_WALL || tile === T.STONE_WALL || tile === T.TREE;
      }
      return FB.SOLID_TILES.has(tile);
    }

    moveHeroWithCollision(hero, dx, dy, dt) {
      const half = 5;

      // X-axis movement + ALttP corner nudging
      if (dx !== 0) {
        const nx = hero.x + dx;
        const cLeft = Math.floor((nx - half) / TS);
        const cRight = Math.floor((nx + half) / TS);
        const rTop = Math.floor((hero.y - half) / TS);
        const rBot = Math.floor((hero.y + half) / TS);
        const checkCol = dx > 0 ? cRight : cLeft;

        const topBlocked = this.isSolidAt(checkCol, rTop);
        const botBlocked = this.isSolidAt(checkCol, rBot);

        if (!topBlocked && !botBlocked) {
          hero.x = nx;
          hero.pushTimer = 0;
        } else {
          // Corner nudge!
          if (topBlocked && !botBlocked) {
            hero.y += 45 * dt;
          } else if (botBlocked && !topBlocked) {
            hero.y -= 45 * dt;
          }
          // Try unlock door or push block
          this.handleHeroBump(hero, checkCol, Math.floor(hero.y / TS), Math.sign(dx), 0, dt);
        }
      }

      // Y-axis movement + ALttP corner nudging
      if (dy !== 0) {
        const ny = hero.y + dy;
        const cLeft = Math.floor((hero.x - half) / TS);
        const cRight = Math.floor((hero.x + half) / TS);
        const rTop = Math.floor((ny - half) / TS);
        const rBot = Math.floor((ny + half) / TS);
        const checkRow = dy > 0 ? rBot : rTop;

        const leftBlocked = this.isSolidAt(cLeft, checkRow);
        const rightBlocked = this.isSolidAt(cRight, checkRow);

        if (!leftBlocked && !rightBlocked) {
          hero.y = ny;
          hero.pushTimer = 0;
        } else {
          if (leftBlocked && !rightBlocked) {
            hero.x += 45 * dt;
          } else if (rightBlocked && !leftBlocked) {
            hero.x -= 45 * dt;
          }
          this.handleHeroBump(hero, Math.floor(hero.x / TS), checkRow, 0, Math.sign(dy), dt);
        }
      }
    }

    handleHeroBump(hero, col, row, dirX, dirY, dt) {
      if (col < 0 || col >= this.roomCols || row < 0 || row >= this.roomRows) return;
      const tile = this.room.grid[row][col];

      // Unlock Small Locked Door (Palace #1 or Frost Spire)
      if (tile === T.DOOR_LOCKED) {
        const dir = this._doorDirForTile(col, row);
        const lock = this.room.locks?.[dir];
        const isFrost = lock?.type === 'frost_small' || this.room.area === 'frost';
        const avail = isFrost ? this.frostSmallKeys : this.smallKeys;
        if (avail > 0) {
          if (isFrost) this.frostSmallKeys -= 1;
          else this.smallKeys -= 1;
          if (lock) this.unlockedLocks.add(lock.id);
          this._openDoorTiles(this.room, dir);
          FB.audio.play('door');
          this.spawnParticles(col * TS + 8, row * TS + 8, isFrost ? '#38bdf8' : '#facc15', 12);
          this.showToast(isFrost ? 'Unlocked Frost Spire Seal!' : 'Unlocked Palace Door!', 2.2);
          this.saveProgress();
          FB.ui.renderHUD(this);
        } else {
          this.showToast(
            isFrost
              ? 'Sealed in ice! Find a Frost Key in the western glacier.'
              : 'Locked! Find a Small Key in the dungeon chambers.',
            2.0
          );
        }
        return;
      }

      // Unlock Boss Door (Palace #1 or Frost Spire)
      if (tile === T.DOOR_BOSS) {
        const dir = this._doorDirForTile(col, row);
        const lock = this.room.locks?.[dir];
        const isFrost = lock?.type === 'frost_boss' || this.room.area === 'frost';
        const hasKey = isFrost ? this.hasFrostBossKey : this.hasBossKey;
        if (hasKey) {
          if (lock) this.unlockedLocks.add(lock.id);
          this._openDoorTiles(this.room, dir);
          FB.audio.play('door');
          this.screenShake = 4;
          this.spawnParticles(col * TS + 8, row * TS + 8, isFrost ? '#38bdf8' : '#fde047', 18);
          this.showToast(
            isFrost
              ? 'The Frost Crown Gate shatters open! Glacior awaits!'
              : 'The Boss Door opens! Prepare for battle!',
            2.8
          );
          this.saveProgress();
          FB.ui.renderHUD(this);
        } else {
          this.showToast(
            isFrost
              ? 'Sealed by Frost Sovereign Glacior! Claim the FROST BOSS KEY in the eastern hall.'
              : 'Sealed by the Sovereign! Find the BOSS KEY in the eastern wing.',
            2.5
          );
        }
        return;
      }

      // Pushable Block (slides across consecutive ICE_FLOOR tiles in Frost Spire!)
      if (tile === T.BLOCK_PUSH && !hero.isClone) {
        const key = `${col},${row}`;
        if (hero.pushTileKey !== key) {
          hero.pushTileKey = key;
          hero.pushTimer = 0;
        }
        hero.pushTimer += dt;
        if (hero.pushTimer >= 0.25) {
          hero.pushTimer = 0;
          const tc = col + dirX;
          const tr = row + dirY;
          if (tc > 0 && tc < this.roomCols - 1 && tr > 0 && tr < this.roomRows - 1) {
            const dest = this.room.grid[tr][tc];
            if (
              dest === T.DUNGEON_FLOOR ||
              dest === T.SWITCH_FLOOR ||
              dest === T.DUNGEON_CARPET ||
              dest === T.ICE_FLOOR
            ) {
              // Restore floor under old block (preserve ice floor in Frost Spire!)
              const neighborIce =
                this.room.grid[row - 1]?.[col] === T.ICE_FLOOR ||
                this.room.grid[row + 1]?.[col] === T.ICE_FLOOR ||
                this.room.grid[row]?.[col - 1] === T.ICE_FLOOR ||
                this.room.grid[row]?.[col + 1] === T.ICE_FLOOR;
              this.room.grid[row][col] = neighborIce ? T.ICE_FLOOR : T.DUNGEON_FLOOR;

              let finalC = tc;
              let finalR = tr;
              let hitSwitch = dest === T.SWITCH_FLOOR;

              // Slide straight across consecutive ice tiles until hitting a switch or obstacle!
              if (dest === T.ICE_FLOOR) {
                while (true) {
                  const nc = finalC + dirX;
                  const nr = finalR + dirY;
                  if (nc <= 0 || nc >= this.roomCols - 1 || nr <= 0 || nr >= this.roomRows - 1) break;
                  const nextTile = this.room.grid[nr][nc];
                  if (nextTile === T.SWITCH_FLOOR) {
                    finalC = nc;
                    finalR = nr;
                    hitSwitch = true;
                    break;
                  } else if (nextTile === T.ICE_FLOOR) {
                    finalC = nc;
                    finalR = nr;
                  } else {
                    break;
                  }
                }
                this.spawnParticles(finalC * TS + 8, finalR * TS + 8, '#bae6fd', 10, 55, { shape: 'dust' });
              }

              if (hitSwitch) {
                this.room.grid[finalR][finalC] = T.SWITCH_FLOOR_ON;
                FB.audio.play('switch');
                this.spawnParticles(finalC * TS + 8, finalR * TS + 8, '#4ade80', 10);
                this.addFloatingText(finalC * TS + 8, finalR * TS, 'LOCKED!', '#4ade80');
              } else {
                this.room.grid[finalR][finalC] = T.BLOCK_PUSH;
                FB.audio.play('door');
              }
            }
          }
        }
      }
    }

    _doorDirForTile(col, row) {
      if (row === 0) return 'north';
      if (row === this.roomRows - 1) return 'south';
      if (col === 0) return 'west';
      return 'east';
    }

    checkHeroTileTriggers(hero, dt) {
      if (hero.isClone) return;
      const col = Math.floor(hero.x / TS);
      const row = Math.floor(hero.y / TS);

      // Smooth Zelda-style Sliding-Camera Room Transitions!
      if (hero.y < 5 && this.room.exits?.north) {
        this.transitionToRoom('north', this.room.exits.north, hero);
        return;
      }
      if (hero.y > this.roomH - 5 && this.room.exits?.south) {
        this.transitionToRoom('south', this.room.exits.south, hero);
        return;
      }
      if (hero.x < 5 && this.room.exits?.west) {
        this.transitionToRoom('west', this.room.exits.west, hero);
        return;
      }
      if (hero.x > this.roomW - 5 && this.room.exits?.east) {
        this.transitionToRoom('east', this.room.exits.east, hero);
        return;
      }

      if (col < 0 || col >= this.roomCols || row < 0 || row >= this.roomRows) return;
      const tile = this.room.grid[row][col];

      // Safe ground tracking
      if (
        tile === T.GRASS ||
        tile === T.GRASS_FLOWERS ||
        tile === T.PATH ||
        tile === T.DUNGEON_FLOOR ||
        tile === T.DUNGEON_CARPET ||
        tile === T.BRIDGE ||
        tile === T.SHOP_FLOOR ||
        tile === T.DARK_GRASS ||
        tile === T.DARK_PATH ||
        tile === T.ICE_FLOOR ||
        tile === T.TOWN_COBBLE ||
        tile === T.DOCK_WOOD ||
        tile === T.SAND ||
        tile === T.SAND_PATH ||
        tile === T.MOUNTAIN_GROUND
      ) {
        hero.safeX = col * TS + 8;
        hero.safeY = row * TS + 8;
      }

      // Portals (Overworld <-> Palace / Shop / Houses / Dark World / Frost / Desert / Magma / Arena)
      if (
        (tile === T.PORTAL_DUNGEON ||
          tile === T.PORTAL_OVERWORLD ||
          tile === T.PORTAL_SHOP ||
          tile === T.SHOP_EXIT ||
          tile === T.PORTAL_DARK ||
          tile === T.PORTAL_FROST ||
          tile === T.PORTAL_HOUSE ||
          tile === T.PORTAL_DESERT ||
          tile === T.PORTAL_MAGMA ||
          tile === T.PORTAL_ARENA) &&
        this.room.portals
      ) {
        const portal = this.room.portals.find((p) => p.col === col && p.row === row);
        if (portal && this.rooms[portal.targetRoom]) {
          FB.audio.play(tile === T.PORTAL_DARK ? 'mirror' : 'door');
          this.enterRoom(portal.targetRoom, { col: portal.targetCol, row: portal.targetRow });
          return;
        }
      }

      // Pit fall (immune during dash, teammate throw, or hookshot zip!)
      if (tile === T.PIT && hero.dashTimer <= 0 && hero.thrownTimer <= 0 && !hero.hookZipping) {
        hero.damage(1, hero.x, hero.y, this);
        hero.x = hero.safeX;
        hero.y = hero.safeY;
        return;
      }

      // Spikes
      if (tile === T.SPIKES && !hero.hookZipping) {
        hero.damage(1, col * TS + 8, row * TS + 8, this);
      }

      // Fairy Pool & Mountain Hot Spring healing
      if (tile === T.FAIRY_POOL || tile === T.HOT_SPRING) {
        if (hero.hp < hero.maxHp) {
          hero.hp = hero.maxHp;
          FB.audio.play('fairy');
          this.spawnParticles(hero.x, hero.y, '#7dd3fc', 12);
          this.addFloatingText(hero.x, hero.y - 10, 'HEALED!', '#7dd3fc');
          FB.ui.renderHUD(this);
        }
      }

      // Triforce Altar: Palace #1 -> Act I Complete (Magic Mirror & Dark World); Frost Spire -> Grand Victory!
      if (tile === T.TRIFORCE_ALTAR) {
        if (this.room.id === 'dg_boss' && this.bossDefeated) {
          this.completeAct1();
        } else if (this.room.id === 'fs_boss' && this.frostBossDefeated) {
          this.triggerVictory();
        }
      }
    }

    checkSwordHits(hero, isSpin) {
      const isFinisher = !isSpin && hero.comboStep === 2;
      const reach = isSpin ? 22 : isFinisher ? 20 : 17;
      const dv = FB.DIR_VEC[hero.dir];
      const forwardOffset = isFinisher ? 16 : 13;
      const cx = isSpin ? hero.x : hero.x + dv.x * forwardOffset;
      const cy = isSpin ? hero.y : hero.y + dv.y * forwardOffset;
      const tempBonus = hero.isClone ? 0 : hero.goldenBlade ? 2 : hero.temperedSword ? 1 : 0;
      const dmg = (isSpin ? 4 : hero.isClone ? 1 : isFinisher ? 3 : 2) + tempBonus;

      // Hit tiles (Bushes, Pots, Crystal Switches)
      const minC = Math.max(0, Math.floor((cx - reach) / TS));
      const maxC = Math.min(this.roomCols - 1, Math.floor((cx + reach) / TS));
      const minR = Math.max(0, Math.floor((cy - reach) / TS));
      const maxR = Math.min(this.roomRows - 1, Math.floor((cy + reach) / TS));

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const tile = this.room.grid[r][c];
          const tx = c * TS + 8;
          const ty = r * TS + 8;
          if (Math.hypot(tx - cx, ty - cy) > reach + 4) continue;

          if (tile === T.BUSH) {
            this.room.grid[r][c] = this._floorTileForRoom(this.room, c, r, false);
            FB.audio.play('bush');
            const isDark = this.room.area === 'darkworld';
            this.spawnParticles(tx, ty, isDark ? '#a855f7' : '#4ade80', 7, 52, { shape: 'leaf', gravity: 55, life: 0.42 });
            this.spawnParticles(tx, ty, isDark ? '#6b21a8' : '#16a34a', 4, 42, { shape: 'leaf', gravity: 50, life: 0.4 });
            this._dropDestructibleLoot(tx, ty, false);
          } else if (tile === T.POT) {
            this.room.grid[r][c] = this._floorTileForRoom(this.room, c, r, false);
            FB.audio.play('pot');
            this.spawnParticles(tx, ty, '#d49461', 7, 68, { shape: 'spark', gravity: 140, life: 0.36 });
            this.spawnParticles(tx, ty, '#8c4f23', 5, 55, { shape: 'square', gravity: 130, life: 0.32 });
            this._dropDestructibleLoot(tx, ty, !!this.room.fairyPots);
          } else if (tile === T.CRYSTAL_BLUE || tile === T.CRYSTAL_RED) {
            const cKey = `crystal_${c}_${r}`;
            if (!hero.swordHitSet.has(cKey)) {
              hero.swordHitSet.add(cKey);
              this.flipCrystalSwitch();
            }
          }
        }
      }

      // Hit enemies (and boss orbiting orbs!) + Sword/Spear Parrying & Clashing!
      for (const e of this.enemies) {
        if (!e.alive) continue;

        if (e.type === 'boss' && e.orbs) {
          for (let oi = 0; oi < e.orbs.length; oi++) {
            const orb = e.orbs[oi];
            if (!orb.alive) continue;
            const ox = e.x + Math.cos(orb.angle) * orb.radius;
            const oy = e.y + Math.sin(orb.angle) * orb.radius;
            const oKey = `orb_${oi}`;
            if (!hero.swordHitSet.has(oKey) && Math.hypot(ox - cx, oy - cy) < reach + 6) {
              hero.swordHitSet.add(oKey);
              orb.hp -= dmg;
              FB.audio.play('hit');
              this.spawnParticles(ox, oy, '#f43f5e', 7);
              if (orb.hp <= 0) {
                orb.alive = false;
                FB.audio.play('enemyDie');
                this.spawnParticles(ox, oy, '#fde047', 12);
              }
            }
          }
        }

        if (!hero.swordHitSet.has(e.id) && Math.hypot(e.x - cx, e.y - cy) < reach + e.w * 0.45) {
          hero.swordHitSet.add(e.id);

          // Check for Sword/Spear Parry or Blade Clash with armed foes!
          if (!isSpin && !hero.isClone && e.armed && e.stunTimer <= 0) {
            const edv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
            const toHeroX = hero.x - e.x;
            const toHeroY = hero.y - e.y;
            const toHeroLen = Math.hypot(toHeroX, toHeroY) || 1;
            const enemyFacingHero = (edv.x * toHeroX + edv.y * toHeroY) / toHeroLen > 0.35;

            if (enemyFacingHero && (e.telegraphTimer > 0 || e.lungeTimer > 0)) {
              // PERFECT PARRY! Deflects enemy's sword/spear lunge and leaves them wide open!
              const mx = (hero.x + e.x) * 0.5;
              const my = (hero.y + e.y) * 0.5;
              const pushAng = Math.atan2(e.y - hero.y, e.x - hero.x);

              e.telegraphTimer = 0;
              e.lungeTimer = 0;
              e.attackCooldown = 1.4;
              e.parryCooldown = 1.2;
              e.stunTimer = 1.7;
              e.knockX = Math.cos(pushAng) * 165;
              e.knockY = Math.sin(pushAng) * 165;
              e.knockTimer = 0.16;

              hero.invuln = Math.max(hero.invuln, 0.36);
              hero.parryFlash = 0.4;
              hero.swordCooldown = 0.08; // Instant counter-slash readiness!

              FB.audio.play('parry');
              this.hitstop = Math.max(this.hitstop, 0.075);
              this.screenShake = Math.max(this.screenShake, 2.5);
              this.spawnRing(mx, my, '#fde047', 22, 0.25);
              this.spawnParticles(mx, my, '#ffffff', 8, 95, { shape: 'spark', life: 0.22 });
              this.spawnParticles(mx, my, '#fde047', 6, 75, { shape: 'star', life: 0.28 });
              this.addFloatingText(mx, my - 10, 'PARRY!', '#fde047');
              continue;
            } else if (enemyFacingHero && !isFinisher && e.parryCooldown <= 0) {
              // BLADE CLASH (Parlay): Head-on sword-vs-spear/sword lock with sparks & recoil!
              const mx = (hero.x + e.x) * 0.5;
              const my = (hero.y + e.y) * 0.5;
              const pushAng = Math.atan2(e.y - hero.y, e.x - hero.x);

              e.parryCooldown = 0.95;
              e.stunTimer = 0.32;
              e.knockX = Math.cos(pushAng) * 110;
              e.knockY = Math.sin(pushAng) * 110;
              e.knockTimer = 0.11;

              hero.knockX = -Math.cos(pushAng) * 65;
              hero.knockY = -Math.sin(pushAng) * 65;
              hero.knockTimer = 0.08;
              hero.invuln = Math.max(hero.invuln, 0.22);

              FB.audio.play('clash');
              this.hitstop = Math.max(this.hitstop, 0.042);
              this.spawnRing(mx, my, '#e2e8f0', 14, 0.18);
              this.spawnParticles(mx, my, '#fef9c3', 7, 80, { shape: 'spark', life: 0.18 });
              this.addFloatingText(mx, my - 9, 'CLASH!', '#e2e8f0');
              continue;
            }
          }

          // Bonus counter-hit damage when striking a stunned/parried enemy!
          const bonus = e.stunTimer > 0 ? 1 : 0;
          const dealt = dmg + bonus;
          const hitOk = e.hit(dealt, hero.x, hero.y, hero.isClone ? this.humanHeroes[0] : hero, this, { isSpin });
          if (hitOk && bonus > 0) {
            this.spawnParticles(e.x, e.y, '#fde047', 6, 70, { shape: 'star', life: 0.22 });
          }
        }
      }

      // Deflect enemy projectiles!
      for (const p of this.projectiles) {
        if (!p.alive || !p.fromEnemy) continue;
        if (Math.hypot(p.x - cx, p.y - cy) < reach + p.radius) {
          p.alive = false;
          FB.audio.play('clink');
          this.spawnParticles(p.x, p.y, '#e2e8f0', 5);
        }
      }

      // Optional Four Swords Friendly Fire bonk!
      if (this.friendlyFire && !hero.isClone) {
        for (const other of this.humanHeroes) {
          if (other === hero || other.downed || hero.swordHitSet.has(`p_${other.index}`)) continue;
          if (Math.hypot(other.x - cx, other.y - cy) < reach + 5) {
            hero.swordHitSet.add(`p_${other.index}`);
            const ang = Math.atan2(other.y - hero.y, other.x - hero.x);
            other.knockX = Math.cos(ang) * 140;
            other.knockY = Math.sin(ang) * 140;
            other.knockTimer = 0.14;
            FB.audio.play('clink');
            // Drop 5 rupees for playful Four Swords chaos!
            if (other.rupees >= 5) {
              other.rupees -= 5;
              this.spawnPickup('rupee_blue', other.x + Math.cos(ang) * 10, other.y + Math.sin(ang) * 10);
            }
          }
        }
      }
    }

    _dropDestructibleLoot(x, y, fairyRoom) {
      if (fairyRoom) {
        this.spawnPickup(Math.random() < 0.45 ? 'fairy' : 'heart', x, y);
        return;
      }
      const r = Math.random();
      if (r < 0.35) this.spawnPickup('rupee_green', x, y);
      else if (r < 0.5 && !this.heroMode) this.spawnPickup('heart', x, y);
      else if (r < 0.58) this.spawnPickup('rupee_blue', x, y);
    }

    flipCrystalSwitch() {
      this.room.crystalState = this.room.crystalState === 'blue' ? 'red' : 'blue';
      FB.audio.play('switch');
      for (let r = 0; r < this.roomRows; r++) {
        for (let c = 0; c < this.roomCols; c++) {
          const t = this.room.grid[r][c];
          if (t === T.CRYSTAL_BLUE) this.room.grid[r][c] = T.CRYSTAL_RED;
          else if (t === T.CRYSTAL_RED) this.room.grid[r][c] = T.CRYSTAL_BLUE;
          else if (t === T.GATE_BLUE_UP) this.room.grid[r][c] = T.GATE_BLUE_DOWN;
          else if (t === T.GATE_BLUE_DOWN) this.room.grid[r][c] = T.GATE_BLUE_UP;
          else if (t === T.GATE_RED_UP) this.room.grid[r][c] = T.GATE_RED_DOWN;
          else if (t === T.GATE_RED_DOWN) this.room.grid[r][c] = T.GATE_RED_UP;
        }
      }
    }

    updateEnemies(dt) {
      const liveHeroes = this.humanHeroes.filter((h) => !h.downed);
      if (liveHeroes.length === 0) return;

      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (e.hurtTimer > 0) e.hurtTimer -= dt;
        if (e.parryCooldown > 0) e.parryCooldown -= dt;
        if (e.attackCooldown > 0) e.attackCooldown -= dt;

        // Ember Rod Burn DoT ticking!
        if (e.burnTimer > 0) {
          e.burnTimer -= dt;
          e.burnTick -= dt;
          if (Math.random() < 0.25) {
            this.spawnParticles(e.x, e.y - 4, '#fb923c', 1, 22, { shape: 'spark', life: 0.22 });
          }
          if (e.burnTick <= 0) {
            e.burnTick = 0.65;
            e.hit(1, e.x, e.y, e.burnOwner || this.humanHeroes[0], this, { isBurn: true, ignoreOrbs: true });
            this.addFloatingText(e.x, e.y - 10, 'BURN', '#fb923c');
            if (!e.alive) continue;
          }
        }

        if (e.stunTimer > 0) {
          e.stunTimer -= dt;
          e.telegraphTimer = 0;
          e.lungeTimer = 0;
          continue;
        }
        e.walkPhase += dt * (e.type === 'red_soldier' ? 9.5 : 7.5);

        // Nearest hero target
        let target = liveHeroes[0];
        let bestDist = Infinity;
        for (const h of liveHeroes) {
          const d = Math.hypot(h.x - e.x, h.y - e.y);
          if (d < bestDist) {
            bestDist = d;
            target = h;
          }
        }

        if (e.type === 'boss') {
          this.updateBoss(e, target, dt);
        } else if (e.type === 'frost_boss') {
          this.updateFrostBoss(e, target, dt);
        } else if (e.knockTimer > 0) {
          e.knockTimer -= dt;
          this.moveEnemy(e, e.knockX * dt, e.knockY * dt);
        } else {
          this.updateNormalEnemy(e, target, bestDist, dt);
        }

        // Contact damage with heroes (extended slightly during enemy weapon lunge!)
        if (e.type === 'wizzrobe' && e.wizPhase === 'vanished') continue;
        const hitDist = e.lungeTimer > 0 ? (e.w + 15) * 0.5 : (e.w + 10) * 0.45;
        for (const h of liveHeroes) {
          if (Math.hypot(h.x - e.x, h.y - e.y) < hitDist) {
            // If hero is mid-swing facing a lunging armed enemy, trigger auto-parry instead of unfair trade!
            if (e.armed && e.lungeTimer > 0 && h.swordTimer > 0) {
              this.checkSwordHits(h, false);
              if (e.stunTimer > 0) continue;
            }
            // Sword parry interrupt on charging Cryo-Wyrm!
            if (e.type === 'frost_boss' && e.bossState === 'charge' && (h.swordTimer > 0 || h.spinTimer > 0)) {
              e.bossState = 'weave';
              e.stateTimer = 1.6;
              e.stunTimer = 1.1;
              h.invuln = Math.max(h.invuln, 0.35);
              FB.audio.play('parry');
              this.hitstop = Math.max(this.hitstop, 0.06);
              this.spawnRing(e.x, e.y, '#7dd3fc', 24, 0.25);
              this.addFloatingText(e.x, e.y - 12, 'PARRY!', '#fde047');
              continue;
            }
            h.damage(e.damage, e.x, e.y, this);
          }
        }

        // Cryo-Wyrm trailing crystalline coils contact check
        if (e.type === 'frost_boss' && e.segments) {
          for (const seg of e.segments) {
            for (const h of liveHeroes) {
              if (!h.downed && Math.hypot(h.x - seg.x, h.y - seg.y) < (seg.r || 7) + 4) {
                h.damage(1, seg.x, seg.y, this);
              }
            }
          }
        }
      }
    }

    updateNormalEnemy(e, target, dist, dt) {
      const hmSpd = this.heroMode ? 1.2 : 1.0;
      const hmCadence = this.heroMode ? 0.8 : 1.0;
      e.aiTimer -= dt;
      e.shootTimer -= dt;

      if (e.type === 'wizzrobe') {
        // Teleporting Arcane Mage: visible (fires reflectable arcane_beam) -> fading -> vanished -> teleport -> appearing!
        e.wizTimer -= dt;
        if (e.wizPhase === 'visible') {
          e.wizAlpha = 1;
          if (e.wizTimer <= 0) {
            e.wizPhase = 'fading';
            e.wizTimer = 0.35;
          }
        } else if (e.wizPhase === 'fading') {
          e.wizAlpha = Math.max(0, e.wizTimer / 0.35);
          if (e.wizTimer <= 0) {
            e.wizPhase = 'vanished';
            e.wizAlpha = 0;
            e.wizTimer = (0.75 + Math.random() * 0.45) * hmCadence;
          }
        } else if (e.wizPhase === 'vanished') {
          e.wizAlpha = 0;
          if (e.wizTimer <= 0) {
            // Teleport to a safe walkable tile within mid-range of the hero
            const ang = Math.random() * Math.PI * 2;
            const rad = 52 + Math.random() * 58;
            const tx = Math.max(TS * 2, Math.min(this.roomW - TS * 2, target.x + Math.cos(ang) * rad));
            const ty = Math.max(TS * 2, Math.min(this.roomH - TS * 2, target.y + Math.sin(ang) * rad));
            const safe = this._findSafeTileNear(this.room, Math.floor(tx / TS), Math.floor(ty / TS));
            e.x = safe.col * TS + 8;
            e.y = safe.row * TS + 8;
            e.wizPhase = 'appearing';
            e.wizTimer = 0.4;
            this.spawnRing(e.x, e.y, '#c084fc', 16, 0.25);
          }
        } else if (e.wizPhase === 'appearing') {
          e.wizAlpha = Math.min(1, 1 - e.wizTimer / 0.4);
          if (e.wizTimer <= 0) {
            e.wizPhase = 'visible';
            e.wizAlpha = 1;
            e.wizTimer = (1.35 + Math.random() * 0.45) * hmCadence;
            // Fire Mirror-Shield-reflectable Arcane Beam!
            const ang = Math.atan2(target.y - e.y, target.x - e.x);
            const spd = 148 * hmSpd;
            this.projectiles.push(
              new FB.Projectile({
                kind: 'arcane_beam',
                x: e.x + Math.cos(ang) * 8,
                y: e.y + Math.sin(ang) * 8,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                fromEnemy: true,
                damage: 2,
                life: 2.2,
                radius: 5,
              })
            );
            FB.audio.play('fire');
          }
        }
        return;
      }

      if (e.type === 'chuchu' || e.type === 'chuchu_mini') {
        e.hopPhase = (e.hopPhase || 0) + dt * (e.type === 'chuchu_mini' ? 9 : 6);
        const hopping = Math.sin(e.hopPhase) > 0;
        if (hopping && dist < 185) {
          const ang = Math.atan2(target.y - e.y, target.x - e.x);
          const spd = e.speed * 1.45 * hmSpd;
          this.moveEnemy(e, Math.cos(ang) * spd * dt, Math.sin(ang) * spd * dt);
        }
        return;
      }

      if (e.type === 'beamos') {
        // Rotating Dungeon Laser Sentry — sweeps eye and blasts heroes in line-of-sight!
        e.eyeAngle = (e.eyeAngle || 0) + dt * (this.heroMode ? 1.55 : 1.15);
        if (e.beamCooldown > 0) e.beamCooldown -= dt;
        if (e.beamCooldown <= 0 && dist < 140) {
          const toHero = Math.atan2(target.y - e.y, target.x - e.x);
          let diff = toHero - e.eyeAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < 0.22) {
            e.beamCooldown = 1.25 * hmCadence;
            const spd = 215 * hmSpd;
            this.projectiles.push(
              new FB.Projectile({
                kind: 'laser_beam',
                x: e.x + Math.cos(toHero) * 10,
                y: e.y + Math.sin(toHero) * 10,
                vx: Math.cos(toHero) * spd,
                vy: Math.sin(toHero) * spd,
                fromEnemy: true,
                damage: 3,
                life: 1.5,
                radius: 4.5,
              })
            );
            FB.audio.play('laser');
            this.spawnRing(e.x, e.y, '#ef4444', 18, 0.2);
          }
        }
        return;
      }

      if (e.type === 'octorok') {
        if (e.aiTimer <= 0) {
          e.dir = Math.floor(Math.random() * 4);
          e.aiTimer = (0.85 + Math.random() * 0.85) * hmCadence;
        }
        const dv = FB.DIR_VEC[e.dir];
        if (!this.moveEnemy(e, dv.x * e.speed * hmSpd * dt, dv.y * e.speed * hmSpd * dt)) {
          e.dir = (e.dir + 1) % 4;
        }
        if (e.shootTimer <= 0 && dist < 195) {
          e.shootTimer = (1.35 + Math.random() * 0.75) * hmCadence;
          // Face nearest axis toward player and spit rock (3-way spread in Dark World!)
          if (Math.abs(target.x - e.x) > Math.abs(target.y - e.y)) {
            e.dir = target.x < e.x ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            e.dir = target.y < e.y ? FB.DIRS.UP : FB.DIRS.DOWN;
          }
          const sv = FB.DIR_VEC[e.dir];
          const baseAng = Math.atan2(sv.y, sv.x);
          const angles = e.biome === 'darkworld' ? [baseAng - 0.24, baseAng, baseAng + 0.24] : [baseAng];
          for (const a of angles) {
            this.projectiles.push(
              new FB.Projectile({
                kind: 'rock',
                x: e.x + Math.cos(a) * 8,
                y: e.y + Math.sin(a) * 8,
                vx: Math.cos(a) * 142 * hmSpd,
                vy: Math.sin(a) * 142 * hmSpd,
                fromEnemy: true,
                damage: 2,
                life: 1.9,
                radius: 4,
              })
            );
          }
        }
      } else if (e.type === 'keese') {
        const ang = Math.atan2(target.y - e.y, target.x - e.x) + Math.sin(this.time * 6.5 + e.x) * 0.75;
        this.moveEnemy(e, Math.cos(ang) * e.speed * hmSpd * dt, Math.sin(ang) * e.speed * hmSpd * dt);
      } else {
        // Armed melee enemies (Soldier, Red Soldier, Stalfos, Armored Knight):
        // Telegraph windup -> sharp weapon lunge (can be Parried!)
        if (e.armed && e.telegraphTimer > 0) {
          e.telegraphTimer -= dt;
          const ang = Math.atan2(target.y - e.y, target.x - e.x);
          if (Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang))) {
            e.dir = Math.cos(ang) < 0 ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            e.dir = Math.sin(ang) < 0 ? FB.DIRS.UP : FB.DIRS.DOWN;
          }
          if (e.telegraphTimer <= 0) {
            e.lungeTimer = 0.22;
            e.attackCooldown =
              (e.type === 'red_soldier' ? 0.85 : e.type === 'knight' ? 0.98 : 1.08) * hmCadence;
            FB.audio.play('sword');
          }
          return;
        }

        if (e.armed && e.lungeTimer > 0) {
          e.lungeTimer -= dt;
          const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
          const lungeSpd = e.speed * 2.3 * hmSpd;
          this.moveEnemy(e, dv.x * lungeSpd * dt, dv.y * lungeSpd * dt);
          return;
        }

        if (dist < 168) {
          const ang = Math.atan2(target.y - e.y, target.x - e.x);
          const vx = Math.cos(ang) * e.speed * hmSpd;
          const vy = Math.sin(ang) * e.speed * hmSpd;
          if (Math.abs(vx) > Math.abs(vy)) {
            e.dir = vx < 0 ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            e.dir = vy < 0 ? FB.DIRS.UP : FB.DIRS.DOWN;
          }

          // Initiate parryable weapon telegraph when close!
          if (e.armed && dist < 44 && e.attackCooldown <= 0) {
            e.telegraphTimer = 0.30 * hmCadence;
            return;
          }

          this.moveEnemy(e, vx * dt, vy * dt);

          // Stalfos throws fast bones at mid-range!
          if (e.type === 'stalfos' && dist > 38 && e.shootTimer <= 0) {
            e.shootTimer = 1.65 * hmCadence;
            this.projectiles.push(
              new FB.Projectile({
                kind: 'bone',
                x: e.x,
                y: e.y,
                vx: Math.cos(ang) * 140 * hmSpd,
                vy: Math.sin(ang) * 140 * hmSpd,
                fromEnemy: true,
                damage: 2,
                life: 1.8,
                radius: 4,
              })
            );
          }
        } else {
          if (e.aiTimer <= 0) {
            e.dir = Math.floor(Math.random() * 4);
            e.aiTimer = 1.0 + Math.random() * 0.8;
          }
          const dv = FB.DIR_VEC[e.dir];
          if (!this.moveEnemy(e, dv.x * e.speed * 0.72 * hmSpd * dt, dv.y * e.speed * 0.72 * hmSpd * dt)) {
            e.dir = (e.dir + 2) % 4;
          }
        }
      }
    }

    summonBossMinions(boss) {
      const activeMinions = this.enemies.filter((m) => m.alive && m.isSummoned).length;
      const maxMinions = boss.phase === 2 ? 4 : 3;
      if (activeMinions >= maxMinions) return 0;

      const isFrost = boss.type === 'frost_boss';
      const slots = Math.min(boss.phase === 2 ? 2 : 1, maxMinions - activeMinions);
      const biome = isFrost ? 'frost' : 'dungeon';
      let spawned = 0;

      for (let i = 0; i < slots; i++) {
        const ang = (boss.lookAngle || 0) + (i === 0 ? 1.15 : -1.15) + (Math.random() - 0.5) * 0.5;
        const sx = Math.max(TS * 2.5, Math.min(this.roomW - TS * 2.5, boss.x + Math.cos(ang) * 34));
        const sy = Math.max(TS * 2.5, Math.min(this.roomH - TS * 2.5, boss.y + Math.sin(ang) * 34));

        let mType = 'keese';
        if (boss.phase === 2) {
          if (isFrost) mType = i === 0 ? 'stalfos' : 'red_soldier';
          else mType = i === 0 ? 'stalfos' : 'keese';
        } else if (isFrost && Math.random() < 0.45) {
          mType = 'stalfos';
        }

        const minion = new FB.Enemy(mType, sx, sy, this.humanHeroes.length, biome);
        minion.isSummoned = true;
        minion.maxHp = Math.max(3, Math.round(minion.maxHp * 0.75));
        minion.hp = minion.maxHp;
        this.enemies.push(minion);
        spawned++;

        const ringColor = isFrost ? '#38bdf8' : '#a855f7';
        this.spawnRing(sx, sy, ringColor, 20, 0.28);
        this.spawnParticles(sx, sy, isFrost ? '#bae6fd' : '#e9d5ff', 10, 65, { shape: 'star' });
      }

      if (spawned > 0) {
        FB.audio.play('mirror');
        this.addFloatingText(
          boss.x,
          boss.y - 18,
          isFrost ? 'FROST GUARD!' : 'SUMMON!',
          isFrost ? '#7dd3fc' : '#d8b4fe'
        );
      }
      return spawned;
    }

    updateBoss(b, target, dt) {
      const hmMult = this.heroMode ? 1.15 : 1.0;
      b.lookAngle = Math.atan2(target.y - b.y, target.x - b.x);
      const orbSpeed = (b.phase === 2 ? 3.2 : 2.1) * hmMult;
      for (const orb of b.orbs) {
        if (!orb.alive) continue;
        orb.angle += orbSpeed * dt;
        const ox = b.x + Math.cos(orb.angle) * orb.radius;
        const oy = b.y + Math.sin(orb.angle) * orb.radius;
        for (const h of this.humanHeroes) {
          if (!h.downed && Math.hypot(h.x - ox, h.y - oy) < 11) {
            h.damage(2, ox, oy, this);
          }
        }
      }

      // Periodically summon Shadow Keese & Stalfos minions!
      b.summonTimer = (b.summonTimer !== undefined ? b.summonTimer : 4.5) - dt;
      if (b.summonTimer <= 0) {
        this.summonBossMinions(b);
        b.summonTimer = b.phase === 2 ? 4.4 : 5.6;
      }

      b.stateTimer -= dt;
      if (b.bossState === 'orbit') {
        // Glide rapidly circling player
        const ang = Math.atan2(target.y - b.y, target.x - b.x) + 0.55;
        const spd = (b.phase === 2 ? 66 : 48) * hmMult;
        b.x = Math.max(TS * 2.5, Math.min(this.roomW - TS * 2.5, b.x + Math.cos(ang) * spd * dt));
        b.y = Math.max(TS * 2.5, Math.min(this.roomH - TS * 2.5, b.y + Math.sin(ang) * spd * dt));

        if (b.stateTimer <= 0) {
          // Fire radial dark energy spread!
          const count = b.phase === 2 ? 8 : 5;
          for (let i = 0; i < count; i++) {
            const a = b.lookAngle + (i - (count - 1) / 2) * 0.32;
            const orbSpd = (b.phase === 2 ? 138 : 112) * hmMult;
            this.projectiles.push(
              new FB.Projectile({
                kind: 'dark_orb',
                x: b.x,
                y: b.y,
                vx: Math.cos(a) * orbSpd,
                vy: Math.sin(a) * orbSpd,
                fromEnemy: true,
                damage: 2,
                life: 2.3,
                radius: 5,
              })
            );
          }
          FB.audio.play('fire');
          b.bossState = 'dash';
          b.stateTimer = 0.78;
          const dashSpd = (b.phase === 2 ? 152 : 118) * hmMult;
          b.dashVx = Math.cos(b.lookAngle) * dashSpd;
          b.dashVy = Math.sin(b.lookAngle) * dashSpd;
        }
      } else if (b.bossState === 'dash') {
        b.x = Math.max(TS * 2.2, Math.min(this.roomW - TS * 2.2, b.x + b.dashVx * dt));
        b.y = Math.max(TS * 2.2, Math.min(this.roomH - TS * 2.2, b.y + b.dashVy * dt));
        if (b.stateTimer <= 0) {
          b.bossState = 'orbit';
          b.stateTimer = b.phase === 2 ? 1.25 : 1.75;
        }
      }
    }

    updateFrostBoss(b, target, dt) {
      const hmMult = this.heroMode ? 1.15 : 1.0;
      b.lookAngle = Math.atan2(target.y - b.y, target.x - b.x);
      b.weavePhase = (b.weavePhase || 0) + dt * (b.phase === 2 ? 4.3 : 2.9);

      // Periodically summon Frost Spire minions (Frost Keese, Frost Stalfos, Frost Soldiers)!
      b.summonTimer = (b.summonTimer !== undefined ? b.summonTimer : 4.2) - dt;
      if (b.summonTimer <= 0) {
        this.summonBossMinions(b);
        b.summonTimer = b.phase === 2 ? 4.2 : 5.4;
      }

      b.stateTimer -= dt;

      if (b.bossState === 'weave') {
        // Serpentine glide across the glacial crown
        const baseAng = b.lookAngle + Math.sin(b.weavePhase) * 0.82;
        const spd = (b.phase === 2 ? 82 : 58) * hmMult;
        b.x = Math.max(TS * 2.2, Math.min(this.roomW - TS * 2.2, b.x + Math.cos(baseAng) * spd * dt));
        b.y = Math.max(TS * 2.2, Math.min(this.roomH - TS * 2.2, b.y + Math.sin(baseAng) * spd * dt));

        if (b.stateTimer <= 0) {
          // Fire wider spread of reflectable Ice Shards, then telegraph a frost charge!
          const count = b.phase === 2 ? 7 : 5;
          for (let i = 0; i < count; i++) {
            const a = b.lookAngle + (i - (count - 1) / 2) * 0.28;
            const shardSpd = (b.phase === 2 ? 152 : 124) * hmMult;
            this.projectiles.push(
              new FB.Projectile({
                kind: 'ice_shard',
                x: b.x + Math.cos(a) * 10,
                y: b.y + Math.sin(a) * 10,
                vx: Math.cos(a) * shardSpd,
                vy: Math.sin(a) * shardSpd,
                fromEnemy: true,
                damage: 2,
                life: 2.3,
                radius: 4.5,
              })
            );
          }
          FB.audio.play('fire');
          b.bossState = 'telegraph';
          b.stateTimer = b.phase === 2 ? 0.36 : 0.45;
        }
      } else if (b.bossState === 'telegraph') {
        // Lock onto player with golden glare before lunging!
        if (b.stateTimer <= 0) {
          b.bossState = 'charge';
          b.stateTimer = 0.72;
          const chargeSpd = (b.phase === 2 ? 202 : 162) * hmMult;
          b.dashVx = Math.cos(b.lookAngle) * chargeSpd;
          b.dashVy = Math.sin(b.lookAngle) * chargeSpd;
          FB.audio.play('dash');
          this.spawnRing(b.x, b.y, '#7dd3fc', 24, 0.24);
        }
      } else if (b.bossState === 'charge') {
        b.x = Math.max(TS * 2.0, Math.min(this.roomW - TS * 2.0, b.x + b.dashVx * dt));
        b.y = Math.max(TS * 2.0, Math.min(this.roomH - TS * 2.0, b.y + b.dashVy * dt));
        if (Math.random() < 0.45) {
          this.spawnParticles(b.x, b.y, '#bae6fd', 1, 24, { shape: 'dust', life: 0.22, size: 2.4 });
        }
        if (b.stateTimer <= 0) {
          // Phase II radial 10-way blizzard shard burst!
          if (b.phase === 2) {
            for (let i = 0; i < 10; i++) {
              const a = (i * Math.PI * 2) / 10 + b.weavePhase * 0.25;
              this.projectiles.push(
                new FB.Projectile({
                  kind: 'ice_shard',
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(a) * 130 * hmMult,
                  vy: Math.sin(a) * 130 * hmMult,
                  fromEnemy: true,
                  damage: 2,
                  life: 2.1,
                  radius: 4.5,
                })
              );
            }
            this.spawnRing(b.x, b.y, '#38bdf8', 34, 0.3);
          }
          b.bossState = 'weave';
          b.stateTimer = b.phase === 2 ? 1.2 : 1.65;
        }
      }

      // Smoothly slither trailing crystalline segments behind head
      if (b.segments && b.segments.length > 0) {
        let prevX = b.x;
        let prevY = b.y;
        const spacing = 11;
        for (const seg of b.segments) {
          const dx = seg.x - prevX;
          const dy = seg.y - prevY;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist > spacing) {
            seg.x = prevX + (dx / dist) * spacing;
            seg.y = prevY + (dy / dist) * spacing;
          }
          prevX = seg.x;
          prevY = seg.y;
        }
      }
    }

    _clearSummonedMinions(color = '#e9d5ff') {
      for (const m of this.enemies) {
        if (m.alive && m.isSummoned) {
          m.alive = false;
          this.spawnParticles(m.x, m.y, color, 10, 75, { shape: 'star' });
        }
      }
    }

    onBossDefeated(boss) {
      this.bossDefeated = true;
      this.slowMoTimer = 0.55;
      this._clearSummonedMinions('#d8b4fe');
      this.screenShake = 8;
      FB.audio.play('victory');
      this.spawnRing(boss.x, boss.y, '#a855f7', 40, 0.45);
      this.spawnParticles(boss.x, boss.y, '#fde047', 28, 110);
      this.spawnParticles(boss.x, boss.y, '#a855f7', 20, 90);
      this.spawnPickup('heart_container', boss.x, boss.y + 12);

      // Reveal Triforce Victory Altar in center!
      const midR = Math.floor(this.roomRows / 2);
      const midC = Math.floor(this.roomCols / 2);
      this.room.grid[midR][midC - 1] = T.TRIFORCE_ALTAR;
      this.room.grid[midR][midC] = T.TRIFORCE_ALTAR;
      this._openDoorTiles(this.room, 'south');
      this.saveProgress();
      this.showToast('VAALOR DEFEATED! Step onto the Golden Relic Altar to claim the Magic Mirror!', 6.0);
    }

    onFrostBossDefeated(boss) {
      this.frostBossDefeated = true;
      this.slowMoTimer = 0.55;
      this._clearSummonedMinions('#bae6fd');
      this.screenShake = 9;
      FB.audio.play('victory');
      this.spawnRing(boss.x, boss.y, '#38bdf8', 42, 0.45);
      this.spawnParticles(boss.x, boss.y, '#bae6fd', 32, 120, { shape: 'star' });
      this.spawnParticles(boss.x, boss.y, '#fde047', 24, 100);
      this.spawnPickup('heart_container', boss.x, boss.y + 14);

      // Reveal Relic Altar in center!
      const midR = Math.floor(this.roomRows / 2);
      const midC = Math.floor(this.roomCols / 2);
      this.room.grid[midR][midC - 1] = T.TRIFORCE_ALTAR;
      this.room.grid[midR][midC] = T.TRIFORCE_ALTAR;
      this._openDoorTiles(this.room, 'south');
      this.saveProgress();
      this.showToast('GLACIOR SHATTERED! Step onto the Golden Relic Altar to claim the Frost Medallion!', 6.5);
    }

    triggerVictory() {
      if (this.state === 'victory') return;
      this.state = 'victory';
      if (FB.saves) {
        const meta = FB.saves.getMeta();
        const prevBest = meta.bestClearTime;
        const bestClearTime =
          prevBest === null || prevBest === undefined ? this.elapsedTime : Math.min(prevBest, this.elapsedTime);
        FB.saves.saveMeta({
          heroModeUnlocked: true,
          bestClearTime,
        });
        FB.saves.saveSlot(this.activeSaveSlot, this);
      }
      FB.audio.stopMusic();
      FB.audio.play('victory');
      FB.ui.renderVictory(this);
    }

    moveEnemy(e, dx, dy) {
      const half = e.w * 0.42;
      let moved = false;
      const nx = e.x + dx;
      const ny = e.y + dy;

      const blockedX =
        nx < TS * 1.2 ||
        nx > this.roomW - TS * 1.2 ||
        this.isSolidAt(Math.floor((nx - half) / TS), Math.floor(e.y / TS), e.flying) ||
        this.isSolidAt(Math.floor((nx + half) / TS), Math.floor(e.y / TS), e.flying);
      if (!blockedX) {
        e.x = nx;
        moved = true;
      }

      const blockedY =
        ny < TS * 1.2 ||
        ny > this.roomH - TS * 1.2 ||
        this.isSolidAt(Math.floor(e.x / TS), Math.floor((ny - half) / TS), e.flying) ||
        this.isSolidAt(Math.floor(e.x / TS), Math.floor((ny + half) / TS), e.flying);
      if (!blockedY) {
        e.y = ny;
        moved = true;
      }
      return moved;
    }

    updateProjectiles(dt) {
      for (const p of this.projectiles) {
        if (!p.alive) continue;
        p.life -= dt;
        p.angle += dt * 16;

        if (p.kind === 'bomb') {
          // Thrown bombs sail forward and decelerate cleanly!
          if (Math.hypot(p.vx, p.vy) > 5) {
            const nx = p.x + p.vx * dt;
            const ny = p.y + p.vy * dt;
            const c = Math.floor(nx / TS);
            const r = Math.floor(ny / TS);
            if (
              nx > TS &&
              nx < this.roomW - TS &&
              ny > TS &&
              ny < this.roomH - TS &&
              !FB.PROJECTILE_BLOCK_TILES.has(this.room.grid[r]?.[c])
            ) {
              p.x = nx;
              p.y = ny;
            } else {
              p.vx *= -0.35;
              p.vy *= -0.35;
            }
            p.vx *= 0.88;
            p.vy *= 0.88;
          }
          if (Math.random() < (p.life < 0.45 ? 0.55 : 0.25)) {
            this.spawnParticles(p.x + 1, p.y - 6, '#fde047', 1, 32, { shape: 'spark', life: 0.16 });
          }
          if (p.life <= 0) {
            this.explodeBomb(p);
            p.alive = false;
          }
          continue;
        }

        if (p.kind === 'hookshot') {
          if (p.latched && p.owner) {
            // Pull owner rapidly toward latched post / chest across pits & rivers!
            p.owner.hookZipping = true;
            const dx = p.latchX - p.owner.x;
            const dy = p.latchY - p.owner.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 14) {
              p.owner.hookZipping = false;
              p.alive = false;
            } else {
              const spd = 290;
              p.owner.x += (dx / dist) * spd * dt;
              p.owner.y += (dy / dist) * spd * dt;
            }
            continue;
          }

          if (!p.returning && p.life <= 0) {
            p.returning = true;
          }
          if (p.returning && p.owner) {
            const dx = p.owner.x - p.x;
            const dy = p.owner.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 12) {
              p.owner.hookZipping = false;
              p.alive = false;
              continue;
            }
            p.vx = (dx / dist) * 280;
            p.vy = (dy / dist) * 280;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Pull pickups back with Hookshot!
          for (const item of this.pickups) {
            if (item.alive && item.kind !== 'item_pedestal' && Math.hypot(item.x - p.x, item.y - p.y) < 12) {
              item.x = p.x;
              item.y = p.y;
            }
          }

          // Check latch onto POST_LATCH or Chests!
          if (!p.returning) {
            const hc = Math.floor(p.x / TS);
            const hr = Math.floor(p.y / TS);
            const htile = this.room.grid[hr]?.[hc];
            if (
              htile === T.POST_LATCH ||
              htile === T.CHEST_CLOSED ||
              htile === T.CHEST_OPEN ||
              htile === T.BIG_CHEST_CLOSED ||
              htile === T.BIG_CHEST_OPEN
            ) {
              p.latched = true;
              p.vx = 0;
              p.vy = 0;
              p.x = hc * TS + 8;
              p.y = hr * TS + 8;
              // Snap landing spot slightly in front of post/chest toward hero
              const ang = Math.atan2(p.owner.y - p.y, p.owner.x - p.x);
              p.latchX = p.x + Math.cos(ang) * 14;
              p.latchY = p.y + Math.sin(ang) * 14;
              FB.audio.play('clink');
              this.spawnParticles(p.x, p.y, '#fde047', 8, 65, { shape: 'spark' });
              continue;
            }
            if (htile === T.CRYSTAL_BLUE || htile === T.CRYSTAL_RED) {
              this.flipCrystalSwitch();
              p.returning = true;
              continue;
            }
            if (
              p.x < 6 ||
              p.x > this.roomW - 6 ||
              p.y < 6 ||
              p.y > this.roomH - 6 ||
              FB.PROJECTILE_BLOCK_TILES.has(htile)
            ) {
              FB.audio.play('clink');
              p.returning = true;
              continue;
            }
            for (const e of this.enemies) {
              if (!e.alive) continue;
              if (Math.hypot(e.x - p.x, e.y - p.y) < e.w * 0.55 + p.radius) {
                e.hit(p.damage, p.x, p.y, p.owner, this, { stun: 2.2 });
                e.parryCooldown = 1.5; // Strips Armored Knight guard!
                p.returning = true;
                break;
              }
            }
          }
          continue;
        }

        if (p.kind === 'boomerang') {
          if (!p.returning && p.life <= 0) {
            p.returning = true;
          }
          if (p.returning && p.owner) {
            const dx = p.owner.x - p.x;
            const dy = p.owner.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 10) {
              p.alive = false;
              continue;
            }
            p.vx = (dx / dist) * 185;
            p.vy = (dy / dist) * 185;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Pull pickups back with boomerang!
          for (const item of this.pickups) {
            if (item.alive && item.kind !== 'item_pedestal' && Math.hypot(item.x - p.x, item.y - p.y) < 12) {
              item.x = p.x;
              item.y = p.y;
            }
          }
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.kind === 'thrown_enemy' && p.payload && p.payload.alive) {
            p.payload.x = p.x;
            p.payload.y = p.y;
          }
          if (p.kind === 'fireball' && Math.random() < 0.5) {
            this.spawnParticles(p.x, p.y, '#fb923c', 1, 18, { shape: 'dust', life: 0.18, size: 2.2 });
          } else if (p.kind === 'dark_orb' && Math.random() < 0.35) {
            this.spawnParticles(p.x, p.y, '#a855f7', 1, 15, { shape: 'dust', life: 0.16, size: 1.8 });
          } else if (p.kind === 'beam' && Math.random() < 0.55) {
            this.spawnParticles(p.x, p.y, '#fde047', 1, 20, { shape: 'star', life: 0.16 });
          } else if (p.kind === 'ice_shard' && Math.random() < 0.4) {
            this.spawnParticles(p.x, p.y, '#bae6fd', 1, 16, { shape: 'spark', life: 0.15, size: 1.8 });
          }
          if (p.life <= 0) {
            if (p.kind === 'thrown_pot') {
              FB.audio.play('pot');
              this.spawnParticles(p.x, p.y, '#d49461', 8, 65, { shape: 'spark', gravity: 135 });
              this._dropDestructibleLoot(p.x, p.y, !!this.room.fairyPots);
            } else if (p.kind === 'thrown_enemy' && p.payload && p.payload.alive) {
              p.payload.hit(3, p.x, p.y, p.owner, this);
            }
            p.alive = false;
            continue;
          }
        }

        // Bounds check
        if (p.x < 4 || p.x > this.roomW - 4 || p.y < 4 || p.y > this.roomH - 4) {
          if (p.kind === 'boomerang') p.returning = true;
          else {
            if (p.kind === 'thrown_pot') {
              FB.audio.play('pot');
              this.spawnParticles(p.x, p.y, '#d49461', 7, 60, { shape: 'spark', gravity: 135 });
            } else if (p.kind === 'thrown_enemy' && p.payload && p.payload.alive) {
              p.payload.hit(3, p.x, p.y, p.owner, this);
            }
            p.alive = false;
          }
          continue;
        }

        // Tile interaction
        const col = Math.floor(p.x / TS);
        const row = Math.floor(p.y / TS);
        if (col >= 0 && col < this.roomCols && row >= 0 && row < this.roomRows) {
          const tile = this.room.grid[row][col];

          if (!p.fromEnemy && (tile === T.CRYSTAL_BLUE || tile === T.CRYSTAL_RED)) {
            this.flipCrystalSwitch();
            if (p.kind === 'boomerang') p.returning = true;
            else p.alive = false;
            continue;
          }

          if ((p.kind === 'fireball' || p.kind === 'beam') && tile === T.TORCH_UNLIT) {
            this.room.grid[row][col] = T.TORCH_LIT;
            FB.audio.play('fire');
            this.spawnParticles(col * TS + 8, row * TS + 6, '#facc15', 10);
            if (p.kind === 'fireball') {
              p.alive = false;
              continue;
            }
          }

          if (FB.PROJECTILE_BLOCK_TILES.has(tile)) {
            if (p.kind === 'boomerang') {
              p.returning = true;
              FB.audio.play('clink');
            } else {
              if (p.kind === 'thrown_pot') {
                FB.audio.play('pot');
                this.spawnParticles(p.x, p.y, '#d49461', 8, 65, { shape: 'spark', gravity: 135 });
                this._dropDestructibleLoot(p.x, p.y, !!this.room.fairyPots);
              } else if (p.kind === 'thrown_enemy' && p.payload && p.payload.alive) {
                p.payload.hit(4, p.x, p.y, p.owner, this);
              } else {
                this.spawnParticles(p.x, p.y, '#cbd5e1', 4);
              }
              p.alive = false;
            }
            continue;
          }
        }

        // Entity collision
        if (p.fromEnemy) {
          for (const h of this.humanHeroes) {
            if (h.downed || h.thrownTimer > 0) continue;
            if (Math.hypot(h.x - p.x, h.y - p.y) < 8 + p.radius) {
              // Passive ALttP Shield Block & Mirror Shield Reflect!
              const canShield = h.swordTimer <= 0 && h.spinTimer <= 0 && !h.carrying && h.dashTimer <= 0;
              if (canShield) {
                const hdv = FB.DIR_VEC[h.dir] || FB.DIR_VEC[0];
                const pSpd = Math.hypot(p.vx, p.vy) || 1;
                const dot = (hdv.x * p.vx + hdv.y * p.vy) / pSpd;
                if (dot < -0.2) {
                  if (h.mirrorShield) {
                    // MIRROR SHIELD REFLECT!
                    p.fromEnemy = false;
                    p.owner = h;
                    p.vx = -p.vx * 1.35;
                    p.vy = -p.vy * 1.35;
                    p.damage = 3;
                    p.life = 1.6;
                    FB.audio.play('reflect');
                    this.spawnRing(p.x, p.y, '#fde047', 14, 0.2);
                    this.spawnParticles(p.x, p.y, '#ffffff', 7, 75, { shape: 'star' });
                    this.addFloatingText(h.x, h.y - 12, 'REFLECT!', '#fde047');
                  } else {
                    // STANDARD SHIELD BLOCK!
                    p.alive = false;
                    FB.audio.play('clink');
                    this.spawnParticles(p.x, p.y, '#e2e8f0', 6, 65, { shape: 'spark' });
                    this.addFloatingText(h.x, h.y - 10, 'BLOCK', '#cbd5e1');
                  }
                  break;
                }
              }

              h.damage(p.damage, p.x, p.y, this);
              p.alive = false;
              break;
            }
          }
        } else {
          for (const e of this.enemies) {
            if (!e.alive || e === p.payload) continue;

            // Arrows / Boomerang / Fireball / Beam can also pop boss shield orbs!
            if (e.type === 'boss' && e.orbs) {
              for (const orb of e.orbs) {
                if (!orb.alive) continue;
                const ox = e.x + Math.cos(orb.angle) * orb.radius;
                const oy = e.y + Math.sin(orb.angle) * orb.radius;
                if (Math.hypot(ox - p.x, oy - p.y) < 7 + p.radius) {
                  orb.hp -= p.damage;
                  FB.audio.play('hit');
                  this.spawnParticles(ox, oy, '#f43f5e', 6);
                  if (orb.hp <= 0) orb.alive = false;
                  if (p.kind === 'boomerang') p.returning = true;
                  else if (p.kind !== 'beam') p.alive = false;
                }
              }
            }

            if (p.alive && !p.hitSet.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) < e.w * 0.55 + p.radius) {
              p.hitSet.add(e.id);
              e.hit(p.damage, p.x, p.y, p.owner, this, {
                stun: p.kind === 'boomerang' ? 2.4 : p.kind === 'thrown_pot' ? 0.6 : 0,
                isFire: p.kind === 'fireball',
              });
              if (p.kind === 'thrown_pot') {
                FB.audio.play('pot');
                this.spawnParticles(p.x, p.y, '#d49461', 8, 65, { shape: 'spark', gravity: 135 });
                this._dropDestructibleLoot(p.x, p.y, !!this.room.fairyPots);
                p.alive = false;
              } else if (p.kind === 'thrown_enemy' && p.payload && p.payload.alive) {
                p.payload.hit(3, p.x, p.y, p.owner, this);
                p.alive = false;
              } else if (p.kind === 'boomerang') {
                p.returning = true;
              } else if (p.kind !== 'beam') {
                p.alive = false;
              }
              break;
            }
          }
        }
      }

      this.projectiles = this.projectiles.filter((p) => p.alive);
    }

    explodeBomb(bomb) {
      const hasBlast = !!bomb.owner?.blastPowder;
      const blastRadius = hasBlast ? 48 : 32;
      const heroBlastRadius = 24;
      const bombDmg = (bomb.damage || 5) + (hasBlast ? 3 : 0);
      FB.audio.play('bombBoom');
      this.screenShake = hasBlast ? 8 : 6;
      this.spawnRing(bomb.x, bomb.y, '#fde047', hasBlast ? 48 : 34, 0.3);
      this.spawnRing(bomb.x, bomb.y, '#fb923c', hasBlast ? 36 : 26, 0.24);
      this.spawnParticles(bomb.x, bomb.y, '#fb923c', hasBlast ? 22 : 16, 95, { shape: 'spark' });
      this.spawnParticles(bomb.x, bomb.y, '#fde047', 12, 70, { shape: 'star' });
      this.spawnParticles(bomb.x, bomb.y, '#e2e8f0', 10, 50, { shape: 'dust', size: 3.2, life: 0.38 });

      // Clear carrying ref if a hero was holding this bomb when it blew up!
      for (const h of this.humanHeroes) {
        if (h.carrying && h.carrying.ref === bomb) {
          h.carrying = null;
        }
      }

      // Blast cracked walls, cracked boulders, bushes, pots, crystal switches!
      const minC = Math.max(0, Math.floor((bomb.x - blastRadius) / TS));
      const maxC = Math.min(this.roomCols - 1, Math.floor((bomb.x + blastRadius) / TS));
      const minR = Math.max(0, Math.floor((bomb.y - blastRadius) / TS));
      const maxR = Math.min(this.roomRows - 1, Math.floor((bomb.y + blastRadius) / TS));

      let discoveredSecret = false;
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const tx = c * TS + 8;
          const ty = r * TS + 8;
          if (Math.hypot(tx - bomb.x, ty - bomb.y) > blastRadius) continue;
          const tile = this.room.grid[r][c];
          if (tile === T.CRACKED_WALL) {
            this.room.grid[r][c] = this._floorTileForRoom(this.room, c, r, false);
            this.room.destroyedTiles.add(`${c},${r}`);
            discoveredSecret = true;
          } else if (tile === T.ROCK_CRACKED) {
            this.room.grid[r][c] = this._floorTileForRoom(this.room, c, r, true);
            this.room.destroyedTiles.add(`${c},${r}`);
            discoveredSecret = true;
          } else if (tile === T.BUSH) {
            this.room.grid[r][c] = this._floorTileForRoom(this.room, c, r, false);
            this._dropDestructibleLoot(tx, ty, false);
          } else if (tile === T.POT) {
            this.room.grid[r][c] = this._floorTileForRoom(this.room, c, r, false);
            this._dropDestructibleLoot(tx, ty, !!this.room.fairyPots);
          } else if (tile === T.CRYSTAL_BLUE || tile === T.CRYSTAL_RED) {
            this.flipCrystalSwitch();
          }
        }
      }

      if (discoveredSecret) {
        FB.audio.play('secret');
        this.showToast('You blasted open a secret passage!', 3.0);
        this.saveProgress();
      }

      // Blast enemies
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - bomb.x, e.y - bomb.y) < blastRadius + e.w * 0.5) {
          e.hit(bombDmg, bomb.x, bomb.y, bomb.owner, this, { isBomb: true, ignoreOrbs: true });
        }
      }

      // Close-range Bomb Self-Damage to heroes caught inside blast vicinity!
      for (const h of this.humanHeroes) {
        if (h.downed) continue;
        if (Math.hypot(h.x - bomb.x, h.y - bomb.y) <= heroBlastRadius) {
          h.damage(2, bomb.x, bomb.y, this);
        }
      }
    }

    updatePickups(dt) {
      for (const item of this.pickups) {
        if (!item.alive) continue;
        item.age += dt;

        for (const h of this.humanHeroes) {
          if (h.downed) continue;
          if (Math.hypot(h.x - item.x, h.y - item.y) < 13) {
            this.collectPickup(item, h);
            break;
          }
        }
      }
      this.pickups = this.pickups.filter((i) => i.alive);
    }

    _awardRupeesWithStreak(hero, baseAmount, x, y, color, bigSfx = false) {
      hero.streakCount = (hero.streakCount || 0) + 1;
      hero.streakTimer = 3.5;
      const mult = hero.streakCount >= 6 ? 3 : hero.streakCount >= 3 ? 2 : 1;
      const total = baseAmount * mult;
      hero.rupees += total;
      FB.audio.play(bigSfx || mult > 1 ? 'bigRupee' : 'rupee');
      const label = mult > 1 ? `+${total} ×${mult}!` : `+${total}`;
      this.addFloatingText(x, y - 6, label, mult > 1 ? '#fde047' : color);
    }

    collectPickup(item, hero) {
      item.alive = false;
      switch (item.kind) {
        case 'rupee_green':
          this._awardRupeesWithStreak(hero, 1, item.x, item.y, '#4ade80', false);
          break;
        case 'rupee_blue':
          this._awardRupeesWithStreak(hero, 5, item.x, item.y, '#60a5fa', false);
          break;
        case 'rupee_red':
          this._awardRupeesWithStreak(hero, 20, item.x, item.y, '#f87171', true);
          break;
        case 'rupee_purple':
          this._awardRupeesWithStreak(hero, 50, item.x, item.y, '#c084fc', true);
          break;
        case 'heart':
          hero.heal(2);
          FB.audio.play('heart');
          break;
        case 'fairy':
          for (const h of this.humanHeroes) h.heal(h.maxHp);
          FB.audio.play('fairy');
          this.spawnParticles(item.x, item.y, '#f472b6', 10, 55, { shape: 'star' });
          this.addFloatingText(item.x, item.y - 8, 'FULL HEAL!', '#f472b6');
          break;
        case 'heart_container':
          for (const h of this.humanHeroes) {
            h.maxHp += 2;
            h.hp = h.maxHp;
          }
          hero.celebrateTimer = 1.1;
          hero.celebrateColor = '#ef4444';
          FB.audio.play('chest');
          this.spawnParticles(item.x, item.y, '#ef4444', 12, 65, { shape: 'star' });
          this.spawnRing(item.x, item.y, '#fde047', 24, 0.35);
          this.showToast('Heart Container claimed! All heroes gain +1 Max Heart!', 3.2);
          break;
        case 'heart_piece': {
          if (item.pieceId) this.collectedHeartPieces.add(item.pieceId);
          this.heartPieces += 1;
          hero.celebrateTimer = 1.1;
          hero.celebrateColor = '#f472b6';
          FB.audio.play('heartPiece');
          this.spawnParticles(item.x, item.y, '#f472b6', 14, 70, { shape: 'star' });
          this.spawnRing(item.x, item.y, '#fde047', 24, 0.35);
          if (this.heartPieces % 4 === 0) {
            for (const h of this.humanHeroes) {
              h.maxHp += 2;
              h.hp = h.maxHp;
            }
            this.showDialog(
              `HEART PIECE 4/4 COMPLETED! Your Heart Pieces united into a full HEART CONTAINER! All heroes permanently gain +1 Max Heart!`
            );
          } else {
            const rem = this.heartPieces % 4;
            this.showToast(`Found a Hidden Heart Piece! (${rem}/4 toward +1 Max Heart)`, 3.6);
          }
          this.saveProgress();
          break;
        }
        case 'key':
          this.smallKeys += 1;
          FB.audio.play('key');
          this.addFloatingText(item.x, item.y - 8, '+KEY', '#fde047');
          break;
        case 'item_pedestal': {
          const meta = FB.ITEM_META[item.itemId];
          // Grant to ALL active heroes so everyone shares dungeon tools in local co-op!
          for (const h of this.humanHeroes) {
            h.grantItem(item.itemId);
          }
          hero.celebrateTimer = 1.2;
          hero.celebrateColor = meta?.color || '#fde047';
          const col = Math.floor(item.x / TS);
          const row = Math.floor(item.y / TS);
          this.room.claimedPedestals.add(`${col},${row}`);
          FB.audio.play('chest');
          this.spawnParticles(item.x, item.y, meta?.color || '#fde047', 14, 65, { shape: 'star' });
          this.spawnRing(item.x, item.y, '#fde047', 26, 0.35);
          this.showDialog(
            `Obtained ${meta.name}! ${meta.desc} (Press Item button to use, Cycle button to switch items.)`
          );
          break;
        }
      }
      FB.ui.renderHUD(this);
    }

    updatePuzzles() {
      const puz = this.room.puzzle;
      if (!puz || this.room.puzzleSolved) return;

      let solved = false;

      if (puz.type === 'switches') {
        // Every SWITCH_FLOOR tile must be either SWITCH_FLOOR_ON (block locked) or have a hero/clone standing on it!
        let totalSwitches = 0;
        let activeSwitches = 0;
        for (let r = 0; r < this.roomRows; r++) {
          for (let c = 0; c < this.roomCols; c++) {
            const tile = this.room.grid[r][c];
            if (tile === T.SWITCH_FLOOR_ON) {
              totalSwitches++;
              activeSwitches++;
            } else if (tile === T.SWITCH_FLOOR) {
              totalSwitches++;
              const sx = c * TS + 8;
              const sy = r * TS + 8;
              const pressed = this.allHeroes.some(
                (h) => !h.downed && Math.hypot(h.x - sx, h.y - sy) < 11
              );
              if (pressed) activeSwitches++;
            }
          }
        }
        if (totalSwitches > 0 && activeSwitches === totalSwitches) {
          solved = true;
        }
      } else if (puz.type === 'defeat_all') {
        if (this.enemies.length > 0 && this.enemies.every((e) => !e.alive)) {
          solved = true;
        }
      } else if (puz.type === 'torches') {
        let unlit = 0;
        for (let r = 0; r < this.roomRows; r++) {
          for (let c = 0; c < this.roomCols; c++) {
            if (this.room.grid[r][c] === T.TORCH_UNLIT) unlit++;
          }
        }
        if (unlit === 0) solved = true;
      }

      if (solved) {
        this.room.puzzleSolved = true;
        FB.audio.play('secret');
        if (puz.unlockDoor) {
          this._openDoorTiles(this.room, puz.unlockDoor);
        }
        if (puz.spawnChest) {
          const ch = puz.spawnChest;
          this.room.grid[ch.row][ch.col] = T.CHEST_CLOSED;
          this.spawnParticles(ch.col * TS + 8, ch.row * TS + 8, '#fde047', 16, 65, { shape: 'star' });
          this.spawnRing(ch.col * TS + 8, ch.row * TS + 8, '#fde047', 24, 0.35);
        }
        if (puz.spawnBigChest) {
          const ch = puz.spawnBigChest;
          this.room.grid[ch.row][ch.col] = T.BIG_CHEST_CLOSED;
          this.spawnParticles(ch.col * TS + 8, ch.row * TS + 8, '#fde047', 22, 75, { shape: 'star' });
          this.spawnRing(ch.col * TS + 8, ch.row * TS + 8, '#fde047', 30, 0.4);
        }
        this.showToast('Puzzle Solved! A path and treasure have been revealed!', 3.2);
      }
    }

    updateParticles(dt) {
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) {
          p.vy += p.gravity * dt;
        } else {
          p.vy *= 0.92;
        }
        p.vx *= 0.92;
        p.rotation += p.vrot * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);

      for (const ft of this.floatingTexts) {
        ft.y -= 18 * dt;
        ft.life -= dt;
      }
      this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
    }

    _computeRoomHash(room) {
      if (!room || !room.grid) return '';
      const rows = room.grid.length;
      const cols = room.grid[0]?.length || 0;
      let h = 2166136261;
      for (let r = 0; r < rows; r++) {
        const row = room.grid[r];
        for (let c = 0; c < cols; c++) {
          h ^= row[c];
          h = Math.imul(h, 16777619);
        }
      }
      return `${room.id}:${room.area}:${cols}x${rows}:${h >>> 0}`;
    }

    initRoomAtmosphere(room) {
      this.ambientMotes = [];
      this.butterflies = [];
      if (!room) return;
      const area = room.area || 'overworld';

      if (area === 'overworld' || area === 'village') {
        // Sunlit pollen motes + fluttering colorful pixel butterflies!
        for (let i = 0; i < 14; i++) {
          this.ambientMotes.push({
            x: Math.random() * FB.RENDER_W,
            y: Math.random() * FB.RENDER_H,
            vx: 6 + Math.random() * 10,
            vy: -4 + Math.random() * 8,
            size: Math.random() < 0.4 ? 3 : 2,
            phase: Math.random() * Math.PI * 2,
            color: area === 'village' ? '#fef9c3' : Math.random() < 0.5 ? '#fef08a' : '#dcfce7',
          });
        }
        const bfColors = [
          ['#fde047', '#f59e0b'],
          ['#7dd3fc', '#38bdf8'],
          ['#f9a8d4', '#f472b6'],
        ];
        for (let i = 0; i < 3; i++) {
          this.butterflies.push({
            x: 80 + Math.random() * (FB.RENDER_W - 160),
            y: 60 + Math.random() * (FB.RENDER_H - 120),
            ang: Math.random() * Math.PI * 2,
            turnTimer: 0.8 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
            colors: bfColors[i % bfColors.length],
          });
        }
      } else if (area === 'desert' || area === 'desert_dungeon') {
        // Wind-blown golden desert sand wisps!
        const count = area === 'desert' ? 24 : 16;
        for (let i = 0; i < count; i++) {
          this.ambientMotes.push({
            x: Math.random() * FB.RENDER_W,
            y: Math.random() * FB.RENDER_H,
            vx: 24 + Math.random() * 22,
            vy: 3 + Math.random() * 6,
            size: Math.random() < 0.4 ? 3 : 2,
            phase: Math.random() * Math.PI * 2,
            color: Math.random() < 0.5 ? '#fde68a' : '#f59e0b',
          });
        }
      } else if (area === 'mountain' || area === 'magma') {
        // Rising volcanic ember sparks & ash!
        const count = area === 'magma' ? 28 : 20;
        for (let i = 0; i < count; i++) {
          this.ambientMotes.push({
            x: Math.random() * FB.RENDER_W,
            y: Math.random() * FB.RENDER_H,
            vx: -6 + Math.random() * 14,
            vy: -16 - Math.random() * 18,
            size: Math.random() < 0.35 ? 3 : 2,
            phase: Math.random() * Math.PI * 2,
            color: Math.random() < 0.55 ? '#fb923c' : '#fde047',
          });
        }
      } else if (area === 'frost') {
        // Multi-depth gently falling crisp pixel snowflakes!
        for (let i = 0; i < 28; i++) {
          const depth = Math.random() < 0.35 ? 2 : 1;
          this.ambientMotes.push({
            x: Math.random() * FB.RENDER_W,
            y: Math.random() * FB.RENDER_H,
            vx: -10 - depth * 6 + Math.random() * 8,
            vy: 18 + depth * 14 + Math.random() * 10,
            size: depth === 2 ? 3 : 2,
            phase: Math.random() * Math.PI * 2,
            color: depth === 2 ? '#ffffff' : '#bae6fd',
          });
        }
      } else if (area === 'darkworld') {
        // Rising violet/magenta twilight spores!
        for (let i = 0; i < 20; i++) {
          this.ambientMotes.push({
            x: Math.random() * FB.RENDER_W,
            y: Math.random() * FB.RENDER_H,
            vx: -6 + Math.random() * 12,
            vy: -10 - Math.random() * 14,
            size: Math.random() < 0.4 ? 3 : 2,
            phase: Math.random() * Math.PI * 2,
            color: Math.random() < 0.5 ? '#c084fc' : '#f472b6',
          });
        }
      } else if (area === 'dungeon' || area === 'shop') {
        // Floating warm sanctuary dust motes
        const count = area === 'shop' ? 10 : 16;
        for (let i = 0; i < count; i++) {
          this.ambientMotes.push({
            x: Math.random() * FB.RENDER_W,
            y: Math.random() * FB.RENDER_H,
            vx: -4 + Math.random() * 8,
            vy: -5 - Math.random() * 7,
            size: 2,
            phase: Math.random() * Math.PI * 2,
            color: area === 'shop' ? '#fde68a' : '#cbd5e1',
          });
        }
      }
    }

    updateAtmosphere(dt) {
      for (const m of this.ambientMotes) {
        m.phase += dt * 3;
        m.x += (m.vx + Math.sin(m.phase) * 8) * dt;
        m.y += m.vy * dt;
        if (m.x < -8) m.x = FB.RENDER_W + 6;
        if (m.x > FB.RENDER_W + 8) m.x = -6;
        if (m.y < -8) m.y = FB.RENDER_H + 6;
        if (m.y > FB.RENDER_H + 8) m.y = -6;
      }

      for (const bf of this.butterflies) {
        bf.phase += dt * 16;
        bf.turnTimer -= dt;
        if (bf.turnTimer <= 0) {
          bf.turnTimer = 0.7 + Math.random() * 1.6;
          bf.ang += (Math.random() - 0.5) * 1.9;
        }
        bf.x += Math.cos(bf.ang) * 26 * dt;
        bf.y += Math.sin(bf.ang) * 22 * dt + Math.sin(bf.phase * 0.5) * 10 * dt;
        if (bf.x < 48 || bf.x > FB.RENDER_W - 48) bf.ang = Math.PI - bf.ang;
        if (bf.y < 48 || bf.y > FB.RENDER_H - 48) bf.ang = -bf.ang;
      }
    }

    renderAtmosphere(ctx) {
      if (!this.room) return;
      const area = this.room.area || 'overworld';

      ctx.save();

      // Subtle diagonal golden sunbeams in Light Overworld!
      if (area === 'overworld') {
        ctx.fillStyle = 'rgba(255, 248, 195, 0.055)';
        for (let i = 0; i < 3; i++) {
          const bx = 70 + i * 210 + Math.sin(this.time * 0.5 + i) * 14;
          ctx.beginPath();
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx + 78, 0);
          ctx.lineTo(bx - 55, FB.RENDER_H);
          ctx.lineTo(bx - 133, FB.RENDER_H);
          ctx.closePath();
          ctx.fill();
        }
      } else if (area === 'darkworld') {
        // Drifting eerie twilight mist ribbons
        const drift = (this.time * 18) % FB.RENDER_W;
        ctx.fillStyle = 'rgba(139, 92, 246, 0.06)';
        ctx.fillRect(0, 70 + Math.sin(this.time * 0.7) * 14, FB.RENDER_W, 44);
        ctx.fillRect((drift - 220) % FB.RENDER_W, 250 + Math.cos(this.time * 0.6) * 14, 280, 38);
      } else if (area === 'shop') {
        // Warm cozy amber lantern glow overhead
        const g = ctx.createRadialGradient(FB.RENDER_W / 2, 120, 20, FB.RENDER_W / 2, 160, 290);
        g.addColorStop(0, 'rgba(254, 215, 130, 0.14)');
        g.addColorStop(1, 'rgba(254, 215, 130, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, FB.RENDER_W, FB.RENDER_H);
      }

      // Ambient motes (pollen / dust / twilight spores / pixel snow)
      for (const m of this.ambientMotes) {
        const pulse = 0.45 + Math.sin(m.phase) * 0.3;
        ctx.globalAlpha = area === 'frost' ? 0.85 : pulse;
        ctx.fillStyle = m.color;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), m.size, m.size);
      }
      ctx.globalAlpha = 1;

      // Fluttering Hi-Bit pixel butterflies in Light Overworld!
      for (const bf of this.butterflies) {
        const bx = Math.round(bf.x);
        const by = Math.round(bf.y);
        const flap = Math.sin(bf.phase) > 0;
        ctx.fillStyle = '#141824';
        ctx.fillRect(bx, by, 2, 4);
        ctx.fillStyle = bf.colors[0];
        if (flap) {
          ctx.fillRect(bx - 4, by - 2, 4, 4);
          ctx.fillRect(bx + 2, by - 2, 4, 4);
          ctx.fillStyle = bf.colors[1];
          ctx.fillRect(bx - 3, by + 2, 3, 2);
          ctx.fillRect(bx + 2, by + 2, 3, 2);
        } else {
          ctx.fillRect(bx - 2, by - 1, 2, 4);
          ctx.fillRect(bx + 2, by - 1, 2, 4);
        }
      }

      ctx.restore();
    }

    _renderRoomWorld(ctx, offsetX = 0, offsetY = 0) {
      const S = FB.HI_RES_SCALE || 2;
      const room = this.room;
      if (!room) return;

      const camOffX = Math.round(-this.camX * S + offsetX);
      const camOffY = Math.round(-this.camY * S + offsetY);

      ctx.save();
      ctx.translate(camOffX, camOffY);

      // 1. Pre-Baked Hi-Bit Room Terrain (dynamically sized cols*32 x rows*32)
      if (FB.hiTiles) {
        const bw = this.roomCols * 32;
        const bh = this.roomRows * 32;
        if (!this.roomCanvas && typeof document !== 'undefined') {
          this.roomCanvas = document.createElement('canvas');
          this.roomCanvas.width = bw;
          this.roomCanvas.height = bh;
          this.roomCtx = this.roomCanvas.getContext('2d');
        } else if (this.roomCanvas && (this.roomCanvas.width !== bw || this.roomCanvas.height !== bh)) {
          this.roomCanvas.width = bw;
          this.roomCanvas.height = bh;
          this.roomCacheKey = null;
        }
        const key = this._computeRoomHash(room);
        if (this.roomCtx && key !== this.roomCacheKey) {
          FB.hiTiles.bakeRoom(this.roomCtx, room);
          this.roomCacheKey = key;
        }
        if (this.roomCanvas) {
          ctx.drawImage(this.roomCanvas, 0, 0);
        }
        // Live animated tile accents with camera culling
        FB.hiTiles.drawAnimatedTileAccents(ctx, room, this.time, this.camX, this.camY);
      }

      // 1b. Render Shop Pedestal Goods
      if (room.shopItems) {
        for (const s of room.shopItems) {
          const cat = FB.SHOP_CATALOG.find((c) => c.id === s.catalogId);
          if (cat) FB.sprites.drawShopItem(ctx, s.col, s.row, cat, this.time);
        }
      }

      // 2. Render Pickups (native 2x world coords)
      for (const item of this.pickups) {
        FB.sprites.drawPickup(ctx, item, this.time);
      }

      // 3. Y-Sorted Hi-Bit 32x32 Entities (Heroes + Clone + Biome/Variant Enemies + Bosses)
      const drawables = [];
      for (const h of this.allHeroes) {
        drawables.push({ y: h.y, draw: () => FB.sprites.drawHero(ctx, h, this.time) });
      }
      for (const e of this.enemies) {
        if (e.alive) {
          drawables.push({ y: e.y, draw: () => FB.sprites.drawEnemy(ctx, e, this.time) });
        }
      }
      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) d.draw();

      // 4. Render Hi-Bit Projectiles
      for (const p of this.projectiles) {
        this.renderProjectile(ctx, p);
      }

      // 5. Render Rich Shaped Particles in world space
      for (const pt of this.particles) {
        const ratio = Math.max(0, pt.life / pt.maxLife);
        const px = Math.round(pt.x * S);
        const py = Math.round(pt.y * S);
        const sz = pt.size * S;
        ctx.save();
        ctx.globalAlpha = ratio;
        if (pt.shape === 'ring') {
          const rad = ((1 - ratio) * pt.maxRadius + 3) * S;
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = Math.max(2, ratio * 4.5);
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.shape === 'leaf') {
          ctx.translate(px, py);
          ctx.rotate(pt.rotation);
          ctx.fillStyle = '#14381d';
          ctx.fillRect(-5, -3, 10, 6);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-4, -2, 8, 4);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(-2, -2, 4, 2);
        } else if (pt.shape === 'star') {
          ctx.fillStyle = pt.color;
          ctx.fillRect(px - 5, py - 1, 11, 2);
          ctx.fillRect(px - 1, py - 5, 2, 11);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1, py - 1, 2, 2);
        } else if (pt.shape === 'dust') {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(px, py, sz * (0.6 + (1 - ratio) * 0.6), 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.shape === 'spark') {
          ctx.translate(px, py);
          ctx.rotate(pt.rotation);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-sz, -1.5, sz * 2, 3);
        } else {
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), Math.round(sz), Math.round(sz));
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // 5c. Crisp Hi-Bit Floating Combat / Loot Text in world space
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      for (const ft of this.floatingTexts) {
        const fx = Math.round(ft.x * S);
        const fy = Math.round(ft.y * S);
        ctx.globalAlpha = Math.min(1, ft.life * 2);
        ctx.fillStyle = '#090d16';
        ctx.fillText(ft.text, fx + 2, fy + 2);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, fx, fy);
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      const S = FB.HI_RES_SCALE || 2;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const area = this.room ? this.room.area : 'overworld';
      ctx.fillStyle =
        area === 'dungeon'
          ? '#121a2d'
          : area === 'frost'
            ? '#0a1c2e'
            : area === 'darkworld'
              ? '#1b1026'
              : area === 'shop'
                ? '#3b2413'
                : area === 'desert' || area === 'desert_dungeon'
                  ? '#4a3216'
                  : area === 'mountain' || area === 'magma'
                    ? '#261414'
                    : '#133d1d';
      ctx.fillRect(0, 0, FB.RENDER_W, FB.RENDER_H);

      // Integer-snapped Hi-Bit screen shake so tiles never show subpixel grid seams
      if (this.screenShake > 0.2 && !this.slideTrans) {
        const sx = Math.round((Math.random() - 0.5) * this.screenShake * S);
        const sy = Math.round((Math.random() - 0.5) * this.screenShake * S);
        ctx.translate(sx, sy);
      }

      // Authentic Zelda ALttP / Minish Cap Sliding-Camera Room Transition!
      if (this.slideTrans && this.prevViewCanvas) {
        const rawT = Math.max(0, Math.min(1, this.slideTrans.timer / this.slideTrans.duration));
        const p = 1 - Math.pow(1 - rawT, 3); // Ease-out cubic
        let outX = 0;
        let outY = 0;
        let inX = 0;
        let inY = 0;
        if (this.slideTrans.dir === 'east') {
          outX = -p * FB.RENDER_W;
          inX = (1 - p) * FB.RENDER_W;
        } else if (this.slideTrans.dir === 'west') {
          outX = p * FB.RENDER_W;
          inX = -(1 - p) * FB.RENDER_W;
        } else if (this.slideTrans.dir === 'south') {
          outY = -p * FB.RENDER_H;
          inY = (1 - p) * FB.RENDER_H;
        } else if (this.slideTrans.dir === 'north') {
          outY = p * FB.RENDER_H;
          inY = -(1 - p) * FB.RENDER_H;
        }
        ctx.drawImage(this.prevViewCanvas, Math.round(outX), Math.round(outY));
        this._renderRoomWorld(ctx, Math.round(inX), Math.round(inY));
      } else {
        this._renderRoomWorld(ctx, 0, 0);
      }

      // 5b. Living World Biome Atmosphere (screen-space sunbeams, butterflies, snow, twilight spores, lantern glow)
      this.renderAtmosphere(ctx);

      // 6. Hi-Bit 640x416 Camera-Shifted Dynamic Darkness & Warm Torch Lighting Pass
      if (this.room && this.room.isDark && !this.room.puzzleSolved) {
        if (!this.darkCanvas && typeof document !== 'undefined') {
          this.darkCanvas = document.createElement('canvas');
          this.darkCanvas.width = FB.RENDER_W;
          this.darkCanvas.height = FB.RENDER_H;
          this.darkCtx = this.darkCanvas.getContext('2d');
        }
        if (this.darkCtx) {
          const dctx = this.darkCtx;
          dctx.globalCompositeOperation = 'source-over';
          dctx.clearRect(0, 0, FB.RENDER_W, FB.RENDER_H);
          dctx.fillStyle = 'rgba(4, 7, 18, 0.91)';
          dctx.fillRect(0, 0, FB.RENDER_W, FB.RENDER_H);

          dctx.globalCompositeOperation = 'destination-out';
          const punchLight = (lx, ly, rad) => {
            if (lx < -rad || lx > FB.RENDER_W + rad || ly < -rad || ly > FB.RENDER_H + rad) return;
            const g = dctx.createRadialGradient(lx, ly, rad * 0.18, lx, ly, rad);
            g.addColorStop(0, 'rgba(0, 0, 0, 1)');
            g.addColorStop(0.68, 'rgba(0, 0, 0, 0.75)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            dctx.fillStyle = g;
            dctx.beginPath();
            dctx.arc(lx, ly, rad, 0, Math.PI * 2);
            dctx.fill();
          };

          const flicker = Math.sin(this.time * 12) * 5;
          for (const h of this.allHeroes) {
            if (!h.downed) {
              punchLight(
                Math.round((h.x - this.camX) * S),
                Math.round((h.y - this.camY) * S),
                96 + flicker * 0.5
              );
            }
          }
          for (let r = 0; r < this.roomRows; r++) {
            for (let c = 0; c < this.roomCols; c++) {
              if (this.room.grid[r][c] === T.TORCH_LIT) {
                punchLight(
                  Math.round((c * TS + 8 - this.camX) * S),
                  Math.round((r * TS + 8 - this.camY) * S),
                  126 + flicker
                );
              }
            }
          }
          for (const p of this.projectiles) {
            if (p.kind === 'fireball' || p.kind === 'beam') {
              punchLight(
                Math.round((p.x - this.camX) * S),
                Math.round((p.y - this.camY) * S),
                78
              );
            }
          }
          dctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(this.darkCanvas, 0, 0);
        }
      } else if (
        this.room &&
        (area === 'dungeon' ||
          area === 'frost' ||
          area === 'darkworld' ||
          area === 'desert_dungeon' ||
          area === 'magma')
      ) {
        // Subtle atmospheric dungeon / spire / twilight / temple vignette
        const grad = ctx.createRadialGradient(
          FB.RENDER_W / 2,
          FB.RENDER_H / 2,
          FB.RENDER_H * 0.36,
          FB.RENDER_W / 2,
          FB.RENDER_H / 2,
          FB.RENDER_W * 0.65
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(
          1,
          area === 'frost'
            ? 'rgba(8, 28, 48, 0.34)'
            : area === 'darkworld'
              ? 'rgba(24, 8, 36, 0.30)'
              : area === 'magma'
                ? 'rgba(42, 10, 6, 0.34)'
                : area === 'desert_dungeon'
                  ? 'rgba(38, 22, 8, 0.32)'
                  : 'rgba(6, 10, 20, 0.36)'
        );
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, FB.RENDER_W, FB.RENDER_H);
      }

      // Room transition fade (for portals / Magic Mirror / stairs)
      if (this.transitionOverlayAlpha > 0) {
        ctx.fillStyle = `rgba(8, 11, 20, ${this.transitionOverlayAlpha})`;
        ctx.fillRect(0, 0, FB.RENDER_W, FB.RENDER_H);
      }

      ctx.restore();
    }

    renderProjectile(ctx, p) {
      const S = FB.HI_RES_SCALE || 2;
      const px = Math.round(p.x * S);
      const py = Math.round(p.y * S);
      ctx.save();
      ctx.translate(px, py);

      if (p.kind === 'boomerang') {
        ctx.rotate(p.angle);
        ctx.fillStyle = '#141824';
        ctx.fillRect(-11, -5, 22, 8);
        ctx.fillRect(-5, -11, 8, 22);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-10, -4, 20, 6);
        ctx.fillRect(-4, -10, 6, 20);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-2, -2, 5, 5);
      } else if (p.kind === 'bomb') {
        const urgent = p.life < 0.45 && Math.floor(this.time * 22) % 2 === 0;
        ctx.fillStyle = '#141824';
        ctx.beginPath();
        ctx.arc(0, 2, 11.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = urgent ? '#ef4444' : '#312e81';
        ctx.beginPath();
        ctx.arc(0, 2, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = urgent ? '#fca5a5' : '#818cf8';
        ctx.fillRect(-5, -3, 4, 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-4, -10, 8, 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, -14, 4, 4);
      } else if (p.kind === 'arrow') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = '#141824';
        ctx.fillRect(-14, -4, 26, 8);
        ctx.fillStyle = '#d4a359';
        ctx.fillRect(-12, -2, 20, 4);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(6, -4, 6, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-14, -4, 6, 8);
      } else if (p.kind === 'fireball') {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-1, -1, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'rock') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-2, 1, 6, 4);
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(-4, -4, 3, 2);
      } else if (p.kind === 'bone') {
        ctx.rotate(p.angle);
        ctx.fillStyle = '#141824';
        ctx.fillRect(-11, -5, 22, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillRect(-10, -4, 4, 8);
        ctx.fillRect(6, -4, 4, 8);
      } else if (p.kind === 'dark_orb') {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.32)';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e1065';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-2, -2, 3, 3);
      } else if (p.kind === 'ice_shard') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
        ctx.fillRect(-14, -6, 28, 12);
        ctx.fillStyle = '#071b2e';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(0, -8);
        ctx.lineTo(-14, 0);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(0, -6);
        ctx.lineTo(-12, 0);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(-5, -2, 13, 3);
      } else if (p.kind === 'beam') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.42)';
        ctx.fillRect(-20, -8, 36, 16);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -4, 32, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, -2, 24, 4);
      } else if (p.kind === 'arcane_beam') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.fillRect(-18, -9, 36, 18);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-14, -5, 28, 10);
        ctx.fillStyle = '#f5d0fe';
        ctx.fillRect(-10, -2, 22, 4);
      } else if (p.kind === 'laser_beam') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.48)';
        ctx.fillRect(-22, -7, 44, 14);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-18, -4, 36, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-14, -2, 28, 4);
      } else if (p.kind === 'thrown_pot') {
        ctx.rotate(p.angle * 0.5);
        ctx.fillStyle = '#24140b';
        ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = '#9e6238';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#e0a470';
        ctx.fillRect(-6, -6, 7, 5);
      } else if (p.kind === 'hookshot') {
        // Draw crisp Hi-Bit metallic chain links back to owner!
        ctx.restore();
        ctx.save();
        if (p.owner) {
          const ox = p.owner.x * S;
          const oy = p.owner.y * S;
          const dx = px - ox;
          const dy = py - oy;
          const dist = Math.hypot(dx, dy) || 1;
          const links = Math.max(2, Math.floor(dist / 11));
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(Math.round(ox), Math.round(oy));
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(Math.round(ox), Math.round(oy));
          ctx.lineTo(px, py);
          ctx.stroke();
          for (let i = 1; i < links; i++) {
            const lx = Math.round(ox + (dx * i) / links);
            const ly = Math.round(oy + (dy * i) / links);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(lx - 3, ly - 3, 6, 6);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(lx - 2, ly - 2, 4, 4);
          }
        }
        const ang = Math.atan2(p.vy || (p.owner ? p.y - p.owner.y : 0), p.vx || (p.owner ? p.x - p.owner.x : 1));
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.fillStyle = '#141824';
        ctx.fillRect(-7, -9, 16, 18);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-6, -8, 10, 4);
        ctx.fillRect(-6, 4, 10, 4);
        ctx.fillRect(0, -6, 8, 12);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-4, -2, 6, 4);
      }

      ctx.restore();
    }
  }

  FB.Game = Game;

  global.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    FB.game = game;
    game.init();
  });
})(window);
