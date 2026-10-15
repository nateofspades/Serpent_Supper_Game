import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:8080/";
const viewports = [
  [1920, 1080],
  [1366, 768],
  [768, 1024],
  [390, 844],
  [320, 568],
  [844, 390],
  [600, 600],
  [700, 600],
  [800, 700],
  [932, 430],
  [480, 640],
];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
let assertions = 0;
try {
  await mkdir("test-results", { recursive: true });
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width <= 844,
      hasTouch: width <= 844,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${width}x${height}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${width}x${height}: ${message.text()}`);
    });
    await page.goto(base, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => {
      const rect = (selector) => {
        const value = document.querySelector(selector).getBoundingClientRect();
        return { x: value.x, y: value.y, width: value.width, height: value.height, bottom: value.bottom, right: value.right };
      };
      return {
        board: rect("#board"),
        machine: rect(".machine"),
        masthead: rect(".masthead"),
        music: rect("#music"),
        dpad: rect(".dpad"),
        buttons: [...document.querySelectorAll(".dpad button")].map((button) => {
          const value = button.getBoundingClientRect();
          return { width: value.width, height: value.height, bottom: value.bottom, right: value.right };
        }),
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        bodyOverflow: getComputedStyle(document.body).overflow,
        touchAction: getComputedStyle(document.body).touchAction,
      };
    });
    assert.ok(Math.abs(metrics.board.width - metrics.board.height) < 2, `square board at ${width}x${height}`); assertions++;
    assert.ok(metrics.board.width >= (width <= 1024 ? 210 : 280), `board remains practical at ${width}x${height}: ${metrics.board.width}`); assertions++;
    assert.ok(metrics.scrollWidth <= width, `no horizontal overflow at ${width}x${height}`); assertions++;
    assert.ok(metrics.scrollHeight <= height, `no vertical overflow at ${width}x${height}: ${metrics.scrollHeight}`); assertions++;
    assert.equal(metrics.bodyOverflow, "hidden"); assertions++;
    assert.equal(metrics.touchAction, "none"); assertions++;
    assert.ok(metrics.music.bottom <= metrics.masthead.bottom, `Music control stays inside header at ${width}x${height}`); assertions++;
    assert.ok(metrics.machine.y >= metrics.masthead.bottom, `machine stays below header at ${width}x${height}`); assertions++;
    assert.ok(metrics.machine.bottom <= height, `complete machine stays visible at ${width}x${height}`); assertions++;
    for (const button of metrics.buttons) {
      assert.ok(button.width >= 48 && button.height >= 48, `48px thumb target at ${width}x${height}: ${JSON.stringify(button)}`); assertions++;
      assert.ok(button.right <= width && button.bottom <= height, `direction button visible at ${width}x${height}`); assertions++;
    }
    if (width <= 1024 && !(width >= 500 && height <= 780)) {
      assert.ok(metrics.dpad.y >= metrics.machine.bottom, `D-pad follows machine at ${width}x${height}`); assertions++;
      assert.ok(metrics.dpad.y - metrics.machine.bottom <= 18, `D-pad is immediately below machine at ${width}x${height}`); assertions++;
    } else if (width <= 1024) {
      assert.ok(metrics.dpad.x >= metrics.machine.right, `landscape D-pad is adjacent to the machine at ${width}x${height}`); assertions++;
    }
    await page.screenshot({ path: `test-results/layout-${width}x${height}.png` });
    console.log(`PASS layout ${width}x${height}: board ${Math.round(metrics.board.width)}px, d-pad bottom ${Math.round(metrics.dpad.bottom)}px`);
    await context.close();
  }
  assert.deepEqual(errors, []); assertions++;
  console.log(`PASS ${assertions} responsive layout assertions across ${viewports.length} viewports`);
} finally {
  await browser.close();
}
