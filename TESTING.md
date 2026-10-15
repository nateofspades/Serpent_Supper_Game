# Neon Snake testing

## Automated suites

### Unit and static interface — Vitest

```sh
npm test
```

Current suite: **16 tests** across three files.

- Engine start, movement, eating, growth, speed, legal tail entry, wall/self collision, full-board win, pause/resume, restart, valid buffered turns, and immediate reversal rejection.
- Music deferred startup, single-context/single-scheduler behavior, mute/resume position, preference persistence, disabled startup, visibility suspension/resume, interruption, and closed-context replacement.
- One Music control, no Sound/event-SFX interface, four labelled direction controls, scroll locking, touch suppression, and minimum thumb-target declarations.

### Browser integration — Playwright Chromium

Start the site first, then run:

```sh
python3 -m http.server 8080
npm run test:browser
```

Current suite: **53 assertions** across 1920×1080, 1366×768, 768×1024, 390×844, 320×568, and 844×390.

It verifies gameplay startup, music's post-interaction start and one-context lifecycle, all touch controls being actionable, reversal rejection, restart/pause/resume without music duplication, persisted Music on/off, mute position continuity, orientation continuity, the unchanged `neon-snake-best` key with value 137, blocked-storage/unavailable-audio fallback, no overflow, visible controls, no failed/HTTP-error asset requests, and no browser console/page errors.

### Responsive layout — Playwright Chromium

```sh
npm run test:layout
```

Current suite: **146 assertions** across the six required viewports plus 600×600 and 700×600 intermediate-height regressions. It verifies a square practical-size board, no horizontal or vertical page overflow, hidden page scrolling, disabled touch panning, the Music control contained in the header, the complete game machine contained below it, four 48 px or larger direction targets, every target inside the viewport, the portrait D-pad immediately after the machine, and the compact-height D-pad adjacent to it.

`npm run test:all` runs all three suites serially after a server is already running. Screenshots are written to ignored `test-results/`; the current README screenshot is `assets/gameplay.png` and was freshly captured from active local gameplay at 1366×768.

## CI

`.github/workflows/test.yml` runs on every pull request and every push to `main`. It installs locked npm dependencies and Chromium with Linux dependencies, starts the static server, waits for readiness, and runs the unit, browser, and layout suites with one browser worker/process at a time.

## Scope and limits

- Browser automation uses Chromium only.
- Touch checks use Playwright emulation; no physical-device testing is claimed.
- Web Audio tests inspect graph/context lifecycle and synthesis scheduling, not speaker output or subjective musical quality.
- The local and deployed origins maintain separate browser storage.
- GitHub Pages deployment and external CI can only be re-verified after these local commits are pushed; this work intentionally does not push.
