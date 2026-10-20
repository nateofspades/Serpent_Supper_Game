// Release identity and compatibility regression tests.
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
const read = (name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const html = await read('index.html');
const document = new JSDOM(html).window.document;

describe('Serpent Supper release identity', () => {
  it('uses the exact approved browser title', () => {
    expect(document.title).toBe('Serpent Supper');
  });
  it('exposes the exact approved home name and visible brand', () => {
    const brand = document.querySelector('.brand');
    expect(brand.getAttribute('aria-label')).toBe('Serpent Supper home');
    const visible = brand.cloneNode(true);
    visible.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    expect(visible.textContent.replace(/\s+/g, ' ').trim()).toBe('Serpent Supper');
  });
  it('names the approved title in description without old prominent branding', () => {
    expect(document.querySelector('meta[name="description"]').content).toContain('Serpent Supper');
    expect(`${document.title} ${document.body.textContent}`).not.toMatch(/Neon\s*Snake|Neon\s*Serpent/i);
  });
  it('begins README with exact title and links the case-sensitive release URL', async () => {
    const readme = await read('README.md');
    expect(readme.split('\n')[0]).toBe('# Serpent Supper');
    expect(readme).toContain('](https://nateofspades.github.io/Serpent_Supper_Game/)');
    expect(readme).toContain('assets/gameplay.png');
  });
  it('updates package identity in manifest and lockstep root metadata', async () => {
    const manifest = JSON.parse(await read('package.json'));
    const lock = JSON.parse(await read('package-lock.json'));
    expect(manifest.name).toBe('serpent-supper');
    expect(lock.name).toBe(manifest.name);
    expect(lock.packages[''].name).toBe(manifest.name);
  });
  it('retains compatibility keys and original legal and music notices', async () => {
    expect(await read('app.js')).toContain('"neon-snake-best"');
    expect(await read('music.js')).toContain('"neon-snake-music"');
    expect(await read('music.js')).toContain('Neon Circuit');
    expect(await read('LICENSE')).toContain('Copyright (c) 2026 Nathan Burns');
  });
});
