// Exact deployed-byte check, separate from browser scenarios.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.env.BASE_URL;
assert.ok(base, 'BASE_URL required');
const files=['index.html','app.js','engine.js','music.js','styles.css','favicon.svg','LICENSE','assets/gameplay.png'];
for(const name of files) {
  const response=await fetch(new URL(name,base));
  assert.equal(response.status,200,`${name} HTTP status`);
  const actual=Buffer.from(await response.arrayBuffer());
  const expected=await readFile(new URL(`../${name}`,import.meta.url));
  assert.deepEqual(actual,expected,`${name} deployed bytes match checkout`);
  console.log(JSON.stringify({file:name,status:response.status,sha256:createHash('sha256').update(actual).digest('hex')}));
}
console.log(`PASS ${files.length} exact deployed assets`);
