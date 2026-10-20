// Serial subprocesses: a single browser at a time, with failures propagated.
import { spawnSync } from 'node:child_process';
for (const name of ['identity', 'keyboard', 'layout', 'state', 'storage', 'audio']) {
  const result = spawnSync(process.execPath, ['tests/serpent-acceptance.mjs'], {
    env: { ...process.env, TEST_CASE: name }, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
