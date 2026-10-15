import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.BASE_URL || "http://127.0.0.1:8080/";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("test-results", { recursive: true });
  for (const [width, height] of [
    [1366, 768],
    [1440, 900],
    [1280, 720],
    [1024, 600],
    [651, 768],
    [700, 900],
    [650, 900],
    [768, 1024],
    [1920, 1080],
    [390, 844],
    [375, 667],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    const board = await page.locator("#board").boundingBox();
    const machine = await page.locator(".machine").boundingBox();
    assert.ok(
      Math.abs(board.width - board.height) < 2,
      `Square board at ${width}x${height}`,
    );
    assert.ok(
      board.width <= 480,
      `Compact board at ${width}x${height}: ${board.width}px`,
    );
    assert.ok(
      machine.y + machine.height <= height - 6,
      `Entire game fits at 100% zoom on ${width}x${height}: bottom ${machine.y + machine.height}`,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "No horizontal overflow",
    );
    for (const selector of ["#level", "#pause", "#restart"]) {
      const control = await page.locator(selector).boundingBox();
      assert.ok(
        control.x >= machine.x &&
          control.x + control.width <= machine.x + machine.width,
        `${selector} is horizontally inside the machine at ${width}x${height}`,
      );
    }
    const start = await page.locator("#primary").boundingBox();
    assert.ok(
      start.x >= board.x && start.x + start.width <= board.x + board.width,
      `Start button is horizontally inside the board at ${width}x${height}`,
    );
    assert.ok(
      start.y >= board.y && start.y + start.height <= board.y + board.height,
      "Start button is inside the board",
    );
    await page.getByRole("button", { name: "Start Game", exact: true }).click();
    await page.locator("#pause").click();
    const resume = await page.locator("#primary").boundingBox();
    assert.ok(
      resume.x >= board.x && resume.x + resume.width <= board.x + board.width,
      `Resume button is horizontally inside the board at ${width}x${height}`,
    );
    assert.ok(
      resume.y >= board.y && resume.y + resume.height <= board.y + board.height,
      "Resume button is inside the board",
    );
    if (width === 1366)
      await page.screenshot({
        path: "test-results/compact-desktop.png",
        fullPage: true,
      });
    if (width === 390)
      await page.screenshot({
        path: "test-results/compact-mobile.png",
        fullPage: true,
      });
    console.log(
      `PASS layout ${width}x${height}: board ${Math.round(board.width)}px, game bottom ${Math.round(machine.y + machine.height)}px`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
