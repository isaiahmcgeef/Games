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

// 7. Visit & render every room in the world
for (const id of Object.keys(g.rooms)) {
  g.enterRoom(id, { col: 10, row: 7 });
  g.update(0.02);
  g.render();
}
console.log(`[PASS] Full world render & update simulation (${Object.keys(g.rooms).length} rooms)`);
console.log('\nALL TESTS PASSED!');
