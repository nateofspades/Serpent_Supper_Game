# Neon Snake testing

Private preparation evidence is recorded in `/root/arcade-migration-audit/preparation/snake-results.json`. The private-worktree unit, complete browser/mobile-music and complete layout scripts passed locally; this is not new CI, public deployment, physical-device or speaker acceptance. In the shared audit, use the lock-owning `run-four-verification.py snake` orchestrator so the dedicated loopback server and tests share one lock lifetime. Do not run against the original server on port 8080.

## Automated suites

### Unit and static interface — Vitest

```sh
npm test
```

Verified current suite: **18 tests** across three files.

- Engine start, movement, eating, growth, speed, legal tail entry, wall/self collision, full-board win, pause/resume, restart, valid buffered turns, and immediate reversal rejection.
- Music deferred startup, single-context/single-scheduler behavior, mute/resume position, preference persistence, disabled startup, visibility suspension/resume, interruption, and closed-context replacement.
- One Music control, no Sound/event-SFX interface, four labelled direction controls, scroll locking, touch suppression, and minimum thumb-target declarations.

### Browser integration — Playwright Chromium

Start the site first, then run:

```sh
python3 -m http.server 4380 --bind 127.0.0.1
# In another terminal after server readiness (outside the shared-lock audit):
BASE_URL=http://127.0.0.1:4380 npm run test:browser
```

Verified current suite: **71 gameplay/music/touch/storage/network/console assertions** across 1920×1080, 1366×768, 768×1024, 390×844, 320×568, and 844×390, followed by the complete mobile-music script covering trusted touch/click/toggle activation, context reuse and master volume.

It verifies gameplay startup, music's post-interaction start and one-context lifecycle, all touch controls being actionable, reversal rejection, restart/pause/resume without music duplication, persisted Music on/off, mute position continuity, orientation continuity, the unchanged `neon-snake-best` key with value 137, blocked-storage/unavailable-audio fallback, no overflow, visible controls, no failed/HTTP-error asset requests, and no browser console/page errors.

### Responsive layout — Playwright Chromium

```sh
BASE_URL=http://127.0.0.1:4380 npm run test:layout
```

Verified current suite: **772 assertions across 20 viewports**, including all six required sizes and intermediate, short-height and zoom-equivalent regressions. It verifies a square practical-size board, no horizontal or vertical page overflow, hidden page scrolling, disabled touch panning, the Music control inside the header, the complete machine below it, four direction targets at least 60×60 px, mobile action buttons at least 48×48 px, visible and nonoverlapping controls, appropriate portrait/landscape D-pad placement and reachable desktop instructions.

`BASE_URL=http://127.0.0.1:4380 npm run test:all` runs the three phases serially after a server is already running. Layout screenshots are written to ignored `test-results/`. `BASE_URL=http://127.0.0.1:4380 node tests/capture-gameplay.js` additionally captures actually started gameplay, asserting real head movement and active status before and after capture. It controls the browser clock for 200 ms of the actual RAF/engine, then freezes time while screenshots encode; it does not inject scores, positions or game flags, and is not wall-clock/audio evidence. The normal browser/layout/music suites run separately without this capture clock control. Current private captures and logs are kept in the external audit, not treated as public deployment evidence.

## CI

`.github/workflows/test.yml` runs on every pull request and every push to `main`. It installs locked npm dependencies and Chromium with Linux dependencies, starts the static server, waits for readiness, and runs the unit, browser, and layout suites with one browser worker/process at a time.

## Scope and limits

- Browser automation uses Chromium only.
- Touch checks use Playwright emulation; no physical-device testing is claimed.
- Web Audio tests inspect graph/context lifecycle and synthesis scheduling, not speaker output or subjective musical quality.
- The local and deployed origins maintain separate browser storage.
- GitHub Pages deployment and external CI can only be re-verified after these local commits are pushed; this work intentionally does not push.
