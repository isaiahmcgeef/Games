# Four Blades: Sanctuary of the Past

A browser-based 16-bit action-adventure inspired by **The Legend of Zelda: A Link to the Past** and **Four Swords**, designed to run completely locally in your browser with **optional 1–4 player local multiplayer**.

## Features

- **16-Bit Pixel-Art World**: Procedurally rendered tiles, animated heroes in 4 classic tunic colors (Emerald, Ruby, Sapphire, Amethyst), dynamic lighting on dungeon braziers, and crisp 3x pixel scaling.
- **Overworld + 9-Room Palace Dungeon**:
  - Explore **Sanctuary Courtyard**, **Whispering Woods** (secret bombable grove + Heart Container), **River Shrine & Fairy Spring** (crystal gate puzzle + Hero's Bow), and the **Palace Courtyard**.
  - Conquer the **Palace of the Four Blades**: floor-switch & push-block chambers, crystal-switch bridges, combat barracks with bombable secret walls, torch-lighting sanctum, Armored Knight mini-boss vault, and a multi-phase boss battle against **Shadow Wraith Vaalor**.
- **Optional 1–4 Player Local Multiplayer**:
  - **1 Player (Solo)**: Classic ALttP adventure + press `Q` / `Tab` to summon/anchor a **Four Swords Spirit Clone** (like *Four Swords Anniversary Edition*) for co-op switches and synchronized sword swings!
  - **2 Players (Shared Keyboard)**: P1 on `WASD + J/K/L/U`, P2 on `Arrow Keys + Numpad / N,M,.,/`.
  - **Up to 4 Players (Web Gamepad API)**: Plug in USB or Bluetooth controllers (Xbox, PlayStation, Switch Pro) — hot-plug supported!
  - **Co-op & Friendly Competition**: Individual Rupee counters, revive fallen teammates by standing beside their spirit, optional **Four Swords Chaos** friendly-bonk toggle, and an end-of-run **MVP Awards Scoreboard**.
- **Built-in 16-Bit Web Audio Synthesizer**: Zero external audio files — procedural retro SFX and looping Overworld, Dungeon, and Boss BGM (with one-click BGM/SFX toggles).

## Running on Your Local Machine

Zero dependencies and no build step required! Pick whichever option is easiest:

### Option 1: Open directly in your browser
1. Clone or download this repository.
2. Double-click `index.html` to open it in Chrome, Firefox, Edge, or Safari.

### Option 2: Run with the included Node local server
```bash
npm start
```
Then open `http://localhost:8080` in your browser.

### Option 3: Run with Python
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## Controls

| Action | P1 (Emerald) | P2 (Ruby) | Gamepad (P1–P4) |
| --- | --- | --- | --- |
| Move | `WASD` (or Arrows in Solo) | `Arrow Keys` | Left Stick / D-Pad |
| Sword / Hold for Spin Attack | `J` / `Space` / `Z` | `Numpad 1` / `N` / `.` | `A` or `X` |
| Use Sub-Item | `K` / `X` | `Numpad 2` / `M` / `/` | `B` |
| Pegasus Dash / Roll | `L` / `C` / `Left Shift` | `Numpad 3` / `,` / `Right Shift` | `Y` or `RB` |
| Cycle Sub-Item | `U` / `E` | `Numpad 0` / `;` | `LB` |
| Solo Spirit Clone (Summon / Hold / Dismiss) | `Q` / `Tab` | — | `Back` / `Select` |
| Pause | `Esc` / `P` | `Esc` / `P` | `Start` |
