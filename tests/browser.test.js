import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://127.0.0.1:8080/";
const viewports = [
  [1920, 1080], [1366, 768], [768, 1024], [390, 844], [320, 568], [844, 390],
];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];
let assertions = 0;
const instrumentAudio = () => {
  window.__audio = { contexts: 0, oscillators: [], resumes: 0, suspends: 0 };
  class Param {
    value = 0;
    setValueAtTime(value) { this.value = value; }
    setTargetAtTime(value) { this.value = value; }
    linearRampToValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
  }
  class Node {
    connect() { return this; }
    disconnect() {}
  }
  class TestAudioContext {
    constructor() {
      window.__audio.contexts += 1;
      this.state = "suspended";
      this.destination = new Node();
      this.started = performance.now();
      this.elapsed = 0;
      this.listeners = {};
    }
    get currentTime() { return this.elapsed + (this.state === "running" ? (performance.now() - this.started) / 1000 : 0); }
    createGain() { return Object.assign(new Node(), { gain: new Param() }); }
    createBiquadFilter() { return Object.assign(new Node(), { frequency: new Param(), Q: new Param() }); }
    createOscillator() {
      const oscillator = Object.assign(new Node(), {
        type: "sine", frequency: new Param(), detune: new Param(), start() {}, stop() {},
      });
      window.__audio.oscillators.push(oscillator);
      return oscillator;
    }
    async resume() { if (this.state !== "running") this.started = performance.now(); this.state = "running"; window.__audio.resumes += 1; this.listeners.statechange?.(); }
    async suspend() { if (this.state === "running") this.elapsed = this.currentTime; this.state = "suspended"; window.__audio.suspends += 1; this.listeners.statechange?.(); }
    addEventListener(type, callback) { this.listeners[type] = callback; }
  }
  window.AudioContext = TestAudioContext;
  window.webkitAudioContext = undefined;
};

try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: width <= 844, hasTouch: width <= 844,
    });
    await context.addInitScript(instrumentAudio);
    const page = await context.newPage();
    page.on("pageerror", (error) => failures.push(`${width}x${height} page: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(`${width}x${height} console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => failures.push(`${width}x${height} request: ${request.url()} ${request.failure()?.errorText}`));
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(`${width}x${height} response: ${response.status()} ${response.url()}`);
    });
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => window.__audio.contexts), 0, `no autoplay at ${width}x${height}`); assertions++;
    const start = page.getByRole("button", { name: "Start Game", exact: true });
    if (width <= 844) {
      const box = await start.boundingBox();
      assert.ok(box, `Start Game is visible at ${width}x${height}`);
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    } else await start.click();
    assert.equal(await page.evaluate(() => window.__audio.contexts), 1, `one music context after interaction at ${width}x${height}`); assertions++;
    const state = () => page.evaluate(async () => {
      const { game, music } = await import("./app.js");
      return { status: game.status, direction: game.direction, turns: game.turns, musicPosition: music.position };
    });
    assert.equal((await state()).status, "running"); assertions++;
    await page.evaluate(() => {
      document.querySelector('[data-direction="up"]').click();
      document.querySelector('[data-direction="down"]').click();
    });
    let current = await state();
    assert.ok(
      (current.direction.y === -1 && current.turns.length === 0) ||
        (current.turns.length === 1 && current.turns[0].y === -1),
      `immediate touch reversal rejected at ${width}x${height}: ${JSON.stringify(current)}`,
    ); assertions++;
    assert.ok(current.turns.every((turn) => turn.y !== 1), `opposite turn was not queued at ${width}x${height}`); assertions++;
    await page.getByRole("button", { name: "Restart", exact: true }).click();
    await page.getByRole("button", { name: "Pause", exact: false }).click();
    const pausedAudio = await state();
    await page.waitForTimeout(120);
    assert.equal(await page.evaluate(() => window.__audio.suspends), 1, `game pause suspends music at ${width}x${height}`); assertions++;
    assert.equal((await state()).musicPosition, pausedAudio.musicPosition, `game pause freezes music transport at ${width}x${height}`); assertions++;
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    assert.equal(await page.evaluate(async () => (await import("./app.js")).music.playing), true, `game resume restarts enabled music at ${width}x${height}`); assertions++;
    assert.equal(await page.evaluate(() => window.__audio.contexts), 1, `restart/pause do not duplicate music at ${width}x${height}`); assertions++;
    const boxes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      dpadBottom: document.querySelector(".dpad").getBoundingClientRect().bottom,
    }));
    assert.ok(boxes.scrollWidth <= width && boxes.scrollHeight <= height && boxes.dpadBottom <= height, `layout visible without overflow at ${width}x${height}`); assertions++;
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(instrumentAudio);
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`lifecycle page: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") failures.push(`lifecycle console: ${message.text()}`); });
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem("neon-snake-best", "137"));
  await page.reload();
  assert.equal(await page.locator("#high-score").textContent(), "137"); assertions++;
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  const before = await page.evaluate(async () => (await import("./app.js")).music.position);
  await page.getByRole("button", { name: "Music on", exact: false }).click();
  assert.equal(await page.locator("#music").getAttribute("aria-pressed"), "false"); assertions++;
  await page.waitForTimeout(120);
  const muted = await page.evaluate(async () => (await import("./app.js")).music.position);
  assert.ok(muted >= before, "muted music retains/advances its loop position"); assertions++;
  await page.getByRole("button", { name: "Music off", exact: false }).click();
  assert.equal(await page.evaluate(() => window.__audio.contexts), 1, "unmute reuses the context"); assertions++;
  await page.setViewportSize({ width: 844, height: 390 });
  assert.equal(await page.evaluate(() => window.__audio.contexts), 1, "orientation change does not reset music"); assertions++;
  await page.reload();
  assert.equal(await page.locator("#music").getAttribute("aria-pressed"), "true"); assertions++;
  await page.getByRole("button", { name: "Music on", exact: false }).click();
  await page.reload();
  assert.equal(await page.locator("#music").getAttribute("aria-pressed"), "false"); assertions++;
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__audio.contexts), 0, "disabled preference prevents music startup"); assertions++;
  await page.getByRole("button", { name: "Music off", exact: false }).click();
  assert.equal(await page.evaluate(() => window.__audio.contexts), 1, "enabling after interaction starts music"); assertions++;
  await context.close();

  const restricted = await browser.newContext();
  await restricted.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("blocked", "SecurityError"); } });
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
  });
  const restrictedPage = await restricted.newPage();
  restrictedPage.on("pageerror", (error) => failures.push(`restricted: ${error.message}`));
  await restrictedPage.goto(base);
  await restrictedPage.getByRole("button", { name: "Start Game", exact: true }).click();
  assert.equal(await restrictedPage.evaluate(async () => (await import("./app.js")).game.status), "running"); assertions++;
  await restricted.close();

  assert.deepEqual(failures, []); assertions++;
  console.log(`PASS ${assertions} gameplay, music, touch, storage, network and console assertions across ${viewports.length} viewports`);
} finally {
  await browser.close();
}
