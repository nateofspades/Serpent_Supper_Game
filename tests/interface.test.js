import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const document = new JSDOM(html).window.document;

describe("game interface", () => {
  it("offers one Music toggle and no Sound or event-SFX interface", () => {
    const music = document.querySelector("#music");
    expect(music).not.toBeNull();
    expect(music.textContent).toMatch(/Music (on|off)/i);
    expect(document.querySelector("#sound")).toBeNull();
    expect(`${html}\n${app}`).not.toMatch(/\btone\s*\(|Sound (on|off)|neon-snake-sound/);
  });

  it("provides four uniquely labelled directional buttons", () => {
    const buttons = [...document.querySelectorAll("button[data-direction]")];
    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.dataset.direction).sort()).toEqual([
      "down", "left", "right", "up",
    ]);
    expect(buttons.every((button) => /^Move (up|down|left|right)$/.test(button.getAttribute("aria-label")))).toBe(true);
  });

  it("declares scroll locking, touch suppression, and comfortable thumb targets", () => {
    expect(css).toMatch(/html[\s\S]*overflow:\s*hidden/);
    expect(css).toMatch(/body[\s\S]*touch-action:\s*none/);
    expect(css).toMatch(/\.dpad button[\s\S]*min-width:\s*48px/);
    expect(css).toMatch(/\.dpad button[\s\S]*min-height:\s*48px/);
  });
});
