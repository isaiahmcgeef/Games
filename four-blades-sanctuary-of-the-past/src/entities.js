/**
 * Game Entities: Heroes (with Solo Four Swords Spirit Clone), Enemies, Boss,
 * Projectiles (Boomerang, Bombs, Arrows, Fireballs), Pickups, and Particles.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  class Hero {
    constructor(index, x, y, isClone = false) {
      this.index = index;
      this.profile = FB.HERO_PROFILES[index % FB.HERO_PROFILES.length];
      this.isClone = isClone;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.dir = FB.DIRS.DOWN;
      this.moving = false;

      this.maxHp = FB.CONFIG.START_MAX_HP;
      this.hp = this.maxHp;
      this.downed = false;
      this.reviveProgress = 0;

      this.invuln = 0;
      this.knockX = 0;
      this.knockY = 0;
      this.knockTimer = 0;

      // Combat & movement timers
      this.swordTimer = 0;
      this.swordCooldown = 0;
      this.swordHitSet = new Set();
      this.spinCharge = 0;
      this.spinReadyNotified = false;
      this.spinTimer = 0;

      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.dashDx = 0;
      this.dashDy = 0;

      this.pushTimer = 0;
      this.pushTileKey = null;

      // Inventory & Four Swords Stats
      this.items = [FB.ITEMS.BOOMERANG]; // Start with Boomerang ready!
      this.itemIdx = 0;
      this.itemCooldown = 0;
      this.activeBoomerang = null;

      this.rupees = 0;
      this.kills = 0;
      this.revives = 0;
      this.damageTaken = 0;
      this.showTag = false;

      // Safe ground memory for pit respawn
      this.safeX = x;
      this.safeY = y;

      // Solo Spirit Clone formation state
      this.cloneHold = false;

      // Rich sprite animation state
      this.walkPhase = 0;
      this.itemAnimTimer = 0;
      this.lastItemUsed = null;
      this.celebrateTimer = 0;
      this.celebrateColor = '#fde047';
      this.pushing = false;
      this.afterimages = [];
      this.dashDustTick = 0;

      // 3-hit sword combo & blade parry state
      this.comboStep = 0; // 0 = Forehand, 1 = Backhand, 2 = Heroic Thrust
      this.comboTimer = 0;
      this.parryFlash = 0;

      // Lift & Throw, Shop Upgrades & Rupee Streak state
      this.carrying = null; // { kind: 'pot' | 'bomb' | 'enemy' | 'hero', ref }
      this.carriedBy = null;
      this.thrownTimer = 0;
      this.thrownVx = 0;
      this.thrownVy = 0;
      this.temperedSword = false;
      this.mirrorShield = false;
      this.potions = 0;
      this.streakCount = 0;
      this.streakTimer = 0;
      this.iceVx = 0;
      this.iceVy = 0;
    }

    get currentItem() {
      return this.items[this.itemIdx] || null;
    }

    grantItem(itemId) {
      if (!this.items.includes(itemId)) {
        this.items.push(itemId);
        this.itemIdx = this.items.length - 1;
        return true;
      }
      this.itemIdx = this.items.indexOf(itemId);
      return false;
    }

    cycleItem() {
      if (this.items.length <= 1) return;
      this.itemIdx = (this.itemIdx + 1) % this.items.length;
    }

    heal(amount) {
      if (this.downed) return;
      this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    damage(amount, srcX, srcY, game) {
      if (this.isClone || this.downed || this.invuln > 0 || this.dashTimer > 0 || this.thrownTimer > 0) return;
      const mult = game.heroMode ? 2 : 1;
      const finalAmt = Math.max(1, Math.round(amount * mult));
      this.hp = Math.max(0, this.hp - finalAmt);
      this.damageTaken += finalAmt;
      this.invuln = FB.CONFIG.INVULN_TIME;
      this.spinCharge = 0;
      this.streakCount = 0;
      this.streakTimer = 0;

      // Drop carried object if hurt
      if (this.carrying && game.dropCarried) {
        game.dropCarried(this);
      }

      const angle = Math.atan2(this.y - srcY, this.x - srcX);
      this.knockX = Math.cos(angle) * 145;
      this.knockY = Math.sin(angle) * 145;
      this.knockTimer = 0.16;

      FB.audio.play('hurt');
      game.screenShake = Math.max(game.screenShake, 3.5);
      game.spawnParticles(this.x, this.y, '#ef4444', 7);

      if (this.hp <= 0) {
        // Red Potion Auto-Revive!
        if (this.potions > 0) {
          this.potions -= 1;
          this.hp = this.maxHp;
          this.invuln = 1.6;
          FB.audio.play('potion');
          game.spawnRing(this.x, this.y, '#f43f5e', 24, 0.35);
          game.spawnParticles(this.x, this.y, '#fda4af', 14, 70, { shape: 'star' });
          game.addFloatingText(this.x, this.y - 12, 'POTION REVIVE!', '#fb7185');
          game.showToast(`${this.profile.name}'s Red Potion restored full health!`, 2.8);
          return;
        }
        if (game.humanHeroes.length > 1) {
          this.downed = true;
          this.reviveProgress = 0;
          game.showToast(`${this.profile.name} fell! Stand beside them to revive!`);
        } else {
          this.downed = true;
        }
      }
    }
  }

  class Enemy {
    constructor(type, x, y, playerCount = 1) {
      this.id = Math.random().toString(36).slice(2);
      this.type = type;
      this.x = x;
      this.y = y;
      this.w = 14;
      this.h = 14;
      this.dir = FB.DIRS.DOWN;
      this.vx = 0;
      this.vy = 0;
      this.alive = true;

      this.hurtTimer = 0;
      this.stunTimer = 0;
      this.knockX = 0;
      this.knockY = 0;
      this.knockTimer = 0;
      this.aiTimer = 0.5 + Math.random() * 1.2;
      this.shootTimer = 1.2 + Math.random() * 1.4;
      this.flying = false;
      this.walkPhase = Math.random() * Math.PI * 2;
      this.attackAnim = 0;
      this.telegraphTimer = 0;
      this.lungeTimer = 0;
      this.attackCooldown = 0.6 + Math.random() * 0.6;
      this.parryCooldown = 0;
      this.armed =
        type === 'soldier' ||
        type === 'red_soldier' ||
        type === 'stalfos' ||
        type === 'knight';

      const scale = 1 + (playerCount - 1) * 0.35;

      switch (type) {
        case 'octorok':
          this.maxHp = Math.round(3 * scale);
          this.speed = 32;
          this.damage = 1;
          this.rupeeDrop = 'rupee_green';
          break;
        case 'soldier':
          this.maxHp = Math.round(5 * scale);
          this.speed = 38;
          this.damage = 2;
          this.rupeeDrop = 'rupee_blue';
          break;
        case 'red_soldier':
          this.maxHp = Math.round(7 * scale);
          this.speed = 48;
          this.damage = 2;
          this.rupeeDrop = 'rupee_blue';
          break;
        case 'keese':
          this.maxHp = Math.round(2 * scale);
          this.speed = 54;
          this.damage = 1;
          this.flying = true;
          this.rupeeDrop = 'rupee_green';
          break;
        case 'stalfos':
          this.maxHp = Math.round(6 * scale);
          this.speed = 44;
          this.damage = 2;
          this.rupeeDrop = 'rupee_blue';
          break;
        case 'knight':
          this.w = 18;
          this.h = 18;
          this.maxHp = Math.round(12 * scale);
          this.speed = 34;
          this.damage = 3;
          this.rupeeDrop = 'rupee_red';
          break;
        case 'boss':
          this.w = 30;
          this.h = 30;
          this.maxHp = Math.round(34 * scale);
          this.speed = 44;
          this.damage = 2;
          this.flying = true;
          this.phase = 1;
          this.bossState = 'orbit';
          this.stateTimer = 2.4;
          this.lookAngle = Math.PI / 2;
          this.dashVx = 0;
          this.dashVy = 0;
          this.orbs = [0, 1, 2, 3].map((i) => ({
            angle: (i * Math.PI) / 2,
            radius: 30,
            alive: true,
            hp: 3,
          }));
          break;
        case 'frost_boss':
          this.w = 28;
          this.h = 28;
          this.maxHp = Math.round(42 * scale);
          this.speed = 50;
          this.damage = 2;
          this.flying = true;
          this.phase = 1;
          this.bossState = 'weave';
          this.stateTimer = 2.0;
          this.lookAngle = Math.PI / 2;
          this.dashVx = 0;
          this.dashVy = 0;
          this.weavePhase = 0;
          this.segments = Array.from({ length: 6 }, (_, i) => ({
            x,
            y: y - (i + 1) * 10,
            r: Math.max(5, 11 - i),
          }));
          break;
        default:
          this.maxHp = 4;
          this.speed = 36;
          this.damage = 1;
          this.rupeeDrop = 'rupee_green';
      }

      this.hp = this.maxHp;
    }

    hit(damage, srcX, srcY, attacker, game, options = {}) {
      if (!this.alive || this.hurtTimer > 0.08) return false;

      // Boss shield orbs protect the core until at least 2 orbs are broken in phase 1
      if (this.type === 'boss' && !options.ignoreOrbs) {
        const aliveOrbs = this.orbs.filter((o) => o.alive).length;
        if (aliveOrbs > 1) {
          FB.audio.play('clink');
          game.spawnParticles(this.x, this.y, '#94a3b8', 5);
          return false;
        }
      }

      // Knights resist frontal non-bomb hits slightly unless stunned/spin
      if (this.type === 'knight' && damage < 3 && this.stunTimer <= 0 && !options.isBomb) {
        damage = 1;
      }

      // Ember Rod melts Frost Sovereign Glacior for bonus fire damage!
      if (this.type === 'frost_boss' && options.isFire) {
        damage += 2;
        game.spawnParticles(this.x, this.y, '#fb923c', 10, 80, { shape: 'star' });
        game.addFloatingText(this.x, this.y - 16, 'MELT!', '#fb923c');
      }

      this.hp -= damage;
      this.hurtTimer = 0.24;
      if (options.stun) {
        this.stunTimer = Math.max(this.stunTimer, options.stun);
      }

      const isAnyBoss = this.type === 'boss' || this.type === 'frost_boss';
      const angle = Math.atan2(this.y - srcY, this.x - srcX);
      const kb = isAnyBoss ? 45 : this.type === 'knight' ? 85 : 155;
      this.knockX = Math.cos(angle) * kb;
      this.knockY = Math.sin(angle) * kb;
      this.knockTimer = isAnyBoss ? 0.08 : 0.16;

      FB.audio.play('hit');
      game.hitstop = Math.max(game.hitstop, 0.032);
      game.spawnParticles(this.x, this.y, this.type === 'frost_boss' ? '#7dd3fc' : '#fde047', 6);

      // Boss phase 2 transitions
      if (this.type === 'boss' && this.phase === 1 && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
        this.phase = 2;
        FB.audio.play('bossRoar');
        game.screenShake = 6;
        game.showToast('Shadow Wraith Vaalor enters Phase II — Fury of the Four Seals!');
        // Respawn 2 fast orbs
        this.orbs.forEach((o, i) => {
          o.alive = i % 2 === 0;
          o.hp = 3;
          o.radius = 34;
        });
      } else if (this.type === 'frost_boss' && this.phase === 1 && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
        this.phase = 2;
        FB.audio.play('bossRoar');
        game.screenShake = 7;
        game.spawnRing(this.x, this.y, '#38bdf8', 36, 0.38);
        game.showToast('Frost Sovereign Glacior enters Phase II — Eternal Blizzard!');
      }

      if (this.hp <= 0) {
        this.alive = false;
        if (attacker) {
          attacker.kills += 1;
        }
        FB.audio.play('enemyDie');
        game.spawnParticles(this.x, this.y, '#f8fafc', 12);
        game.spawnParticles(this.x, this.y, this.type === 'frost_boss' ? '#38bdf8' : '#facc15', 10);

        if (this.type === 'boss') {
          game.onBossDefeated(this);
        } else if (this.type === 'frost_boss') {
          game.onFrostBossDefeated(this);
        } else {
          // Drop loot
          const roll = Math.random();
          if (roll < 0.28) {
            game.spawnPickup('heart', this.x, this.y);
          } else if (roll < 0.85) {
            game.spawnPickup(this.rupeeDrop || 'rupee_green', this.x, this.y);
          }
        }
      }
      return true;
    }
  }

  class Projectile {
    constructor(opts) {
      this.kind = opts.kind; // 'boomerang' | 'bomb' | 'arrow' | 'fireball' | 'rock' | 'bone' | 'dark_orb' | 'beam' | 'thrown_pot' | 'thrown_enemy' | 'hookshot' | 'ice_shard'
      this.x = opts.x;
      this.y = opts.y;
      this.startX = opts.x;
      this.startY = opts.y;
      this.vx = opts.vx || 0;
      this.vy = opts.vy || 0;
      this.owner = opts.owner || null;
      this.fromEnemy = !!opts.fromEnemy;
      this.life = opts.life || 2.0;
      this.maxLife = this.life;
      this.damage = opts.damage || 1;
      this.radius = opts.radius || 5;
      this.returning = false;
      this.alive = true;
      this.angle = 0;
      this.carriedPickup = null;
      this.payload = opts.payload || null;
      this.hitSet = new Set();
    }
  }

  class Pickup {
    constructor(kind, x, y, extra = {}) {
      this.kind = kind;
      this.x = x;
      this.y = y;
      this.vx = extra.vx || 0;
      this.vy = extra.vy || 0;
      this.itemId = extra.itemId || null;
      this.alive = true;
      this.age = 0;
      this.magnetDelay = 0.2;
    }
  }

  class Particle {
    constructor(x, y, vx, vy, color, life, size = 2, opts = {}) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.shape = opts.shape || 'square'; // 'square' | 'leaf' | 'spark' | 'ring' | 'star' | 'dust'
      this.rotation = opts.rotation || Math.random() * Math.PI * 2;
      this.vrot = opts.vrot || (Math.random() - 0.5) * 10;
      this.gravity = opts.gravity || 0;
      this.maxRadius = opts.maxRadius || 24;
    }
  }

  class FloatingText {
    constructor(x, y, text, color = '#fde047') {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.life = 0.9;
    }
  }

  FB.Hero = Hero;
  FB.Enemy = Enemy;
  FB.Projectile = Projectile;
  FB.Pickup = Pickup;
  FB.Particle = Particle;
  FB.FloatingText = FloatingText;
})(window);
