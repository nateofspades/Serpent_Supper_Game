// Release acceptance: six viewports, trusted input, real native audio.
// Native audio uses real time. Only keyboard mechanics freeze RAF for determinism.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as playwright from 'playwright';
const root = new URL('../', import.meta.url);
const base = process.env.BASE_URL;
assert.ok(base, 'Explicit BASE_URL required; never fall back to original :8080');
const url = new URL(base);
assert.notEqual(url.port, '8080', 'original server is not the prepared worktree');
const live = process.env.LIVE === '1';
if (!live) {
  assert.equal(url.hostname, '127.0.0.1');
  // Compare all runtime bytes BEFORE launching a browser. Correct title alone
  // cannot identify the worktree when original and prepared files match.
  for (const name of ['index.html', 'app.js', 'engine.js', 'music.js', 'styles.css', 'favicon.svg']) {
    const response = await fetch(new URL(name, url));
    assert.equal(response.status, 200, `served ${name}`);
    assert.equal(await response.text(), await readFile(new URL(name, root), 'utf8'), `worktree identity ${name}`);
  }
}
const selected = process.env.TEST_CASE || 'identity';
const engine = process.env.BROWSER || 'chromium';
assert.ok(['chromium', 'firefox', 'webkit'].includes(engine));
assert.ok(['identity','keyboard','layout','state','storage','audio'].includes(selected));
const sizes = [[1920,1080],[1366,768],[768,1024],[390,844],[320,568],[844,390]];
const browser = await playwright[engine].launch({ headless: true });
const problems = [];
const state = (page) => page.evaluate(async () => {
  const { game, music } = await import(new URL('./app.js', location.href).href);
  return { status: game.status, snake: game.snake, food: game.food, score: game.score,
    direction: game.direction, turns: game.turns, size: game.size, enabled: music.enabled,
    position: music.position, audioState: music.context?.state, time: music.context?.currentTime };
});
const until = async (fn, message, timeout=3000) => {
  const start = Date.now();
  while (Date.now()-start < timeout) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 30));
  }
  assert.fail(message);
};
async function geometry(page, width, height) {
  const boxes = await page.evaluate(() => {
    const selectors = ['#board','#music','#restart','#pause', ...['up','left','right','down'].map((d)=>`[data-direction="${d}"]`)];
    if (!document.querySelector('#overlay').hidden) selectors.push('#primary');
    return { boxes: selectors.map((selector) => {
      const node = document.querySelector(selector), r = node.getBoundingClientRect();
      const top = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return {selector,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
        hit: top === node || node.contains(top)};
    }), sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight };
  });
  assert.ok(boxes.sw <= width && boxes.sh <= height, 'no document overflow');
  for (const b of boxes.boxes) {
    assert.ok(b.width>0 && b.height>0 && b.x>=0 && b.y>=0 && b.right<=width+1 && b.bottom<=height+1, JSON.stringify(b));
    // Overlay intentionally covers board in ready/paused/terminal states.
    if (b.selector !== '#board') assert.ok(b.hit, `unobscured ${b.selector}`);
    if (b.selector.includes('data-direction')) assert.ok(b.width>=60 && b.height>=60, 'large D-pad');
    else if (b.selector !== '#board' && width<=844) assert.ok(b.width>=48 && b.height>=48, 'mobile action target');
  }
}
try {
  for (const [width,height] of sizes) {
    const mobile = width<=844;
    const context = await browser.newContext({ viewport:{width,height}, hasTouch:mobile,
      ...(engine !== 'firefox' ? {isMobile:mobile} : {}) });
    try {
      const page = await context.newPage();
      if (selected==='keyboard') {
        await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
        await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
      }
      page.on('pageerror',(e)=>problems.push(e.message));
      page.on('console',(m)=>{if(m.type()==='error') problems.push(m.text());});
      page.on('requestfailed',(r)=>problems.push(`request ${r.url()} ${r.failure()?.errorText}`));
      page.on('response',(r)=>{if(r.status()>=400) problems.push(`${r.status()} ${r.url()}`);});
      // Count forwarded native constructions only; no fake clock/nodes/context.
      if (selected==='audio') await context.addInitScript(() => {
        window.__nativeAudio = window.AudioContext || window.webkitAudioContext;
        window.__nativeContexts=[];
        if(window.__nativeAudio) window.AudioContext = new Proxy(window.__nativeAudio, {
          construct(Target,args) {const real = Reflect.construct(Target,args); window.__nativeContexts.push(real); return real;}
        });
      });
      await page.goto(base, {waitUntil:'networkidle'});
      const activate = async (selector) => mobile ? page.locator(selector).tap() : page.locator(selector).click();
      if (selected==='identity') {
        assert.equal(await page.title(),'Serpent Supper');
        assert.equal(await page.locator('.brand').getAttribute('aria-label'),'Serpent Supper home');
        const wordGap=await page.locator('.brand').evaluate((brand)=>{
          const text=[...brand.childNodes].find((n)=>n.nodeType===Node.TEXT_NODE&&n.textContent.includes('Serpent'));
          const range=document.createRange();range.selectNodeContents(text);
          return brand.lastElementChild.getBoundingClientRect().left-range.getBoundingClientRect().right;
        });
        assert.ok(wordGap>=3,`visible space between approved title words: ${wordGap}px`);
      }
      if (selected==='layout') {
        await geometry(page,width,height);
        await activate('#primary');
        await geometry(page,width,height);
        // Trusted touchscreen input (not element.click or synthetic touchstart).
        for (const d of ['up','left','down','right']) {
          await activate(`[data-direction="${d}"]`);
          await until(async()=>JSON.stringify((await state(page)).direction)===JSON.stringify({up:{x:0,y:-1},left:{x:-1,y:0},down:{x:0,y:1},right:{x:1,y:0}}[d]),`direction ${d}`);
        }
        await activate('#pause');
        const before=await state(page);
        await page.setViewportSize({width:height,height:width});
        await geometry(page,height,width);
        const after=await state(page);
        assert.equal(after.status,'paused');
        assert.deepEqual(after.snake,before.snake);
        assert.equal(after.score,before.score);
        assert.deepEqual(after.food,before.food);
      }
      if (selected==='keyboard') {
        // Expected suspect: global Space handler suppresses native activation.
        await page.locator('#primary').focus();
        await page.keyboard.press('Space');
        await until(async()=>(await state(page)).status==='running','Space on Start activates the button');
        await page.locator('#music').focus();
        const pref=(await state(page)).enabled;
        await page.keyboard.press('Space');
        await until(async()=>(await state(page)).enabled!==pref,'Space on Music toggles preference');
        assert.equal((await state(page)).status,'running','Music Space must not pause game');
        await page.locator('#music').evaluate((n)=>n.blur());
        await page.keyboard.press('Space');
        assert.equal((await state(page)).status,'paused','unfocused gameplay Space pauses');
        await page.keyboard.press('Space');
        assert.equal((await state(page)).status,'running');
        await page.locator('#restart').focus();
        await page.keyboard.press('Space');
        assert.equal((await state(page)).status,'running','focused Restart Space does not pause');
        assert.equal((await state(page)).score,0);
        await page.locator('#pause').focus();
        await page.keyboard.press('Space');
        assert.equal((await state(page)).status,'paused','focused Pause Space activates exactly once');
        await page.keyboard.press('Space');
        assert.equal((await state(page)).status,'running');
        await page.locator('#pause').evaluate((n)=>n.blur());
        await page.locator('#restart').evaluate((n)=>n.blur());
        await page.keyboard.press('Control+Space');
        assert.equal((await state(page)).status,'running','modified Space ignored');
        await page.keyboard.down('Space');
        await page.keyboard.down('Space');
        assert.equal((await state(page)).status,'paused','held Space does not repeat');
        await page.keyboard.up('Space');
        await page.keyboard.press('Space');
        for(const [key,d] of [['ArrowUp',{x:0,y:-1}],['a',{x:-1,y:0}],['S',{x:0,y:1}],['ArrowRight',{x:1,y:0}]]) {
          await page.keyboard.press(key);
          await page.clock.runFor(200);
          await until(async()=>JSON.stringify((await state(page)).direction)===JSON.stringify(d),key);
        }
      }
      if (selected==='state') {
        await activate('#primary');
        const initial=await state(page);
        await until(async()=>(await state(page)).snake[0].x!==initial.snake[0].x,'RAF movement');
        await activate('#pause');
        const paused=await state(page);
        await page.waitForTimeout(350);
        assert.deepEqual((await state(page)).snake,paused.snake);
        await activate('#pause');
        await until(async()=>(await state(page)).status==='over','natural wall collision',5000);
        assert.match(await page.locator('#overlay-title').textContent(),/Game Over/);
        await activate('#primary');
        assert.equal((await state(page)).status,'running');
        // Explicit deterministic fixture, NOT genuine-play screenshot evidence.
        // Real next RAF consumes the fixture and must update HUD/persistence.
        await page.evaluate(async()=>{
          const {game}=await import(new URL('./app.js',location.href).href);
          game.food={x:game.snake[0].x+1,y:game.snake[0].y};
        });
        await until(async()=>(await state(page)).score===10,'food score');
        assert.equal((await state(page)).snake.length,4);
        assert.equal(await page.locator('#score').textContent(),'010');
        assert.equal(await page.evaluate(()=>localStorage.getItem('neon-snake-best')),'10');
        // Small-board terminal fixture, existing Engine public fields only.
        await page.evaluate(async()=>{
          const {game}=await import(new URL('./app.js',location.href).href);
          Object.assign(game,{size:3,snake:[{x:1,y:0},{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:2},{x:2,y:2},{x:2,y:1},{x:1,y:1}],food:{x:2,y:0},direction:{x:1,y:0},turns:[],status:'running'});
        });
        await until(async()=>(await state(page)).status==='won','board-full victory');
        assert.equal(await page.locator('#overlay-title').textContent(),'You filled the board!');
        await page.evaluate(async()=>{
          const {game}=await import(new URL('./app.js',location.href).href);
          Object.assign(game,{size:24,snake:[{x:3,y:3},{x:3,y:4},{x:4,y:4},{x:4,y:3},{x:5,y:3}],food:{x:10,y:10},direction:{x:1,y:0},turns:[],status:'running'});
        });
        await until(async()=>(await state(page)).status==='over','self-collision fixture');
        await activate('#restart');
        const runningBefore=await state(page);
        await page.setViewportSize({width:height,height:width});
        const runningAfter=await state(page);
        assert.equal(runningAfter.status,'running');
        assert.equal(runningAfter.score,runningBefore.score);
        assert.deepEqual(runningAfter.food,runningBefore.food);
        // Reload discards fixture; never imply restart changes configurable size.
        await page.reload();
        assert.equal((await state(page)).size,24);
      }
      if (selected==='storage') {
        await page.evaluate(()=>{localStorage.setItem('neon-snake-best','137');localStorage.setItem('neon-snake-music','false');});
        await page.reload();
        assert.equal(await page.locator('#high-score').textContent(),'137');
        assert.equal((await state(page)).enabled,false);
        await activate('#primary');
        assert.equal((await state(page)).time,undefined,'disabled audio not created');
        await activate('#restart');
        await page.reload();
        assert.equal(await page.locator('#high-score').textContent(),'137');
        for(const value of ['NaN','Infinity','-2','garbage']) {
          await page.evaluate((v)=>localStorage.setItem('neon-snake-best',v),value);
          await page.reload();
          assert.equal(await page.locator('#high-score').textContent(),'000');
        }
        // A route alias serves identical bytes on the SAME origin, no production
        // route edits. This models path compatibility, not real-user migration.
        await page.evaluate(()=>{localStorage.setItem('neon-snake-best','137');localStorage.setItem('neon-snake-music','false');});
        await context.route('**/Serpent_Supper_Game/**',async(route)=>{
          const incoming=new URL(route.request().url());
          const relative=incoming.pathname.split('/Serpent_Supper_Game/')[1] || 'index.html';
          await route.fulfill({response:await context.request.get(new URL(relative,url).href)});
        });
        await page.goto(new URL('/Serpent_Supper_Game/',url).href);
        assert.equal(await page.locator('#high-score').textContent(),'137');
        assert.equal((await state(page)).enabled,false);
        await context.unroute('**/Serpent_Supper_Game/**');
        await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}}));
        await page.goto(base);
        await activate('#primary');
        assert.equal((await state(page)).status,'running','blocked storage fallback');
      }
      if (selected==='audio') {
        assert.equal(await page.evaluate(()=>window.__nativeContexts.length),0,'no eager context');
        await activate('#primary');
        await until(async()=>(await state(page)).audioState==='running','native context running');
        await page.evaluate(async()=>{
          const {music}=await import(new URL('./app.js',location.href).href);
          if(!(music.context instanceof window.__nativeAudio)) throw Error('not native audio');
          window.__savedContext=music.context;window.__savedTimer=music.timer;
          const analyser=music.context.createAnalyser(); analyser.fftSize=2048;
          const silent=music.context.createGain();silent.gain.value=0;
          music.master.connect(analyser);analyser.connect(silent);silent.connect(music.context.destination);
          window.__analyser=analyser;
        });
        const sample=()=>page.evaluate(async()=>{
          const {music}=await import(new URL('./app.js',location.href).href);
          const data=new Float32Array(window.__analyser.fftSize);window.__analyser.getFloatTimeDomainData(data);
          return {time:music.context.currentTime,peak:Math.max(...data.map(Math.abs)),rms:Math.sqrt(data.reduce((s,n)=>s+n*n,0)/data.length),
            same:music.context===window.__savedContext,timer:music.timer===window.__savedTimer,count:window.__nativeContexts.length};
        });
        const samples=[];
        for(let i=0;i<90;i++){samples.push(await sample());await page.waitForTimeout(100);}
        console.log(JSON.stringify({case:selected,engine,width,height,samples}));
        assert.ok(samples.at(-1).time-samples[0].time>8,'real clock crosses a complete loop');
        assert.ok(samples.some((s)=>s.rms>0.001),'native nonzero output signal');
        // This staccato score intentionally rests between short envelopes.
        // Require signal in every complete second, not an invented duty cycle.
        const startTime=samples[0].time;
        const completeSeconds=Math.floor(samples.at(-1).time-startTime);
        for(let second=0;second<completeSeconds;second++) {
          assert.ok(samples.some((s)=>s.time>=startTime+second&&s.time<startTime+second+1&&s.rms>0.001),`signal in second ${second}`);
        }
        assert.ok(samples.every((s)=>Number.isFinite(s.peak)&&s.peak<0.98),'headroom, no measured clipping');
        // Overlapping voices are intentional orchestration. One context/timer
        // and signal bounds reject duplicate transport, not polyphonic music.
        await activate('#music');await page.waitForTimeout(300);
        assert.ok((await sample()).rms<0.0001,'muted master signal');
        await activate('#music');
        await until(async()=>(await sample()).rms>0.001,'unmute signal');
        await activate('#restart');
        await activate('#pause');
        await until(async()=>(await state(page)).audioState==='suspended','pause suspends');
        const paused=await state(page);await page.waitForTimeout(250);
        assert.ok(Math.abs((await state(page)).time-paused.time)<0.01,'paused audio clock frozen');
        await activate('#pause');
        await until(async()=>(await state(page)).audioState==='running','resume running');
        const before=await state(page);
        await page.setViewportSize({width:height,height:width});
        await activate('#restart');
        const after=await state(page);
        const expected=(before.position+after.time-before.time)%8;
        const circular=Math.abs(after.position-expected);
        assert.ok(Math.min(circular,8-circular)<0.1,'resize/restart preserves phase');
        const final=await sample();
        assert.ok(final.same&&final.timer&&final.count===1,'one native context and scheduler across lifecycle');
        console.log(JSON.stringify({case:selected,engine,width,height,samples,final}));
      }
      assert.deepEqual(problems,[],'no page/console/network/asset failures');
      console.log(`PASS ${selected} ${engine} ${width}x${height}`);
    } finally {await context.close();}
  }
} finally {await browser.close();}
