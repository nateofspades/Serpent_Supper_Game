import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const base = process.env.BASE_URL || "http://127.0.0.1:8080/";
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
try {
  await page.addInitScript(() => {
    Math.random = () => 0; // Keep incidental food outside the keyboard test route.
    window.__tones = [];
    window.__audioContexts = [];
    const NativeAudio = window.AudioContext;
    window.AudioContext = class extends NativeAudio {
      constructor(...args) {
        super(...args);
        window.__audioContexts.push(this);
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        const original = oscillator.frequency.setValueAtTime.bind(
          oscillator.frequency,
        );
        oscillator.frequency.setValueAtTime = (frequency, time) => {
          window.__tones.push(frequency);
          return original(frequency, time);
        };
        return oscillator;
      }
    };
  });
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page.goto(base);
  await page
    .getByRole("button", { name: "Start Game", exact: true })
    .waitFor({ timeout: 5000 });
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  await page.clock.runFor(170);
  const state = () =>
    page.evaluate(async () => {
      const { game } = await import("./app.js");
      return {
        status: game.status,
        head: game.snake[0],
        score: game.score,
        length: game.snake.length,
        direction: game.direction,
      };
    });
  assert.equal((await state()).status, "running");
  assert.equal((await state()).head.x, 13);
  await page.keyboard.press("ArrowUp");
  await page.clock.runFor(160);
  assert.equal((await state()).head.y, 11);
  await page.keyboard.press("Space");
  const paused = await state();
  await page.clock.runFor(500);
  assert.deepEqual(await state(), paused);
  assert.equal(paused.status, "paused");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(160);
  assert.equal((await state()).status, "running");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal((await state()).score, 0);
  console.log(
    "PASS desktop: Start, automatic movement, arrow steering, Space pause, button resume, restart",
  );
  await page.evaluate(async () => {
    const { game } = await import("./app.js");
    game.food = { x: 13, y: 12 };
  });
  await page.clock.runFor(170);
  assert.equal((await state()).score, 10);
  assert.equal((await state()).length, 4);
  assert.equal(await page.locator("#score").textContent(), "010");
  assert.equal(await page.locator("#high-score").textContent(), "010");
  await page.reload();
  assert.equal(await page.locator("#high-score").textContent(), "010");
  await page.locator("#sound").click();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "true",
  );
  await page.reload();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "true",
  );
  console.log(
    "PASS eating, growth, score display, high-score persistence and sound-toggle persistence",
  );
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  for (const [key, expected] of [
    ["w", { x: 0, y: -1 }],
    ["a", { x: -1, y: 0 }],
    ["s", { x: 0, y: 1 }],
    ["d", { x: 1, y: 0 }],
    ["ArrowUp", { x: 0, y: -1 }],
    ["ArrowLeft", { x: -1, y: 0 }],
    ["ArrowDown", { x: 0, y: 1 }],
    ["ArrowRight", { x: 1, y: 0 }],
  ]) {
    await page.keyboard.press(key);
    await page.clock.runFor(170);
    assert.deepEqual((await state()).direction, expected);
  }
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await page.clock.runFor(170);
  assert.deepEqual((await state()).direction, { x: 0, y: -1 });
  await page.clock.runFor(170);
  assert.deepEqual((await state()).direction, { x: -1, y: 0 });
  await page.locator("#pause").click();
  assert.equal((await state()).status, "paused");
  await page.keyboard.press("Space");
  assert.equal((await state()).status, "running");
  await page.evaluate(async () => {
    const { game } = await import("./app.js");
    game.snake = [
      { x: 23, y: 12 },
      { x: 22, y: 12 },
      { x: 21, y: 12 },
    ];
    game.direction = { x: 1, y: 0 };
    game.turns = [];
  });
  await page.clock.runFor(170);
  assert.equal((await state()).status, "over");
  assert.equal(await page.locator("#overlay-title").textContent(), "Game Over");
  assert.match(
    await page.locator("#overlay-message").textContent(),
    /Final score: 0/,
  );
  await page.getByRole("button", { name: "Play Again", exact: true }).click();
  assert.equal((await state()).status, "running");
  await page.evaluate(async () => {
    const { game } = await import("./app.js");
    game.snake = [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ];
  });
  await page.clock.runFor(170);
  assert.equal((await state()).status, "over");
  assert.ok(
    await page.evaluate(() => window.__tones.includes(180)),
    "Loss generates a Web Audio tone",
  );
  await page.getByRole("button", { name: "Play Again", exact: true }).click();
  await page.evaluate(async () => {
    const { game } = await import("./app.js");
    game.food = { x: 13, y: 12 };
  });
  await page.clock.runFor(170);
  assert.ok(
    await page.evaluate(() => window.__tones.includes(520)),
    "Eating generates a Web Audio tone",
  );
  await page.locator("#sound").click();
  const toneCount = await page.evaluate(() => window.__tones.length);
  await page.evaluate(async () => {
    const { game } = await import("./app.js");
    game.food = { x: 14, y: 12 };
  });
  await page.clock.runFor(170);
  assert.equal(await page.evaluate(() => window.__tones.length), toneCount);
  console.log(
    "PASS eating/loss Web Audio generation and mute suppression (not a listening test)",
  );
  console.log(
    "PASS all eight keyboard mappings, rapid queued turns, button pause, Space resume, wall/self collision, final score, Play Again",
  );
  await page.reload();
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const phone = await mobile.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await phone.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await phone.goto(base);
  assert.ok(
    await phone.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const pad = await phone.locator(".dpad").boundingBox();
  assert.ok(
    pad.y + pad.height <= 844,
    `Board and touch controls fit together on a phone: ${JSON.stringify(pad)}`,
  );
  await phone.getByRole("button", { name: "Start Game", exact: true }).tap();
  for (const [name, expected] of [
    ["Move up", { x: 0, y: -1 }],
    ["Move left", { x: -1, y: 0 }],
    ["Move down", { x: 0, y: 1 }],
    ["Move right", { x: 1, y: 0 }],
  ]) {
    await phone.getByRole("button", { name, exact: true }).tap();
    await phone.clock.runFor(170);
    const direction = await phone.evaluate(
      async () => (await import("./app.js")).game.direction,
    );
    assert.deepEqual(direction, expected);
  }
  await phone.reload();
  await phone.screenshot({ path: "test-results/mobile.png", fullPage: true });
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No overflow at ${width}px`,
    );
    const board = await page.locator("#board").boundingBox();
    assert.ok(
      Math.abs(board.width - board.height) < 2,
      `Square board at ${width}px`,
    );
  }
  console.log(
    "PASS touch directional controls and responsive layouts at 320, 375, 390, 768, 1440 pixels",
  );
  const restricted = await browser.newContext();
  await restricted.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
  });
  const restrictedPage = await restricted.newPage();
  restrictedPage.on("pageerror", (error) => errors.push(error.message));
  await restrictedPage.goto(base);
  await restrictedPage
    .getByRole("button", { name: "Start Game", exact: true })
    .click();
  await restrictedPage.locator("#sound").click();
  assert.equal(
    await restrictedPage.evaluate(
      async () => (await import("./app.js")).game.status,
    ),
    "running",
  );
  console.log(
    "PASS playable when localStorage is blocked and Web Audio is unavailable",
  );
  await restricted.close();
  assert.deepEqual(errors, []);
  console.log("PASS no browser JavaScript or console errors");
} finally {
  await browser.close();
}
