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
      this.bossIntroTimer = 0;
    }

    init(game) {
      this.game = game;
      this.els = {
        titleOverlay: document.getElementById('title-overlay'),
        pauseOverlay: document.getElementById('pause-overlay'),
        gameoverOverlay: document.getElementById('gameover-overlay'),
        victoryOverlay: document.getElementById('victory-overlay'),
        mapOverlay: document.getElementById('map-overlay'),
        worldmapCanvas: document.getElementById('worldmap-canvas'),
        mapJournal: document.getElementById('map-journal'),
        mapAreaSubtitle: document.getElementById('map-area-subtitle'),
        btnMap: document.getElementById('btn-map'),
        btnCloseMap: document.getElementById('btn-close-map'),
        bossIntroCard: document.getElementById('boss-intro-card'),
        bossIntroSub: document.getElementById('boss-intro-sub'),
        bossIntroTitle: document.getElementById('boss-intro-title'),
        hudPlayers: document.getElementById('hud-players'),
        hudKeys: document.getElementById('hud-keys'),
        hudBossKey: document.getElementById('hud-boss-key'),
        hudRoomName: document.getElementById('hud-room-name'),
        hudTimer: document.getElementById('hud-timer'),
        hudHeroBadge: document.getElementById('hud-hero-badge'),
        minimapCanvas: document.getElementById('minimap-canvas'),
        bossBarWrap: document.getElementById('boss-bar-wrap'),
        bossBarTitle: document.getElementById('boss-bar-title'),
        bossBarFill: document.getElementById('boss-bar-fill'),
        toastBanner: document.getElementById('toast-banner'),
        dialogBox: document.getElementById('dialog-box'),
        dialogText: document.getElementById('dialog-text'),
        gamepadStatus: document.getElementById('gamepad-status'),
        victoryStats: document.getElementById('victory-stats'),
        victoryTime: document.getElementById('victory-time'),
        btnStart: document.getElementById('btn-start'),
        btnBossRush: document.getElementById('btn-boss-rush'),
        btnResume: document.getElementById('btn-resume'),
        btnRestartPause: document.getElementById('btn-restart-pause'),
        btnMenuPause: document.getElementById('btn-menu-pause'),
        btnRetry: document.getElementById('btn-retry'),
        btnVictoryReplay: document.getElementById('btn-victory-replay'),
        btnMute: document.getElementById('btn-mute'),
        btnMusic: document.getElementById('btn-music'),
        btnPause: document.getElementById('btn-pause'),
        friendlyFireToggle: document.getElementById('friendly-fire-toggle'),
        heroModeToggle: document.getElementById('hero-mode-toggle'),
        heroModeLabel: document.getElementById('hero-mode-label'),
        saveSlotsRow: document.getElementById('save-slots-row'),
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

      // Pause Drop-In / Drop-Out player count buttons
      const pausePBtns = document.querySelectorAll('.pause-p-btn');
      pausePBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const count = parseInt(btn.dataset.pausePlayers, 10) || 1;
          game.setActivePlayerCount(count);
        });
      });

      if (this.els.friendlyFireToggle) {
        this.els.friendlyFireToggle.addEventListener('change', (e) => {
          game.friendlyFire = !!e.target.checked;
        });
      }

      if (this.els.heroModeToggle) {
        this.els.heroModeToggle.addEventListener('change', (e) => {
          game.heroMode = !!e.target.checked;
        });
      }

      if (this.els.btnStart) {
        this.els.btnStart.addEventListener('click', () => {
          FB.audio.init();
          const slot = FB.saves ? FB.saves.getSlot(game.activeSaveSlot) : null;
          if (slot) {
            game.loadSaveSlot(game.activeSaveSlot, game.selectedPlayerCount);
          } else {
            game.startNewGame(game.selectedPlayerCount, {
              slotIndex: game.activeSaveSlot,
              heroMode: game.heroMode,
            });
          }
        });
      }

      if (this.els.btnResume) {
        this.els.btnResume.addEventListener('click', () => game.togglePause(false));
      }
      if (this.els.btnRestartPause) {
        this.els.btnRestartPause.addEventListener('click', () => {
          game.togglePause(false);
          game.startNewGame(game.selectedPlayerCount, {
            slotIndex: game.activeSaveSlot,
            heroMode: game.heroMode,
          });
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
      if (this.els.btnMap) {
        this.els.btnMap.addEventListener('click', () => {
          if (game.state === 'playing') game.toggleMapDrawer();
        });
      }
      if (this.els.btnCloseMap) {
        this.els.btnCloseMap.addEventListener('click', () => {
          game.toggleMapDrawer(false);
        });
      }
      if (this.els.minimapCanvas) {
        this.els.minimapCanvas.addEventListener('click', () => {
          if (game.state === 'playing') game.toggleMapDrawer();
        });
      }
      if (this.els.btnBossRush) {
        this.els.btnBossRush.addEventListener('click', () => {
          FB.audio.init();
          game.startBossRushMode(game.selectedPlayerCount);
        });
      }

      this.updateControlCards(1);
    }

    renderSaveSlots(game) {
      if (!this.els.saveSlotsRow || !FB.saves) return;
      const slots = FB.saves.getAllSlots();
      const meta = FB.saves.getMeta();
      if (this.els.heroModeLabel) {
        this.els.heroModeLabel.textContent = meta.heroModeUnlocked
          ? '★ Hero Mode Unlocked (2× Damage + Speedrun Timer)'
          : 'Hero Mode Preview (2× Damage + Speedrun Timer)';
      }
      if (this.els.btnBossRush) {
        const unlocked = !!meta.bossRushUnlocked;
        this.els.btnBossRush.classList.toggle('hidden', !unlocked);
        if (unlocked && meta.bossRushBestTime !== null && meta.bossRushBestTime !== undefined) {
          const bs = Math.floor(meta.bossRushBestTime);
          this.els.btnBossRush.textContent = `★ BOSS RUSH (Best ${Math.floor(bs / 60)}:${String(bs % 60).padStart(2, '0')})`;
        } else {
          this.els.btnBossRush.textContent = '★ FOUR SOVEREIGNS BOSS RUSH';
        }
      }

      let html = '';
      slots.forEach((s, idx) => {
        const active = game.activeSaveSlot === idx ? 'active' : '';
        if (!s) {
          html += `
            <div class="save-slot-card ${active}" data-slot-idx="${idx}">
              <div class="save-slot-head"><span>Slot ${idx + 1}</span><span>NEW</span></div>
              <div class="save-slot-meta">Empty Sanctuary File<br/>Click Embark to begin</div>
            </div>
          `;
        } else {
          const act = s.act1Cleared ? 'Act II' : 'Act I';
          const hearts = Math.ceil((s.heroes?.[0]?.maxHp || 12) / 2);
          const rupees = (s.heroes || []).reduce((sum, h) => sum + (h.rupees || 0), 0);
          const secs = Math.floor(s.elapsedTime || 0);
          const mins = Math.floor(secs / 60);
          const rem = String(secs % 60).padStart(2, '0');
          html += `
            <div class="save-slot-card ${active}" data-slot-idx="${idx}">
              <div class="save-slot-head">
                <span>Slot ${idx + 1} • ${act}${s.heroMode ? ' ★' : ''}</span>
                <button type="button" class="save-slot-del" data-del-slot="${idx}" title="Delete Save">✕</button>
              </div>
              <div class="save-slot-meta">${s.roomName || 'Sanctuary'}<br/>♥${hearts} • ◆${rupees} • ${mins}:${rem}</div>
            </div>
          `;
        }
      });

      this.els.saveSlotsRow.innerHTML = html;

      // Update Embark button label based on selected slot
      const sel = slots[game.activeSaveSlot];
      if (this.els.btnStart) {
        this.els.btnStart.textContent = sel
          ? `CONTINUE SLOT ${game.activeSaveSlot + 1}`
          : `EMBARK (SLOT ${game.activeSaveSlot + 1})`;
      }

      this.els.saveSlotsRow.querySelectorAll('.save-slot-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.save-slot-del')) return;
          game.activeSaveSlot = parseInt(card.dataset.slotIdx, 10) || 0;
          this.renderSaveSlots(game);
        });
      });

      this.els.saveSlotsRow.querySelectorAll('.save-slot-del').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.delSlot, 10);
          FB.saves.deleteSlot(idx);
          this.renderSaveSlots(game);
        });
      });
    }

    syncPausePlayerButtons(count) {
      document.querySelectorAll('.pause-p-btn').forEach((btn) => {
        const p = parseInt(btn.dataset.pausePlayers, 10);
        btn.classList.toggle('active', p === count);
      });
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
      if (name && name !== 'playing') {
        this.els.mapOverlay?.classList.add('hidden');
      }
    }

    showBossIntro(subtitle, title) {
      this.bossIntroTimer = 2.25;
      if (!this.els.bossIntroCard) return;
      if (this.els.bossIntroSub) this.els.bossIntroSub.textContent = subtitle || 'BOSS';
      if (this.els.bossIntroTitle) this.els.bossIntroTitle.textContent = title || 'GUARDIAN';
      this.els.bossIntroCard.classList.remove('hidden');
      // Restart CSS animation cleanly
      this.els.bossIntroCard.style.animation = 'none';
      void this.els.bossIntroCard.offsetWidth;
      this.els.bossIntroCard.style.animation = '';
    }

    setMapVisible(open, game) {
      if (!this.els.mapOverlay) return;
      this.els.mapOverlay.classList.toggle('hidden', !open);
      if (open && game) {
        this.renderMapDrawer(game);
      }
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
      if (this.bossIntroTimer > 0) {
        this.bossIntroTimer -= dt;
        if (this.bossIntroTimer <= 0 && this.els.bossIntroCard) {
          this.els.bossIntroCard.classList.add('hidden');
        }
      }
    }

    _mapGroupForArea(area) {
      if (area === 'overworld' || area === 'village' || area === 'desert' || area === 'mountain') {
        return 'lightworld';
      }
      return area || 'lightworld';
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
        const badges = [
          h.potions > 0 ? `🧪${h.potions}` : '',
          h.blueElixir ? '💙' : '',
          h.mirrorShield ? '🛡' : '',
          h.goldenBlade ? '👑' : h.temperedSword ? '⚔' : '',
          h.heroMail ? '🔰' : '',
        ]
          .filter(Boolean)
          .join('');

        html += `
          <div class="hud-hero-card ${h.downed ? 'downed' : ''}" style="--hero-color:${h.profile.uiColor}">
            <div class="hud-hero-top">
              <span class="hud-hero-badge">P${h.index + 1} ${h.profile.name}${badges ? ' ' + badges : ''}</span>
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

      const area = game.room ? game.room.area : 'overworld';
      let smallK = game.smallKeys;
      let hasBk = game.hasBossKey;
      let bkName = 'BOSS KEY';
      if (area === 'frost') {
        smallK = game.frostSmallKeys;
        hasBk = game.hasFrostBossKey;
        bkName = 'FROST KEY';
      } else if (area === 'desert_dungeon') {
        smallK = game.desertSmallKeys;
        hasBk = game.hasDesertBossKey;
        bkName = 'SOLAR KEY';
      } else if (area === 'magma') {
        smallK = game.magmaSmallKeys;
        hasBk = game.hasMagmaBossKey;
        bkName = 'MAGMA KEY';
      }
      if (this.els.hudKeys) {
        this.els.hudKeys.textContent = `${smallK}`;
      }
      if (this.els.hudBossKey) {
        this.els.hudBossKey.classList.toggle('has-key', !!hasBk);
        this.els.hudBossKey.textContent = hasBk ? `${bkName} ✓` : `${bkName} —`;
      }
      if (this.els.hudRoomName && game.room) {
        this.els.hudRoomName.textContent = game.room.name;
      }
      if (this.els.hudTimer) {
        const t = game.elapsedTime || 0;
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        const tenths = Math.floor((t * 10) % 10);
        this.els.hudTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
      }
      if (this.els.hudHeroBadge) {
        this.els.hudHeroBadge.classList.toggle('hidden', !game.heroMode);
      }

      // Boss health bar (all 4 Sovereign Bosses!)
      const boss = game.enemies.find(
        (e) =>
          e.alive &&
          (e.type === 'boss' || e.type === 'frost_boss' || e.type === 'desert_boss' || e.type === 'magma_boss')
      );
      if (this.els.bossBarWrap && this.els.bossBarFill) {
        if (boss) {
          this.els.bossBarWrap.classList.remove('hidden');
          if (this.els.bossBarTitle) {
            this.els.bossBarTitle.textContent =
              boss.type === 'frost_boss'
                ? 'Frost Sovereign Glacior'
                : boss.type === 'desert_boss'
                  ? 'Solar Sentinel Solkar'
                  : boss.type === 'magma_boss'
                    ? 'Forge Titan Ignis Rex'
                    : 'Shadow Wraith Vaalor';
          }
          const pct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
          this.els.bossBarFill.style.width = `${pct}%`;
        } else {
          this.els.bossBarWrap.classList.add('hidden');
        }
      }

      this.renderMinimap(game);
    }

    _drawAreaMap(canvas, game, detailed = false) {
      if (!canvas || !game.room) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0b101b';
      ctx.fillRect(0, 0, w, h);

      const group = this._mapGroupForArea(game.room.area);
      const areaRooms = Object.values(game.rooms).filter((r) => this._mapGroupForArea(r.area) === group);
      if (areaRooms.length === 0) return;

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
      const padX = detailed ? 24 : 10;
      const padY = detailed ? 20 : 8;
      const cellW = Math.min(detailed ? 56 : 18, Math.floor((w - padX) / cols));
      const cellH = Math.min(detailed ? 38 : 12, Math.floor((h - padY) / rows));
      const startX = Math.floor((w - cols * cellW) / 2);
      const startY = Math.floor((h - rows * cellH) / 2);

      for (const r of areaRooms) {
        const rx = startX + (r.gx - minX) * cellW;
        const ry = startY + (r.gy - minY) * cellH;
        const isCurrent = r.id === game.room.id;

        if (!r.visited && !isCurrent && !r.isBossRoom) {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.22)';
          ctx.fillRect(rx + 2, ry + 2, Math.max(4, cellW - 4), Math.max(4, cellH - 4));
          continue;
        }

        if (isCurrent) {
          ctx.fillStyle = '#facc15';
        } else if (r.isBossRoom) {
          ctx.fillStyle = '#dc2626';
        } else if (r.area === 'village') {
          ctx.fillStyle = '#0ea5e9';
        } else if (r.area === 'desert' || r.area === 'desert_dungeon') {
          ctx.fillStyle = '#d97706';
        } else if (r.area === 'mountain' || r.area === 'magma') {
          ctx.fillStyle = '#b91c1c';
        } else if (r.area === 'overworld') {
          ctx.fillStyle = '#3f8f47';
        } else if (r.area === 'darkworld') {
          ctx.fillStyle = '#7e22ce';
        } else if (r.area === 'frost') {
          ctx.fillStyle = '#0284c7';
        } else {
          ctx.fillStyle = '#476899';
        }

        // Slightly reflect wide/tall room proportions in detailed view
        const rCols = r.cols || 20;
        const rRows = r.rows || 13;
        const rw = detailed && rCols < 16 ? Math.max(8, Math.floor(cellW * 0.62)) : Math.max(4, cellW - 4);
        const rh = detailed && rRows < 12 ? Math.max(8, Math.floor(cellH * 0.65)) : Math.max(4, cellH - 4);
        const ox = rx + Math.floor((cellW - rw) / 2);
        const oy = ry + Math.floor((cellH - rh) / 2);
        ctx.fillRect(ox, oy, rw, rh);

        if (detailed) {
          ctx.strokeStyle = isCurrent ? '#ffffff' : 'rgba(255,255,255,0.22)';
          ctx.lineWidth = isCurrent ? 2 : 1;
          ctx.strokeRect(ox + 0.5, oy + 0.5, rw - 1, rh - 1);

          // Unopened chest indicator
          const hasUnopenedChest =
            r.visited &&
            r.chests &&
            r.chests.some((ch) => !r.openedChests || !r.openedChests.has(`${ch.col},${ch.row}`));
          if (hasUnopenedChest) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(ox + rw - 7, oy + 3, 4, 4);
          }

          // Boss marker
          if (r.isBossRoom) {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(ox + Math.floor(rw / 2) - 2, oy + Math.floor(rh / 2) - 2, 5, 5);
          }
        } else if (r.isBossRoom) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(rx + Math.floor(cellW / 2) - 1, ry + Math.floor(cellH / 2) - 1, 2, 2);
        }
      }
    }

    renderMinimap(game) {
      this._drawAreaMap(this.els.minimapCanvas, game, false);
    }

    _questObjectiveHint(game) {
      if (!game.bossDefeated) {
        return 'Act I: Explore the Light Overworld & Villages, then conquer the Sanctuary Palace (North-East) and defeat Vaalor to claim the Magic Mirror.';
      }
      const remaining = [];
      if (!game.frostBossDefeated) remaining.push('Frost Spire (Dark World North — Glacior)');
      if (game.rooms.ds_boss && !game.desertBossDefeated) remaining.push('Sunspire Desert Temple (Solkar)');
      if (game.rooms.mg_boss && !game.magmaBossDefeated) remaining.push('Magma Citadel (Ignis Rex)');
      if (remaining.length > 0) {
        return `Act II (Open World): Conquer remaining dungeons in any order — ${remaining.join(' • ')}.`;
      }
      return 'All Sovereign Medallions united! Step onto a Sovereign Altar or test your might in the Sanctuary Arena!';
    }

    renderMapDrawer(game) {
      if (!game || !game.room) return;
      this._drawAreaMap(this.els.worldmapCanvas, game, true);

      const areaLabels = {
        overworld: 'Light Overworld — Hyrule-Scale Realm',
        village: 'Sanctuary Villages & Outposts',
        desert: 'Sunscorched Desert & Oasis',
        mountain: 'Crag-Peak Mountains & Ridge',
        darkworld: 'Twilight Dark World',
        dungeon: 'Palace #1 — Sanctuary Palace',
        frost: 'Dungeon #2 — Frost Spire',
        desert_dungeon: 'Dungeon #3 — Sunspire Desert Temple',
        magma: 'Dungeon #4 — Magma Citadel',
        shop: 'Interior Sanctuary',
      };
      if (this.els.mapAreaSubtitle) {
        this.els.mapAreaSubtitle.textContent = `${game.room.name} (${areaLabels[game.room.area] || game.room.area}) • ${game.roomCols}×${game.roomRows} tiles`;
      }

      if (this.els.mapJournal) {
        const h0 = game.humanHeroes[0];
        const items = (h0?.items || [])
          .map((id) => FB.ITEM_META[id]?.name || id)
          .join(', ') || 'None yet';

        const upgrades = [
          h0?.temperedSword ? 'Tempered Blade' : null,
          h0?.goldenBlade ? 'Golden Master Blade' : null,
          h0?.mirrorShield ? 'Mirror Shield' : null,
          h0?.pegasusOil ? 'Pegasus Oil' : null,
          h0?.gripSandals ? 'Grip Sandals' : null,
          h0?.heroMail ? "Hero's Mail" : null,
          h0?.blastPowder ? 'Blast Powder' : null,
          h0?.blueElixir ? 'Blue Elixir' : null,
        ].filter(Boolean);

        const visitedCount = Object.values(game.rooms).filter((r) => r.visited).length;
        const totalRooms = Object.keys(game.rooms).length;

        this.els.mapJournal.innerHTML = `
          <div class="journal-section">
            <div class="journal-label">Current Objective</div>
            <div>${this._questObjectiveHint(game)}</div>
          </div>
          <div class="journal-section">
            <div class="journal-label">Sovereign Medallions</div>
            <div class="medallion-row">
              <div class="medallion-pill ${game.bossDefeated ? 'earned' : ''}">${game.bossDefeated ? '★' : '○'} Shadow (Vaalor)</div>
              <div class="medallion-pill ${game.frostBossDefeated ? 'earned' : ''}">${game.frostBossDefeated ? '★' : '○'} Frost (Glacior)</div>
              <div class="medallion-pill ${game.desertBossDefeated ? 'earned' : ''}">${game.desertBossDefeated ? '★' : '○'} Solar (Solkar)</div>
              <div class="medallion-pill ${game.magmaBossDefeated ? 'earned' : ''}">${game.magmaBossDefeated ? '★' : '○'} Magma (Ignis)</div>
            </div>
          </div>
          <div class="journal-section">
            <div class="journal-label">Exploration &amp; Heart Pieces</div>
            <div>Rooms Explored: <strong>${visitedCount} / ${totalRooms}</strong> &nbsp;•&nbsp; Heart Pieces: <strong>${game.heartPieces % 4} / 4</strong> (Total: ${game.heartPieces})</div>
          </div>
          <div class="journal-section">
            <div class="journal-label">Dungeon Tools &amp; Village Upgrades</div>
            <div><strong>Items:</strong> ${items}</div>
            <div><strong>Upgrades:</strong> ${upgrades.length ? upgrades.join(', ') : 'Visit Villages & Shops!'}</div>
          </div>
        `;
      }
    }

    renderVictory(game) {
      if (!this.els.victoryStats) return;
      const secs = Math.floor(game.elapsedTime);
      const mins = Math.floor(secs / 60);
      const rem = secs % 60;
      const meta = FB.saves ? FB.saves.getMeta() : {};
      let bestStr = '';
      if (meta.bestClearTime !== null && meta.bestClearTime !== undefined) {
        const bSecs = Math.floor(meta.bestClearTime);
        bestStr = `  •  Best: ${Math.floor(bSecs / 60)}m ${String(bSecs % 60).padStart(2, '0')}s`;
      }
      const modeStr = game.heroMode ? '  •  ★ HERO MODE CLEAR!' : '  •  ★ Hero Mode Unlocked!';
      if (this.els.victoryTime) {
        this.els.victoryTime.textContent = `Grand Quest Clear Time: ${mins}m ${String(rem).padStart(2, '0')}s${bestStr}${modeStr}`;
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
