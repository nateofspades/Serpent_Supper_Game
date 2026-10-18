// Capture actual started games, never a staged score or forced engine state.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const output=process.env.SCREENSHOT_DIR || 'test-results';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const [width,height] of [[1366,768],[390,844],[320,568],[844,390]]) {
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4380');
  await page.locator('#primary').click();
  assert.equal(await page.locator('#overlay').isVisible(),false);
  assert.equal(await page.locator('#status').innerText(),'In the zone');
  await page.screenshot({path:`${output}/snake-gameplay-${width}x${height}.png`});
  await page.close();
 }
} finally {await browser.close();}
