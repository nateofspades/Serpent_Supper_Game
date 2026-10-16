# Neon Snake

**Play now:** https://github.com/nateofspades/neon_snake_game

A responsive, browser-only arcade Snake game built with HTML, CSS, Canvas, and vanilla JavaScript. It has no accounts, tracking, ads, backend, or runtime dependencies.

![Neon Snake active gameplay with the synthwave music control and directional pad](assets/gameplay.png)

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

Music starts only after a user interaction. **Music on / off** is persisted under `neon-snake-music`; muting preserves the loop position. The single music controller continues independently of game start, pause, restart, menu, game over, resize, and orientation changes, and handles page visibility, interrupted audio, unavailable Web Audio, and closed contexts without creating simultaneous duplicate tracks. Food, loss, and button sound effects are intentionally absent.

## Run locally

The game itself needs only a static HTTP server because it uses native ES modules:

```sh
python3 -m http.server 8080
```

Open <http://localhost:8080/>. No build step is required.

## Install and test

Automated tests require Node.js 22+ and npm:

```sh
npm ci
npx playwright install chromium
npm test
```

For browser and responsive suites, keep the local server running in another terminal:

```sh
npm run test:browser
npm run test:layout
# or, after starting the server:
npm run test:all
```

On minimal Linux installations, use `npx playwright install --with-deps chromium`. Browser coverage is Chromium and mobile coverage uses browser touch emulation, not physical-device certification. See [TESTING.md](TESTING.md) for the test matrix and current verification details.

To exercise a deployment instead of localhost:

```sh
BASE_URL=https://nateofspades.github.io/neon_snake/ npm run test:browser
BASE_URL=https://nateofspades.github.io/neon_snake/ npm run test:layout
```

## Project files

- `index.html` — accessible game, music, action, and direction controls.
- `styles.css` — viewport-fit responsive design and touch-scroll suppression.
- `engine.js` — deterministic, DOM-independent game rules.
- `app.js` — rendering, input, timing, storage, and UI integration.
- `music.js` — original procedural score and resilient Web Audio lifecycle.
- `tests/*.test.js` — Vitest unit/interface tests and Playwright browser/layout suites.
- `.github/workflows/test.yml` — CI for pushes to `main` and pull requests.

All production references use relative URLs (`./app.js`, `./music.js`, `./styles.css`, `./favicon.svg`, and `assets/gameplay.png`), so the site works from the GitHub Pages repository subpath `/neon_snake/`. `.nojekyll` keeps Pages serving the static files directly.

## Browser notes

Canvas 2D, ES modules, CSS Grid, and Web Audio are used where available. If localStorage is blocked, scores and music preferences become session-only. If Web Audio is missing or cannot resume, gameplay remains functional. Scores and preferences are origin-specific and do not sync between devices.
