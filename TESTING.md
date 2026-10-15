# Verification report

Verified locally in headless Chromium with Playwright and Node.js 22.

## Passing engine tests

- Ready → Start → rightward movement, three-cell initial length.
- Eating increases length and score, reduces the tick interval, and respawns on a free cell.
- Wall collisions and body collisions end play; the departing tail cell is legal.
- Eating the final free cell completes the board without a spawning loop.
- Buffered direction changes are processed one per tick; immediate reversals and overflow inputs are rejected.
- Pause freezes state; Resume continues; Restart clears score, body, direction, and queued turns.

## Passing browser checks

- Start, automatic movement, all four arrow keys and all four WASD mappings.
- Space pause/resume and button pause/resume.
- Restart and Game Over → Play Again.
- Food pickup, visible score increase, growth, high-score persistence after reload.
- Rapid queued turns remain sequential rather than producing an invalid same-tick reversal.
- Wall and self-collisions display Game Over and the final score.
- Sound preference persistence; actual Web Audio oscillators generated for eating and losing; muted events generate none.
- Touch-emulated directional buttons in all four directions.
- No horizontal overflow and a square board at 320, 375, 390, 768, and 1440 px widths.
- Board and directional controls fit together at a 390 × 844 phone viewport.
- Desktop and mobile screenshots inspected; no blocking clipping or overlap.
- No captured browser JavaScript or console errors.
- Gameplay remains functional with blocked localStorage and unavailable Web Audio.

## Limits and deployment

These results are local only. No GitHub Pages deployment or live-site verification has been performed because the requested repository name belongs to an existing private repository, and modifying existing repositories was explicitly prohibited. No repositories were changed.

Tests use touch emulation rather than a physical phone. Audio verification checks synthesis calls, not speaker output. Browser coverage is Chromium only. Storage is origin-specific and requires browser permission for persistence.
