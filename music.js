// "Neon Circuit" — an original procedural score composed for Neon Snake.
// Copyright (c) 2026 Nathan Burns. Released with this project under the MIT License.
export const MUSIC_KEY = "neon-snake-music";
const LOOP_SECONDS = 8;
const STEP = 0.25;
const BASS = [55, 55, 65.41, 55, 73.42, 65.41, 49, 49];
const LEAD = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 493.88, 392];

export class MusicController {
  constructor({
    AudioContext,
    storage,
    getHidden = () => false,
    setTimer = (fn) => setInterval(fn, 100),
    clearTimer = (id) => clearInterval(id),
  } = {}) {
    this.AudioContext = AudioContext;
    this.storage = storage;
    this.getHidden = getHidden;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.enabled = this.#readPreference();
    this.context = null;
    this.master = null;
    this.timer = null;
    this.activated = false;
    this.nextStep = 0;
    this.offset = 0;
    this.timelineOrigin = 0;
    this.scheduleOrigin = 0;
  }

  #readPreference() {
    try {
      return this.storage?.getItem(MUSIC_KEY) !== "false";
    } catch {
      return true;
    }
  }

  #persist() {
    try {
      this.storage?.setItem(MUSIC_KEY, String(this.enabled));
    } catch {
      // Storage is optional; music still works for the current page.
    }
  }

  get playing() {
    return Boolean(this.context && this.context.state === "running" && this.enabled);
  }

  get position() {
    if (!this.context) return this.offset;
    return (
      this.offset + Math.max(0, this.context.currentTime - this.timelineOrigin)
    ) % LOOP_SECONDS;
  }

  async activate() {
    this.activated = true;
    if (!this.enabled || this.getHidden()) return;
    await this.#ensureContext();
  }

  async toggle() {
    // The toggle itself is a trusted user gesture and can unlock Web Audio.
    this.activated = true;
    return this.setEnabled(!this.enabled);
  }

  async setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.#persist();
    if (this.master && this.context?.state !== "closed") {
      const now = this.context.currentTime;
      this.master.gain.setTargetAtTime(this.enabled ? 0.14 : 0, now, 0.025);
    }
    if (this.enabled && this.activated && !this.getHidden()) await this.#ensureContext();
    return this.enabled;
  }

  async handleVisibility() {
    if (!this.context || this.context.state === "closed") {
      if (!this.getHidden() && this.enabled && this.activated) await this.#ensureContext();
      return;
    }
    if (this.getHidden()) {
      this.offset = this.position;
      this.timelineOrigin = this.context.currentTime;
      if (this.context.state === "running") await this.context.suspend().catch(() => {});
    } else if (this.enabled && this.activated) {
      await this.context.resume().catch(() => {});
    }
  }

  async handleInterruption() {
    if (!this.enabled || !this.activated || this.getHidden()) return;
    await this.#ensureContext();
  }

  async #ensureContext() {
    if (!this.AudioContext) return;
    if (this.context?.state === "closed") {
      this.offset = this.position;
      this.context = null;
      this.master = null;
      if (this.timer) this.clearTimer(this.timer);
      this.timer = null;
    }
    if (!this.context) {
      try {
        this.context = new this.AudioContext();
        this.master = this.context.createGain();
        this.master.gain.setValueAtTime(this.enabled ? 0.14 : 0, this.context.currentTime);
        this.master.connect(this.context.destination);
        this.timelineOrigin = this.context.currentTime;
        this.#resetSchedule();
        this.context.addEventListener?.("statechange", () => {
          if (this.context?.state === "interrupted") this.context.resume().catch(() => {});
        });
        this.timer = this.setTimer(() => this.#schedule());
      } catch {
        this.context = null;
        this.master = null;
        return;
      }
    }
    if (this.context.state === "suspended" || this.context.state === "interrupted") {
      await this.context.resume().catch(() => {});
    }
    this.#schedule();
  }

  #resetSchedule() {
    if (!this.context) return;
    this.nextStep = Math.floor(this.offset / STEP);
    this.scheduleOrigin = this.context.currentTime - this.offset;
  }

  #note(frequency, when, duration, type, volume, detune = 0) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.detune?.setValueAtTime(detune, when);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
  }

  #schedule() {
    if (!this.context || this.context.state === "closed") return;
    const nextTime = this.scheduleOrigin + this.nextStep * STEP;
    if (nextTime < this.context.currentTime) {
      const skipped = Math.ceil((this.context.currentTime - nextTime) / STEP);
      const absoluteStep = this.nextStep + skipped;
      this.scheduleOrigin += Math.floor(absoluteStep / 32) * LOOP_SECONDS;
      this.nextStep = absoluteStep % 32;
    }
    const horizon = this.context.currentTime + 0.6;
    while (this.scheduleOrigin + this.nextStep * STEP < horizon) {
      const index = this.nextStep % 32;
      const when = this.scheduleOrigin + this.nextStep * STEP;
      if (index % 2 === 0) {
        const bass = BASS[Math.floor(index / 4) % BASS.length];
        this.#note(bass, when, 0.31, "sawtooth", 0.11);
        this.#note(bass * 2, when, 0.22, "square", 0.025, -7);
      }
      if (index % 4 === 2) {
        const lead = LEAD[Math.floor(index / 4) % LEAD.length];
        this.#note(lead, when, 0.18, "square", 0.035);
        this.#note(lead * 1.005, when, 0.18, "sawtooth", 0.018);
      }
      // A low sine pulse supplies the four-on-the-floor electronic kick.
      if (index % 2 === 0) this.#note(48, when, 0.12, "sine", 0.16);
      this.nextStep += 1;
      if (this.nextStep >= 32) {
        this.nextStep = 0;
        this.scheduleOrigin += LOOP_SECONDS;
      }
    }
  }
}
