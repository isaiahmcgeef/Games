/**
 * Local Save Slot Manager (3 persistent browser slots + global Hero Mode & Best Time meta).
 * Gracefully degrades to in-memory storage when localStorage is unavailable (e.g., headless tests).
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});
  const SLOT_PREFIX = 'four_blades_save_slot_';
  const META_KEY = 'four_blades_meta_v1';

  class SaveManager {
    constructor() {
      this.memoryStore = new Map();
    }

    _readRaw(key) {
      try {
        if (global.localStorage) {
          return global.localStorage.getItem(key);
        }
      } catch (_) {}
      return this.memoryStore.has(key) ? this.memoryStore.get(key) : null;
    }

    _writeRaw(key, val) {
      try {
        if (global.localStorage) {
          global.localStorage.setItem(key, val);
          return;
        }
      } catch (_) {}
      this.memoryStore.set(key, val);
    }

    _removeRaw(key) {
      try {
        if (global.localStorage) {
          global.localStorage.removeItem(key);
          return;
        }
      } catch (_) {}
      this.memoryStore.delete(key);
    }

    getMeta() {
      const defaults = {
        heroModeUnlocked: false,
        bestClearTime: null,
        bossRushUnlocked: false,
        bossRushBestTime: null,
        arenaBestWave: 0,
      };
      const raw = this._readRaw(META_KEY);
      if (!raw) return defaults;
      try {
        return Object.assign(defaults, JSON.parse(raw));
      } catch (_) {
        return defaults;
      }
    }

    saveMeta(patch) {
      const next = Object.assign(this.getMeta(), patch);
      this._writeRaw(META_KEY, JSON.stringify(next));
      return next;
    }

    getSlot(slotIndex) {
      const raw = this._readRaw(SLOT_PREFIX + slotIndex);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    }

    getAllSlots() {
      return [0, 1, 2].map((i) => this.getSlot(i));
    }

    deleteSlot(slotIndex) {
      this._removeRaw(SLOT_PREFIX + slotIndex);
    }

    serializeGame(game) {
      const roomStates = {};
      for (const [id, r] of Object.entries(game.rooms || {})) {
        roomStates[id] = {
          visited: !!r.visited,
          puzzleSolved: !!r.puzzleSolved,
          openedChests: Array.from(r.openedChests || []),
          claimedPedestals: Array.from(r.claimedPedestals || []),
          destroyedTiles: Array.from(r.destroyedTiles || []),
          crystalState: r.crystalState || 'blue',
        };
      }

      const safeRoomId =
        game.room && game.room.isBossRoom
          ? game.room.area === 'frost'
            ? 'fs_ante'
            : game.room.area === 'desert_dungeon'
              ? 'ds_ante'
              : game.room.area === 'magma'
                ? 'mg_ante'
                : 'dg_ante'
          : game.room
            ? game.room.id
            : 'ow_start';

      return {
        version: 2,
        updatedAt: Date.now(),
        roomId: safeRoomId,
        roomName: game.rooms?.[safeRoomId]?.name || 'Sanctuary Courtyard',
        playerCount: game.humanHeroes.length,
        elapsedTime: game.elapsedTime || 0,
        smallKeys: game.smallKeys || 0,
        hasBossKey: !!game.hasBossKey,
        frostSmallKeys: game.frostSmallKeys || 0,
        hasFrostBossKey: !!game.hasFrostBossKey,
        desertSmallKeys: game.desertSmallKeys || 0,
        hasDesertBossKey: !!game.hasDesertBossKey,
        magmaSmallKeys: game.magmaSmallKeys || 0,
        hasMagmaBossKey: !!game.hasMagmaBossKey,
        unlockedLocks: Array.from(game.unlockedLocks || []),
        bossDefeated: !!game.bossDefeated,
        act1Cleared: !!game.act1Cleared,
        frostBossDefeated: !!game.frostBossDefeated,
        desertBossDefeated: !!game.desertBossDefeated,
        magmaBossDefeated: !!game.magmaBossDefeated,
        heartPieces: game.heartPieces || 0,
        collectedHeartPieces: Array.from(game.collectedHeartPieces || []),
        heroMode: !!game.heroMode,
        friendlyFire: !!game.friendlyFire,
        heroes: game.humanHeroes.map((h) => ({
          index: h.index,
          maxHp: h.maxHp,
          hp: Math.max(2, h.hp),
          rupees: h.rupees,
          kills: h.kills,
          revives: h.revives,
          items: [...h.items],
          itemIdx: h.itemIdx,
          temperedSword: !!h.temperedSword,
          mirrorShield: !!h.mirrorShield,
          potions: h.potions || 0,
          goldenBlade: !!h.goldenBlade,
          pegasusOil: !!h.pegasusOil,
          gripSandals: !!h.gripSandals,
          blueElixir: !!h.blueElixir,
          heroMail: !!h.heroMail,
          blastPowder: !!h.blastPowder,
        })),
        roomStates,
      };
    }

    saveSlot(slotIndex, game) {
      if (slotIndex === null || slotIndex === undefined) return null;
      const data = this.serializeGame(game);
      this._writeRaw(SLOT_PREFIX + slotIndex, JSON.stringify(data));
      return data;
    }
  }

  FB.saves = new SaveManager();
})(window);
