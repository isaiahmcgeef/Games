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

// 8. Visit & render every room in the world
for (const id of Object.keys(g.rooms)) {
  g.enterRoom(id, { col: 10, row: 7 });
  g.update(0.02);
  g.render();
}
console.log(`[PASS] Full world render & update simulation (${Object.keys(g.rooms).length} rooms)`);
console.log('\nALL TESTS PASSED!');
