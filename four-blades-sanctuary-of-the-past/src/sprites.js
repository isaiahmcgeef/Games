/**
 * Hi-Bit 32x32 Pixel Art Entity Renderer (640x416 native canvas).
 * Renders crisp dark-outlined Heroes, Biome- & Variant-diverse Enemies,
 * multi-phase Bosses (Vaalor & Cryo-Wyrm Glacior), Pickups, and Shop Goods.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const S = FB.HI_RES_SCALE || 2; // 2x pixel density (logical 16px tile -> 32x32 Hi-Bit pixels)
  const OUTLINE = '#141824';

  class SpriteRenderer {
    constructor() {
      this.built = false;
    }

    init() {
      this.built = true;
    }

    drawTile(ctx, id, dx, dy, time) {
      if (FB.hiTiles) {
        FB.hiTiles._drawTileHiBit(ctx, id, dx * S, dy * S, 0, 0, [[id]], 'overworld', 0);
      }
    }

    drawHero(ctx, hero, time) {
      const p = hero.profile;
      const hx = hero.x * S;
      const hy = hero.y * S;

      // 1. Pegasus Dash afterimage trail
      if (hero.afterimages && hero.afterimages.length > 0 && !hero.downed) {
        for (const ghost of hero.afterimages) {
          const alpha = Math.max(0, (ghost.life / ghost.maxLife) * 0.48);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.tunicLight;
          ctx.beginPath();
          ctx.arc(Math.round(ghost.x * S), Math.round(ghost.y * S), 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(ghost.x * S) - 4, Math.round(ghost.y * S) - 4, 8, 8);
          ctx.restore();
        }
      }

      // Lunge offset during sword slash / block push
      const dv = FB.DIR_VEC[hero.dir] || FB.DIR_VEC[0];
      let lungeX = 0;
      let lungeY = 0;
      if (hero.swordTimer > 0) {
        const prog = 1 - hero.swordTimer / FB.CONFIG.SWORD_DURATION;
        const mag = hero.comboStep === 2 ? 9.5 : 5.2;
        const thrust = Math.sin(prog * Math.PI) * mag;
        lungeX = dv.x * thrust;
        lungeY = dv.y * thrust;
      } else if (hero.pushing) {
        lungeX = dv.x * 3;
        lungeY = dv.y * 3;
      }

      const x = Math.round(hx - 16 + lungeX);
      const y = Math.round(hy - 20 + lungeY);

      ctx.save();

      // Golden Parry Counter Aura
      if (hero.parryFlash > 0) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy, 22 + (0.4 - hero.parryFlash) * 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Spirit Clone shimmer / Damage i-frame blink
      if (hero.isClone) {
        ctx.globalAlpha = 0.8 + Math.sin(time * 10) * 0.1;
        if (hero.cloneHold) {
          ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(hx, hy + 8, 18 + Math.sin(time * 6) * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (hero.invuln > 0 && Math.floor(time * 24) % 2 === 0) {
        ctx.globalAlpha = 0.48;
      }

      // Crisp soft oval ground shadow
      ctx.fillStyle = 'rgba(7, 11, 22, 0.38)';
      ctx.beginPath();
      ctx.ellipse(Math.round(hx), Math.round(hy + 10), 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Downed / Ghost state in Multiplayer
      if (hero.downed) {
        const bob = Math.sin(time * 6) * 5;
        const tail = Math.sin(time * 10) * 3;
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 7, y + 3 + bob, 18, 20);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 8, y + 4 + bob, 16, 18);
        ctx.fillRect(x + 10 + tail, y + 20 + bob, 12, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 11, y + 10 + bob, 3, 4);
        ctx.fillRect(x + 18, y + 10 + bob, 3, 4);
        if (hero.reviveProgress > 0) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(hx, hy, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hero.reviveProgress);
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
        ctx.translate(Math.round(hx), Math.round(hy - 2));
        ctx.rotate(spinAng);
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-13, -11, 26, 22);
        ctx.fillStyle = p.tunicDark;
        ctx.fillRect(-12, -10, 24, 20);
        ctx.fillStyle = p.tunic;
        ctx.fillRect(-10, -8, 20, 16);
        ctx.fillStyle = p.cap;
        ctx.fillRect(-8, -12, 16, 8);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(-6, -10, 8, 4);
        ctx.fillStyle = p.accent;
        ctx.fillRect(-4, -2, 8, 4);
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(-10, 6, 8, 4);
        ctx.fillRect(2, 6, 8, 4);
        ctx.restore();
        ctx.restore();
        return;
      }

      // Spin-charge golden aura & orbiting glint sparks
      if (hero.spinCharge > 0.16) {
        const ready = hero.spinCharge >= FB.CONFIG.SPIN_CHARGE_TIME;
        const pct = Math.min(1, hero.spinCharge / FB.CONFIG.SPIN_CHARGE_TIME);
        const pulse = Math.floor(time * 18) % 2;
        ctx.strokeStyle = ready ? (pulse ? '#fde047' : '#ffffff') : 'rgba(253, 224, 71, 0.58)';
        ctx.lineWidth = ready ? 3 : 2;
        ctx.beginPath();
        ctx.arc(hx, hy, 16 + pct * 6 + (ready ? pulse * 2 : 0), 0, Math.PI * 2);
        ctx.stroke();
        if (ready) {
          for (let i = 0; i < 4; i++) {
            const sa = time * 9 + (i * Math.PI) / 2;
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fde047';
            ctx.fillRect(Math.round(hx + Math.cos(sa) * 22) - 2, Math.round(hy + Math.sin(sa) * 22) - 2, 4, 4);
          }
        }
      }

      // Effective facing direction
      let drawDir = hero.dir;
      if (hero.spinTimer > 0) {
        const spinOrder = [FB.DIRS.DOWN, FB.DIRS.RIGHT, FB.DIRS.UP, FB.DIRS.LEFT];
        const prog = 1 - hero.spinTimer / FB.CONFIG.SPIN_DURATION;
        drawDir = spinOrder[Math.floor(prog * 6) % 4];
      } else if (hero.celebrateTimer > 0) {
        drawDir = FB.DIRS.DOWN;
      }

      // 4-frame expressive stride cycle + idle breathing
      const frame = hero.moving ? Math.floor(hero.walkPhase) % 4 : 0;
      const idleBreath =
        !hero.moving && hero.swordTimer <= 0 ? (Math.sin(time * 3.6 + hero.index) > 0.65 ? -1 : 0) : 0;
      const bobY = (frame === 1 || frame === 3 ? -2 : 0) + idleBreath;
      const leftFootY = frame === 1 ? -3 : frame === 3 ? 2 : 0;
      const rightFootY = frame === 3 ? -3 : frame === 1 ? 2 : 0;
      const hemShift = frame === 1 ? -2 : frame === 3 ? 2 : 0;
      const capBounce = hero.moving ? (frame % 2 === 0 ? 0 : 2) : 0;

      // --- BOOTS (outlined leather boots with cuff highlight) ---
      const drawBoot = (bx, by) => {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(bx - 1, by - 1, 8, 6);
        ctx.fillStyle = '#4a2b17';
        ctx.fillRect(bx, by, 6, 4);
        ctx.fillStyle = '#7c4c2b';
        ctx.fillRect(bx + 1, by, 3, 2);
      };
      if (drawDir === FB.DIRS.LEFT || drawDir === FB.DIRS.RIGHT) {
        const stride = frame === 1 ? 4 : frame === 3 ? -4 : 0;
        drawBoot(x + 8 + stride, y + 26);
        drawBoot(x + 17 - stride, y + 26);
      } else {
        drawBoot(x + 8, Math.round(y + 26 + leftFootY));
        drawBoot(x + 18, Math.round(y + 26 + rightFootY));
      }

      // --- TUNIC BODY (32x32 outlined pleated Hylian tunic, belt & golden buckle) ---
      const ty = Math.round(y + 14 + bobY);
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x + 6, ty - 1, 20, 15);
      ctx.fillStyle = p.tunicDark;
      ctx.fillRect(x + 7, ty, 18, 13);
      ctx.fillStyle = p.tunic;
      ctx.fillRect(x + 8, ty, 16, 11);
      // Shoulder & chest highlight folds
      ctx.fillStyle = p.tunicLight;
      ctx.fillRect(x + 9, ty + 1, 6, 6);
      ctx.fillRect(x + 17, ty + 1, 4, 4);
      // Collar V-neck trim
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 14, ty, 4, 2);
      // Animated pleated skirt hem shadow
      ctx.fillStyle = p.tunicDark;
      ctx.fillRect(x + 14 + hemShift, ty + 10, 4, 3);
      // Leather Belt + Golden Buckle
      ctx.fillStyle = '#4a2b17';
      ctx.fillRect(x + 7, ty + 8, 18, 2);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 13, ty + 7, 6, 4);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(x + 14, ty + 8, 3, 2);

      // --- ARMS & HANDS ---
      const drawArm = (ax, ay, aw, ah) => {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(ax - 1, ay - 1, aw + 2, ah + 2);
        ctx.fillStyle = p.tunic;
        ctx.fillRect(ax, ay, aw, Math.max(2, ah - 3));
        ctx.fillStyle = p.skin;
        ctx.fillRect(ax, ay + Math.max(1, ah - 3), aw, 3);
      };
      if (hero.celebrateTimer > 0 || hero.carrying) {
        drawArm(x + 4, Math.round(y + 3 + bobY), 4, 11);
        drawArm(x + 24, Math.round(y + 3 + bobY), 4, 11);
      } else if (hero.pushing) {
        drawArm(x + 4 + dv.x * 4, Math.round(y + 15 + dv.y * 4), 4, 6);
        drawArm(x + 24 + dv.x * 4, Math.round(y + 15 + dv.y * 4), 4, 6);
      } else {
        const armSwing = frame === 1 ? -2 : frame === 3 ? 2 : 0;
        drawArm(x + 4, Math.round(y + 16 + bobY + armSwing), 4, 6);
        drawArm(x + 24, Math.round(y + 16 + bobY - armSwing), 4, 6);
      }

      // --- HEAD, POINTED HYLIAN EARS, HAIR & FLUTTERING CAP ---
      const hyTop = Math.round(y + 3 + bobY);
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x + 7, hyTop, 18, 13);
      ctx.fillStyle = p.skin;
      ctx.fillRect(x + 8, hyTop + 1, 16, 11);
      // Warm cheek shading
      ctx.fillStyle = '#e6ad7e';
      ctx.fillRect(x + 8, hyTop + 9, 16, 3);

      // Pointed Hylian ears!
      if (drawDir === FB.DIRS.DOWN || drawDir === FB.DIRS.UP) {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 5, hyTop + 5, 3, 4);
        ctx.fillRect(x + 24, hyTop + 5, 3, 4);
        ctx.fillStyle = p.skin;
        ctx.fillRect(x + 6, hyTop + 6, 2, 2);
        ctx.fillRect(x + 24, hyTop + 6, 2, 2);
      }

      if (drawDir === FB.DIRS.UP) {
        // Back of hair + long fluttering pointed cap tail
        ctx.fillStyle = p.hair;
        ctx.fillRect(x + 8, hyTop + 7, 16, 5);
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 5, hyTop - 3, 22, 11);
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 6, hyTop - 2, 20, 9);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 9, hyTop - 1, 12, 4);
        // Pointed swaying cap tail down back
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 11 + hemShift, hyTop + 6 + capBounce, 10, 9);
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 12 + hemShift, hyTop + 6 + capBounce, 8, 7);
        ctx.fillStyle = p.tunicDark;
        ctx.fillRect(x + 13 + hemShift, hyTop + 11 + capBounce, 6, 2);
      } else {
        // Cap crown + expressive fluttering pointed tail
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(x + 5, hyTop - 3, 22, 8);
        ctx.fillStyle = p.cap;
        ctx.fillRect(x + 6, hyTop - 2, 20, 6);
        ctx.fillStyle = p.tunicLight;
        ctx.fillRect(x + 9, hyTop - 1, 11, 3);
        ctx.fillStyle = p.tunicDark;
        ctx.fillRect(x + 6, hyTop + 3, 20, 1);

        if (drawDir === FB.DIRS.LEFT) {
          // Tail streaming right
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 23, hyTop + capBounce, 8, 7);
          ctx.fillRect(x + 27, hyTop + 4 + capBounce, 5, 5);
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 23, hyTop + 1 + capBounce, 7, 5);
          ctx.fillRect(x + 27, hyTop + 4 + capBounce, 4, 3);
        } else if (drawDir === FB.DIRS.RIGHT) {
          // Tail streaming left
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 1, hyTop + capBounce, 8, 7);
          ctx.fillRect(x, hyTop + 4 + capBounce, 5, 5);
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 2, hyTop + 1 + capBounce, 7, 5);
          ctx.fillRect(x + 1, hyTop + 4 + capBounce, 4, 3);
        } else {
          // Side-draped tail on Front view
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 23, hyTop + 2 + capBounce, 6, 8);
          ctx.fillStyle = p.cap;
          ctx.fillRect(x + 23, hyTop + 3 + capBounce, 5, 6);
        }

        // Layered Hair bangs & sideburns
        ctx.fillStyle = p.hair;
        ctx.fillRect(x + 8, hyTop + 3, 16, 4);
        ctx.fillRect(x + 7, hyTop + 5, 2, 5);
        ctx.fillRect(x + 23, hyTop + 5, 2, 5);
        ctx.fillStyle = '#f6c453';
        ctx.fillRect(x + 10, hyTop + 3, 5, 2);
        ctx.fillRect(x + 17, hyTop + 3, 4, 2);

        // Expressive Blinking Eyes with white glint
        const blinking =
          !hero.moving && hero.swordTimer <= 0 && Math.floor(time * 8 + hero.index * 3) % 28 === 0;
        const eyeH = blinking ? 1 : 4;
        const drawEye = (ex, ey) => {
          ctx.fillStyle = '#141824';
          ctx.fillRect(ex, ey, 3, eyeH);
          if (!blinking) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ex, ey, 1, 2);
          }
        };
        if (drawDir === FB.DIRS.DOWN) {
          drawEye(x + 10, hyTop + 7);
          drawEye(x + 19, hyTop + 7);
        } else if (drawDir === FB.DIRS.LEFT) {
          drawEye(x + 10, hyTop + 7);
        } else if (drawDir === FB.DIRS.RIGHT) {
          drawEye(x + 19, hyTop + 7);
        }
      }

      // --- ORNATE HYLIAN SHIELD / GLOWING MIRROR SHIELD ---
      if (hero.celebrateTimer <= 0 && hero.spinTimer <= 0 && !hero.carrying) {
        const isMirror = !!hero.mirrorShield;
        const rim = isMirror ? '#fde047' : '#e5be53';
        const inner = isMirror ? '#dc2626' : p.tunicDark;
        const glint = isMirror && Math.floor(time * 6 + hero.index) % 3 === 0 ? '#ffffff' : '#fef08a';
        const drawShield = (sx, sy, sw) => {
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(sx - 1, sy - 1, sw + 2, 12);
          ctx.fillStyle = rim;
          ctx.fillRect(sx, sy, sw, 10);
          ctx.fillStyle = inner;
          ctx.fillRect(sx + 1, sy + 2, Math.max(2, sw - 2), 6);
          ctx.fillStyle = glint;
          ctx.fillRect(sx + 2, sy + 2, Math.max(1, sw - 5), 3);
        };
        if (drawDir === FB.DIRS.DOWN) drawShield(x + 21, ty + 2, 8);
        else if (drawDir === FB.DIRS.LEFT) drawShield(x + 4, ty + 2, 6);
        else if (drawDir === FB.DIRS.RIGHT) drawShield(x + 22, ty + 2, 6);
      }

      // --- OVERHEAD CARRIED OBJECT (Pot / Live Bomb) ---
      if (hero.carrying) {
        const cy = Math.round(y - 14 + bobY);
        if (hero.carrying.kind === 'pot') {
          ctx.fillStyle = '#24140b';
          ctx.fillRect(x + 7, cy - 1, 18, 17);
          ctx.fillStyle = '#9e6238';
          ctx.fillRect(x + 8, cy, 16, 15);
          ctx.fillStyle = '#ba7747';
          ctx.fillRect(x + 6, cy + 4, 20, 9);
          ctx.fillStyle = '#e0a470';
          ctx.fillRect(x + 10, cy - 2, 12, 4);
        } else if (hero.carrying.kind === 'bomb') {
          const b = hero.carrying.ref;
          const urgent = b && b.life < 0.45 && Math.floor(time * 22) % 2 === 0;
          ctx.fillStyle = OUTLINE;
          ctx.beginPath();
          ctx.arc(hx, cy + 8, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = urgent ? '#ef4444' : '#312e81';
          ctx.beginPath();
          ctx.arc(hx, cy + 8, 8.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#818cf8';
          ctx.fillRect(hx - 4, cy + 3, 3, 3);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(hx - 1, cy - 5, 3, 4);
        }
      }

      // --- ITEM USE VISUAL POSE (Drawn Bow / Glowing Ember Rod) ---
      if (hero.itemAnimTimer > 0 && hero.swordTimer <= 0 && hero.spinTimer <= 0) {
        const ix = hx + dv.x * 16;
        const iy = hy + dv.y * 16;
        if (hero.lastItemUsed === FB.ITEMS.BOW) {
          const ang = Math.atan2(dv.y, dv.x);
          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate(ang);
          ctx.strokeStyle = '#6b421f';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(-4, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();
          ctx.strokeStyle = '#e0a958';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-4, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-2, -10);
          ctx.lineTo(-8, 0);
          ctx.lineTo(-2, 10);
          ctx.stroke();
          ctx.restore();
        } else if (hero.lastItemUsed === FB.ITEMS.FIREROD) {
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(hx + dv.x * 6, hy + dv.y * 6);
          ctx.lineTo(ix + dv.x * 8, iy + dv.y * 8);
          ctx.stroke();
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(ix + dv.x * 10, iy + dv.y * 10, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(ix + dv.x * 10, iy + dv.y * 10, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- ALttP OVERHEAD ITEM-GET CELEBRATION ---
      if (hero.celebrateTimer > 0) {
        const glow = Math.sin(time * 14) * 0.15 + 0.35;
        ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
        ctx.beginPath();
        ctx.arc(hx, y - 8, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(hx - 7, y - 15, 14, 14);
        ctx.fillStyle = hero.celebrateColor || '#fde047';
        ctx.fillRect(hx - 6, y - 14, 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 3, y - 12, 4, 4);
      }

      // --- HI-BIT MULTI-BAND SWORD SLASH & SPIN ATTACK (Tempered Blade Upgrade!) ---
      const isTemp = !!hero.temperedSword && !hero.isClone;
      const bladeEdge = isTemp ? '#fef08a' : '#f8fafc';
      const bladeCore = isTemp ? '#fb923c' : '#94a3b8';
      const guardCol = isTemp ? '#ef4444' : '#facc15';

      if (hero.spinTimer > 0) {
        const prog = 1 - hero.spinTimer / FB.CONFIG.SPIN_DURATION;
        const angle = prog * Math.PI * 2.6;
        ctx.strokeStyle = isTemp ? '#fb923c' : p.tunicLight;
        ctx.globalAlpha = 0.58;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(hx, hy, 38, angle - 2.2, angle);
        ctx.stroke();

        ctx.globalAlpha = 0.94;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(hx, hy, 36, angle - 1.5, angle);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(hx, hy, 39, angle - 0.85, angle);
        ctx.stroke();

        const bx = hx + Math.cos(angle) * 41;
        const by = hy + Math.sin(angle) * 41;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(angle) * 10, hy + Math.sin(angle) * 10);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.strokeStyle = bladeEdge;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(angle) * 10, hy + Math.sin(angle) * 10);
        ctx.lineTo(bx, by);
        ctx.stroke();
      } else if (hero.swordTimer > 0) {
        const rawProg = 1 - hero.swordTimer / FB.CONFIG.SWORD_DURATION;
        const prog = 1 - Math.pow(1 - Math.min(1, Math.max(0, rawProg)), 2.2);
        const baseAngles = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
        const base = baseAngles[hero.dir] || 0;
        const step = hero.comboStep || 0;
        const ox = hx + lungeX * 0.55;
        const oy = hy + lungeY * 0.55;

        if (step === 2) {
          // HIT 3: HEROIC FINISHER THRUST
          const thrustDist = 18 + Math.sin(Math.min(1, rawProg * 1.15) * Math.PI) * 28;
          const dirX = Math.cos(base);
          const dirY = Math.sin(base);
          const perpX = -dirY;
          const perpY = dirX;
          const tipX = ox + dirX * thrustDist;
          const tipY = oy + dirY * thrustDist;

          ctx.save();
          ctx.globalAlpha = Math.max(0.2, 1 - rawProg * 0.75);
          ctx.fillStyle = isTemp ? '#fb923c' : p.tunicLight;
          ctx.beginPath();
          ctx.moveTo(tipX + dirX * 8, tipY + dirY * 8);
          ctx.lineTo(ox + dirX * 10 + perpX * 13, oy + dirY * 10 + perpY * 13);
          ctx.lineTo(ox + dirX * 10 - perpX * 13, oy + dirY * 10 - perpY * 13);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(tipX + dirX * 5, tipY + dirY * 5);
          ctx.lineTo(ox + dirX * 14 + perpX * 7, oy + dirY * 14 + perpY * 7);
          ctx.lineTo(ox + dirX * 14 - perpX * 7, oy + dirY * 14 - perpY * 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Outlined Tempered/Steel Thrust Blade
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(ox + dirX * 8, oy + dirY * 8);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          ctx.strokeStyle = bladeEdge;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(ox + dirX * 8, oy + dirY * 8);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          ctx.strokeStyle = bladeCore;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + dirX * 12, oy + dirY * 12);
          ctx.lineTo(ox + dirX * (thrustDist - 6), oy + dirY * (thrustDist - 6));
          ctx.stroke();

          // Crossguard
          ctx.strokeStyle = guardCol;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ox + dirX * 11 + perpX * 7, oy + dirY * 11 + perpY * 7);
          ctx.lineTo(ox + dirX * 11 - perpX * 7, oy + dirY * 11 - perpY * 7);
          ctx.stroke();

          // Shockwave tip flash
          if (rawProg < 0.55) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(tipX) - 5, Math.round(tipY) - 1, 10, 2);
            ctx.fillRect(Math.round(tipX) - 1, Math.round(tipY) - 5, 2, 10);
          }
        } else {
          // HIT 1 (Forehand) & HIT 2 (Backhand) Hi-Bit Multi-Band Crescent Arcs
          const reverse = step === 1;
          const startA = reverse ? base + 1.48 : base - 1.48;
          const endA = reverse ? base - 1.52 : base + 1.52;
          const a = startA + (endA - startA) * prog;
          const trailStart = reverse ? Math.min(startA, a + 1.55) : Math.max(startA, a - 1.55);
          const innerTrailStart = reverse ? Math.min(startA, a + 1.15) : Math.max(startA, a - 1.15);

          ctx.save();
          ctx.globalAlpha = Math.max(0.15, (1 - prog * 0.68) * 0.65);
          ctx.strokeStyle = isTemp ? '#fb923c' : reverse ? '#38bdf8' : p.tunicLight;
          ctx.lineWidth = 13;
          ctx.beginPath();
          ctx.arc(ox, oy, 31, trailStart, a, reverse);
          ctx.stroke();

          ctx.globalAlpha = Math.max(0.22, (1 - prog * 0.6) * 0.85);
          ctx.strokeStyle = reverse ? '#bae6fd' : '#fde047';
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          ctx.arc(ox, oy, 34, innerTrailStart, a, reverse);
          ctx.stroke();

          ctx.globalAlpha = Math.max(0.25, 1 - prog * 0.55);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.arc(ox, oy, 37, reverse ? Math.min(startA, a + 0.65) : Math.max(startA, a - 0.65), a, reverse);
          ctx.stroke();
          ctx.restore();

          const bx = ox + Math.cos(a) * 37;
          const by = oy + Math.sin(a) * 37;
          const perpX = -Math.sin(a);
          const perpY = Math.cos(a);

          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 7.5;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 8, oy + Math.sin(a) * 8);
          ctx.lineTo(bx, by);
          ctx.stroke();

          ctx.strokeStyle = bladeEdge;
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 8, oy + Math.sin(a) * 8);
          ctx.lineTo(bx, by);
          ctx.stroke();

          ctx.strokeStyle = bladeCore;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 11, oy + Math.sin(a) * 11);
          ctx.lineTo(ox + Math.cos(a) * 32, oy + Math.sin(a) * 32);
          ctx.stroke();

          ctx.strokeStyle = guardCol;
          ctx.lineWidth = 3.8;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * 11 + perpX * 6, oy + Math.sin(a) * 11 + perpY * 6);
          ctx.lineTo(ox + Math.cos(a) * 11 - perpX * 6, oy + Math.sin(a) * 11 - perpY * 6);
          ctx.stroke();

          if (prog < 0.65) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(bx) - 2, Math.round(by) - 2, 5, 5);
          }
        }
      }

      // Multiplayer Player Tag
      if (hero.showTag) {
        ctx.fillStyle = 'rgba(10, 14, 24, 0.82)';
        ctx.fillRect(Math.round(hx) - 12, y - 16, 24, 11);
        ctx.fillStyle = hero.isClone ? '#67e8f9' : p.uiColor;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hero.isClone ? 'SP' : `P${hero.index + 1}`, Math.round(hx), y - 7);
      }

      ctx.restore();
    }

    drawEnemy(ctx, e, time) {
      const ex = e.x * S;
      const ey = e.y * S;
      const ew = e.w * S;
      const eh = e.h * S;
      const x = Math.round(ex - ew / 2);
      const y = Math.round(ey - eh / 2);
      const flash = e.hurtTimer > 0 && Math.floor(time * 26) % 2 === 0;
      const step4 = Math.floor(e.walkPhase || time * 7) % 4;
      const bob = step4 === 1 || step4 === 3 ? -2 : 0;
      const v = e.variant || 0;
      const isFrost = e.biome === 'frost';
      const isDark = e.biome === 'darkworld';

      ctx.save();

      // Ground shadow
      if (e.type !== 'frost_boss') {
        const shadowY = e.flying ? y + eh + 3 : y + eh - 2;
        ctx.fillStyle = 'rgba(7, 11, 22, 0.36)';
        ctx.beginPath();
        ctx.ellipse(Math.round(ex), shadowY, Math.max(8, ew * 0.42), 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (e.stunTimer > 0) {
        ctx.translate(Math.sin(time * 42) * 2.5, 0);
      }

      switch (e.type) {
        case 'octorok': {
          const puff = e.shootTimer < 0.35 ? 2 : 0;
          const sy = step4 % 2 === 1 ? -2 : 0;
          const bodyDark = flash ? '#ffffff' : isDark ? '#581c87' : '#991b1b';
          const bodyMid = flash ? '#ffffff' : isDark ? '#9333ea' : '#dc2626';
          const bodyHi = flash ? '#ffffff' : isDark ? '#c084fc' : '#f87171';
          const markCol = isDark ? '#fde047' : v === 1 ? '#fde047' : '#fecaca';

          // Articulated waving tentacles
          ctx.fillStyle = OUTLINE;
          for (let i = 0; i < 4; i++) {
            const tx = x + 1 + i * 7;
            const ty = y + 20 + ((step4 + i) % 2 === 0 ? 2 : 0);
            ctx.fillRect(tx, ty, 6, 7);
            ctx.fillStyle = bodyDark;
            ctx.fillRect(tx + 1, ty + 1, 4, 5);
            ctx.fillStyle = OUTLINE;
          }

          // Outlined rounded dome shell
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 1 - puff, y + 3 + sy, 26 + puff * 2, 19 - sy);
          ctx.fillRect(x + 4 - puff, y + 1 + sy, 20 + puff * 2, 22 - sy);
          ctx.fillStyle = bodyDark;
          ctx.fillRect(x + 2 - puff, y + 4 + sy, 24 + puff * 2, 17 - sy);
          ctx.fillStyle = bodyMid;
          ctx.fillRect(x + 4 - puff, y + 3 + sy, 20 + puff * 2, 14 - sy);
          ctx.fillStyle = bodyHi;
          ctx.fillRect(x + 6, y + 4 + sy, 10, 5);

          // Per-spawn shell pattern variability (spots / stripes / scar / horns)
          if (!flash) {
            ctx.fillStyle = markCol;
            if (v === 0) {
              ctx.fillRect(x + 7, y + 5 + sy, 3, 2);
              ctx.fillRect(x + 18, y + 6 + sy, 3, 2);
            } else if (v === 1) {
              ctx.fillRect(x + 12, y + 3 + sy, 4, 7);
            } else if (v === 2) {
              ctx.fillStyle = OUTLINE;
              ctx.fillRect(x + 17, y + 5 + sy, 5, 2);
              ctx.fillRect(x + 19, y + 4 + sy, 2, 5);
            } else {
              // Tiny ridge horns
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(x + 5, y + sy, 3, 4);
              ctx.fillRect(x + 20, y + sy, 3, 4);
            }
          }

          // Expressive eyes & puffing snout
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 7, y + 10 + sy, 4, 5);
          ctx.fillRect(x + 17, y + 10 + sy, 4, 5);
          ctx.fillStyle = '#111827';
          ctx.fillRect(x + 9, y + 12 + sy, 2, 3);
          ctx.fillRect(x + 18, y + 12 + sy, 2, 3);
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 10 - puff, y + 16, 8 + puff * 2, 7);
          ctx.fillStyle = puff ? '#fef08a' : '#facc15';
          ctx.fillRect(x + 11 - puff, y + 17, 6 + puff * 2, 5);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(x + 13, y + 19, 2, 2);
          break;
        }

        case 'soldier':
        case 'red_soldier': {
          const isRed = e.type === 'red_soldier';
          let armorDark = isRed ? '#881337' : '#1b5e36';
          let armorMid = isRed ? '#dc2626' : '#2f854b';
          let armorHi = isRed ? '#f87171' : '#5ac474';
          let plume = isRed ? '#fde047' : '#a7f3d0';
          if (isFrost) {
            armorDark = isRed ? '#075985' : '#1e3a5f';
            armorMid = isRed ? '#0284c7' : '#2e6f9e';
            armorHi = '#7dd3fc';
            plume = '#f0f9ff';
          } else if (isDark) {
            armorDark = '#3b0764';
            armorMid = isRed ? '#be123c' : '#6b21a8';
            armorHi = isRed ? '#fb7185' : '#a855f7';
            plume = '#fde047';
          }
          if (flash) armorDark = armorMid = armorHi = '#ffffff';

          const footL = step4 === 1 ? -2 : step4 === 3 ? 2 : 0;
          const footR = -footL;
          // Outlined boots
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 6, y + 22 + footL, 7, 6);
          ctx.fillRect(x + 15, y + 22 + footR, 7, 6);
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 7, y + 23 + footL, 5, 4);
          ctx.fillRect(x + 16, y + 23 + footR, 5, 4);

          // Outlined breastplate & pauldrons
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 3, y + 11 + bob, 22, 14);
          ctx.fillStyle = armorDark;
          ctx.fillRect(x + 4, y + 12 + bob, 20, 12);
          ctx.fillStyle = armorMid;
          ctx.fillRect(x + 6, y + 12 + bob, 16, 10);
          ctx.fillStyle = armorHi;
          ctx.fillRect(x + 4, y + 12 + bob, 4, 6);
          ctx.fillRect(x + 20, y + 12 + bob, 4, 6);
          // Variant chest trim (belt / gold crest / diagonal sash)
          ctx.fillStyle = v === 2 ? '#fde047' : '#cbd5e1';
          if (v === 1) ctx.fillRect(x + 12, y + 14 + bob, 4, 7);
          else ctx.fillRect(x + 6, y + 19 + bob, 16, 2);

          // Outlined Helmet + Per-Spawn Plume Variant!
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 5, y + 1 + bob, 18, 12);
          ctx.fillStyle = armorMid;
          ctx.fillRect(x + 6, y + 2 + bob, 16, 10);
          ctx.fillStyle = armorHi;
          ctx.fillRect(x + 8, y + 3 + bob, 10, 4);
          // Plume variants
          ctx.fillStyle = plume;
          if (v === 0) {
            ctx.fillRect(x + 11 + (step4 % 2), y - 3 + bob, 6, 4);
          } else if (v === 1) {
            ctx.fillRect(x + 8, y - 2 + bob, 12, 3);
          } else if (v === 2) {
            // Twin crest horns
            ctx.fillRect(x + 6, y - 2 + bob, 3, 4);
            ctx.fillRect(x + 19, y - 2 + bob, 3, 4);
          } else {
            ctx.fillRect(x + 12, y - 4 + bob, 4, 5);
          }
          // Visor slit & glowing eyes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 7, y + 7 + bob, 14, 4);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(x + 9, y + 8 + bob, 3, 2);
          ctx.fillRect(x + 16, y + 8 + bob, 3, 2);

          // Animated Thrusting Spear with Parry Telegraph Star!
          const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
          const telegraph = e.telegraphTimer > 0;
          const lunging = e.lungeTimer > 0;
          const thrust = telegraph ? 16 : lunging ? 36 : Math.sin(time * 9 + e.x) * 4 + 24;
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(ex, ey + bob);
          ctx.lineTo(ex + dv.x * (thrust + 4), ey + bob + dv.y * (thrust + 4));
          ctx.stroke();

          ctx.strokeStyle = '#925d2c';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ex, ey + bob);
          ctx.lineTo(ex + dv.x * (thrust - 6), ey + bob + dv.y * (thrust - 6));
          ctx.stroke();

          ctx.strokeStyle = telegraph ? '#fde047' : lunging ? '#ffffff' : isFrost ? '#bae6fd' : '#e2e8f0';
          ctx.lineWidth = lunging ? 4.5 : 3.5;
          ctx.beginPath();
          ctx.moveTo(ex + dv.x * (thrust - 8), ey + bob + dv.y * (thrust - 8));
          ctx.lineTo(ex + dv.x * (thrust + 4), ey + bob + dv.y * (thrust + 4));
          ctx.stroke();

          if (telegraph) {
            const tx = Math.round(ex + dv.x * (thrust + 5));
            const ty = Math.round(ey + bob + dv.y * (thrust + 5));
            ctx.fillStyle = Math.floor(time * 24) % 2 === 0 ? '#ffffff' : '#fde047';
            ctx.fillRect(tx - 5, ty - 1, 11, 2);
            ctx.fillRect(tx - 1, ty - 5, 2, 11);
          } else if (lunging) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(ex + dv.x * 12, ey + bob + dv.y * 12);
            ctx.lineTo(ex + dv.x * (thrust + 8), ey + bob + dv.y * (thrust + 8));
            ctx.stroke();
          }
          break;
        }

        case 'keese': {
          const flap = Math.floor(time * 14 + e.x) % 4;
          const flyY = Math.sin(time * 7 + e.y) * 5 - 4;
          const wingY = flap === 0 ? -6 : flap === 1 ? -2 : flap === 2 ? 4 : 0;
          const wingH = flap === 2 ? 10 : 8;
          const bodyCol = flash ? '#ffffff' : isFrost ? '#0369a1' : v === 2 ? '#581c87' : '#1e1b4b';
          const wingCol = flash ? '#ffffff' : isFrost ? '#38bdf8' : v === 1 ? '#7c3aed' : v === 3 ? '#be123c' : '#4338ca';
          const veinCol = isFrost ? '#bae6fd' : '#312e81';

          // Outlined veined bat wings
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x - 4, Math.round(y + 7 + flyY + wingY), 14, wingH + 2);
          ctx.fillRect(x + 18, Math.round(y + 7 + flyY + wingY), 14, wingH + 2);
          ctx.fillStyle = wingCol;
          ctx.fillRect(x - 3, Math.round(y + 8 + flyY + wingY), 12, wingH);
          ctx.fillRect(x + 19, Math.round(y + 8 + flyY + wingY), 12, wingH);
          ctx.fillStyle = veinCol;
          ctx.fillRect(x, Math.round(y + 11 + flyY + wingY), 8, 2);
          ctx.fillRect(x + 20, Math.round(y + 11 + flyY + wingY), 8, 2);

          // Outlined furry bat body & ears
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 8, Math.round(y + 6 + flyY), 12, 13);
          ctx.fillRect(x + 8, Math.round(y + 2 + flyY), 4, 5);
          ctx.fillRect(x + 16, Math.round(y + 2 + flyY), 4, 5);
          ctx.fillStyle = bodyCol;
          ctx.fillRect(x + 9, Math.round(y + 7 + flyY), 10, 11);
          ctx.fillRect(x + 9, Math.round(y + 3 + flyY), 2, 4);
          ctx.fillRect(x + 17, Math.round(y + 3 + flyY), 2, 4);
          // Glowing eyes & tiny fangs
          ctx.fillStyle = isFrost ? '#fef08a' : '#fde047';
          ctx.fillRect(x + 10, Math.round(y + 10 + flyY), 2, 2);
          ctx.fillRect(x + 16, Math.round(y + 10 + flyY), 2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 12, Math.round(y + 14 + flyY), 1, 2);
          ctx.fillRect(x + 15, Math.round(y + 14 + flyY), 1, 2);
          break;
        }

        case 'stalfos': {
          const rattle = step4 === 1 ? -2 : step4 === 3 ? 2 : 0;
          const telegraph = e.telegraphTimer > 0;
          const lunging = e.lungeTimer > 0;
          const windup = telegraph ? -10 : e.shootTimer < 0.35 ? -6 : 0;
          const boneHi = flash ? '#ffffff' : isFrost ? '#e0f2fe' : '#f8fafc';
          const boneShade = flash ? '#ffffff' : isFrost ? '#7dd3fc' : '#cbd5e1';

          // Rattling bone legs
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 8, y + 22 + rattle, 5, 7);
          ctx.fillRect(x + 15, y + 22 - rattle, 5, 7);
          ctx.fillStyle = boneShade;
          ctx.fillRect(x + 9, y + 23 + rattle, 3, 5);
          ctx.fillRect(x + 16, y + 23 - rattle, 3, 5);

          // Outlined ribcage
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 7, y + 12 + bob, 14, 11);
          ctx.fillStyle = boneShade;
          ctx.fillRect(x + 8, y + 13 + bob, 12, 9);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 10, y + 15 + bob, 8, 2);
          ctx.fillRect(x + 10, y + 19 + bob, 8, 2);

          // Outlined Skull + Per-Spawn Variant (cracked brow / horned)
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 6, y + 1 + bob, 16, 12);
          ctx.fillStyle = boneHi;
          ctx.fillRect(x + 7, y + 2 + bob, 14, 9);
          ctx.fillRect(x + 9, y + 10 + bob + (step4 % 2), 10, 3);
          if (v === 2) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(x + 13, y + 2 + bob, 2, 3);
          } else if (v === 3) {
            ctx.fillStyle = boneShade;
            ctx.fillRect(x + 5, y - 1 + bob, 3, 4);
            ctx.fillRect(x + 20, y - 1 + bob, 3, 4);
          }
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 9, y + 5 + bob, 4, 4);
          ctx.fillRect(x + 15, y + 5 + bob, 4, 4);
          ctx.fillStyle = isFrost ? '#38bdf8' : '#ef4444';
          ctx.fillRect(x + 10, y + 6 + bob, 2, 2);
          ctx.fillRect(x + 16, y + 6 + bob, 2, 2);

          // Buckler variant (wood / iron / frost)
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 1, y + 11 + bob, 7, 13);
          ctx.fillStyle = isFrost ? '#0284c7' : v % 2 === 0 ? '#b45309' : '#64748b';
          ctx.fillRect(x + 2, y + 12 + bob, 5, 11);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(x + 3, y + 16 + bob, 3, 3);

          // Curved Bone/Steel Scimitar
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 22, y + 5 + bob + windup, 5, 17);
          ctx.fillStyle = telegraph ? '#fde047' : '#f8fafc';
          ctx.fillRect(x + 23, y + 6 + bob + windup, 3, 15);
          if (telegraph) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 20, y + 4 + bob + windup, 9, 2);
            ctx.fillRect(x + 24, y + bob + windup, 2, 9);
          } else if (lunging) {
            const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
            const ba = Math.atan2(dv.y, dv.x);
            ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.arc(ex, ey, 26, ba - 0.9, ba + 0.9);
            ctx.stroke();
          }
          break;
        }

        case 'knight': {
          // Imposing 38x38 Hi-Bit Darknut / Frost Guard Plate Champion!
          const stompL = step4 === 1 ? -2 : 0;
          const stompR = step4 === 3 ? -2 : 0;
          const capeSway = Math.round(Math.sin(time * 7 + e.x) * 2);
          const telegraph = e.telegraphTimer > 0;
          const lunging = e.lungeTimer > 0;
          const plateDark = flash ? '#ffffff' : isFrost ? '#0c4a6e' : '#334155';
          const plateMid = flash ? '#ffffff' : isFrost ? '#0284c7' : '#64748b';
          const plateHi = flash ? '#ffffff' : isFrost ? '#bae6fd' : '#cbd5e1';
          const capeCol = flash ? '#ffffff' : isFrost ? '#1e3a8a' : v % 2 === 0 ? '#991b1b' : '#581c87';
          const trimCol = isFrost ? '#7dd3fc' : '#facc15';

          // Flowing outlined cape behind
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 3 + capeSway, y + 11 + bob, 30, 19);
          ctx.fillStyle = capeCol;
          ctx.fillRect(x + 4 + capeSway, y + 12 + bob, 28, 17);

          // Heavy plate greaves
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 5, y + 26 + stompL, 9, 8);
          ctx.fillRect(x + 22, y + 26 + stompR, 9, 8);
          ctx.fillStyle = plateDark;
          ctx.fillRect(x + 6, y + 27 + stompL, 7, 6);
          ctx.fillRect(x + 23, y + 27 + stompR, 7, 6);

          // Heavy chestplate & helm
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 3, y + 5 + bob, 30, 24);
          ctx.fillStyle = plateDark;
          ctx.fillRect(x + 4, y + 6 + bob, 28, 22);
          ctx.fillStyle = plateMid;
          ctx.fillRect(x + 6, y + 6 + bob, 24, 18);
          ctx.fillStyle = plateHi;
          ctx.fillRect(x + 7, y + 1 + bob, 22, 10);
          // Horned / Crowned Helm Crest variant
          ctx.fillStyle = trimCol;
          if (v % 2 === 0) {
            ctx.fillRect(x + 12, y - 3 + bob, 12, 4);
          } else {
            ctx.fillRect(x + 6, y - 3 + bob, 4, 6);
            ctx.fillRect(x + 26, y - 3 + bob, 4, 6);
          }
          // Visor & glowing eyes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 8, y + 7 + bob, 20, 5);
          ctx.fillStyle = isFrost ? '#38bdf8' : '#ef4444';
          ctx.fillRect(x + 12, y + 8 + bob, 4, 3);
          ctx.fillRect(x + 20, y + 8 + bob, 4, 3);

          // Riveted Tower Shield
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x - 1, y + 9 + bob, 11, 21);
          ctx.fillStyle = trimCol;
          ctx.fillRect(x, y + 10 + bob, 9, 19);
          ctx.fillStyle = isFrost ? '#0369a1' : '#b45309';
          ctx.fillRect(x + 2, y + 12 + bob, 5, 15);
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(x + 2, y + 12 + bob, 2, 10);

          // Heavy Broadsword
          const swordLift = telegraph ? -10 : (step4 % 2) * 3;
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 29, y + 3 + bob + swordLift, 6, 23);
          ctx.fillStyle = telegraph ? '#fde047' : '#e2e8f0';
          ctx.fillRect(x + 30, y + 4 + bob + swordLift, 4, 21);
          ctx.fillStyle = trimCol;
          ctx.fillRect(x + 27, y + 19 + bob + swordLift, 10, 4);

          if (telegraph) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 27, y + 2 + bob + swordLift, 10, 2);
            ctx.fillRect(x + 31, y - 2 + bob + swordLift, 2, 10);
          } else if (lunging) {
            const dv = FB.DIR_VEC[e.dir] || FB.DIR_VEC[0];
            const ba = Math.atan2(dv.y, dv.x);
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
            ctx.lineWidth = 6.5;
            ctx.beginPath();
            ctx.arc(ex, ey, 32, ba - 1.0, ba + 1.0);
            ctx.stroke();
          }
          break;
        }

        case 'wizzrobe': {
          const alpha = e.wizAlpha !== undefined ? e.wizAlpha : 1;
          if (alpha <= 0.04) break;
          ctx.save();
          ctx.globalAlpha *= alpha;
          const hover = Math.round(Math.sin(time * 6 + e.x) * 3);
          const robeDark = flash ? '#ffffff' : isFrost ? '#075985' : isDark ? '#581c87' : '#312e81';
          const robeMid = flash ? '#ffffff' : isFrost ? '#0ea5e9' : isDark ? '#9333ea' : '#4f46e5';
          const trimCol = isFrost ? '#bae6fd' : '#facc15';

          // Arcane aura shimmer beneath floating robe
          ctx.fillStyle = isFrost ? 'rgba(56, 189, 248, 0.35)' : 'rgba(168, 85, 247, 0.35)';
          ctx.beginPath();
          ctx.arc(ex, ey + hover, 16, 0, Math.PI * 2);
          ctx.fill();

          // Pointed hood & flowing mage robe
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 8, y - 2 + hover, 12, 8);
          ctx.fillRect(x + 4, y + 6 + hover, 20, 20);
          ctx.fillStyle = robeMid;
          ctx.fillRect(x + 9, y - 1 + hover, 10, 7);
          ctx.fillRect(x + 5, y + 7 + hover, 18, 18);
          ctx.fillStyle = robeDark;
          ctx.fillRect(x + 5, y + 18 + hover, 18, 7);
          // Gold rune trim
          ctx.fillStyle = trimCol;
          ctx.fillRect(x + 5, y + 22 + hover, 18, 2);
          ctx.fillRect(x + 12, y + 12 + hover, 4, 10);

          // Shadowed face void + glowing arcane eyes
          ctx.fillStyle = '#090d16';
          ctx.fillRect(x + 8, y + 5 + hover, 12, 7);
          ctx.fillStyle = e.wizPhase === 'appearing' ? '#ffffff' : '#fde047';
          ctx.fillRect(x + 10, y + 7 + hover, 3, 3);
          ctx.fillRect(x + 15, y + 7 + hover, 3, 3);
          ctx.restore();
          break;
        }

        case 'chuchu':
        case 'chuchu_mini': {
          const isMini = e.type === 'chuchu_mini';
          const hop = Math.abs(Math.sin((e.hopPhase || 0) + time * (isMini ? 9 : 6)));
          const lift = Math.round(hop * (isMini ? 7 : 9));
          const squash = hop < 0.25 ? 2 : 0;
          const baseCol = flash
            ? '#ffffff'
            : isFrost
              ? '#0284c7'
              : isDark
                ? '#7e22ce'
                : v % 2 === 0
                  ? '#16a34a'
                  : '#0891b2';
          const hiCol = flash
            ? '#ffffff'
            : isFrost
              ? '#7dd3fc'
              : isDark
                ? '#d8b4fe'
                : v % 2 === 0
                  ? '#86efac'
                  : '#67e8f9';

          const rw = (isMini ? 16 : 24) + squash * 2;
          const rh = (isMini ? 13 : 20) - squash;
          const sx = Math.round(ex - rw / 2);
          const sy = Math.round(ey + (isMini ? 7 : 11) - rh - lift);

          // Outlined translucent jelly dome
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(sx - 1, sy + 2, rw + 2, rh - 1);
          ctx.fillRect(sx + 2, sy - 1, rw - 4, rh + 2);
          ctx.fillStyle = baseCol;
          ctx.fillRect(sx, sy + 2, rw, rh - 2);
          ctx.fillRect(sx + 3, sy, rw - 6, rh);
          // Specular jelly highlight
          ctx.fillStyle = hiCol;
          ctx.fillRect(sx + 3, sy + 2, Math.max(4, Math.floor(rw * 0.4)), 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx + 4, sy + 2, 2, 2);

          // Cute expressive ChuChu eyes
          const eyeY = sy + Math.floor(rh * 0.45);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(Math.round(ex) - (isMini ? 4 : 6), eyeY, isMini ? 2 : 3, isMini ? 3 : 4);
          ctx.fillRect(Math.round(ex) + (isMini ? 2 : 3), eyeY, isMini ? 2 : 3, isMini ? 3 : 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(Math.round(ex) - (isMini ? 4 : 5), eyeY + 1, 1, 2);
          ctx.fillRect(Math.round(ex) + (isMini ? 2 : 4), eyeY + 1, 1, 2);
          break;
        }

        case 'beamos': {
          const ang = e.eyeAngle || 0;
          // Rotating crimson laser sight sweep telegraph!
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.32)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ex, ey - 4);
          ctx.lineTo(ex + Math.cos(ang) * 180, ey - 4 + Math.sin(ang) * 180);
          ctx.stroke();
          ctx.restore();

          // Carved obsidian / sandstone stone turret pillar
          const stoneDark = flash ? '#ffffff' : '#334155';
          const stoneMid = flash ? '#ffffff' : e.biome === 'desert_dungeon' || e.biome === 'desert' ? '#b45309' : '#64748b';
          const stoneHi = flash ? '#ffffff' : e.biome === 'desert_dungeon' || e.biome === 'desert' ? '#f59e0b' : '#cbd5e1';

          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x + 2, y + 1, 28, 28);
          ctx.fillStyle = stoneDark;
          ctx.fillRect(x + 3, y + 16, 26, 12);
          ctx.fillStyle = stoneMid;
          ctx.fillRect(x + 4, y + 3, 24, 15);
          ctx.fillStyle = stoneHi;
          ctx.fillRect(x + 6, y + 4, 20, 4);
          // Gold crown studs
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x + 4, y + 14, 24, 2);

          // Sweeping cyclops crystal eye
          const eyeX = Math.round(ex + Math.cos(ang) * 6);
          const eyeY = Math.round(ey - 4 + Math.sin(ang) * 4);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 7, y + 7, 18, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(eyeX - 4, eyeY - 3, 8, 6);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(eyeX - 2, eyeY - 1, 4, 2);
          break;
        }

        case 'boss':
          this._drawBoss(ctx, e, time, flash);
          break;

        case 'frost_boss':
          this._drawFrostBoss(ctx, e, time, flash);
          break;
      }

      // Burning Ember Rod flame flicker aura
      if (e.burnTimer > 0) {
        const bf = Math.floor(time * 18 + e.x) % 2;
        ctx.fillStyle = 'rgba(249, 115, 22, 0.78)';
        ctx.fillRect(Math.round(ex) - 7 + bf * 2, y + 2, 5, 7);
        ctx.fillRect(Math.round(ex) + 2 - bf * 2, y + 6, 5, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(Math.round(ex) - 5 + bf * 2, y + 4, 2, 3);
      }

      // Compact Hi-Bit pixel HP bar above damaged non-boss enemies
      const isBoss =
        e.type === 'boss' ||
        e.type === 'frost_boss' ||
        e.type === 'desert_boss' ||
        e.type === 'magma_boss';
      if (!isBoss && e.hp > 0 && e.hp < e.maxHp) {
        const bw = Math.max(22, Math.min(34, ew));
        const bx = Math.round(ex - bw / 2);
        const by = y - 10;
        const pct = Math.max(0, Math.min(1, e.hp / e.maxHp));
        ctx.fillStyle = '#090d16';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx, by, bw, 4);
        ctx.fillStyle = pct > 0.45 ? '#ef4444' : '#f59e0b';
        ctx.fillRect(bx, by, Math.max(2, Math.round(bw * pct)), 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(bx, by, Math.max(2, Math.round(bw * pct)), 1);
      }

      // Orbiting twin stun stars
      if (e.stunTimer > 0) {
        for (let i = 0; i < 2; i++) {
          const sa = time * 13 + i * Math.PI;
          const sx = Math.round(ex + Math.cos(sa) * 14);
          const sy = Math.round(y - 6 + Math.sin(sa) * 5);
          ctx.fillStyle = i === 0 ? '#fde047' : '#ffffff';
          ctx.fillRect(sx - 3, sy - 1, 7, 2);
          ctx.fillRect(sx - 1, sy - 3, 2, 7);
        }
      }

      ctx.restore();
    }

    _drawBoss(ctx, b, time, flash) {
      // Shadow Wraith Vaalor — Hi-Bit 64x64 Outlined Arcane Sovereign!
      const bob = Math.sin(time * 4.5) * 7;
      const cx = b.x * S;
      const cy = b.y * S + bob;
      const enraged = b.phase === 2;
      const telegraph = b.bossState === 'orbit' && b.stateTimer < 0.45;

      ctx.save();

      // Rotating outer arcane rune ring
      ctx.strokeStyle = enraged ? 'rgba(244, 63, 94, 0.55)' : 'rgba(139, 92, 246, 0.48)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 42 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Tattered dark shadow cloak tendrils
      ctx.fillStyle = enraged ? 'rgba(88, 28, 135, 0.8)' : 'rgba(20, 12, 45, 0.78)';
      for (let i = -3; i <= 3; i++) {
        const tx = cx + i * 8;
        const wave = Math.sin(time * 10 + i * 1.3) * 6;
        ctx.fillRect(Math.round(tx - 3), Math.round(cy + 16), 6, Math.round(18 + wave));
      }

      if (telegraph) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.34)';
        ctx.beginPath();
        ctx.arc(cx, cy, 46 + Math.sin(time * 32) * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outlined armored shadow core
      ctx.fillStyle = '#090714';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : enraged ? '#581c87' : '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : enraged ? '#7e22ce' : '#312e81';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 6, 17, 0, Math.PI * 2);
      ctx.fill();

      // Phase II crackling lightning arcs
      if (enraged && Math.floor(time * 16) % 2 === 0) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        const a1 = time * 7;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * 26, cy + Math.sin(a1) * 26);
        ctx.lineTo(cx + Math.cos(a1 + 0.4) * 38, cy + Math.sin(a1 + 0.4) * 38);
        ctx.lineTo(cx + Math.cos(a1 + 0.8) * 30, cy + Math.sin(a1 + 0.8) * 30);
        ctx.stroke();
      }

      // Sculpted Golden Royal Crown Horns
      ctx.fillStyle = '#090714';
      ctx.fillRect(cx - 25, cy - 35, 10, 15);
      ctx.fillRect(cx + 15, cy - 35, 10, 15);
      ctx.fillRect(cx - 7, cy - 41, 14, 16);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 24, cy - 34, 8, 13);
      ctx.fillRect(cx + 16, cy - 34, 8, 13);
      ctx.fillRect(cx - 6, cy - 40, 12, 14);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(cx - 3, cy - 38, 4, 8);

      // Giant Expressive Sorcerer Eye
      const blinking = Math.floor(time * 5) % 24 === 0 && b.bossState === 'orbit';
      const eyeH = blinking ? 4 : 16;
      ctx.fillStyle = '#090714';
      ctx.fillRect(cx - 18, cy - eyeH / 2 - 2, 36, eyeH + 4);
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(cx - 16, cy - eyeH / 2, 32, eyeH);
      if (!blinking) {
        const lookX = Math.cos(b.lookAngle || 0) * 6.5;
        const lookY = Math.sin(b.lookAngle || 0) * 3;
        ctx.fillStyle = telegraph ? '#facc15' : enraged ? '#ef4444' : '#7c3aed';
        ctx.fillRect(cx - 6 + lookX, cy - 6 + lookY, 12, 12);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 2.5 + lookX, cy - 3.5 + lookY, 5, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 4 + lookX, cy - 4 + lookY, 3, 3);
      }

      // Orbiting Eyed Dark Shield Orbs
      if (b.orbs) {
        for (const orb of b.orbs) {
          if (!orb.alive) continue;
          const ox = cx + Math.cos(orb.angle) * orb.radius * S;
          const oy = cy + Math.sin(orb.angle) * orb.radius * S;
          ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
          ctx.beginPath();
          ctx.arc(ox, oy, 16 + Math.sin(time * 12 + orb.angle) * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#090714';
          ctx.beginPath();
          ctx.arc(ox, oy, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(ox, oy, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(ox, oy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(ox - 2, oy - 2, 4, 4);
        }
      }
      ctx.restore();
    }

    _drawFrostBoss(ctx, b, time, flash) {
      // Frost Sovereign Glacior — Hi-Bit Faceted Crystalline Cryo-Wyrm!
      const enraged = b.phase === 2;
      const telegraph = b.bossState === 'telegraph';
      const bob = Math.sin(time * 5.2) * 5;
      const cx = b.x * S;
      const cy = b.y * S + bob;

      ctx.save();

      // 1. Outlined Crystalline Body Segments (tail -> neck)
      if (b.segments && b.segments.length > 0) {
        for (let i = b.segments.length - 1; i >= 0; i--) {
          const seg = b.segments[i];
          const sx = seg.x * S;
          const sr = (seg.r || Math.max(5, 11 - i)) * S;
          const sy = seg.y * S + Math.sin(time * 6 + i * 0.9) * 3;

          ctx.fillStyle = 'rgba(7, 11, 22, 0.26)';
          ctx.beginPath();
          ctx.ellipse(sx, sy + sr + 6, sr * 0.85, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = enraged ? 'rgba(56, 189, 248, 0.36)' : 'rgba(125, 211, 252, 0.24)';
          ctx.beginPath();
          ctx.arc(sx, sy, sr + 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#082032';
          ctx.beginPath();
          ctx.arc(sx, sy, sr + 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = flash ? '#ffffff' : i % 2 === 0 ? '#0284c7' : '#0369a1';
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();

          // Faceted crystal spine highlight
          ctx.fillStyle = flash ? '#ffffff' : i === b.segments.length - 1 ? '#fde047' : '#bae6fd';
          ctx.fillRect(Math.round(sx - sr * 0.5), Math.round(sy - sr * 0.5), Math.max(6, Math.round(sr)), 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(sx - sr * 0.3), Math.round(sy - sr * 0.45), Math.max(3, Math.round(sr * 0.5)), 2);
        }
      }

      // 2. Phase II Blizzard Aura & Charge Telegraph Ring
      if (enraged) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.72)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 40 + Math.sin(time * 10) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (telegraph) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.38)';
        ctx.beginPath();
        ctx.arc(cx, cy, 44 + Math.sin(time * 34) * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Outlined Horned Cryo-Wyrm Dragon Head
      ctx.fillStyle = '#071b2e';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : enraged ? '#0c4a6e' : '#075985';
      ctx.beginPath();
      ctx.arc(cx, cy, 27, 0, Math.PI * 2);
      ctx.fill();

      // Faceted glacial brow plate
      ctx.fillStyle = flash ? '#ffffff' : '#38bdf8';
      ctx.fillRect(cx - 20, cy - 18, 40, 15);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - 12, cy - 16, 24, 6);

      // Jagged Frost Crown Horns
      ctx.fillStyle = '#071b2e';
      ctx.fillRect(cx - 28, cy - 35, 10, 19);
      ctx.fillRect(cx + 18, cy - 35, 10, 19);
      ctx.fillRect(cx - 8, cy - 41, 16, 19);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(cx - 26, cy - 33, 6, 16);
      ctx.fillRect(cx + 20, cy - 33, 6, 16);
      ctx.fillRect(cx - 6, cy - 39, 12, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 25, cy - 31, 3, 9);
      ctx.fillRect(cx + 21, cy - 31, 3, 9);
      ctx.fillRect(cx - 2, cy - 37, 4, 10);

      // Frosted Jaw Tusks
      ctx.fillStyle = '#071b2e';
      ctx.fillRect(cx - 18, cy + 15, 8, 12);
      ctx.fillRect(cx + 10, cy + 15, 8, 12);
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(cx - 16, cy + 16, 4, 9);
      ctx.fillRect(cx + 12, cy + 16, 4, 9);

      // Fierce Tracking Eyes
      const lookX = Math.cos(b.lookAngle || 0) * 4.5;
      const lookY = Math.sin(b.lookAngle || 0) * 2.5;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 16, cy - 4, 12, 10);
      ctx.fillRect(cx + 4, cy - 4, 12, 10);
      ctx.fillStyle = telegraph ? '#fde047' : enraged ? '#f43f5e' : '#38bdf8';
      ctx.fillRect(cx - 12 + lookX, cy - 2 + lookY, 6, 6);
      ctx.fillRect(cx + 8 + lookX, cy - 2 + lookY, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 12 + lookX, cy - 2 + lookY, 2, 2);
      ctx.fillRect(cx + 8 + lookX, cy - 2 + lookY, 2, 2);

      ctx.restore();
    }

    drawPickup(ctx, item, time) {
      const bob = Math.sin(time * 6 + item.x) * 3.5;
      const x = Math.round(item.x * S);
      const y = Math.round(item.y * S + bob);

      ctx.save();
      ctx.fillStyle = 'rgba(7, 11, 22, 0.32)';
      ctx.beginPath();
      ctx.ellipse(x, Math.round(item.y * S + 10), 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

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
          const wScale = 0.72 + Math.abs(Math.cos(time * 4.2 + item.x)) * 0.28;
          const rw = Math.max(4, Math.round(8 * wScale));
          ctx.fillStyle = OUTLINE;
          ctx.beginPath();
          ctx.moveTo(x, y - 12);
          ctx.lineTo(x + rw + 2, y - 4);
          ctx.lineTo(x + rw + 2, y + 4);
          ctx.lineTo(x, y + 12);
          ctx.lineTo(x - rw - 2, y + 4);
          ctx.lineTo(x - rw - 2, y - 4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = colors[0];
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x + rw, y - 3);
          ctx.lineTo(x + rw, y + 3);
          ctx.lineTo(x, y + 10);
          ctx.lineTo(x - rw, y + 3);
          ctx.lineTo(x - rw, y - 3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = colors[2];
          ctx.fillRect(x, y - 4, Math.max(2, rw - 2), 9);
          ctx.fillStyle = colors[1];
          ctx.fillRect(x - Math.max(2, Math.floor(rw / 2)), y - 6, 3, 7);
          if (Math.floor(time * 6 + item.x) % 5 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 1, y - 9, 2, 4);
          }
          break;
        }

        case 'heart': {
          const beat = Math.sin(time * 8) > 0.7 ? 1 : 0;
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x - 9 - beat, y - 6 - beat, 18 + beat * 2, 11 + beat);
          ctx.fillRect(x - 5, y + 4, 10, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 8 - beat, y - 5 - beat, 7 + beat, 7 + beat);
          ctx.fillRect(x + 1, y - 5 - beat, 7 + beat, 7 + beat);
          ctx.fillRect(x - 6, y + 1, 12, 4);
          ctx.fillRect(x - 3, y + 5, 6, 3);
          ctx.fillStyle = '#fecaca';
          ctx.fillRect(x - 6, y - 4, 3, 3);
          break;
        }

        case 'fairy': {
          const wf = Math.floor(time * 18) % 2 === 0 ? -4 : 3;
          ctx.fillStyle = 'rgba(244, 114, 182, 0.34)';
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(x - 12, y - 6 + wf, 9, 6);
          ctx.fillRect(x + 3, y - 6 + wf, 9, 6);
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 2, y - 2, 4, 4);
          break;
        }

        case 'heart_container': {
          const pulse = Math.sin(time * 5) * 0.14 + 0.28;
          ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
          ctx.beginPath();
          ctx.arc(x, y, 19, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x - 13, y - 10, 26, 16);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 12, y - 9, 24, 14);
          ctx.fillRect(x - 8, y + 4, 16, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 10, y - 7, 9, 9);
          ctx.fillRect(x + 1, y - 7, 9, 9);
          ctx.fillRect(x - 6, y + 1, 12, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - 8, y - 5, 3, 3);
          break;
        }

        case 'heart_piece': {
          const pulse = Math.sin(time * 6) * 0.14 + 0.3;
          ctx.fillStyle = `rgba(244, 114, 182, ${pulse})`;
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fill();
          // Golden Heart Quarter Shard
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x - 10, y - 9, 20, 14);
          ctx.fillRect(x - 6, y + 4, 12, 5);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 9, y - 8, 18, 12);
          ctx.fillRect(x - 5, y + 3, 10, 5);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(x - 7, y - 6, 8, 8);
          ctx.fillRect(x - 4, y + 1, 6, 4);
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(x - 6, y - 5, 3, 3);
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 2, y - 6, 5, 8);
          break;
        }

        case 'key': {
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(x - 6, y - 10, 12, 20);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 5, y - 9, 10, 8);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x - 2, y - 7, 4, 4);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - 2, y - 1, 4, 10);
          ctx.fillRect(x + 2, y + 3, 4, 3);
          ctx.fillRect(x + 2, y + 7, 4, 2);
          break;
        }

        case 'item_pedestal': {
          const glow = Math.sin(time * 5) * 0.15 + 0.32;
          const meta = FB.ITEM_META[item.itemId];
          ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fill();

          if (item.itemId === FB.ITEMS.BOMB) {
            ctx.fillStyle = OUTLINE;
            ctx.beginPath();
            ctx.arc(x, y + 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#312e81';
            ctx.beginPath();
            ctx.arc(x, y + 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#818cf8';
            ctx.fillRect(x - 4, y - 2, 3, 3);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(x, y - 12, 4, 5);
          } else if (item.itemId === FB.ITEMS.BOW) {
            ctx.strokeStyle = '#d4a359';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, 10, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 2, y - 9);
            ctx.lineTo(x + 2, y + 9);
            ctx.stroke();
          } else if (item.itemId === FB.ITEMS.FIREROD) {
            ctx.fillStyle = OUTLINE;
            ctx.fillRect(x - 3, y - 9, 6, 22);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x - 2, y - 8, 4, 20);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 2, y - 12, 3, 3);
          } else if (item.itemId === FB.ITEMS.HOOKSHOT) {
            ctx.fillStyle = OUTLINE;
            ctx.fillRect(x - 5, y - 10, 10, 22);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x - 3, y - 4, 6, 14);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(x - 7, y - 11, 4, 8);
            ctx.fillRect(x + 3, y - 11, 4, 8);
            ctx.fillRect(x - 3, y - 12, 6, 6);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(x - 3, y + 3, 6, 4);
          } else if (item.itemId === FB.ITEMS.MIRROR) {
            ctx.fillStyle = OUTLINE;
            ctx.fillRect(x - 9, y - 11, 18, 22);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(x - 8, y - 10, 16, 20);
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(x - 5, y - 7, 10, 14);
            ctx.fillStyle = '#faf5ff';
            ctx.fillRect(x - 4, y - 6, 4, 8);
          } else {
            ctx.fillStyle = meta?.color || '#38bdf8';
            ctx.fillRect(x - 8, y - 8, 16, 16);
          }
          break;
        }
      }
      ctx.restore();
    }

    drawShopItem(ctx, col, row, catalogItem, time) {
      const cx = (col * FB.TILE_SIZE + 8) * S;
      const cy = (row * FB.TILE_SIZE + 6) * S + Math.sin(time * 4 + col) * 2.5;
      ctx.save();

      // Velvet gold-trimmed shop mat underneath
      ctx.fillStyle = '#3b2413';
      ctx.fillRect(col * 32 + 2, row * 32 + 4, 28, 24);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(col * 32 + 4, row * 32 + 6, 24, 20);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(col * 32 + 4, row * 32 + 6, 24, 2);

      if (catalogItem.id === 'heal') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(cx - 9, cy - 6, 18, 12);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 8, cy - 5, 7, 7);
        ctx.fillRect(cx + 1, cy - 5, 7, 7);
        ctx.fillRect(cx - 6, cy + 1, 12, 4);
        ctx.fillRect(cx - 3, cy + 5, 6, 3);
      } else if (catalogItem.id === 'potion') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(cx - 7, cy - 9, 14, 19);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cx - 3, cy - 10, 6, 5);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(cx - 6, cy - 5, 12, 13);
        ctx.fillStyle = '#fda4af';
        ctx.fillRect(cx - 4, cy - 3, 4, 7);
      } else if (catalogItem.id === 'mirror_shield') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(cx - 9, cy - 9, 18, 19);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 8, cy - 8, 16, 17);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cx - 5, cy - 5, 10, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 4, cy - 4, 3, 6);
      } else if (catalogItem.id === 'tempered_sword') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(cx - 4, cy - 12, 8, 22);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 2, cy - 11, 4, 16);
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(cx - 1, cy - 9, 2, 12);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 7, cy + 3, 14, 4);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 2, cy + 7, 4, 4);
      }

      // Crisp Hi-Bit price pill
      ctx.fillStyle = 'rgba(10, 14, 24, 0.88)';
      ctx.fillRect(cx - 14, row * 32 + 24, 28, 11);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${catalogItem.cost}R`, cx, row * 32 + 33);
      ctx.restore();
    }
  }

  FB.sprites = new SpriteRenderer();
})(window);
