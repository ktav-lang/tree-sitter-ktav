import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const build = require.resolve('node-gyp-build/bin.js');

const result = spawnSync(process.execPath, [build], {
  env: { ...process.env, npm_config_build_from_source: 'true' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
