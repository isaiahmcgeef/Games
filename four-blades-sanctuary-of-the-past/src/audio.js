/**
 * Procedural 16-bit SNES/GBA-inspired Web Audio Synthesizer.
 * Zero external files required — generates crisp retro SFX and looping BGM.
 */
(function (global) {
  'use strict';

  const FB = (global.FourBlades = global.FourBlades || {});

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.musicEnabled = true;
      this.currentTrack = null;
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.noiseBuffer = null;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return;
      }
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.ctx = new AudioCtx();
        this._buildNoiseBuffer();
      } catch (_) {
        this.ctx = null;
      }
    }

    _buildNoiseBuffer() {
      if (!this.ctx) return;
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * 1.0;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.muted) {
        this.stopMusic();
      } else if (this.currentTrack) {
        const track = this.currentTrack;
        this.currentTrack = null;
        this.playMusic(track);
      }
      return this.muted;
    }

    toggleMusic() {
      this.musicEnabled = !this.musicEnabled;
      if (!this.musicEnabled) {
        this.stopMusic(false);
      } else if (this.currentTrack && !this.muted) {
        const track = this.currentTrack;
        this.currentTrack = null;
        this.playMusic(track);
      }
      return this.musicEnabled;
    }

    _tone(freq, startOffset, duration, type = 'square', volume = 0.08, slideTo = null) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime + startOffset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(30, freq), now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    _noise(startOffset, duration, volume = 0.1, filterFreq = 1200) {
      if (this.muted || !this.ctx || !this.noiseBuffer) return;
      const now = this.ctx.currentTime + startOffset;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now);
      src.stop(now + duration + 0.02);
    }

    play(sfx) {
      this.init();
      if (this.muted || !this.ctx) return;

      switch (sfx) {
        case 'sword':
          this._noise(0, 0.065, 0.09, 2800);
          this._tone(680, 0, 0.06, 'triangle', 0.08, 260);
          break;
        case 'sword2':
          this._noise(0, 0.065, 0.09, 3200);
          this._tone(820, 0, 0.06, 'triangle', 0.085, 340);
          break;
        case 'sword3':
          this._noise(0, 0.09, 0.11, 2400);
          this._tone(960, 0, 0.08, 'square', 0.065, 420);
          this._tone(520, 0.02, 0.08, 'triangle', 0.07, 1080);
          break;
        case 'clash':
          this._tone(1680, 0, 0.055, 'square', 0.075, 2350);
          this._tone(1120, 0.015, 0.08, 'triangle', 0.07, 1500);
          this._noise(0, 0.05, 0.09, 3600);
          break;
        case 'parry':
          this._tone(1320, 0, 0.06, 'square', 0.085, 1980);
          this._tone(1980, 0.03, 0.18, 'sine', 0.1, 2640);
          this._tone(990, 0.02, 0.16, 'triangle', 0.085, 1480);
          this._noise(0, 0.07, 0.11, 4200);
          break;
        case 'spin':
          this._noise(0, 0.22, 0.12, 2200);
          this._tone(520, 0, 0.1, 'square', 0.07, 880);
          this._tone(720, 0.09, 0.15, 'square', 0.08, 360);
          break;
        case 'charge':
          this._tone(660, 0, 0.07, 'sine', 0.06, 990);
          this._tone(990, 0.06, 0.09, 'triangle', 0.07, 1320);
          break;
        case 'bush':
          this._noise(0, 0.11, 0.1, 1600);
          this._tone(240, 0, 0.07, 'triangle', 0.05, 110);
          break;
        case 'pot':
          this._noise(0, 0.16, 0.14, 1900);
          this._tone(340, 0, 0.06, 'square', 0.07, 150);
          this._tone(520, 0.04, 0.08, 'triangle', 0.06, 190);
          break;
        case 'hit':
          this._tone(210, 0, 0.08, 'sawtooth', 0.11, 80);
          this._noise(0, 0.07, 0.09, 1000);
          break;
        case 'enemyDie':
          this._tone(340, 0, 0.07, 'square', 0.08, 170);
          this._tone(260, 0.06, 0.08, 'square', 0.08, 110);
          this._noise(0.05, 0.14, 0.09, 1400);
          break;
        case 'hurt':
          this._tone(320, 0, 0.07, 'sawtooth', 0.11, 140);
          this._tone(200, 0.07, 0.12, 'sawtooth', 0.1, 90);
          break;
        case 'dash':
          this._noise(0, 0.11, 0.07, 900);
          this._tone(280, 0, 0.1, 'triangle', 0.05, 480);
          break;
        case 'rupee':
          this._tone(987.77, 0, 0.06, 'square', 0.07);
          this._tone(1318.5, 0.055, 0.12, 'square', 0.07);
          break;
        case 'bigRupee':
          this._tone(784, 0, 0.06, 'square', 0.07);
          this._tone(1046.5, 0.05, 0.06, 'square', 0.07);
          this._tone(1568, 0.1, 0.18, 'square', 0.08);
          break;
        case 'heart':
          this._tone(659.25, 0, 0.07, 'triangle', 0.09);
          this._tone(880, 0.06, 0.12, 'triangle', 0.09);
          break;
        case 'fairy':
          [659, 784, 988, 1318, 1568].forEach((f, idx) => {
            this._tone(f, idx * 0.055, 0.14, 'sine', 0.08);
          });
          break;
        case 'key':
          this._tone(1174.6, 0, 0.06, 'triangle', 0.08);
          this._tone(1567.9, 0.06, 0.06, 'triangle', 0.08);
          this._tone(2093, 0.12, 0.16, 'triangle', 0.08);
          break;
        case 'chest':
          // Iconic ascending chest fanfare
          [392, 440, 494, 523, 587, 659, 784, 1046.5].forEach((f, i) => {
            this._tone(f, i * 0.065, i === 7 ? 0.42 : 0.08, 'square', 0.07);
            this._tone(f * 0.5, i * 0.065, i === 7 ? 0.42 : 0.08, 'triangle', 0.06);
          });
          break;
        case 'secret':
          // Classic Zelda-style secret discovery chime
          [784, 740, 622, 440, 415, 659, 830, 1046.5].forEach((f, i) => {
            this._tone(f, i * 0.075, i === 7 ? 0.34 : 0.085, 'square', 0.07);
          });
          break;
        case 'switch':
          this._tone(440, 0, 0.05, 'square', 0.07);
          this._tone(660, 0.05, 0.09, 'square', 0.07);
          break;
        case 'door':
          this._noise(0, 0.25, 0.12, 420);
          this._tone(130, 0, 0.22, 'sawtooth', 0.07, 85);
          break;
        case 'bombPlace':
          this._tone(240, 0, 0.06, 'triangle', 0.07, 180);
          break;
        case 'bombBoom':
          this._noise(0, 0.38, 0.22, 320);
          this._tone(120, 0, 0.32, 'sawtooth', 0.14, 38);
          break;
        case 'boomerang':
          this._tone(520, 0, 0.08, 'triangle', 0.06, 740);
          break;
        case 'arrow':
          this._tone(880, 0, 0.07, 'triangle', 0.07, 340);
          this._noise(0, 0.05, 0.05, 3200);
          break;
        case 'fire':
          this._noise(0, 0.18, 0.11, 1100);
          this._tone(310, 0, 0.15, 'sawtooth', 0.07, 170);
          break;
        case 'clink':
          this._tone(1600, 0, 0.05, 'square', 0.06, 2200);
          break;
        case 'bossRoar':
          this._tone(180, 0, 0.35, 'sawtooth', 0.12, 65);
          this._noise(0, 0.35, 0.14, 520);
          break;
        case 'victory':
          [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => {
            const t = i < 4 ? i * 0.12 : 0.48 + (i - 4) * 0.16;
            const d = i === 6 ? 0.55 : 0.13;
            this._tone(f, t, d, 'square', 0.075);
            this._tone(f * 0.5, t, d, 'triangle', 0.07);
          });
          break;
        case 'revive':
          [523, 659, 784, 1046].forEach((f, i) => {
            this._tone(f, i * 0.06, 0.14, 'triangle', 0.08);
          });
          break;
        case 'lift':
          this._tone(240, 0, 0.07, 'triangle', 0.08, 460);
          break;
        case 'throw':
          this._noise(0, 0.08, 0.08, 1900);
          this._tone(480, 0, 0.08, 'triangle', 0.07, 220);
          break;
        case 'hurricane':
          this._noise(0, 0.36, 0.16, 1800);
          [440, 554, 659, 880, 1108].forEach((f, i) => {
            this._tone(f, i * 0.04, 0.16, 'square', 0.065);
          });
          break;
        case 'beam':
          this._tone(1180, 0, 0.09, 'square', 0.065, 1760);
          this._tone(880, 0.03, 0.1, 'triangle', 0.07, 1320);
          break;
        case 'reflect':
          this._tone(1560, 0, 0.07, 'sine', 0.09, 2340);
          this._tone(1170, 0.02, 0.09, 'triangle', 0.08, 1760);
          break;
        case 'buy':
          [659, 880, 1318].forEach((f, i) => {
            this._tone(f, i * 0.055, 0.12, 'square', 0.07);
          });
          break;
        case 'potion':
          [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
            this._tone(f, i * 0.05, 0.14, 'sine', 0.085);
          });
          break;
        case 'hookshot':
          this._noise(0, 0.1, 0.08, 3400);
          this._tone(720, 0, 0.06, 'square', 0.065, 1180);
          this._tone(960, 0.05, 0.06, 'square', 0.06, 620);
          break;
        case 'mirror':
          [587, 740, 880, 1175, 1480, 1760].forEach((f, i) => {
            this._tone(f, i * 0.045, 0.22, 'sine', 0.075);
          });
          break;
        case 'laser':
          this._tone(1480, 0, 0.14, 'sawtooth', 0.08, 420);
          this._noise(0, 0.12, 0.09, 3200);
          break;
        case 'heartPiece':
          [523, 659, 784, 1046.5, 1318.5].forEach((f, i) => {
            this._tone(f, i * 0.075, i === 4 ? 0.36 : 0.09, 'triangle', 0.085);
            this._tone(f * 0.5, i * 0.075, i === 4 ? 0.36 : 0.09, 'sine', 0.06);
          });
          break;
      }
    }

    playMusic(trackName) {
      if (this.currentTrack === trackName && this.bgmTimer) return;
      this.stopMusic(false);
      this.currentTrack = trackName;
      if (this.muted || !this.musicEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Original heroic 16-bit style compositions (MIDI note numbers)
      const tracks = {
        overworld: {
          tempoMs: 175,
          lead: [
            69, 0, 69, 72, 74, 0, 76, 0, 74, 72, 69, 0, 64, 0, 67, 0,
            69, 0, 72, 76, 79, 0, 76, 74, 72, 0, 74, 72, 69, 0, 0, 0,
            76, 0, 76, 79, 81, 0, 79, 76, 74, 0, 76, 74, 72, 0, 69, 0,
            72, 74, 76, 0, 74, 72, 69, 67, 69, 0, 0, 0, 64, 0, 67, 0,
          ],
          bass: [
            45, 0, 52, 0, 45, 0, 52, 0, 48, 0, 55, 0, 43, 0, 50, 0,
            45, 0, 52, 0, 48, 0, 55, 0, 50, 0, 55, 0, 45, 0, 52, 0,
            48, 0, 55, 0, 53, 0, 57, 0, 50, 0, 57, 0, 45, 0, 52, 0,
            48, 0, 55, 0, 43, 0, 50, 0, 45, 0, 52, 0, 45, 0, 43, 0,
          ],
        },
        darkworld: {
          tempoMs: 162,
          lead: [
            62, 0, 65, 69, 70, 0, 69, 65, 67, 0, 65, 62, 61, 0, 64, 0,
            62, 0, 69, 70, 74, 0, 72, 70, 69, 0, 67, 65, 69, 0, 0, 0,
          ],
          bass: [
            38, 38, 45, 0, 46, 0, 45, 0, 43, 43, 50, 0, 45, 0, 49, 0,
            38, 38, 45, 0, 46, 0, 50, 0, 45, 45, 43, 0, 38, 0, 45, 0,
          ],
        },
        dungeon: {
          tempoMs: 220,
          wave: 'triangle',
          lead: [
            64, 0, 67, 0, 69, 0, 67, 64, 62, 0, 64, 0, 67, 0, 0, 0,
            64, 0, 67, 0, 71, 0, 72, 71, 69, 0, 67, 0, 64, 0, 0, 0,
            71, 0, 72, 0, 74, 0, 72, 71, 69, 0, 67, 0, 66, 0, 64, 0,
            62, 0, 64, 67, 66, 0, 62, 0, 64, 0, 0, 0, 59, 0, 0, 0,
          ],
          bass: [
            40, 0, 47, 0, 40, 0, 47, 0, 38, 0, 45, 0, 40, 0, 47, 0,
            40, 0, 47, 0, 43, 0, 50, 0, 45, 0, 47, 0, 40, 0, 47, 0,
            43, 0, 50, 0, 45, 0, 52, 0, 43, 0, 47, 0, 42, 0, 47, 0,
            38, 0, 45, 0, 42, 0, 47, 0, 40, 0, 47, 0, 40, 0, 38, 0,
          ],
        },
        frost: {
          // Crystalline shimmering icy arpeggio theme for Frost Spire!
          tempoMs: 188,
          wave: 'sine',
          lead: [
            76, 79, 83, 88, 83, 79, 76, 0, 74, 78, 81, 86, 81, 78, 74, 0,
            72, 76, 79, 84, 83, 79, 76, 74, 71, 74, 78, 83, 78, 0, 0, 0,
          ],
          bass: [
            52, 0, 0, 47, 52, 0, 47, 0, 50, 0, 0, 45, 50, 0, 45, 0,
            48, 0, 0, 43, 48, 0, 43, 0, 47, 0, 50, 0, 47, 0, 43, 0,
          ],
        },
        shop: {
          // Cozy bouncy sanctuary merchant melody!
          tempoMs: 185,
          wave: 'triangle',
          lead: [
            72, 0, 76, 79, 81, 0, 79, 76, 74, 0, 77, 79, 76, 0, 72, 0,
            72, 0, 76, 79, 84, 0, 81, 79, 77, 76, 74, 71, 72, 0, 0, 0,
          ],
          bass: [
            48, 0, 55, 0, 53, 0, 57, 0, 50, 0, 55, 0, 48, 0, 55, 0,
            48, 0, 55, 0, 53, 0, 57, 0, 50, 0, 55, 0, 48, 0, 52, 0,
          ],
        },
        village: {
          // Warm pastoral Kakariko-inspired village melody!
          tempoMs: 210,
          wave: 'triangle',
          lead: [
            67, 0, 71, 74, 76, 0, 74, 71, 72, 0, 71, 67, 69, 0, 0, 0,
            67, 0, 71, 74, 79, 0, 76, 74, 72, 74, 71, 69, 67, 0, 0, 0,
          ],
          bass: [
            43, 0, 50, 0, 47, 0, 50, 0, 48, 0, 55, 0, 45, 0, 50, 0,
            43, 0, 50, 0, 48, 0, 55, 0, 50, 0, 45, 0, 43, 0, 50, 0,
          ],
        },
        desert: {
          // Mystical Phrygian desert caravan & Sunspire theme!
          tempoMs: 170,
          wave: 'square',
          lead: [
            64, 0, 65, 68, 69, 0, 68, 65, 64, 0, 65, 64, 62, 0, 64, 0,
            64, 0, 68, 69, 71, 0, 69, 68, 65, 68, 65, 64, 64, 0, 0, 0,
          ],
          bass: [
            40, 0, 47, 0, 41, 0, 48, 0, 40, 0, 47, 0, 38, 0, 45, 0,
            40, 0, 47, 0, 41, 0, 48, 0, 45, 0, 41, 0, 40, 0, 47, 0,
          ],
        },
        mountain: {
          // Driving heroic Death-Peak & Magma Citadel ascent theme!
          tempoMs: 152,
          wave: 'square',
          lead: [
            62, 62, 65, 69, 74, 0, 72, 69, 70, 0, 69, 65, 67, 0, 64, 0,
            62, 62, 69, 72, 74, 77, 76, 74, 72, 70, 69, 67, 69, 0, 0, 0,
          ],
          bass: [
            38, 38, 45, 38, 46, 46, 45, 45, 43, 43, 50, 43, 45, 45, 49, 45,
            38, 38, 45, 38, 46, 46, 50, 46, 45, 43, 41, 40, 38, 0, 45, 0,
          ],
        },
        boss: {
          tempoMs: 130,
          lead: [
            69, 69, 72, 69, 74, 69, 75, 74, 72, 69, 67, 69, 72, 74, 72, 69,
            76, 76, 79, 76, 81, 79, 76, 74, 72, 74, 76, 74, 72, 69, 67, 64,
          ],
          bass: [
            45, 45, 45, 52, 45, 45, 48, 50, 45, 45, 43, 45, 48, 48, 50, 47,
            48, 48, 48, 55, 53, 53, 52, 50, 48, 48, 50, 50, 45, 45, 43, 40,
          ],
        },
      };

      const data = tracks[trackName];
      if (!data) return;

      this.bgmStep = 0;
      const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

      this.bgmTimer = setInterval(() => {
        if (this.muted || !this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
        const idx = this.bgmStep % data.lead.length;
        const lNote = data.lead[idx];
        const bNote = data.bass[idx];
        const dur = (data.tempoMs / 1000) * 0.85;
        if (lNote > 0) {
          this._tone(midiToFreq(lNote), 0, dur, data.wave || 'square', 0.028);
        }
        if (bNote > 0) {
          this._tone(midiToFreq(bNote), 0, dur * 1.1, 'triangle', 0.036);
        }
        this.bgmStep++;
      }, data.tempoMs);
    }

    stopMusic(clearTrack = true) {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
      if (clearTrack) {
        this.currentTrack = null;
      }
    }
  }

  FB.audio = new SoundEngine();
})(window);
