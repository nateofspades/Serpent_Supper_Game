# Neon Snake

A browser-only arcade Snake game built with HTML, CSS, and vanilla JavaScript. No frameworks, runtime dependencies, accounts, tracking, API keys, database, or backend.

## Play

- Select **Start Game** to begin.
- Steer with **arrow keys**, **WASD**, or the on-screen directional pad.
- Eat red food to gain **10 points**, grow by one cell, and increase speed.
- Avoid walls and your own body. Moving into the tail's departing cell is legal.
- Use **Space** or **Pause / Resume** to pause and continue.
- **Restart** immediately begins a fresh run. **Play Again** starts over after a loss.
- Toggle **Sound** to enable or disable synthesized eating and losing effects.
- Personal best and sound preference are saved in localStorage on the current browser and origin.

The 24 × 24 board advances every 155 ms initially, decreasing by 4 ms per meal to a 65 ms minimum. The level indicator increases every five meals. Filling the whole board wins the game. Up to two turns can be buffered, with one consumed per tick; direct reversals are rejected against the last buffered direction.

## Run locally

From this directory, with Python 3 installed:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080/. No npm install or build is needed to play. Use HTTP rather than opening index.html directly because the JavaScript uses native ES modules. This is only a static file server, not an application backend.

## Files

- `index.html`: accessible controls, game board, and help.
- `styles.css`: responsive arcade design, keyboard focus, and reduced-motion handling.
- `engine.js`: deterministic, DOM-independent rules and state transitions.
- `app.js`: canvas rendering, input, timing, optional storage, and Web Audio.
- `favicon.svg`: local icon; no external fonts or image requests.
- `tests/engine.test.js`: rule and state regression tests.
- `tests/browser.test.js`: desktop/touch Chromium integration tests and screenshots.

The exported `game` instance in `app.js` supports deterministic browser integration tests without a global test hook. Rendering runs via requestAnimationFrame; the grid advances at its current fixed step. Delayed frames do not trigger a burst of catch-up moves.

## Tests (development only)

Node.js 22+ and npm are needed for automated tests, not for the game itself:

```sh
npm ci
npm test
npx playwright install chromium
# Start the static server in a separate terminal, then:
npm run test:browser
```

On a minimal Linux machine Playwright may require OS libraries: `npx playwright install --with-deps chromium`.

Screenshots are generated in `test-results/` (git-ignored). The browser suite uses a paused virtual clock and deliberate state setups to test rare collisions and food pickups reliably. It exercises real DOM events, native canvas rendering, localStorage, and Web Audio. Mobile testing is touch emulation, not physical-device certification. Sound generation is instrumented, not a subjective listening test.

To run the same browser suite against a deployment:

```sh
BASE_URL=https://nateofspades.github.io/Snakes_Game/ npm run test:browser
```

## GitHub Pages

All production asset URLs are relative, so the game supports a GitHub Pages repository subpath. No build step is needed. Configure **Settings → Pages → Deploy from a branch → main → / (root)** after pushing the files. `.nojekyll` disables unnecessary Jekyll processing.

Intended repository: https://github.com/nateofspades/Snakes_Game

Intended website: https://nateofspades.github.io/Snakes_Game/

These are intended targets, not a claim of deployment. At initial handoff, publishing was blocked because an existing private, empty repository already used this name and the request explicitly prohibited modifying existing repositories. Remote changes require owner authorization.

## Browser notes

A modern browser with Canvas 2D, ES modules, and CSS grid is required. Sound starts disabled and requires a user gesture; unsupported audio fails silently. If storage is blocked, the game remains playable with session-only scores. Best scores do not sync between devices or between localhost and GitHub Pages. On very short mobile viewports some scrolling is needed.
