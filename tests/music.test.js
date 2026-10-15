import { describe, expect, it, vi } from "vitest";
import { MusicController, MUSIC_KEY } from "../music.js";

class Param {
  value = 0;
  events = [];
  setValueAtTime(value, time) {
    this.value = value;
    this.events.push(["set", value, time]);
  }
  linearRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push(["linear", value, time]);
  }
  exponentialRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push(["exponential", value, time]);
  }
  setTargetAtTime(value, time, constant) {
    this.value = value;
    this.events.push(["target", value, time, constant]);
  }
}
class Node {
  connect() { return this; }
  disconnect() {}
}
class FakeContext {
  static instances = [];
  constructor() {
    this.state = "suspended";
    this.currentTime = 12.5;
    this.destination = new Node();
    this.oscillators = [];
    this.gains = [];
    this.listeners = new Map();
    FakeContext.instances.push(this);
  }
  createGain() {
    const node = Object.assign(new Node(), { gain: new Param() });
    this.gains.push(node);
    return node;
  }
  createOscillator() {
    const node = Object.assign(new Node(), {
      frequency: new Param(),
      detune: new Param(),
      type: "sine",
      start: vi.fn(),
      stop: vi.fn(),
    });
    this.oscillators.push(node);
    return node;
  }
  createBiquadFilter() {
    return Object.assign(new Node(), { frequency: new Param(), Q: new Param(), type: "lowpass" });
  }
  resume = vi.fn(async () => { this.state = "running"; });
  suspend = vi.fn(async () => { this.state = "suspended"; });
  addEventListener(type, callback) { this.listeners.set(type, callback); }
}
const storage = (initial = {}) => ({
  values: { ...initial },
  getItem(key) { return this.values[key] ?? null; },
  setItem(key, value) { this.values[key] = String(value); },
});
const harness = (initial = {}) => {
  FakeContext.instances = [];
  const store = storage(initial);
  const timers = [];
  const controller = new MusicController({
    AudioContext: FakeContext,
    storage: store,
    getHidden: () => false,
    setTimer: (fn) => (timers.push(fn), timers.length),
    clearTimer: vi.fn(),
  });
  return { controller, store, timers };
};

describe("MusicController", () => {
  it("does not create audio until a user interaction, then creates one looping score", async () => {
    const { controller, timers } = harness();
    expect(FakeContext.instances).toHaveLength(0);
    await controller.activate();
    await controller.activate();
    expect(FakeContext.instances).toHaveLength(1);
    expect(controller.enabled).toBe(true);
    expect(controller.playing).toBe(true);
    expect(timers).toHaveLength(1);
    timers[0]();
    expect(FakeContext.instances[0].oscillators.length).toBeGreaterThan(3);
  });

  it("mutes and unmutes at the current position and persists the preference", async () => {
    const { controller, store } = harness();
    await controller.activate();
    const context = FakeContext.instances[0];
    const position = controller.position;
    await controller.setEnabled(false);
    expect(store.values[MUSIC_KEY]).toBe("false");
    expect(context.suspend).not.toHaveBeenCalled();
    expect(controller.position).toBe(position);
    await controller.setEnabled(true);
    expect(store.values[MUSIC_KEY]).toBe("true");
    expect(FakeContext.instances).toHaveLength(1);
  });

  it("loads a disabled preference without starting on interaction", async () => {
    const { controller } = harness({ [MUSIC_KEY]: "false" });
    expect(controller.enabled).toBe(false);
    await controller.activate();
    expect(FakeContext.instances).toHaveLength(0);
    await controller.toggle();
    expect(FakeContext.instances).toHaveLength(1);
  });

  it("treats enabling with the Music toggle as the activating interaction", async () => {
    const { controller } = harness({ [MUSIC_KEY]: "false" });
    await controller.toggle();
    expect(controller.enabled).toBe(true);
    expect(FakeContext.instances).toHaveLength(1);
    expect(controller.playing).toBe(true);
  });

  it("suspends while hidden, resumes after visibility returns, and replaces a closed context once", async () => {
    let hidden = false;
    FakeContext.instances = [];
    const controller = new MusicController({
      AudioContext: FakeContext,
      storage: storage(),
      getHidden: () => hidden,
      setTimer: () => 1,
      clearTimer: vi.fn(),
    });
    await controller.activate();
    const first = FakeContext.instances[0];
    hidden = true;
    await controller.handleVisibility();
    expect(first.suspend).toHaveBeenCalledTimes(1);
    hidden = false;
    await controller.handleVisibility();
    expect(first.resume).toHaveBeenCalledTimes(2);
    first.state = "closed";
    await controller.handleInterruption();
    expect(FakeContext.instances).toHaveLength(2);
    await controller.handleInterruption();
    expect(FakeContext.instances).toHaveLength(2);
  });

  it("preserves pending notes without duplicating them after visibility returns", async () => {
    let hidden = false;
    const timers = [];
    FakeContext.instances = [];
    const controller = new MusicController({
      AudioContext: FakeContext,
      storage: storage(),
      getHidden: () => hidden,
      setTimer: (fn) => (timers.push(fn), timers.length),
      clearTimer: vi.fn(),
    });
    await controller.activate();
    const context = FakeContext.instances[0];
    context.currentTime = 13.5;
    timers[0]();
    hidden = true;
    await controller.handleVisibility();
    const count = context.oscillators.length;
    hidden = false;
    await controller.handleVisibility();
    expect(context.oscillators.length).toBe(count);
    timers[0]();
    expect(context.oscillators.length).toBe(count);
  });
});
