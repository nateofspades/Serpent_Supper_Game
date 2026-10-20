# Serpent Supper testing

Final release evidence is recorded in `/root/arcade-final-migration/serpentsuppergame/`. Historical private results remain in `/root/arcade-migration-audit/preparation/snake-results.json`; they are not new-revision acceptance. Run one game/browser process at a time with an explicit BASE_URL and your own loopback server. Do not run against the original checkout's server on port 8080.

## Automated suites

### Unit and static interface — Vitest

```sh
npm test
```

Suite: **24 tests** across four files, including six exact-identity/legal-notice/storage-key checks. Vitest runs with maxWorkers=1.

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

`BASE_URL=http://127.0.0.1:4380 npm run test:all` runs unit, browser/mobile-music, layout and expanded acceptance serially after server readiness. Layout screenshots go to ignored `test-results/`. `BASE_URL=http://127.0.0.1:4380 node tests/capture-gameplay.js` captures actual started gameplay, asserting real head movement and active status before/after capture. It advances 200 ms of the actual RAF, then freezes only encoding time; no scores/positions/flags are injected. It is not real-clock/audio evidence.

## Expanded release acceptance

`BASE_URL=http://127.0.0.1:4380 npm run test:acceptance` runs six cases at six viewports: 36 scenario/viewport passes, separately from the legacy assertion counts above. The sizes are exactly 1920×1080, 1366×768, 768×1024, 390×844, 320×568 and 844×390. Phone/tablet cases use hasTouch/isMobile and trusted taps; desktop uses clicks/keyboard. Cases cover identity, focused/native Space and gameplay keys, ready/running geometry and hitboxes, pause/orientation, natural wall loss, restart/Play Again, deterministic labelled food/growth/victory/self-collision fixtures, running resize, seeded/invalid/blocked storage and same-origin path aliases.

Native audio case forwards the real AudioContext constructor (no fake nodes/time), measures 90 analyser samples over more than a full loop, signal in every complete second, measured peak headroom, mute/unmute, frozen suspended clock, resume and restart/resize phase, with one context and scheduler. It is not a speaker/listening test. Existing browser/mobile-music scripts instead use fake contexts and are integration checks. No user volume slider exists; master gain and mute are tested.

The keyboard-only case freezes RAF while operating focus/Space, then explicitly advances 200 ms for each steering tick. This prevents a real wall loss while a resource-constrained runner is still interacting with controls. State/layout/native-audio cases use normal wall-clock progression; no fake AudioContext is used in expanded acceptance. A foreground tool timeout and earlier test-harness duty-cycle/timing failures are retained in external logs, not counted as final passes or production defects.

For the deployed site use `LIVE=1 BASE_URL=https://nateofspades.github.io/Serpent_Supper_Game/ npm run test:acceptance`. The local harness verifies served runtime bytes against this checkout and rejects port 8080; LIVE omits only that loopback identity prerequisite. Live and local counts must be reported separately. The seeded path alias is emulated; it does not claim actual user data migrated. Actual CI and Pages handles are in external result.json, not inferred from a push.

## CI

`.github/workflows/test.yml` runs on every pull request and every push to `main`. It installs locked npm dependencies and Chromium with Linux dependencies, starts the static server, waits for readiness, and runs the unit, browser, and layout suites with one browser worker/process at a time.

## Scope and limits

- Browser automation uses Chromium only.
- Touch checks use Playwright emulation; no physical-device testing is claimed.
- Native audio acceptance measures real clock and graph signal; the older mock suites inspect synthesis/lifecycle. Neither certifies speakers, subjective quality, physical devices or commercial-melody originality.
- The local and deployed origins maintain separate browser storage.
- CI runs all suites then deploys only allowlisted runtime assets after green tests on pushes to main. Browser emulation is not physical-device testing; Firefox/WebKit and genuine OS-background interruption remain outside this release's measured coverage.
