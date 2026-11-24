/**
 * Unified Local Multiplayer Input Manager.
 * Supports 1-Player solo (WASD or Arrows), 2-Player shared keyboard,
 * and up to 4-Player hot-plug Gamepads via the Web Gamepad API.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  class InputManager {
    constructor() {
      this.keys = new Set();
      this.prevKeys = new Set();
      this.prevPadButtons = [[], [], [], []];
      this.playerCount = 1;
      this.connectedPads = [];

      global.addEventListener('keydown', (e) => {
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)
        ) {
          e.preventDefault();
        }
        this.keys.add(e.code);
      });

      global.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
      });

      global.addEventListener('blur', () => {
        this.keys.clear();
      });
    }

    setPlayerCount(count) {
      this.playerCount = Math.max(1, Math.min(4, count));
    }

    isKeyDown(code) {
      return this.keys.has(code);
    }

    isKeyJustPressed(code) {
      return this.keys.has(code) && !this.prevKeys.has(code);
    }

    _anyDown(codes) {
      for (let i = 0; i < codes.length; i++) {
        if (this.keys.has(codes[i])) return true;
      }
      return false;
    }

    _anyJustPressed(codes) {
      for (let i = 0; i < codes.length; i++) {
        if (this.keys.has(codes[i]) && !this.prevKeys.has(codes[i])) return true;
      }
      return false;
    }

    pollGamepads() {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      this.connectedPads = pads;
      return pads;
    }

    getConnectedGamepadCount() {
      return this.pollGamepads().length;
    }

    getPlayerInput(playerIndex) {
      const state = {
        dx: 0,
        dy: 0,
        attackDown: false,
        attackPressed: false,
        itemPressed: false,
        dashPressed: false,
        cyclePressed: false,
        clonePressed: false,
        grabPressed: false,
        interactPressed: false,
      };

      const solo = this.playerCount === 1;

      // Keyboard bindings
      if (playerIndex === 0) {
        if (this._anyDown(solo ? ['KeyW', 'ArrowUp'] : ['KeyW'])) state.dy -= 1;
        if (this._anyDown(solo ? ['KeyS', 'ArrowDown'] : ['KeyS'])) state.dy += 1;
        if (this._anyDown(solo ? ['KeyA', 'ArrowLeft'] : ['KeyA'])) state.dx -= 1;
        if (this._anyDown(solo ? ['KeyD', 'ArrowRight'] : ['KeyD'])) state.dx += 1;

        const atkKeys = ['KeyJ', 'Space', 'KeyZ'];
        const itemKeys = ['KeyK', 'KeyX'];
        const dashKeys = ['KeyL', 'KeyC', 'ShiftLeft'];
        const cycleKeys = ['KeyU', 'KeyE'];
        const cloneKeys = ['KeyQ', 'Tab'];
        const grabKeys = ['KeyF'];

        state.attackDown = this._anyDown(atkKeys);
        state.attackPressed = this._anyJustPressed(atkKeys);
        state.itemPressed = this._anyJustPressed(itemKeys);
        state.dashPressed = this._anyJustPressed(dashKeys);
        state.cyclePressed = this._anyJustPressed(cycleKeys);
        state.clonePressed = this._anyJustPressed(cloneKeys);
        state.grabPressed = this._anyJustPressed(grabKeys);
        state.interactPressed = state.attackPressed || state.grabPressed;
      } else if (playerIndex === 1) {
        if (this._anyDown(['ArrowUp'])) state.dy -= 1;
        if (this._anyDown(['ArrowDown'])) state.dy += 1;
        if (this._anyDown(['ArrowLeft'])) state.dx -= 1;
        if (this._anyDown(['ArrowRight'])) state.dx += 1;

        const atkKeys = ['Numpad1', 'Period', 'KeyN', 'Enter'];
        const itemKeys = ['Numpad2', 'Slash', 'KeyM'];
        const dashKeys = ['Numpad3', 'Comma', 'ShiftRight'];
        const cycleKeys = ['Numpad0', 'Semicolon', 'Quote'];
        const grabKeys = ['Backslash', 'ControlRight', 'NumpadDecimal'];

        state.attackDown = this._anyDown(atkKeys);
        state.attackPressed = this._anyJustPressed(atkKeys);
        state.itemPressed = this._anyJustPressed(itemKeys);
        state.dashPressed = this._anyJustPressed(dashKeys);
        state.cyclePressed = this._anyJustPressed(cycleKeys);
        state.grabPressed = this._anyJustPressed(grabKeys);
        state.interactPressed = state.attackPressed || state.grabPressed;
      }

      // Gamepad support (works seamlessly alongside keyboard for P1-P4!)
      const pads = this.connectedPads;
      const pad = pads[playerIndex];
      if (pad) {
        const deadzone = 0.25;
        const ax = Math.abs(pad.axes[0] || 0) > deadzone ? pad.axes[0] : 0;
        const ay = Math.abs(pad.axes[1] || 0) > deadzone ? pad.axes[1] : 0;
        if (ax !== 0 || ay !== 0) {
          state.dx = ax;
          state.dy = ay;
        }
        // D-pad (standard mapping 12=Up, 13=Down, 14=Left, 15=Right)
        if (pad.buttons[12]?.pressed) state.dy = -1;
        if (pad.buttons[13]?.pressed) state.dy = 1;
        if (pad.buttons[14]?.pressed) state.dx = -1;
        if (pad.buttons[15]?.pressed) state.dx = 1;

        const prev = this.prevPadButtons[playerIndex] || [];
        const down = (idx) => !!pad.buttons[idx]?.pressed;
        const just = (idx) => down(idx) && !prev[idx];

        // A(0)=Sword/Spin, B(1)=Item, X(2)=Grab/Throw, Y(3)/RB(5)=Dash, LB(4)=Cycle, Back(8)=Clone
        if (down(0)) state.attackDown = true;
        if (just(0)) state.attackPressed = true;
        if (just(1)) state.itemPressed = true;
        if (just(2)) state.grabPressed = true;
        if (just(3) || just(5)) state.dashPressed = true;
        if (just(4)) state.cyclePressed = true;
        if (just(8)) state.clonePressed = true;
        if (just(0) || just(2)) state.interactPressed = true;
      }

      // Normalize diagonal movement
      const len = Math.hypot(state.dx, state.dy);
      if (len > 1) {
        state.dx /= len;
        state.dy /= len;
      }

      return state;
    }

    isPausePressed() {
      if (this.isKeyJustPressed('Escape') || this.isKeyJustPressed('KeyP')) return true;
      for (let i = 0; i < this.connectedPads.length; i++) {
        const p = this.connectedPads[i];
        const prev = this.prevPadButtons[i] || [];
        if (p?.buttons[9]?.pressed && !prev[9]) return true;
      }
      return false;
    }

    isMapPressed() {
      if (this.playerCount === 1 && this.isKeyJustPressed('KeyM')) return true;
      if (this.isKeyJustPressed('KeyI') || this.isKeyJustPressed('Backquote')) return true;
      return false;
    }

    endFrame() {
      this.prevKeys = new Set(this.keys);
      const pads = this.connectedPads;
      for (let i = 0; i < 4; i++) {
        const pad = pads[i];
        this.prevPadButtons[i] = pad ? pad.buttons.map((b) => !!b.pressed) : [];
      }
    }
  }

  FB.input = new InputManager();
})(window);
