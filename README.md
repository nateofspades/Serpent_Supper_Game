# Neon Snake — private preparation

[Older live deployment](https://nateofspades.github.io/neon_snake_game/) — the legacy site, not this private branch or an approved new URL.

![Actual Snake gameplay with music and directional controls](assets/gameplay.png)

**Not published or cleared for release.** This is the existing game, not a redraw. Art, engine, music, keyboard/touch controls, no-page-scroll layout and `neon-snake-best` / `neon-snake-music` are preserved. Proposed branding/URL is only in `docs/private-migration.md`. Historical evidence below predates this preparation; current results are `/root/arcade-migration-audit/preparation/snake-*`.

Private verification completed locally: **18 Vitest tests across 3 files, 71 gameplay/music/touch/storage/network/console assertions across six viewports plus the complete mobile-music script, and 772 layout assertions across 20 viewports passed**. Four new actual-started/moved gameplay captures also passed. The separate capture harness advances the real browser RAF for 200 ms, then freezes the browser clock only while encoding screenshots; normal browser/music/layout tests use their existing unmodified timing. The original slow-encoding capture failure remains preserved in the external audit. No engine state, score or positions were injected. The image above was refreshed from the private-worktree capture.

In the shared audit environment all servers/tests must use `flock /root/arcade-migration-audit/preparation/test.lock`. Avoid the original server on port 8080: run `python3 -m http.server 4380 --bind 127.0.0.1` in this worktree, then test with `BASE_URL=http://127.0.0.1:4380 npm run test:all`. Unit-only: `npm test`. Browser suites are executable Node scripts, not Vitest files. No build step exists. Candidate runtime consists only of `index.html`, `styles.css`, `app.js`, `engine.js`, `music.js`, `favicon.svg` and `LICENSE`; exclude tests/evidence/private docs. The original MIT assertions below are not independent chain-of-title clearance.

A responsive, browser-only arcade Snake game built with HTML, CSS, Canvas, and vanilla JavaScript. It has no accounts, tracking, ads, backend, or runtime dependencies.

## Controls

### Desktop

- Select **Start Game**, then steer with the **arrow keys** or **WASD**.
- Press **Space** or select **Pause / Resume** to pause and continue.
- **Restart** begins a new run immediately; **Play Again** starts over after a loss.
- Direct reversals are rejected. Up to two legal turns can be buffered and are applied one per game tick.

### Mobile and touch

- Select **Start Game**, then use the four large directional buttons below the board in portrait or beside it in short landscape view.
- The page and game surface suppress browser scrolling and touch panning while playing.
- The layout keeps the board, controls, Music toggle, and gameplay actions visible at practical phone, tablet, laptop, and desktop viewports.

Each red food pickup adds 10 points and one body segment. The 24 × 24 board starts at a 155 ms tick and accelerates to a 65 ms minimum. The personal best is stored under the original `neon-snake-best` localStorage key so existing scores remain compatible.

## Music

**Neon Circuit** is the original instrumental synthwave/electronic background score composed programmatically for this project. It is synthesized at runtime with the Web Audio API; it contains no samples, recordings, generated audio files, or third-party musical assets. Copyright © 2026 Nathan Burns and licensed under this repository's MIT License.

Music starts only after a user interaction. **Music on / off** is persisted under `neon-snake-music`; muting preserves the loop position. The single music controller is reused across start, restart, menu, game over, resize and orientation changes. Gameplay pause suspends the existing audio context at its current transport position; Resume continues that context without changing the enabled preference. Page visibility and interrupted/closed/unavailable audio are handled without creating simultaneous duplicate tracks. Food, loss, and button sound effects are intentionally absent.

## Run locally

The game itself needs only a static HTTP server because it uses native ES modules:

```sh
python3 -m http.server 4380 --bind 127.0.0.1
```

Open <http://127.0.0.1:4380/>. No build step is required. In this shared audit use the lock-owning verification orchestrator rather than holding a server lock in one terminal while trying to acquire a second test lock.

## Install and test

Automated tests require Node.js 22+ and npm:

```sh
npm ci
npx playwright install chromium
npm test
```

For browser and responsive suites, keep the local server running in another terminal:

```sh
BASE_URL=http://127.0.0.1:4380 npm run test:browser
BASE_URL=http://127.0.0.1:4380 npm run test:layout
# or, after starting the server:
BASE_URL=http://127.0.0.1:4380 npm run test:all
```

On minimal Linux installations, use `npx playwright install --with-deps chromium`. Browser coverage is Chromium and mobile coverage uses browser touch emulation, not physical-device certification. See [TESTING.md](TESTING.md) for the test matrix and current verification details.

Use the dedicated private-worktree base explicitly, never an unrelated original server:

```sh
BASE_URL=http://127.0.0.1:4380 npm run test:browser
BASE_URL=http://127.0.0.1:4380 npm run test:layout
```

## Project files

- `index.html` — accessible game, music, action, and direction controls.
- `styles.css` — viewport-fit responsive design and touch-scroll suppression.
- `engine.js` — deterministic, DOM-independent game rules.
- `app.js` — rendering, input, timing, storage, and UI integration.
- `music.js` — original procedural score and resilient Web Audio lifecycle.
- `tests/*.test.js` — Vitest unit/interface tests and Playwright browser/layout suites.
- `.github/workflows/test.yml` — CI for pushes to `main` and pull requests.

All game references use relative URLs (`./app.js`, `./music.js`, `./styles.css`, and `./favicon.svg`); the README image is `assets/gameplay.png`. A future hosted subpath must be verified after separate authorization. No proposed renamed site is published by this private preparation. `.nojekyll` remains unchanged.

## Browser notes

Canvas 2D, ES modules, CSS Grid, and Web Audio are used where available. If localStorage is blocked, scores and music preferences become session-only. If Web Audio is missing or cannot resume, gameplay remains functional. Scores and preferences are origin-specific and do not sync between devices.

## Technology and credits

The existing [MIT notice](LICENSE) credits **Nathan Burns (2026)**; it is preserved, not replaced with a new general license. The geometric art, engine and **Neon Circuit** implementation remain unchanged. Contributor/chain-of-title and name-use decisions remain separate release gates. Runtime code is native HTML/CSS/ES modules, Canvas and Web Audio with no framework or backend. Vitest, Playwright, jsdom and Prettier are development/test dependencies; do not bundle their installations, tests, browser binaries or private migration documents as runtime content.
