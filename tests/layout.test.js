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
  [480, 720],
  [640, 781],
  [1100, 568],
  [1440, 500],
  [1536, 864], // 1920x1080 at 125% browser zoom
  [1280, 720], // 1920x1080 at 150%
  [960, 540], // 1920x1080 at 200%
  [1200, 675],
  [1201, 651],
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
          return { x: value.x, y: value.y, width: value.width, height: value.height, bottom: value.bottom, right: value.right };
        }),
        interactive: [...document.querySelectorAll("button")]
          .filter((button) => getComputedStyle(button).display !== "none")
          .map((button) => {
            const value = button.getBoundingClientRect();
            return { id: button.id, width: value.width, height: value.height };
          }),
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        bodyOverflow: getComputedStyle(document.body).overflow,
        touchAction: getComputedStyle(document.body).touchAction,
      };
    });
    assert.ok(Math.abs(metrics.board.width - metrics.board.height) < 2, `square board at ${width}x${height}`); assertions++;
    assert.ok(metrics.board.width >= (width <= 1200 ? 210 : 280), `board remains practical at ${width}x${height}: ${metrics.board.width}`); assertions++;
    assert.ok(metrics.scrollWidth <= width, `no horizontal overflow at ${width}x${height}`); assertions++;
    assert.ok(metrics.scrollHeight <= height, `no vertical overflow at ${width}x${height}: ${metrics.scrollHeight}`); assertions++;
    assert.equal(metrics.bodyOverflow, "hidden"); assertions++;
    assert.equal(metrics.touchAction, "none"); assertions++;
    assert.ok(metrics.music.bottom <= metrics.masthead.bottom, `Music control stays inside header at ${width}x${height}`); assertions++;
    assert.ok(metrics.machine.y >= metrics.masthead.bottom, `machine stays below header at ${width}x${height}`); assertions++;
    assert.ok(metrics.machine.bottom <= height, `complete machine stays visible at ${width}x${height}`); assertions++;
    for (const button of metrics.buttons) {
      assert.ok(button.width >= 60 && button.height >= 60, `60px D-pad thumb target at ${width}x${height}: ${JSON.stringify(button)}`); assertions++;
      assert.ok(button.right <= width && button.bottom <= height, `direction button visible at ${width}x${height}`); assertions++;
    }
    const [up, left, right, down] = metrics.buttons;
    assert.ok(down.y > Math.max(left.bottom, right.bottom), `Down starts below Left/Right at ${width}x${height}`); assertions++;
    assert.ok(down.y - left.bottom <= 8, `Down is just below Left/Right at ${width}x${height}`); assertions++;
    assert.ok(Math.abs(down.x - up.x) < 1, `Down stays horizontally centered at ${width}x${height}`); assertions++;
    for (let i = 0; i < metrics.buttons.length; i++) {
      for (let j = i + 1; j < metrics.buttons.length; j++) {
        const a = metrics.buttons[i];
        const b = metrics.buttons[j];
        const overlap = a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        assert.equal(overlap, false, `D-pad buttons do not overlap at ${width}x${height}`); assertions++;
      }
    }
    if (width <= 844) {
      for (const button of metrics.interactive) {
        assert.ok(button.width >= 48 && button.height >= 48, `48px mobile button at ${width}x${height}: ${JSON.stringify(button)}`); assertions++;
      }
    }
    if (width >= 900) {
      const instructions = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar');
        const blocks = [...document.querySelectorAll('.how-to, .instruction, .tip')];
        return {
          sidebar: sidebar.getBoundingClientRect().toJSON(),
          scrollable: ['auto', 'scroll'].includes(getComputedStyle(sidebar).overflowY),
          blocks: blocks.map(el => ({ ...el.getBoundingClientRect().toJSON(), visible: getComputedStyle(el).display !== 'none' })),
        };
      });
      for (const block of instructions.blocks) {
        assert.ok(block.visible && block.width > 0 && block.height > 0, `desktop instructions are shown at ${width}x${height}`); assertions++;
        assert.ok(block.x >= 0 && block.right <= width, `instruction text fits horizontally at ${width}x${height}`); assertions++;
        assert.ok(block.bottom <= height || (instructions.scrollable && instructions.sidebar.bottom <= height), `instructions visible or reachable by sidebar scroll at ${width}x${height}`); assertions++;
      }
    }
    const adjacent =
      (width >= 500 && width <= 1200 && height <= 780) ||
      (width > 1200 && height <= 650);
    if (width <= 1200 && !adjacent) {
      assert.ok(metrics.dpad.y >= metrics.machine.bottom, `D-pad follows machine at ${width}x${height}`); assertions++;
      assert.ok(metrics.dpad.y - metrics.machine.bottom <= 18, `D-pad is immediately below machine at ${width}x${height}`); assertions++;
    } else if (adjacent) {
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
