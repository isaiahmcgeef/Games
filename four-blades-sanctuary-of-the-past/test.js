/**
 * Automated Verification Harness (`npm test`) for Four Blades: Sanctuary of the Past.
 * Verifies:
 *  1. Syntax across server.js and all src/*.js scripts
 *  2. World map integrity (20x13 grids, reciprocal exits, unblocked doorways, walkable portals)
 *  3. End-to-end headless Canvas2D runtime simulation of all gameplay systems
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');

function assert(cond, msg) {
  if (!cond) {
    throw new Error('ASSERTION FAILED: ' + msg);
  }
}

// 1. Syntax check every JS file in project
const scriptOrder = [
  'constants.js',
  'audio.js',
  'tiles-hibit.js',
  'sprites.js',
  'input.js',
  'saves.js',
  'maps.js',
  'maps-overworld.js',
  'maps-palace.js',
  'maps-darkworld.js',
  'maps-frost.js',
  'entities.js',
  'ui.js',
  'game.js',
].filter((f) => fs.existsSync(path.join(SRC_DIR, f)));

const allJs = [path.join(ROOT, 'server.js'), ...scriptOrder.map((f) => path.join(SRC_DIR, f))];
for (const file of allJs) {
  execFileSync(process.execPath, ['--check', file]);
}
console.log(`[PASS] Syntax check (${allJs.length} JS files)`);

// 2. Setup headless DOM + Canvas2D + localStorage mock
const listeners = {};
const storage = new Map();
const makeCtx = () => ({
  imageSmoothingEnabled: false,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  font: '',
  textAlign: '',
  fillRect() {},
  clearRect() {},
  drawImage() {},
  save() {},
  restore() {},
  translate() {},
  rotate() {},
  beginPath() {},
  arc() {},
  ellipse() {},
  moveTo() {},
  lineTo() {},
  closePath() {},
  fill() {},
  stroke() {},
  fillText() {},
  createRadialGradient() {
    return { addColorStop() {} };
  },
});
const makeEl = (id) => ({
  id,
  width: 320,
  height: 208,
  textContent: '',
  innerHTML: '',
  style: {},
  dataset: {},
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {},
  querySelectorAll: () => [],
  getContext: () => makeCtx(),
});
const elements = {};
global.window = global;
global.navigator = { getGamepads: () => [] };
global.requestAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.addEventListener = (ev, fn) => {
  (listeners[ev] = listeners[ev] || []).push(fn);
};
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
global.document = {
  createElement: () => makeEl('c'),
  getElementById: (id) => (elements[id] = elements[id] || makeEl(id)),
  querySelectorAll: () => [],
};

for (const f of scriptOrder) {
  require(path.join(SRC_DIR, f));
}

const FB = global.FourBlades;
const T = FB.TILES;
(listeners.DOMContentLoaded || []).forEach((fn) => fn());
const g = FB.game;
assert(!!g, 'Game instance initialized');

// 3. Verify World Map Integrity across all regions
const rooms = FB.createWorldData();
const roomIds = Object.keys(rooms);
assert(roomIds.length >= 13, `Expected at least 13 rooms, got ${roomIds.length}`);
const opp = { north: 'south', south: 'north', east: 'west', west: 'east' };
for (const id of roomIds) {
  const r = rooms[id];
  assert(r.grid.length === FB.ROOM_ROWS, `${id}: expected ${FB.ROOM_ROWS} rows`);
  for (let row = 0; row < FB.ROOM_ROWS; row++) {
    assert(r.grid[row].length === FB.ROOM_COLS, `${id} row ${row}: expected ${FB.ROOM_COLS} cols`);
  }
  for (const [dir, target] of Object.entries(r.exits || {})) {
    assert(!!rooms[target], `${id}: exit ${dir} points to missing room ${target}`);
    assert(
      rooms[target].exits?.[opp[dir]] === id,
      `${id}: exit ${dir} -> ${target} is not reciprocal`
    );
    const coords =
      dir === 'north'
        ? [
            [0, 9],
            [0, 10],
          ]
        : dir === 'south'
          ? [
              [12, 9],
              [12, 10],
            ]
          : dir === 'west'
            ? [
                [6, 0],
                [7, 0],
              ]
            : [
                [6, 19],
                [7, 19],
              ];
    for (const [rr, cc] of coords) {
      const tile = r.grid[rr][cc];
      assert(
        tile !== T.TREE && tile !== T.DUNGEON_WALL && tile !== T.STONE_WALL && tile !== T.DARK_TREE,
        `${id}: exit ${dir} blocked by wall tile ${tile} at (${rr},${cc})`
      );
    }
  }
  for (const p of r.portals || []) {
    const tr = rooms[p.targetRoom];
    assert(!!tr, `${id}: portal target ${p.targetRoom} missing`);
    const destTile = tr.grid[p.targetRow][p.targetCol];
    assert(
      !FB.SOLID_TILES.has(destTile),
      `${id}: portal lands on solid tile ${destTile} in ${p.targetRoom} (${p.targetCol},${p.targetRow})`
    );
  }
}
console.log(`[PASS] Map & doorway integrity (${roomIds.length} rooms verified)`);

// 4. Test 3 Save Slots + Load Round-Trip
g.startNewGame(1, { slotIndex: 1 });
g.humanHeroes[0].rupees = 77;
g.humanHeroes[0].grantItem(FB.ITEMS.BOW);
g.smallKeys = 2;
g.saveProgress();
const saved = FB.saves.getSlot(1);
assert(saved && saved.smallKeys === 2 && saved.heroes[0].rupees === 77, 'Save slot persisted');

g.startNewGame(1, { slotIndex: 0 });
assert(g.smallKeys === 0, 'Slot 0 fresh');
g.loadSaveSlot(1, 2);
assert(g.smallKeys === 2, 'Loaded slot 1 smallKeys');
assert(g.humanHeroes.length === 2, 'Loaded slot 1 with 2 players');
assert(g.humanHeroes[0].rupees === 77, 'Loaded slot 1 rupees');
assert(g.humanHeroes[1].items.includes(FB.ITEMS.BOW), 'Drop-in P2 synced shared Bow');
console.log('[PASS] 3-Slot Save/Load round-trip');

// 5. Test Live Pause-Menu Drop-In / Drop-Out Co-op (2P -> 4P -> 1P)
g.setActivePlayerCount(4);
assert(g.humanHeroes.length === 4, 'Drop-in to 4P');
assert(g.humanHeroes[3].items.includes(FB.ITEMS.BOW), 'P4 synced shared items');
g.setActivePlayerCount(1);
assert(g.humanHeroes.length === 1, 'Drop-out to 1P');
console.log('[PASS] Drop-In / Drop-Out local co-op');

// 6. Test 3-Hit Sword Combo + Perfect Parry + Blade Clash
const p1 = g.humanHeroes[0];
p1.comboTimer = 0;
g.startSwordSwing(p1);
assert(p1.comboStep === 0, 'Combo Hit 0');
g.startSwordSwing(p1);
assert(p1.comboStep === 1, 'Combo Hit 1');
g.startSwordSwing(p1);
assert(p1.comboStep === 2, 'Combo Hit 2');

const soldier = new FB.Enemy('soldier', p1.x + 18, p1.y, 1);
soldier.dir = FB.DIRS.LEFT;
soldier.telegraphTimer = 0.25;
g.enemies = [soldier];
p1.dir = FB.DIRS.RIGHT;
p1.comboTimer = 0;
g.startSwordSwing(p1);
g.checkSwordHits(p1, false);
assert(soldier.stunTimer >= 1.5, 'Perfect Parry stunned Soldier');

const knight = new FB.Enemy('knight', p1.x + 18, p1.y, 1);
knight.dir = FB.DIRS.LEFT;
knight.parryCooldown = 0;
g.enemies = [knight];
p1.comboTimer = 0;
g.startSwordSwing(p1);
g.checkSwordHits(p1, false);
assert(knight.parryCooldown > 0 && knight.stunTimer > 0, 'Blade Clash triggered vs Knight');
console.log('[PASS] 3-Hit Sword Combo, Perfect Parry & Blade Clash');

// 7. Test Phase 2: Lift & Throw, Bomb Self-Damage, Hurricane, Shield Reflect, Sword Beam, Shop & Potion Revive, Rupee Streak
g.startNewGame(2, { slotIndex: 2 });
const h1 = g.humanHeroes[0];
const h2 = g.humanHeroes[1];

// Bomb Close-Range Self-Damage
const startHp = h1.hp;
h1.invuln = 0;
g.explodeBomb({ x: h1.x + 8, y: h1.y, damage: 5, owner: h1 });
assert(h1.hp === startHp - 2, `Expected Bomb self-damage of 2 HP, got ${startHp - h1.hp}`);

// Lift & Throw Teammate
h1.x = 120; h1.y = 100; h1.dir = FB.DIRS.RIGHT;
h2.x = 132; h2.y = 100;
assert(g.handleHeroGrabOrThrow(h1) === true && h1.carrying?.kind === 'hero', 'Lift teammate');
assert(g.handleHeroGrabOrThrow(h1) === true && h2.thrownTimer > 0, 'Throw teammate');

// Synced Four-Blade Hurricane Finisher
h2.thrownTimer = 0; h2.x = h1.x + 20; h2.y = h1.y; h2.spinCharge = 0.3;
const dummy = new FB.Enemy('soldier', h1.x + 30, h1.y, 2);
g.enemies = [dummy];
const preHp = dummy.hp;
g.startSpinAttack(h1);
assert(dummy.hp < preHp, 'Synced Four-Blade Hurricane damaged nearby enemy');

// Shop Purchase (Mirror Shield, Tempered Blade, Red Potion) & Auto-Revive
g.enterRoom('ow_shop', { col: 10, row: 7 });
h1.rupees = 200;
h1.x = 11 * 16 + 8; h1.y = 6 * 16 + 8;
g.tryBuyShopItem(h1);
assert(h1.mirrorShield === true, 'Purchased Mirror Shield');
h1.x = 14 * 16 + 8; h1.y = 6 * 16 + 8;
g.tryBuyShopItem(h1);
assert(h1.temperedSword === true, 'Purchased Tempered Blade');
h1.x = 8 * 16 + 8; h1.y = 6 * 16 + 8;
g.tryBuyShopItem(h1);
assert(h1.potions === 1, 'Purchased Red Potion');

// Full-Health Master Sword Beam on Combo Hit 3
h1.hp = h1.maxHp;
h1.comboTimer = 0.3; h1.comboStep = 1;
g.projectiles = [];
g.startSwordSwing(h1);
assert(g.projectiles.some((p) => p.kind === 'beam'), 'Tempered Blade fires Sword Beam on Hit 3 at full health');

// Mirror Shield Reflect
h1.swordTimer = 0; h1.spinTimer = 0; h1.dir = FB.DIRS.RIGHT; h1.invuln = 0;
const proj = new FB.Projectile({ kind: 'rock', x: h1.x + 6, y: h1.y, vx: -100, vy: 0, fromEnemy: true, damage: 1, radius: 4 });
g.projectiles = [proj];
g.updateProjectiles(0.01);
assert(proj.fromEnemy === false && proj.vx > 0, 'Mirror Shield reflected enemy rock!');

// Red Potion Auto-Revive
h1.invuln = 0; h1.hp = 1;
h1.damage(5, h1.x + 10, h1.y, g);
assert(h1.hp === h1.maxHp && h1.potions === 0 && !h1.downed, 'Red Potion auto-revived hero!');

// Rupee Streak Multiplier
h1.rupees = 0; h1.streakCount = 0;
for (let i = 0; i < 4; i++) {
  g.collectPickup(new FB.Pickup('rupee_green', h1.x, h1.y), h1);
}
assert(h1.rupees > 4, `Expected Rupee Streak bonus (>4), got ${h1.rupees}`);
console.log('[PASS] Phase 2: Lift/Throw, Bomb Self-Damage, Hurricane, Shop, Sword Beam, Mirror Reflect, Potion & Streaks');

// 8. Test Phase 3: Act I Complete -> Magic Mirror + Dark World + Hookshot
g.enterRoom('dg_boss', { col: 10, row: 7 });
g.bossDefeated = true;
g.completeAct1();
assert(g.act1Cleared === true, 'Act I marked cleared');
assert(h1.items.includes(FB.ITEMS.MIRROR), 'Magic Mirror granted on Act I clear');
assert(g.room.id === 'ow_start', 'Returned to Sanctuary Courtyard');
assert(g.room.grid[5][10] === T.PORTAL_DARK, 'Dark World Rift opened in Sanctuary Courtyard');

// Magic Mirror Light <-> Dark Overworld Warp
g.useMagicMirror(h1);
assert(g.room.id === 'dw_start', 'Magic Mirror warped to Dark World Twilight Courtyard');
g.useMagicMirror(h1);
assert(g.room.id === 'ow_start', 'Magic Mirror warped back to Light Overworld');

// Hookshot Latch & Zip across Crimson Rapids river!
g.enterRoom('dw_river', { col: 3, row: 3 });
h1.grantItem(FB.ITEMS.HOOKSHOT);
h1.dir = FB.DIRS.RIGHT;
h1.x = 4 * 16 + 8;
h1.y = 3 * 16 + 8;
h1.itemCooldown = 0;
g.useHeroItem(h1);
const startX = h1.x;
for (let i = 0; i < 45; i++) {
  g.updateProjectiles(0.02);
  g.render();
}
assert(h1.x > startX + 70, `Expected Hookshot to zip hero across Crimson Rapids river (moved ${Math.round(h1.x - startX)}px)`);
console.log('[PASS] Phase 3: Act I Clear, Magic Mirror Light/Dark Warp & Hookshot Grapple');

// 9. Test Phase 4: Frost Spire (Ice Sliding Blocks, Frost Keys, Dynamic Darkness, Cryo-Wyrm Boss, Grand Victory & Hero Mode)
assert(Object.keys(g.rooms).length === 25, `Expected 25 total rooms, got ${Object.keys(g.rooms).length}`);

// 9a. Sliding Ice Block Puzzle in fs_ice_blocks
g.enterRoom('fs_ice_blocks', { col: 15, row: 6 });
assert(g.room.grid[5][7] === T.BLOCK_PUSH && g.room.grid[8][7] === T.BLOCK_PUSH, 'Two ice push blocks present');
// Push Block 1 right -> stops at (10, 5) before pillar at (11, 5)
h1.pushTimer = 0; h1.pushTileKey = null;
g.handleHeroBump(h1, 7, 5, 1, 0, 0.3);
assert(g.room.grid[5][10] === T.BLOCK_PUSH, 'Ice block 1 slid across ice to (10,5)');
assert(g.room.grid[5][7] === T.ICE_FLOOR, 'Vacated ice block cell restored as ICE_FLOOR');
// Push Block 1 up -> locks onto switch at (10, 3)
h1.pushTimer = 0; h1.pushTileKey = null;
g.handleHeroBump(h1, 10, 5, 0, -1, 0.3);
assert(g.room.grid[3][10] === T.SWITCH_FLOOR_ON, 'Ice block 1 slid north and locked switch (10,3)');
// Push Block 2 right -> stops at (10, 8), then push down -> locks switch (10, 9)
h1.pushTimer = 0; h1.pushTileKey = null;
g.handleHeroBump(h1, 7, 8, 1, 0, 0.3);
assert(g.room.grid[8][10] === T.BLOCK_PUSH, 'Ice block 2 slid across ice to (10,8)');
h1.pushTimer = 0; h1.pushTileKey = null;
g.handleHeroBump(h1, 10, 8, 0, 1, 0.3);
assert(g.room.grid[9][10] === T.SWITCH_FLOOR_ON, 'Ice block 2 slid south and locked switch (10,9)');
g.updatePuzzles();
assert(g.room.puzzleSolved === true && g.room.grid[2][15] === T.CHEST_CLOSED, 'fs_ice_blocks solved and Frost Key chest spawned');
g.openChest(15, 2, false, h1);
assert(g.frostSmallKeys === 1, 'Claimed Frost Small Key');

// Unlock fs_entry north Frost seal
g.enterRoom('fs_entry', { col: 10, row: 2 });
g.handleHeroBump(h1, 9, 0, 0, -1, 0.05);
assert(g.frostSmallKeys === 0 && g.room.grid[0][9] === T.DOOR_OPEN, 'Unlocked Frost Spire small door');

// 9b. Dynamic Darkness Pitch-Black Vault (fs_dark_hall)
g.enterRoom('fs_dark_hall', { col: 10, row: 10 });
assert(g.room.isDark === true, 'fs_dark_hall flagged isDark');
g.render();
assert(!!g.darkCanvas, 'Offscreen dynamic darkness mask initialized and rendered');
for (let r = 0; r < FB.ROOM_ROWS; r++) {
  for (let c = 0; c < FB.ROOM_COLS; c++) {
    if (g.room.grid[r][c] === T.TORCH_UNLIT) g.room.grid[r][c] = T.TORCH_LIT;
  }
}
g.updatePuzzles();
assert(g.room.puzzleSolved === true && g.room.grid[6][19] === T.DOOR_OPEN, 'Lighting torches cleared darkness and unlocked east door');

// 9c. Cryo-Wyrm Boss (fs_boss), Fire Rod Melt Bonus, Defeat & Grand Victory -> Hero Mode Unlock
g.enterRoom('fs_boss', { col: 10, row: 10 });
const wyrm = g.enemies.find((e) => e.type === 'frost_boss');
assert(wyrm && wyrm.segments && wyrm.segments.length === 6, 'Cryo-Wyrm boss spawned with 6 crystalline segments');
for (let i = 0; i < 60; i++) {
  g.updateEnemies(0.05);
  g.updateProjectiles(0.05);
}
g.render();
const hpBeforeMelt = wyrm.hp;
wyrm.hurtTimer = 0;
wyrm.hit(3, h1.x, h1.y, h1, g, { isFire: true });
assert(wyrm.hp === hpBeforeMelt - 5, `Expected Fire Rod melt bonus (3+2=5 dmg), got ${hpBeforeMelt - wyrm.hp}`);
wyrm.hurtTimer = 0;
wyrm.hit(999, h1.x, h1.y, h1, g, {});
assert(!wyrm.alive && g.frostBossDefeated === true, 'Cryo-Wyrm defeated');
assert(g.room.grid[6][9] === T.TRIFORCE_ALTAR, 'Final Triforce Altar revealed in fs_boss');
g.triggerVictory();
assert(g.state === 'victory', 'Grand Victory triggered');
assert(FB.saves.getMeta().heroModeUnlocked === true, 'Hero Mode unlocked upon clearing Grand Quest');

// 9d. Hero Mode: 2x Damage + No Free Bush Heart Drops
g.startNewGame(1, { slotIndex: 0, heroMode: true });
const hmHero = g.humanHeroes[0];
const hmHp0 = hmHero.hp;
hmHero.invuln = 0;
hmHero.damage(1, hmHero.x + 10, hmHero.y, g);
assert(hmHero.hp === hmHp0 - 2, `Expected Hero Mode 2x damage (2 HP), got ${hmHp0 - hmHero.hp}`);
g.pickups = [];
for (let i = 0; i < 60; i++) {
  g._dropDestructibleLoot(100, 100, false);
}
assert(!g.pickups.some((p) => p.kind === 'heart'), 'Hero Mode disables free heart drops from bushes/pots');
console.log('[PASS] Phase 4: Frost Spire, Ice Blocks, Dynamic Darkness, Cryo-Wyrm Boss, Grand Victory & Hero Mode');

// 10. Test Hi-Bit 32x32 Graphics Overhaul (640x416, room terrain cache, enemy variability, biome atmosphere)
assert(FB.RENDER_W === 640 && FB.RENDER_H === 416, 'Hi-Bit render dimensions 640x416');
assert(g.canvas.width === 640 && g.canvas.height === 416, 'Game canvas sized 640x416');

g.enterRoom('ow_start', { col: 10, row: 7 });
g.render();
assert(!!g.roomCanvas && g.roomCanvas.width === 640 && g.roomCanvas.height === 416, 'Pre-baked Hi-Bit roomCanvas 640x416');
assert(g.butterflies.length >= 2 && g.ambientMotes.length >= 10, 'Overworld butterflies and sunlit pollen active');
const cacheBefore = g.roomCacheKey;
g.room.grid[4][4] = T.GRASS_FLOWERS;
g.render();
assert(g.roomCacheKey !== cacheBefore, 'Room cache key invalidates and re-bakes automatically on tile mutation');

g.enterRoom('fs_entry', { col: 10, row: 7 });
assert(g.ambientMotes.length >= 20, 'Frost Spire falling pixel snow active');
assert(g.enemies.every((e) => e.biome === 'frost' && e.variant >= 0 && e.variant <= 3), 'Frost Spire enemies carry frost biome & visual variant');

g.enterRoom('dw_start', { col: 10, row: 7 });
assert(g.ambientMotes.length >= 15, 'Dark World twilight spores active');
assert(g.enemies.every((e) => e.biome === 'darkworld'), 'Dark World enemies carry darkworld biome');

// Verify removing pots/bushes in Dark World leaves DARK_GRASS/DARK_PATH, never Light World green GRASS!
const dwHero = g.humanHeroes[0];
g.room.grid[4][4] = T.POT;
dwHero.carrying = null;
dwHero.dir = FB.DIRS.RIGHT;
dwHero.x = 3 * 16 + 10;
dwHero.y = 4 * 16 + 8;
assert(g.handleHeroGrabOrThrow(dwHero) === true, 'Lifted pot in Dark World');
assert(g.room.grid[4][4] === T.DARK_GRASS, `Expected DARK_GRASS under lifted Dark World pot, got ${g.room.grid[4][4]}`);
dwHero.carrying = null;
g.room.grid[4][5] = T.POT;
g.explodeBomb({ x: 5 * 16 + 8, y: 4 * 16 + 8, damage: 5, owner: dwHero });
assert(g.room.grid[4][5] === T.DARK_GRASS, `Expected DARK_GRASS under bombed Dark World pot, got ${g.room.grid[4][5]}`);

// Verify both bosses summon minions and clear them on defeat!
g.bossDefeated = false;
g.frostBossDefeated = false;
g.enterRoom('dg_boss', { col: 10, row: 10 });
const vaalor = g.enemies.find((e) => e.type === 'boss');
assert(vaalor && vaalor.maxHp >= 54, 'Vaalor buffed difficulty');
vaalor.summonTimer = 0.05;
g.updateEnemies(0.1);
assert(g.enemies.some((e) => e.alive && e.isSummoned), 'Vaalor summoned minions during combat');
g.onBossDefeated(vaalor);
assert(!g.enemies.some((e) => e.alive && e.isSummoned), 'Vaalor defeat clears summoned minions');

g.enterRoom('fs_boss', { col: 10, row: 10 });
const glacior = g.enemies.find((e) => e.type === 'frost_boss');
assert(glacior && glacior.maxHp >= 68, 'Glacior buffed difficulty');
glacior.summonTimer = 0.05;
g.updateEnemies(0.1);
assert(g.enemies.some((e) => e.alive && e.isSummoned && e.biome === 'frost'), 'Glacior summoned Frost minions during combat');
g.onFrostBossDefeated(glacior);
assert(!g.enemies.some((e) => e.alive && e.isSummoned), 'Glacior defeat clears summoned minions');

console.log('[PASS] Hi-Bit 32x32 Graphics, Dark World Pot Ground Fix & Boss Minion Summoning');

// 11. Visit & render every room in the world at Hi-Bit 640x416
for (const id of Object.keys(g.rooms)) {
  g.enterRoom(id, { col: 10, row: 7 });
  g.update(0.02);
  g.render();
}
console.log(`[PASS] Full world render & update simulation (${Object.keys(g.rooms).length} rooms @ 640x416)`);
console.log('\nALL TESTS PASSED!');
