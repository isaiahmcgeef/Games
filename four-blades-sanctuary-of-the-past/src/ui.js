/**
 * HUD, Title/Multiplayer Lobby, Live Minimap, Boss Bar, Pause & Four Swords Victory UI.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  class UIManager {
    constructor() {
      this.els = {};
      this.toastTimer = 0;
      this.toastText = '';
    }

    init(game) {
      this.game = game;
      this.els = {
        titleOverlay: document.getElementById('title-overlay'),
        pauseOverlay: document.getElementById('pause-overlay'),
        gameoverOverlay: document.getElementById('gameover-overlay'),
        victoryOverlay: document.getElementById('victory-overlay'),
        hudPlayers: document.getElementById('hud-players'),
        hudKeys: document.getElementById('hud-keys'),
        hudBossKey: document.getElementById('hud-boss-key'),
        hudRoomName: document.getElementById('hud-room-name'),
        minimapCanvas: document.getElementById('minimap-canvas'),
        bossBarWrap: document.getElementById('boss-bar-wrap'),
        bossBarFill: document.getElementById('boss-bar-fill'),
        toastBanner: document.getElementById('toast-banner'),
        dialogBox: document.getElementById('dialog-box'),
        dialogText: document.getElementById('dialog-text'),
        gamepadStatus: document.getElementById('gamepad-status'),
        victoryStats: document.getElementById('victory-stats'),
        victoryTime: document.getElementById('victory-time'),
        btnStart: document.getElementById('btn-start'),
        btnResume: document.getElementById('btn-resume'),
        btnRestartPause: document.getElementById('btn-restart-pause'),
        btnMenuPause: document.getElementById('btn-menu-pause'),
        btnRetry: document.getElementById('btn-retry'),
        btnVictoryReplay: document.getElementById('btn-victory-replay'),
        btnMute: document.getElementById('btn-mute'),
        btnMusic: document.getElementById('btn-music'),
        btnPause: document.getElementById('btn-pause'),
        friendlyFireToggle: document.getElementById('friendly-fire-toggle'),
      };

      // Player count selector buttons
      const modeBtns = document.querySelectorAll('.player-count-btn');
      modeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          modeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const count = parseInt(btn.dataset.players, 10) || 1;
          game.selectedPlayerCount = count;
          this.updateControlCards(count);
        });
      });

      if (this.els.friendlyFireToggle) {
        this.els.friendlyFireToggle.addEventListener('change', (e) => {
          game.friendlyFire = !!e.target.checked;
        });
      }

      if (this.els.btnStart) {
        this.els.btnStart.addEventListener('click', () => {
          FB.audio.init();
          game.startNewGame(game.selectedPlayerCount);
        });
      }

      if (this.els.btnResume) {
        this.els.btnResume.addEventListener('click', () => game.togglePause(false));
      }
      if (this.els.btnRestartPause) {
        this.els.btnRestartPause.addEventListener('click', () => {
          game.togglePause(false);
          game.startNewGame(game.selectedPlayerCount);
        });
      }
      if (this.els.btnMenuPause) {
        this.els.btnMenuPause.addEventListener('click', () => game.returnToTitle());
      }
      if (this.els.btnRetry) {
        this.els.btnRetry.addEventListener('click', () => game.respawnFromGameOver());
      }
      if (this.els.btnVictoryReplay) {
        this.els.btnVictoryReplay.addEventListener('click', () => game.returnToTitle());
      }
      if (this.els.btnMute) {
        this.els.btnMute.addEventListener('click', () => {
          const muted = FB.audio.toggleMute();
          this.els.btnMute.textContent = muted ? 'SFX: OFF' : 'SFX: ON';
          this.els.btnMute.classList.toggle('is-off', muted);
        });
      }
      if (this.els.btnMusic) {
        this.els.btnMusic.addEventListener('click', () => {
          const on = FB.audio.toggleMusic();
          this.els.btnMusic.textContent = on ? 'BGM: ON' : 'BGM: OFF';
          this.els.btnMusic.classList.toggle('is-off', !on);
        });
      }
      if (this.els.btnPause) {
        this.els.btnPause.addEventListener('click', () => {
          if (game.state === 'playing' || game.state === 'paused') {
            game.togglePause();
          }
        });
      }

      this.updateControlCards(1);
    }

    updateControlCards(count) {
      const cards = document.querySelectorAll('.control-slot');
      cards.forEach((card) => {
        const idx = parseInt(card.dataset.slot, 10);
        card.classList.toggle('slot-active', idx <= count);
      });
    }

    updateGamepadBanner(padCount) {
      if (!this.els.gamepadStatus) return;
      if (padCount === 0) {
        this.els.gamepadStatus.textContent =
          'No gamepads detected yet — Keyboard supports 1–2 players; plug in USB/Bluetooth controllers for up to 4 players!';
      } else {
        this.els.gamepadStatus.textContent = `${padCount} Controller${padCount > 1 ? 's' : ''} connected and ready! Press any button to wake controllers.`;
      }
    }

    setOverlay(name) {
      this.els.titleOverlay?.classList.toggle('hidden', name !== 'title');
      this.els.pauseOverlay?.classList.toggle('hidden', name !== 'paused');
      this.els.gameoverOverlay?.classList.toggle('hidden', name !== 'gameover');
      this.els.victoryOverlay?.classList.toggle('hidden', name !== 'victory');
    }

    showToast(text, duration = 3.2) {
      this.toastText = text;
      this.toastTimer = duration;
      if (this.els.toastBanner) {
        this.els.toastBanner.textContent = text;
        this.els.toastBanner.classList.remove('hidden');
      }
    }

    showDialog(text) {
      if (!this.els.dialogBox || !this.els.dialogText) return;
      if (text) {
        this.els.dialogText.textContent = text;
        this.els.dialogBox.classList.remove('hidden');
      } else {
        this.els.dialogBox.classList.add('hidden');
      }
    }

    update(dt) {
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0 && this.els.toastBanner) {
          this.els.toastBanner.classList.add('hidden');
        }
      }
    }

    renderHUD(game) {
      if (!this.els.hudPlayers) return;

      // Render player status cards
      let html = '';
      for (const h of game.humanHeroes) {
        const totalHearts = Math.ceil(h.maxHp / 2);
        let heartsHtml = '';
        for (let i = 0; i < totalHearts; i++) {
          const val = h.hp - i * 2;
          const cls = val >= 2 ? 'heart full' : val === 1 ? 'heart half' : 'heart empty';
          heartsHtml += `<span class="${cls}"></span>`;
        }
        const item = h.currentItem ? FB.ITEM_META[h.currentItem] : null;
        const itemTag = item
          ? `<span class="hud-item-pill" style="--pill-color:${item.color}">${item.short}</span>`
          : `<span class="hud-item-pill">—</span>`;

        html += `
          <div class="hud-hero-card ${h.downed ? 'downed' : ''}" style="--hero-color:${h.profile.uiColor}">
            <div class="hud-hero-top">
              <span class="hud-hero-badge">P${h.index + 1} ${h.profile.name}</span>
              <span class="hud-rupees">◆ ${h.rupees}</span>
              ${itemTag}
            </div>
            <div class="hud-hearts">${heartsHtml}</div>
          </div>
        `;
      }

      if (game.humanHeroes.length === 1) {
        const cloneActive = !!game.spiritClone;
        html += `
          <div class="hud-clone-hint ${cloneActive ? 'active' : ''}">
            <span class="clone-dot"></span>
            <span>Spirit Clone [Q]: <strong>${cloneActive ? (game.spiritClone.cloneHold ? 'HOLDING' : 'FOLLOW') : 'OFF'}</strong></span>
          </div>
        `;
      }

      this.els.hudPlayers.innerHTML = html;

      if (this.els.hudKeys) {
        this.els.hudKeys.textContent = `${game.smallKeys}`;
      }
      if (this.els.hudBossKey) {
        this.els.hudBossKey.classList.toggle('has-key', game.hasBossKey);
        this.els.hudBossKey.textContent = game.hasBossKey ? 'BOSS KEY ✓' : 'BOSS KEY —';
      }
      if (this.els.hudRoomName && game.room) {
        this.els.hudRoomName.textContent = game.room.name;
      }

      // Boss health bar
      const boss = game.enemies.find((e) => e.type === 'boss' && e.alive);
      if (this.els.bossBarWrap && this.els.bossBarFill) {
        if (boss) {
          this.els.bossBarWrap.classList.remove('hidden');
          const pct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
          this.els.bossBarFill.style.width = `${pct}%`;
        } else {
          this.els.bossBarWrap.classList.add('hidden');
        }
      }

      this.renderMinimap(game);
    }

    renderMinimap(game) {
      const canvas = this.els.minimapCanvas;
      if (!canvas || !game.room) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0e1420';
      ctx.fillRect(0, 0, w, h);

      const currentArea = game.room.area;
      const areaRooms = Object.values(game.rooms).filter((r) => r.area === currentArea);

      // Compute grid bounds
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const r of areaRooms) {
        if (r.gx < minX) minX = r.gx;
        if (r.gx > maxX) maxX = r.gx;
        if (r.gy < minY) minY = r.gy;
        if (r.gy > maxY) maxY = r.gy;
      }

      const cols = Math.max(1, maxX - minX + 1);
      const rows = Math.max(1, maxY - minY + 1);
      const cellW = Math.min(20, Math.floor((w - 12) / cols));
      const cellH = Math.min(13, Math.floor((h - 10) / rows));
      const startX = Math.floor((w - cols * cellW) / 2);
      const startY = Math.floor((h - rows * cellH) / 2);

      for (const r of areaRooms) {
        const rx = startX + (r.gx - minX) * cellW;
        const ry = startY + (r.gy - minY) * cellH;
        const isCurrent = r.id === game.room.id;

        if (!r.visited && !isCurrent && !r.isBossRoom) {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.22)';
          ctx.fillRect(rx + 1, ry + 1, cellW - 2, cellH - 2);
          continue;
        }

        if (isCurrent) {
          ctx.fillStyle = '#facc15';
        } else if (r.isBossRoom) {
          ctx.fillStyle = '#dc2626';
        } else if (r.area === 'overworld') {
          ctx.fillStyle = '#3f8f47';
        } else {
          ctx.fillStyle = '#476899';
        }
        ctx.fillRect(rx + 1, ry + 1, cellW - 2, cellH - 2);

        if (r.isBossRoom) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(rx + Math.floor(cellW / 2) - 1, ry + Math.floor(cellH / 2) - 1, 2, 2);
        }
      }
    }

    renderVictory(game) {
      if (!this.els.victoryStats) return;
      const secs = Math.floor(game.elapsedTime);
      const mins = Math.floor(secs / 60);
      const rem = secs % 60;
      if (this.els.victoryTime) {
        this.els.victoryTime.textContent = `Clear Time: ${mins}m ${String(rem).padStart(2, '0')}s`;
      }

      // Rank players by Four Swords Score (Rupees + Kills * 15 + Revives * 25)
      const ranked = [...game.humanHeroes].sort(
        (a, b) =>
          b.rupees + b.kills * 15 + b.revives * 25 - (a.rupees + a.kills * 15 + a.revives * 25)
      );

      let html = '';
      ranked.forEach((h, idx) => {
        const score = h.rupees + h.kills * 15 + h.revives * 25;
        const medal =
          idx === 0 ? '★ HERO OF LIGHT (MVP)' : idx === 1 ? '✦ VANGUARD BLADE' : '✧ SANCTUARY GUARD';
        html += `
          <div class="victory-hero-row" style="--hero-color:${h.profile.uiColor}">
            <div class="vh-name">
              <strong>P${h.index + 1} ${h.profile.name}</strong>
              <span class="vh-medal">${medal}</span>
            </div>
            <div class="vh-metrics">
              <span>◆ ${h.rupees} Rupees</span>
              <span>⚔ ${h.kills} Defeated</span>
              <span>★ ${score} Score</span>
            </div>
          </div>
        `;
      });
      this.els.victoryStats.innerHTML = html;
      this.setOverlay('victory');
    }
  }

  FB.ui = new UIManager();
})(window);
