# Serpent Supper — execution-lane handoff and regression design

Historical source-phase design, retained for provenance. The owner subsequently released the lane and authorized the final Serpent Supper publication. Tests and scripts are now integrated; current executable coverage and limits are in TESTING.md, and actual release results are in the external assigned evidence directory. Pending statements below describe the earlier checkpoint, not current release instructions.

**SOURCE-PHASE DRAFT — NOTHING IN THIS FILE HAS BEEN EXECUTED.** Parent must release the single execution lane before any test, browser, server, dependency installation, build, Codex, commit, remote rename or publication. Production remains unchanged until observed RED. The default npm scripts deliberately remain untouched: the new unit file is not in their explicit list and the new standalone browser file is not auto-discovered.

## Draft files and first vertical tracer bullets

- `tests/serpent-identity.test.js`: Vitest/JSDOM exact browser title (`Serpent Supper`), accessible/visible home identity, description, no prominent old identity, exact README title/live link, package/lock consistency, original keys/license/track credit. The exact-title test should fail against current HTML, but no failure has been observed. Run just that test first; fix only after confirming intended assertion failure, then run it and existing suites. Apply other identity corrections in small RED/GREEN slices, not one speculative runtime rewrite.
- `tests/serpent-acceptance.mjs`: executable Node/Playwright draft with explicit `TEST_CASE=identity|keyboard|layout|state|storage|audio`, one browser and sequential six-viewports. Default is `identity`, not all expensive suites. It rejects port 8080 and checks current runtime response bytes before launching locally. Real AudioContext is forwarded using a native constructor Proxy (not a fake context), and a zero-gain analyser branch avoids adding audible output to the existing destination connection. No browser clock substitution in this file. All draft syntax/behavior still needs real review and execution after release.
- `docs/dependency-license-inventory.json`: source inspection metadata, NOT a vulnerability report or install manifest verification.
- `docs/IP_AUDIT.md`: scoped source/history/asset/music/comparison findings and remaining limits.

## Isolation: never validate the original server

Coordinator verified original PID 2571422, port 8080, cwd `/root/neon_snake`. Do not reuse or stop it. Do not assume it remains that PID later. Static port defaults in existing tests are unsafe in this shared environment; pass BASE_URL to **every** browser/layout/capture command. There is no build script; do not invent a build pass.

After parent releases lane, use one lock-owning orchestrator or parent-held execution lock for server lifetime plus all tests, not one server lock followed by a deadlocking nested test lock. Existing prior preparation lock is `/root/arcade-migration-audit/preparation/test.lock`; ask parent which current lock/lane governs before using it. A lock alone is not a release signal.

Proposed dedicated port: **4380**, only if unoccupied. Do not evict another process if busy. Explicit root and loopback binding, even if shell cwd is wrong:

```sh
# FUTURE ONLY, foreground command to be launched/owned by the orchestrator:
python3 -m http.server 4380 --bind 127.0.0.1 --directory /root/arcade-migration-prep/neonserpentgame
```

Parent/orchestrator records its own spawned PID, launch argv and cwd, then reads `/proc/<owned-pid>/cmdline` and `/proc/<owned-pid>/cwd`, listener identity and HTTP responses before tests. Set cwd to `/root/arcade-migration-prep/neonserpentgame`; verify `--directory` names this same prepared root and port binds 127.0.0.1. Save exact identity and response-byte checks in external release evidence. Startup health must check live responses, not blind sleep. Kill/reap only owned child in `finally`; do not blanket `pkill python` or stop port 8080. Baseline original/prepared runtime bytes currently match, so content equality by itself is insufficient: PID/root identity is required too. After identity fixes, the prepared title/HTML must differ from original but do not mutate original to force agreement.

## Future command sequence (not run)

All commands below from assigned worktree, only after parent release, with logs under `/root/arcade-final-migration/serpentsuppergame/`. Use shell pipefail and preserve actual exit status if teeing. Exact result counts must come from new outputs, not this file or historic README. Check installed Node/npm/Playwright availability without reinstalling over another worker; shared node_modules must never be staged.

```sh
# First observed RED: one exact title assertion, before production edits.
npx vitest run --maxWorkers=1 tests/serpent-identity.test.js -t 'uses the exact approved browser title'
# Once the title test fails for the correct reason, minimal title change, rerun it.
# Add other identity tracer bullets and corrections; then:
npx vitest run --maxWorkers=1 tests/serpent-identity.test.js
# Browser suspect first, before a keydown correction:
BASE_URL=http://127.0.0.1:4380/ TEST_CASE=keyboard node tests/serpent-acceptance.mjs
# Capture exact button-focus/Space failure; errors in draft setup are not feature RED.
# Preserve full existing serial suite including all 20 layout sizes:
BASE_URL=http://127.0.0.1:4380/ npm run test:all
# Expanded standalone cases, run serially, each with own log/exit code:
BASE_URL=http://127.0.0.1:4380/ TEST_CASE=identity node tests/serpent-acceptance.mjs
BASE_URL=http://127.0.0.1:4380/ TEST_CASE=layout node tests/serpent-acceptance.mjs
BASE_URL=http://127.0.0.1:4380/ TEST_CASE=state node tests/serpent-acceptance.mjs
BASE_URL=http://127.0.0.1:4380/ TEST_CASE=storage node tests/serpent-acceptance.mjs
BASE_URL=http://127.0.0.1:4380/ TEST_CASE=audio node tests/serpent-acceptance.mjs
# Additional browser engines only when installed and parent lane permits:
BASE_URL=http://127.0.0.1:4380/ BROWSER=firefox TEST_CASE=audio node tests/serpent-acceptance.mjs
BASE_URL=http://127.0.0.1:4380/ BROWSER=webkit TEST_CASE=audio node tests/serpent-acceptance.mjs
```

Do not treat an unavailable browser/audio backend as a music pass. Firefox does not support Playwright `isMobile`; draft uses hasTouch and viewport without that flag, report distinction. Use repo-supported harness/private pulseaudio sink if necessary, never alter unrelated audio service. Current npm test names explicitly list three old unit files; after RED/GREEN add the new identity file to CI/scripts and add standalone cases serially (another test/config change, not executed here). Current `serve` defaults to all-interface 8080, so fix development script/documentation deliberately after a guard regression test, not by using it now.

## Required acceptance matrix and observable oracles

Six required sizes: **1920×1080, 1366×768, 768×1024, 390×844, 320×568, 844×390**. Desktop mouse/keyboard plus `hasTouch/isMobile` contexts for tablet/phone in Chromium/WebKit; Firefox viewport/touch limits explicit. Preserve original full 20-size layout script, including short heights and zoom-equivalent widths.

| Area | Draft implemented oracle / additional execution checks |
|---|---|
| Identity and source | Exact title, home aria-label; static metadata/README/package checks; local runtime bytes. Final screenshot must actually show new identity. Check deployed URL separately, not just source strings. |
| Geometry | Ready and running arena + actions + music + D-pad positive boxes wholly inside viewport; no overflow; hit-testing rejects obstructed buttons; ≥60 px directions, ≥48 px mobile actions. Existing 20-size suite retains square/minimum board dimensions, D-pad separation/Down location and desktop instructions. Repeat after terminal menu and final-title width changes; hit-testing center is not complete edge-hit coverage. |
| Real touch | Real Playwright `tap` activates start/actions and each direction through a legal four-turn route; source synthetic `element.click()` is not counted as touch proof. Add rapid two-turn queue/opposite tap, repeated tap, boundary taps and no pan/scroll to explicit browser regression coverage before final acceptance. |
| Keyboard/focus | Space focused Start, Space focused Music must activate native button without pausing; unfocused Space pause/resume; Enter restart; arrows/lowercase WASD/uppercase direction route. Extend focused Restart/Pause/Resume Space, Tab reachability, visible focus, held key/repeat suppression, two rapid legal turns, reversal rejection, Alt/Ctrl/Meta handling. Confirm input focus/native behavior before minimal fix. |
| State and scoring | Actual RAF movement; pause freezes snake; natural wall-loss overlay; Play Again restarts; deterministic ahead-food fixture consumed by real next RAF yields +10/growth/HUD/storage; explicit small-board full fixture produces win UI. Fixtures are labelled, never genuine-play screenshot evidence. Preserve existing unit self-collision, departing-tail legality, acceleration floor, spawn exclusion and queue tests; expand browser self-collision/terminal restart if needed. |
| Resize/orientation | Paused model snapshot identical after dimensions swap; same music context/timer and expected modulo-eight phase after resize/restart. Add running resize preserving snake/food/score/queued input without reset; account for legitimate elapsed ticks, not strict equality on a moving game. Real mobile browser orientation is not identical to viewport-only emulation. |
| Storage | Seed literal best/music keys, reload/restart, disabled audio context absent, invalid/negative/nonfinite scores safe, blocked localStorage playable, same-origin path alias preserves seeded values. Alias intercept serves unchanged files under new path: models origin-key compatibility only, not real migration. Final deployed old/new paths should be tested on same Pages origin where accessible; local and remote origins cannot share actual storage. |
| Real audio | No context before gesture; native instance after trusted click/tap; currentTime advances beyond one eight-second loop; native analyser samples nonzero RMS and peak below clipping bound; muted samples near zero, unmute signal returns; pause freezes clock; same context/scheduler across resume/restart/resize and phase equation. Native observation forwards actual constructor, oscillator/timer are not faked. A real analyser validates graph signal, not physical speakers. |
| Audio follow-ups | Listen to full loops for gap/burst/artifact; record onset/scheduled-node diagnostics if phase issue reproduces. Existing fake tests retain unit visibility/closed-context regressions but do not satisfy real playback. Add actual foreground/background visibility transitions (not redefining document.hidden), paused and muted page restore, native context suspend/resume/close recovery and verify no overlapping active contexts. Measure master gain/headroom and silence after mute across multiple samples, not just one; real-time sampling can miss a narrow peak. Physical-speaker loudness remains unverified unless physically tested. No invented volume slider or added SFX. |
| Errors and assets | Every draft context monitors pageerror, console error, failed requests and HTTP≥400; assert none. Confirm SVG/stylesheet/module MIME/subpath behavior, no mixed-content or failed final screenshot. Console/network failures are failures, not ignored as unrelated without evidence. |

Draft limits must be closed or explicitly reported: keyboard subcases above, real hidden-page/native recovery, full waveform/subjective loop listening, browser-engine availability and physical devices/speakers. Do not equate this design with implemented/executed coverage. Tests that pass unchanged are baseline regression checks; only intended failed assertions establish RED for corrections.

## Post-green release gates owned by final worker / parent

1. Full existing unit/browser/mobile-music/layout plus new cases, actual counts and screenshots at final local revision. Capture via preserved honest capture harness separately; it freezes browser time only during encoding and is not real-audio evidence. View every image used in final claims. Preserve unique prepared commits and original shared git store.
2. Actual supported read-only `codex review --base <recorded-original-baseline>` only after full green, record reviewed head/conclusion/limits; reproduce findings with RED, fix minimally, full rerun and re-review substantive fixes. Do not execute now.
3. Finalize audit with actual final menu/gameplay/motion/music observations and close limitations honestly. Update README exact header/clickable case-sensitive Pages URL/actual inspected screenshot and instructions. Stale private proposal must not override approved name.
4. Rename **existing** repo only after destination/readiness check; compare immutable repo ID before/after; fetch/ancestry verification, no force push, retain all prepared commits, verify author association. Parent owns profile retirement; no profile writes by worker.
5. CI unit+browser and Pages passing for exact final SHA; read-back source/deployed title/assets/HTTP/real gameplay/audio at six sizes as practical. No invented new pass counts, no claim merely pushed equals deployed.
6. Only final worker writes actual `result.json`/report with verified outcomes. This phase intentionally creates neither.
