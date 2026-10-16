import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});

const instrumentAudio = () => {
  window.__audio = { contexts: 0, resumes: 0, masterValues: [], instances: [] };
  class Param {
    setValueAtTime(value) {
      this.value = value;
    }
    setTargetAtTime(value) {
      this.value = value;
    }
    exponentialRampToValueAtTime(value) {
      this.value = value;
    }
  }
  class Node {
    connect() {
      return this;
    }
  }
  class TestAudioContext {
    constructor() {
      window.__audio.contexts += 1;
      window.__audio.instances.push(this);
      this.state = "suspended";
      this.currentTime = 0;
      this.destination = new Node();
      this.listeners = {};
      this.gainCount = 0;
    }
    createGain() {
      const param = new Param();
      if (this.gainCount++ === 0) {
        const setValueAtTime = param.setValueAtTime.bind(param);
        const setTargetAtTime = param.setTargetAtTime.bind(param);
        param.setValueAtTime = (value, time) => {
          window.__audio.masterValues.push(value);
          setValueAtTime(value, time);
        };
        param.setTargetAtTime = (value, time, constant) => {
          window.__audio.masterValues.push(value);
          setTargetAtTime(value, time, constant);
        };
      }
      return Object.assign(new Node(), { gain: param });
    }
    createOscillator() {
      return Object.assign(new Node(), {
        type: "sine",
        frequency: new Param(),
        detune: new Param(),
        start() {},
        stop() {},
      });
    }
    async resume() {
      this.state = "running";
      window.__audio.resumes += 1;
    }
    async suspend() {
      this.state = "suspended";
    }
    addEventListener(type, callback) {
      this.listeners[type] = callback;
    }
  }
  window.AudioContext = TestAudioContext;
  window.webkitAudioContext = undefined;
};

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(instrumentAudio);
  const page = await context.newPage();
  await page.goto(base);

  assert.equal(
    await page.evaluate(() => window.__audio.contexts),
    0,
    "does not autoplay",
  );
  await page.dispatchEvent("#primary", "touchstart");
  await page.waitForFunction(() => window.__audio.resumes === 1, null, {
    timeout: 1500,
  });
  assert.deepEqual(
    await page.evaluate(() => ({
      contexts: window.__audio.contexts,
      master: window.__audio.masterValues[0],
    })),
    { contexts: 1, master: 0.28 },
    "the first mobile touch creates, resumes, and unmutes one context",
  );

  await page.dispatchEvent("#primary", "click");
  assert.equal(
    await page.evaluate(() => window.__audio.contexts),
    1,
    "the click following a touch does not duplicate the context",
  );
  await context.close();

  const clickContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await clickContext.addInitScript(instrumentAudio);
  const clickPage = await clickContext.newPage();
  await clickPage.goto(base);
  await clickPage.dispatchEvent("#primary", "click");
  await clickPage.waitForFunction(() => window.__audio.resumes === 1);
  assert.equal(
    await clickPage.evaluate(() => window.__audio.contexts),
    1,
    "a click-only mobile path activates music",
  );
  await clickContext.close();

  const toggleContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await toggleContext.addInitScript(instrumentAudio);
  const togglePage = await toggleContext.newPage();
  await togglePage.goto(base);
  await togglePage.evaluate(() =>
    localStorage.setItem("neon-snake-music", "false"),
  );
  await togglePage.reload();
  await togglePage.dispatchEvent("#music", "click");
  await togglePage.waitForFunction(() => window.__audio.resumes === 1);
  assert.deepEqual(
    await togglePage.evaluate(() => ({
      contexts: window.__audio.contexts,
      master: window.__audio.masterValues[0],
      pressed: document.querySelector("#music").getAttribute("aria-pressed"),
    })),
    { contexts: 1, master: 0.28, pressed: "true" },
    "the mobile Music toggle activates and unmutes music",
  );
  await toggleContext.close();

  console.log(
    "PASS mobile touch, click fallback, toggle activation, context reuse, and master volume",
  );
} finally {
  await browser.close();
}
