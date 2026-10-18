# Private migration proposal — NOT publication authorization

Current neutral review title: **Neon Snake**. Proposed later title: **Neon Serpent**.
Proposed repository: `nateofspades/Neon_Serpent_Game`.
Proposed URL: `https://nateofspades.github.io/Neon_Serpent_Game/`.
These are planning values, not newly published URLs, availability claims or cleared marks.

## Preserved compatibility

Keep existing localStorage keys: `neon-snake-best`, `neon-snake-music`.
A path-only move on the same origin normally retains origin-wide storage; an origin change does not automatically transfer it. Do not clear or silently rename keys. Plan an explicit export/import if a future origin changes.

All original art, rule engines and music source remain the baseline design. No blanket redraw or note substitution is authorized. MIT notices remain; an existing MIT file and author assertion do not establish every underlying right or chain of title. No third-party permission is fabricated. Historical evidence in docs is not a new pass.

## Release gates

1. Finish exact-revision tests, screenshot review and independent code review, including remediation.
2. Obtain name-use/trademark/domain and applicable art/music/ownership decisions. This is not legal clearance.
3. Review an allowlisted static runtime output, retain license notices, and exclude tests, copied reference data, evidence, node_modules and private migration docs.
4. Only with separate authorization: update actual metadata/remotes/deploy settings, publish, then read back exact deployed revision and URL. Do not deploy this private preparation branch or rename the repository now.

Current local execution evidence: `/root/arcade-migration-audit/preparation/snake-results.json` and related logs/screenshots. No pushes, merges or public changes are authorized here.
