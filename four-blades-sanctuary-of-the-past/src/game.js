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
      this.canvas.width = FB.VIEW_W;
      this.canvas.height = FB.VIEW_H;
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

      this.smallKeys = 0;
      this.hasBossKey = false;
      this.unlockedLocks = new Set();
      this.bossDefeated = false;
      this.activeDialog = null;
      this.dialogTimer = 0;
      this.hudTick = 0;
      this.lastFrameTime = performance.now();
    }

    init() {
      FB.sprites.init();
      FB.ui.init(this);
      FB.ui.setOverlay('title');

      // Show animated sanctuary background behind title screen
      this.rooms = FB.createWorldData();
      this.room = this.rooms.ow_start;

      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    get allHeroes() {
      return this.spiritClone ? [...this.humanHeroes, this.spiritClone] : this.humanHeroes;
    }

    startNewGame(playerCount) {
      this.selectedPlayerCount = playerCount;
      FB.input.setPlayerCount(playerCount);

      this.rooms = FB.createWorldData();
      this.smallKeys = 0;
      this.hasBossKey = false;
      this.unlockedLocks = new Set();
      this.bossDefeated = false;
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
      FB.ui.setOverlay('none');
      FB.ui.showDialog(null);
      FB.ui.renderHUD(this);

      const modeLabel =
        playerCount === 1
          ? 'Solo Quest! Press Q anytime to summon your Four Swords Spirit Clone.'
          : `${playerCount}-Player Local Co-op Active! Collect rupees & conquer the Palace!`;
      this.showToast(modeLabel, 4.2);
    }

    returnToTitle() {
      this.state = 'title';
      FB.audio.stopMusic();
      FB.ui.showDialog(null);
      FB.ui.setOverlay('title');
    }

    togglePause(forceState) {
      if (this.state !== 'playing' && this.state !== 'paused') return;
      const shouldPause = forceState !== undefined ? forceState : this.state === 'playing';
      this.state = shouldPause ? 'paused' : 'playing';
      FB.ui.setOverlay(shouldPause ? 'paused' : 'none');
    }

    respawnFromGameOver() {
      // Respawn at Sanctuary Courtyard or Palace Entrance with full hearts, keeping progress!
      const targetId = this.room && this.room.area === 'dungeon' ? 'dg_entry' : 'ow_start';
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

    enterRoom(roomId, spawnPos) {
      const room = this.rooms[roomId];
      if (!room) return;
      this.room = room;
      room.visited = true;

      this.projectiles = [];
      this.pickups = [];
      this.particles = [];
      this.floatingTexts = [];
      this.enemies = [];

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
          nx = Math.max(TS * 1.5, Math.min(FB.VIEW_W - TS * 1.5, nx));
          ny = Math.max(TS * 1.5, Math.min(FB.VIEW_H - TS * 1.5, ny));
          h.x = nx;
          h.y = ny;
          h.safeX = nx;
          h.safeY = ny;
          h.activeBoomerang = null;
          h.knockTimer = 0;
          if (h.downed) {
            // Auto-revive with 2 hearts on room transition so co-op stays snappy
            h.downed = false;
            h.hp = Math.min(h.maxHp, 4);
          }
        });
        if (this.spiritClone) {
          this.spiritClone.x = this.humanHeroes[0].x - 14;
          this.spiritClone.y = this.humanHeroes[0].y;
          this.spiritClone.cloneHold = false;
        }
      }

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

      // Spawn enemies unless boss defeated or combat puzzle already cleared
      const shouldSpawnEnemies =
        room.enemies &&
        !(room.isBossRoom && this.bossDefeated) &&
        !(room.puzzle && room.puzzle.type === 'defeat_all' && room.puzzleSolved);

      if (shouldSpawnEnemies) {
        for (const spec of room.enemies) {
          this.enemies.push(
            new FB.Enemy(
              spec.type,
              spec.col * TS + 8,
              spec.row * TS + 8,
              this.humanHeroes.length
            )
          );
        }
      }

      // If boss room entered with boss alive, bar exit and cue boss music!
      if (room.isBossRoom && !this.bossDefeated) {
        this._setDoorTiles(room, 'south', T.DOOR_BARRED);
        FB.audio.play('bossRoar');
        FB.audio.playMusic('boss');
        this.showToast('SHADOW WRAITH VAALOR — Break its dark orbs to expose the core!', 4.2);
      } else if (room.isBossRoom && this.bossDefeated) {
        this._openDoorTiles(room, 'south');
        room.grid[6][9] = T.TRIFORCE_ALTAR;
        room.grid[6][10] = T.TRIFORCE_ALTAR;
      } else {
        FB.audio.playMusic(room.area === 'dungeon' ? 'dungeon' : 'overworld');
      }

      this.transitionOverlayAlpha = 0.85;
      FB.ui.renderHUD(this);
    }

    _setDoorTiles(room, dir, tileId) {
      if (dir === 'north') {
        room.grid[0][9] = tileId;
        room.grid[0][10] = tileId;
      } else if (dir === 'south') {
        room.grid[12][9] = tileId;
        room.grid[12][10] = tileId;
      } else if (dir === 'west') {
        room.grid[6][0] = tileId;
        room.grid[7][0] = tileId;
      } else if (dir === 'east') {
        room.grid[6][19] = tileId;
        room.grid[7][19] = tileId;
      }
    }

    _openDoorTiles(room, dir) {
      this._setDoorTiles(room, dir, T.DOOR_OPEN);
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

      if (FB.input.isPausePressed()) {
        if (this.state === 'playing' || this.state === 'paused') {
          this.togglePause();
        }
      }

      if (this.state === 'playing') {
        this.update(dt);
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

      this.elapsedTime += dt;

      // Update Heroes
      for (let i = 0; i < this.humanHeroes.length; i++) {
        this.updateHero(this.humanHeroes[i], FB.input.getPlayerInput(i), dt);
      }

      // Update Solo Spirit Clone if active
      if (this.spiritClone) {
        this.updateSpiritClone(dt);
      }

      // Multiplayer revive check
      this.updateMultiplayerRevive(dt);

      // Game over check (all human heroes downed)
      if (this.humanHeroes.every((h) => h.downed)) {
        this.state = 'gameover';
        FB.audio.stopMusic();
        FB.ui.setOverlay('gameover');
        return;
      }

      // Update Enemies, Projectiles, Pickups, Puzzles, Particles
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updatePickups(dt);
      this.updatePuzzles();
      this.updateParticles(dt);

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

      // Solo Four Swords Spirit Clone toggle (Q / Tab)
      if (hero.index === 0 && this.humanHeroes.length === 1 && inp.clonePressed) {
        this.toggleSpiritClone();
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

      // Dash / Pegasus Roll
      if (inp.dashPressed && hero.dashCooldown <= 0 && hero.dashTimer <= 0) {
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
        hero.dashTimer = FB.CONFIG.DASH_DURATION;
        hero.dashCooldown = FB.CONFIG.DASH_COOLDOWN;
        hero.dashDustTick = 0;
        FB.audio.play('dash');
        this.spawnParticles(hero.x, hero.y + 4, '#e2e8f0', 6, 38, { shape: 'dust' });
      }

      // Sword attack + Charge Spin Attack
      if (inp.attackPressed && hero.swordCooldown <= 0 && hero.spinTimer <= 0) {
        // First check if interacting with chest or signpost right in front
        if (this.tryInteract(hero)) {
          hero.swordCooldown = 0.22;
        } else {
          this.startSwordSwing(hero);
        }
      }

      if (inp.attackDown && hero.spinTimer <= 0) {
        hero.spinCharge += dt;
        if (hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME && !hero.spinReadyNotified) {
          hero.spinReadyNotified = true;
          FB.audio.play('charge');
          this.spawnParticles(hero.x, hero.y, '#fde047', 7, 45, { shape: 'star' });
          this.spawnRing(hero.x, hero.y, '#fde047', 18, 0.22);
        }
      } else {
        if (hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME) {
          this.startSpinAttack(hero);
        }
        hero.spinCharge = 0;
        hero.spinReadyNotified = false;
      }

      // Sub-Item use
      if (inp.itemPressed && hero.itemCooldown <= 0 && hero.currentItem) {
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
        const speedMult = hero.spinCharge > 0.15 ? 0.65 : hero.swordTimer > 0 ? 0.5 : 1.0;
        vx = inp.dx * FB.CONFIG.PLAYER_SPEED * speedMult;
        vy = inp.dy * FB.CONFIG.PLAYER_SPEED * speedMult;
        if (inp.dx !== 0 || inp.dy !== 0) {
          if (Math.abs(inp.dx) > Math.abs(inp.dy)) {
            hero.dir = inp.dx < 0 ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            hero.dir = inp.dy < 0 ? FB.DIRS.UP : FB.DIRS.DOWN;
          }
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
      }
    }

    startSpinAttack(hero) {
      hero.spinTimer = FB.CONFIG.SPIN_DURATION;
      hero.swordCooldown = 0.36;
      hero.swordHitSet = new Set();
      FB.audio.play('spin');
      this.spawnParticles(hero.x, hero.y, '#fde047', 10, 75, { shape: 'star' });
      this.spawnRing(hero.x, hero.y, '#fde047', 26, 0.3);
    }

    tryInteract(hero) {
      const dv = FB.DIR_VEC[hero.dir];
      const fx = hero.x + dv.x * 13;
      const fy = hero.y + dv.y * 13;
      const col = Math.floor(fx / TS);
      const row = Math.floor(fy / TS);
      if (col < 0 || col >= FB.ROOM_COLS || row < 0 || row >= FB.ROOM_ROWS) return false;
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
      }
    }

    isSolidAt(col, row, flying = false) {
      if (col < 0 || col >= FB.ROOM_COLS || row < 0 || row >= FB.ROOM_ROWS) return false;
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
      if (col < 0 || col >= FB.ROOM_COLS || row < 0 || row >= FB.ROOM_ROWS) return;
      const tile = this.room.grid[row][col];

      // Unlock Small Locked Door
      if (tile === T.DOOR_LOCKED) {
        if (this.smallKeys > 0) {
          const dir = this._doorDirForTile(col, row);
          const lock = this.room.locks?.[dir];
          this.smallKeys -= 1;
          if (lock) this.unlockedLocks.add(lock.id);
          this._openDoorTiles(this.room, dir);
          FB.audio.play('door');
          this.spawnParticles(col * TS + 8, row * TS + 8, '#facc15', 12);
          this.showToast('Unlocked Palace Door!', 2.2);
          FB.ui.renderHUD(this);
        } else {
          this.showToast('Locked! Find a Small Key in the dungeon chambers.', 2.0);
        }
        return;
      }

      // Unlock Boss Door
      if (tile === T.DOOR_BOSS) {
        if (this.hasBossKey) {
          const dir = this._doorDirForTile(col, row);
          const lock = this.room.locks?.[dir];
          if (lock) this.unlockedLocks.add(lock.id);
          this._openDoorTiles(this.room, dir);
          FB.audio.play('door');
          this.screenShake = 4;
          this.spawnParticles(col * TS + 8, row * TS + 8, '#fde047', 18);
          this.showToast('The Boss Door opens! Prepare for battle!', 2.8);
          FB.ui.renderHUD(this);
        } else {
          this.showToast('Sealed by the Sovereign! Find the BOSS KEY in the eastern wing.', 2.5);
        }
        return;
      }

      // Pushable Block!
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
          if (tc > 0 && tc < FB.ROOM_COLS - 1 && tr > 0 && tr < FB.ROOM_ROWS - 1) {
            const dest = this.room.grid[tr][tc];
            if (dest === T.DUNGEON_FLOOR || dest === T.SWITCH_FLOOR || dest === T.DUNGEON_CARPET) {
              // Restore floor under old block
              this.room.grid[row][col] = T.DUNGEON_FLOOR;
              // If pushed onto switch, mark tile as BLOCK_PUSH AND remember switch underneath
              if (dest === T.SWITCH_FLOOR) {
                this.room.grid[tr][tc] = T.SWITCH_FLOOR_ON;
                FB.audio.play('switch');
                this.spawnParticles(tc * TS + 8, tr * TS + 8, '#4ade80', 10);
                this.addFloatingText(tc * TS + 8, tr * TS, 'LOCKED!', '#4ade80');
              } else {
                this.room.grid[tr][tc] = T.BLOCK_PUSH;
                FB.audio.play('door');
              }
            }
          }
        }
      }
    }

    _doorDirForTile(col, row) {
      if (row === 0) return 'north';
      if (row === FB.ROOM_ROWS - 1) return 'south';
      if (col === 0) return 'west';
      return 'east';
    }

    checkHeroTileTriggers(hero, dt) {
      if (hero.isClone) return;
      const col = Math.floor(hero.x / TS);
      const row = Math.floor(hero.y / TS);

      // Room border transitions!
      if (hero.y < 5 && this.room.exits?.north) {
        this.enterRoom(this.room.exits.north, { col: 9.5, row: FB.ROOM_ROWS - 2 });
        return;
      }
      if (hero.y > FB.VIEW_H - 5 && this.room.exits?.south) {
        this.enterRoom(this.room.exits.south, { col: 9.5, row: 1 });
        return;
      }
      if (hero.x < 5 && this.room.exits?.west) {
        this.enterRoom(this.room.exits.west, { col: FB.ROOM_COLS - 2, row: 6.5 });
        return;
      }
      if (hero.x > FB.VIEW_W - 5 && this.room.exits?.east) {
        this.enterRoom(this.room.exits.east, { col: 1, row: 6.5 });
        return;
      }

      if (col < 0 || col >= FB.ROOM_COLS || row < 0 || row >= FB.ROOM_ROWS) return;
      const tile = this.room.grid[row][col];

      // Safe ground tracking
      if (
        tile === T.GRASS ||
        tile === T.GRASS_FLOWERS ||
        tile === T.PATH ||
        tile === T.DUNGEON_FLOOR ||
        tile === T.DUNGEON_CARPET ||
        tile === T.BRIDGE
      ) {
        hero.safeX = col * TS + 8;
        hero.safeY = row * TS + 8;
      }

      // Portals (Overworld <-> Palace)
      if ((tile === T.PORTAL_DUNGEON || tile === T.PORTAL_OVERWORLD) && this.room.portals) {
        const portal = this.room.portals.find((p) => p.col === col && p.row === row);
        if (portal) {
          FB.audio.play('door');
          this.enterRoom(portal.targetRoom, { col: portal.targetCol, row: portal.targetRow });
          return;
        }
      }

      // Pit fall
      if (tile === T.PIT && hero.dashTimer <= 0) {
        hero.damage(1, hero.x, hero.y, this);
        hero.x = hero.safeX;
        hero.y = hero.safeY;
        return;
      }

      // Spikes
      if (tile === T.SPIKES) {
        hero.damage(1, col * TS + 8, row * TS + 8, this);
      }

      // Fairy Pool healing
      if (tile === T.FAIRY_POOL) {
        if (hero.hp < hero.maxHp) {
          hero.hp = hero.maxHp;
          FB.audio.play('fairy');
          this.spawnParticles(hero.x, hero.y, '#7dd3fc', 12);
          this.addFloatingText(hero.x, hero.y - 10, 'HEALED!', '#7dd3fc');
          FB.ui.renderHUD(this);
        }
      }

      // Triforce Victory Altar!
      if (tile === T.TRIFORCE_ALTAR && this.bossDefeated) {
        this.triggerVictory();
      }
    }

    checkSwordHits(hero, isSpin) {
      const isFinisher = !isSpin && hero.comboStep === 2;
      const reach = isSpin ? 22 : isFinisher ? 20 : 17;
      const dv = FB.DIR_VEC[hero.dir];
      const forwardOffset = isFinisher ? 16 : 13;
      const cx = isSpin ? hero.x : hero.x + dv.x * forwardOffset;
      const cy = isSpin ? hero.y : hero.y + dv.y * forwardOffset;
      const dmg = isSpin ? 4 : hero.isClone ? 1 : isFinisher ? 3 : 2;

      // Hit tiles (Bushes, Pots, Crystal Switches)
      const minC = Math.max(0, Math.floor((cx - reach) / TS));
      const maxC = Math.min(FB.ROOM_COLS - 1, Math.floor((cx + reach) / TS));
      const minR = Math.max(0, Math.floor((cy - reach) / TS));
      const maxR = Math.min(FB.ROOM_ROWS - 1, Math.floor((cy + reach) / TS));

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const tile = this.room.grid[r][c];
          const tx = c * TS + 8;
          const ty = r * TS + 8;
          if (Math.hypot(tx - cx, ty - cy) > reach + 4) continue;

          if (tile === T.BUSH) {
            this.room.grid[r][c] = T.GRASS;
            FB.audio.play('bush');
            this.spawnParticles(tx, ty, '#4ade80', 7, 52, { shape: 'leaf', gravity: 55, life: 0.42 });
            this.spawnParticles(tx, ty, '#16a34a', 4, 42, { shape: 'leaf', gravity: 50, life: 0.4 });
            this._dropDestructibleLoot(tx, ty, false);
          } else if (tile === T.POT) {
            this.room.grid[r][c] = this.room.area === 'dungeon' ? T.DUNGEON_FLOOR : T.GRASS;
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
          const hitOk = e.hit(dealt, hero.x, hero.y, hero.isClone ? this.humanHeroes[0] : hero, this);
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
      else if (r < 0.5) this.spawnPickup('heart', x, y);
      else if (r < 0.58) this.spawnPickup('rupee_blue', x, y);
    }

    flipCrystalSwitch() {
      this.room.crystalState = this.room.crystalState === 'blue' ? 'red' : 'blue';
      FB.audio.play('switch');
      for (let r = 0; r < FB.ROOM_ROWS; r++) {
        for (let c = 0; c < FB.ROOM_COLS; c++) {
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
        } else if (e.knockTimer > 0) {
          e.knockTimer -= dt;
          this.moveEnemy(e, e.knockX * dt, e.knockY * dt);
        } else {
          this.updateNormalEnemy(e, target, bestDist, dt);
        }

        // Contact damage with heroes (extended slightly during enemy weapon lunge!)
        const hitDist = e.lungeTimer > 0 ? (e.w + 15) * 0.5 : (e.w + 10) * 0.45;
        for (const h of liveHeroes) {
          if (Math.hypot(h.x - e.x, h.y - e.y) < hitDist) {
            // If hero is mid-swing facing the lunging armed enemy, trigger auto-parry instead of unfair trade!
            if (e.armed && e.lungeTimer > 0 && h.swordTimer > 0) {
              this.checkSwordHits(h, false);
              if (e.stunTimer > 0) continue;
            }
            h.damage(e.damage, e.x, e.y, this);
          }
        }
      }
    }

    updateNormalEnemy(e, target, dist, dt) {
      e.aiTimer -= dt;
      e.shootTimer -= dt;

      if (e.type === 'octorok') {
        if (e.aiTimer <= 0) {
          e.dir = Math.floor(Math.random() * 4);
          e.aiTimer = 1.1 + Math.random() * 1.0;
        }
        const dv = FB.DIR_VEC[e.dir];
        if (!this.moveEnemy(e, dv.x * e.speed * dt, dv.y * e.speed * dt)) {
          e.dir = (e.dir + 1) % 4;
        }
        if (e.shootTimer <= 0 && dist < 170) {
          e.shootTimer = 2.0 + Math.random() * 1.1;
          // Face nearest axis toward player and spit rock
          if (Math.abs(target.x - e.x) > Math.abs(target.y - e.y)) {
            e.dir = target.x < e.x ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            e.dir = target.y < e.y ? FB.DIRS.UP : FB.DIRS.DOWN;
          }
          const sv = FB.DIR_VEC[e.dir];
          this.projectiles.push(
            new FB.Projectile({
              kind: 'rock',
              x: e.x + sv.x * 8,
              y: e.y + sv.y * 8,
              vx: sv.x * 115,
              vy: sv.y * 115,
              fromEnemy: true,
              damage: 1,
              life: 1.8,
              radius: 4,
            })
          );
        }
      } else if (e.type === 'keese') {
        const ang = Math.atan2(target.y - e.y, target.x - e.x) + Math.sin(this.time * 5 + e.x) * 0.8;
        this.moveEnemy(e, Math.cos(ang) * e.speed * dt, Math.sin(ang) * e.speed * dt);
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
            e.lungeTimer = 0.2;
            e.attackCooldown = e.type === 'red_soldier' ? 1.15 : 1.45;
            FB.audio.play('sword');
          }
          return;
        }

        if (e.armed && e.lungeTimer > 0) {
          e.lungeTimer -= dt;
          const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
          const lungeSpd = e.speed * 2.15;
          this.moveEnemy(e, dv.x * lungeSpd * dt, dv.y * lungeSpd * dt);
          return;
        }

        if (dist < 135) {
          const ang = Math.atan2(target.y - e.y, target.x - e.x);
          const vx = Math.cos(ang) * e.speed;
          const vy = Math.sin(ang) * e.speed;
          if (Math.abs(vx) > Math.abs(vy)) {
            e.dir = vx < 0 ? FB.DIRS.LEFT : FB.DIRS.RIGHT;
          } else {
            e.dir = vy < 0 ? FB.DIRS.UP : FB.DIRS.DOWN;
          }

          // Initiate parryable weapon telegraph when close!
          if (e.armed && dist < 38 && e.attackCooldown <= 0) {
            e.telegraphTimer = 0.36;
            return;
          }

          this.moveEnemy(e, vx * dt, vy * dt);

          // Stalfos throws bones at mid-range!
          if (e.type === 'stalfos' && dist > 42 && e.shootTimer <= 0) {
            e.shootTimer = 2.4;
            this.projectiles.push(
              new FB.Projectile({
                kind: 'bone',
                x: e.x,
                y: e.y,
                vx: Math.cos(ang) * 115,
                vy: Math.sin(ang) * 115,
                fromEnemy: true,
                damage: 2,
                life: 1.6,
                radius: 4,
              })
            );
          }
        } else {
          if (e.aiTimer <= 0) {
            e.dir = Math.floor(Math.random() * 4);
            e.aiTimer = 1.2 + Math.random();
          }
          const dv = FB.DIR_VEC[e.dir];
          if (!this.moveEnemy(e, dv.x * e.speed * 0.6 * dt, dv.y * e.speed * 0.6 * dt)) {
            e.dir = (e.dir + 2) % 4;
          }
        }
      }
    }

    updateBoss(b, target, dt) {
      b.lookAngle = Math.atan2(target.y - b.y, target.x - b.x);
      const orbSpeed = b.phase === 2 ? 2.6 : 1.7;
      for (const orb of b.orbs) {
        if (!orb.alive) continue;
        orb.angle += orbSpeed * dt;
        const ox = b.x + Math.cos(orb.angle) * orb.radius;
        const oy = b.y + Math.sin(orb.angle) * orb.radius;
        for (const h of this.humanHeroes) {
          if (!h.downed && Math.hypot(h.x - ox, h.y - oy) < 11) {
            h.damage(1, ox, oy, this);
          }
        }
      }

      b.stateTimer -= dt;
      if (b.bossState === 'orbit') {
        // Glide smoothly toward arena center / circling player
        const ang = Math.atan2(target.y - b.y, target.x - b.x) + 0.6;
        const spd = b.phase === 2 ? 52 : 36;
        b.x = Math.max(TS * 2.5, Math.min(FB.VIEW_W - TS * 2.5, b.x + Math.cos(ang) * spd * dt));
        b.y = Math.max(TS * 2.5, Math.min(FB.VIEW_H - TS * 2.5, b.y + Math.sin(ang) * spd * dt));

        if (b.stateTimer <= 0) {
          // Fire radial dark energy spread!
          const count = b.phase === 2 ? 6 : 4;
          for (let i = 0; i < count; i++) {
            const a = b.lookAngle + ((i - (count - 1) / 2) * 0.36);
            this.projectiles.push(
              new FB.Projectile({
                kind: 'dark_orb',
                x: b.x,
                y: b.y,
                vx: Math.cos(a) * (b.phase === 2 ? 118 : 95),
                vy: Math.sin(a) * (b.phase === 2 ? 118 : 95),
                fromEnemy: true,
                damage: 2,
                life: 2.2,
                radius: 5,
              })
            );
          }
          FB.audio.play('fire');
          b.bossState = 'dash';
          b.stateTimer = 0.85;
          const dashSpd = b.phase === 2 ? 128 : 96;
          b.dashVx = Math.cos(b.lookAngle) * dashSpd;
          b.dashVy = Math.sin(b.lookAngle) * dashSpd;
        }
      } else if (b.bossState === 'dash') {
        b.x = Math.max(TS * 2.2, Math.min(FB.VIEW_W - TS * 2.2, b.x + b.dashVx * dt));
        b.y = Math.max(TS * 2.2, Math.min(FB.VIEW_H - TS * 2.2, b.y + b.dashVy * dt));
        if (b.stateTimer <= 0) {
          b.bossState = 'orbit';
          b.stateTimer = b.phase === 2 ? 1.6 : 2.3;
        }
      }
    }

    onBossDefeated(boss) {
      this.bossDefeated = true;
      this.screenShake = 8;
      FB.audio.play('victory');
      this.spawnParticles(boss.x, boss.y, '#fde047', 28, 110);
      this.spawnParticles(boss.x, boss.y, '#a855f7', 20, 90);
      this.spawnPickup('heart_container', boss.x, boss.y + 12);

      // Reveal Triforce Victory Altar in center!
      this.room.grid[6][9] = T.TRIFORCE_ALTAR;
      this.room.grid[6][10] = T.TRIFORCE_ALTAR;
      this._openDoorTiles(this.room, 'south');
      this.showToast('VAALOR DEFEATED! Step onto the Golden Relic Altar to claim victory!', 6.0);
    }

    triggerVictory() {
      if (this.state === 'victory') return;
      this.state = 'victory';
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
        nx > FB.VIEW_W - TS * 1.2 ||
        this.isSolidAt(Math.floor((nx - half) / TS), Math.floor(e.y / TS), e.flying) ||
        this.isSolidAt(Math.floor((nx + half) / TS), Math.floor(e.y / TS), e.flying);
      if (!blockedX) {
        e.x = nx;
        moved = true;
      }

      const blockedY =
        ny < TS * 1.2 ||
        ny > FB.VIEW_H - TS * 1.2 ||
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
          if (Math.random() < (p.life < 0.45 ? 0.55 : 0.25)) {
            this.spawnParticles(p.x + 1, p.y - 6, '#fde047', 1, 32, { shape: 'spark', life: 0.16 });
          }
          if (p.life <= 0) {
            this.explodeBomb(p);
            p.alive = false;
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
          if (p.kind === 'fireball' && Math.random() < 0.5) {
            this.spawnParticles(p.x, p.y, '#fb923c', 1, 18, { shape: 'dust', life: 0.18, size: 2.2 });
          } else if (p.kind === 'dark_orb' && Math.random() < 0.35) {
            this.spawnParticles(p.x, p.y, '#a855f7', 1, 15, { shape: 'dust', life: 0.16, size: 1.8 });
          }
          if (p.life <= 0) {
            p.alive = false;
            continue;
          }
        }

        // Bounds check
        if (p.x < 4 || p.x > FB.VIEW_W - 4 || p.y < 4 || p.y > FB.VIEW_H - 4) {
          if (p.kind === 'boomerang') p.returning = true;
          else p.alive = false;
          continue;
        }

        // Tile interaction
        const col = Math.floor(p.x / TS);
        const row = Math.floor(p.y / TS);
        if (col >= 0 && col < FB.ROOM_COLS && row >= 0 && row < FB.ROOM_ROWS) {
          const tile = this.room.grid[row][col];

          if (!p.fromEnemy && (tile === T.CRYSTAL_BLUE || tile === T.CRYSTAL_RED)) {
            this.flipCrystalSwitch();
            if (p.kind === 'boomerang') p.returning = true;
            else p.alive = false;
            continue;
          }

          if (p.kind === 'fireball' && tile === T.TORCH_UNLIT) {
            this.room.grid[row][col] = T.TORCH_LIT;
            FB.audio.play('fire');
            this.spawnParticles(col * TS + 8, row * TS + 6, '#facc15', 10);
            p.alive = false;
            continue;
          }

          if (FB.PROJECTILE_BLOCK_TILES.has(tile)) {
            if (p.kind === 'boomerang') {
              p.returning = true;
              FB.audio.play('clink');
            } else {
              this.spawnParticles(p.x, p.y, '#cbd5e1', 4);
              p.alive = false;
            }
            continue;
          }
        }

        // Entity collision
        if (p.fromEnemy) {
          for (const h of this.humanHeroes) {
            if (h.downed) continue;
            if (Math.hypot(h.x - p.x, h.y - p.y) < 8 + p.radius) {
              h.damage(p.damage, p.x, p.y, this);
              p.alive = false;
              break;
            }
          }
        } else {
          for (const e of this.enemies) {
            if (!e.alive) continue;

            // Arrows / Boomerang / Fireball can also pop boss shield orbs!
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
                  else p.alive = false;
                }
              }
            }

            if (p.alive && Math.hypot(e.x - p.x, e.y - p.y) < e.w * 0.55 + p.radius) {
              e.hit(p.damage, p.x, p.y, p.owner, this, {
                stun: p.kind === 'boomerang' ? 2.4 : 0,
              });
              if (p.kind === 'boomerang') p.returning = true;
              else p.alive = false;
              break;
            }
          }
        }
      }

      this.projectiles = this.projectiles.filter((p) => p.alive);
    }

    explodeBomb(bomb) {
      const blastRadius = 32;
      FB.audio.play('bombBoom');
      this.screenShake = 6;
      this.spawnRing(bomb.x, bomb.y, '#fde047', 34, 0.28);
      this.spawnRing(bomb.x, bomb.y, '#fb923c', 26, 0.22);
      this.spawnParticles(bomb.x, bomb.y, '#fb923c', 16, 95, { shape: 'spark' });
      this.spawnParticles(bomb.x, bomb.y, '#fde047', 12, 70, { shape: 'star' });
      this.spawnParticles(bomb.x, bomb.y, '#e2e8f0', 10, 50, { shape: 'dust', size: 3.2, life: 0.38 });

      // Blast cracked walls, cracked boulders, bushes, pots, crystal switches!
      const minC = Math.max(0, Math.floor((bomb.x - blastRadius) / TS));
      const maxC = Math.min(FB.ROOM_COLS - 1, Math.floor((bomb.x + blastRadius) / TS));
      const minR = Math.max(0, Math.floor((bomb.y - blastRadius) / TS));
      const maxR = Math.min(FB.ROOM_ROWS - 1, Math.floor((bomb.y + blastRadius) / TS));

      let discoveredSecret = false;
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const tx = c * TS + 8;
          const ty = r * TS + 8;
          if (Math.hypot(tx - bomb.x, ty - bomb.y) > blastRadius) continue;
          const tile = this.room.grid[r][c];
          if (tile === T.CRACKED_WALL) {
            this.room.grid[r][c] = T.DUNGEON_FLOOR;
            discoveredSecret = true;
          } else if (tile === T.ROCK_CRACKED) {
            this.room.grid[r][c] = T.PATH;
            discoveredSecret = true;
          } else if (tile === T.BUSH) {
            this.room.grid[r][c] = T.GRASS;
            this._dropDestructibleLoot(tx, ty, false);
          } else if (tile === T.POT) {
            this.room.grid[r][c] = this.room.area === 'dungeon' ? T.DUNGEON_FLOOR : T.GRASS;
            this._dropDestructibleLoot(tx, ty, !!this.room.fairyPots);
          } else if (tile === T.CRYSTAL_BLUE || tile === T.CRYSTAL_RED) {
            this.flipCrystalSwitch();
          }
        }
      }

      if (discoveredSecret) {
        FB.audio.play('secret');
        this.showToast('You blasted open a secret passage!', 3.0);
      }

      // Blast enemies
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - bomb.x, e.y - bomb.y) < blastRadius + e.w * 0.5) {
          e.hit(bomb.damage, bomb.x, bomb.y, bomb.owner, this, { isBomb: true, ignoreOrbs: true });
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

    collectPickup(item, hero) {
      item.alive = false;
      switch (item.kind) {
        case 'rupee_green':
          hero.rupees += 1;
          FB.audio.play('rupee');
          this.addFloatingText(item.x, item.y - 6, '+1', '#4ade80');
          break;
        case 'rupee_blue':
          hero.rupees += 5;
          FB.audio.play('rupee');
          this.addFloatingText(item.x, item.y - 6, '+5', '#60a5fa');
          break;
        case 'rupee_red':
          hero.rupees += 20;
          FB.audio.play('bigRupee');
          this.addFloatingText(item.x, item.y - 6, '+20', '#f87171');
          break;
        case 'rupee_purple':
          hero.rupees += 50;
          FB.audio.play('bigRupee');
          this.addFloatingText(item.x, item.y - 6, '+50', '#c084fc');
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
        for (let r = 0; r < FB.ROOM_ROWS; r++) {
          for (let c = 0; c < FB.ROOM_COLS; c++) {
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
        for (let r = 0; r < FB.ROOM_ROWS; r++) {
          for (let c = 0; c < FB.ROOM_COLS; c++) {
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

    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = this.room && this.room.area === 'dungeon' ? '#23314d' : '#1f5e2c';
      ctx.fillRect(0, 0, FB.VIEW_W, FB.VIEW_H);

      // Integer-snapped screen shake so tiles never show subpixel grid seams
      if (this.screenShake > 0.2) {
        const sx = Math.round((Math.random() - 0.5) * this.screenShake);
        const sy = Math.round((Math.random() - 0.5) * this.screenShake);
        ctx.translate(sx, sy);
      }

      // 1. Render Tile Map
      if (this.room) {
        for (let r = 0; r < FB.ROOM_ROWS; r++) {
          for (let c = 0; c < FB.ROOM_COLS; c++) {
            FB.sprites.drawTile(ctx, this.room.grid[r][c], c * TS, r * TS, this.time);
          }
        }
      }

      // 2. Render Pickups
      for (const item of this.pickups) {
        FB.sprites.drawPickup(ctx, item, this.time);
      }

      // 3. Y-Sorted Entities (Heroes + Clone + Enemies) for authentic 2.5D depth!
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

      // 4. Render Projectiles
      for (const p of this.projectiles) {
        this.renderProjectile(ctx, p);
      }

      // 5. Render Rich Shaped Particles & Floating Text
      for (const pt of this.particles) {
        const ratio = Math.max(0, pt.life / pt.maxLife);
        ctx.save();
        ctx.globalAlpha = ratio;
        if (pt.shape === 'ring') {
          const rad = (1 - ratio) * pt.maxRadius + 3;
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = Math.max(1, ratio * 2.5);
          ctx.beginPath();
          ctx.arc(Math.round(pt.x), Math.round(pt.y), rad, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.shape === 'leaf') {
          ctx.translate(Math.round(pt.x), Math.round(pt.y));
          ctx.rotate(pt.rotation);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-2, -1, 4, 2);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(-1, -1, 2, 1);
        } else if (pt.shape === 'star') {
          const px = Math.round(pt.x);
          const py = Math.round(pt.y);
          ctx.fillStyle = pt.color;
          ctx.fillRect(px - 2, py, 5, 1);
          ctx.fillRect(px, py - 2, 1, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px, py, 1, 1);
        } else if (pt.shape === 'dust') {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(Math.round(pt.x), Math.round(pt.y), pt.size * (0.6 + (1 - ratio) * 0.6), 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.shape === 'spark') {
          ctx.translate(Math.round(pt.x), Math.round(pt.y));
          ctx.rotate(pt.rotation);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.size, -0.75, pt.size * 2, 1.5);
        } else {
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x - pt.size / 2), Math.round(pt.y - pt.size / 2), pt.size, pt.size);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      for (const ft of this.floatingTexts) {
        ctx.globalAlpha = Math.min(1, ft.life * 2);
        ctx.fillStyle = '#090d16';
        ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
      }
      ctx.globalAlpha = 1;

      // Subtle atmospheric dungeon vignette
      if (this.room && this.room.area === 'dungeon') {
        const grad = ctx.createRadialGradient(
          FB.VIEW_W / 2,
          FB.VIEW_H / 2,
          FB.VIEW_H * 0.35,
          FB.VIEW_W / 2,
          FB.VIEW_H / 2,
          FB.VIEW_W * 0.65
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(6, 10, 20, 0.36)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, FB.VIEW_W, FB.VIEW_H);
      }

      // Room transition fade
      if (this.transitionOverlayAlpha > 0) {
        ctx.fillStyle = `rgba(8, 11, 20, ${this.transitionOverlayAlpha})`;
        ctx.fillRect(0, 0, FB.VIEW_W, FB.VIEW_H);
      }

      ctx.restore();
    }

    renderProjectile(ctx, p) {
      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y));

      if (p.kind === 'boomerang') {
        ctx.rotate(p.angle);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-5, -2, 10, 3);
        ctx.fillRect(-2, -5, 3, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-1, -1, 3, 3);
      } else if (p.kind === 'bomb') {
        const urgent = p.life < 0.45 && Math.floor(this.time * 22) % 2 === 0;
        ctx.fillStyle = urgent ? '#ef4444' : '#312e81';
        ctx.beginPath();
        ctx.arc(0, 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-2, -5, 4, 2);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, -7, 2, 2);
      } else if (p.kind === 'arrow') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = '#d4a359';
        ctx.fillRect(-6, -1, 10, 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(3, -2, 3, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-7, -2, 3, 4);
      } else if (p.kind === 'fireball') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'rock') {
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-1, 0, 3, 2);
      } else if (p.kind === 'bone') {
        ctx.rotate(p.angle);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillRect(-5, -2, 2, 4);
        ctx.fillRect(3, -2, 2, 4);
      } else if (p.kind === 'dark_orb') {
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
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
