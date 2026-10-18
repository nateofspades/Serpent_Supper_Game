// Capture actual started/moved games, never staged scores or forced engine state.
// Control only the browser clock: advance the real RAF by 200 ms, then keep
// time frozen during slow screenshot encoding. This is not wall-clock/audio evidence.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const output=process.env.SCREENSHOT_DIR || 'test-results';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const [width,height] of [[1366,768],[390,844],[320,568],[844,390]]) {
  const page=await browser.newPage({viewport:{width,height}});
  await page.clock.install({time:0});
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4380');
  await page.clock.pauseAt(3_600_000);
  await page.locator('#primary').click();
  const headBefore=await page.evaluate(async () => (await import(new URL('./app.js', location.href).href)).game.snake[0].x);
  await page.clock.runFor(200);
  const headAfter=await page.evaluate(async () => (await import(new URL('./app.js', location.href).href)).game.snake[0].x);
  assert.ok(headAfter > headBefore, 'the actual RAF must move the snake before capture');
  assert.equal(await page.locator('#overlay').isVisible(),false);
  assert.equal(await page.locator('#status').innerText(),'In the zone');
  await page.screenshot({path:`${output}/snake-gameplay-${width}x${height}.png`});
  assert.equal(await page.locator('#status').innerText(),'In the zone', 'capture must remain actual active gameplay');
  await page.close();
 }
} finally {await browser.close();}
