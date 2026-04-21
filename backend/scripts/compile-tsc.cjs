'use strict';
const { spawnSync } = require('node:child_process');
const tsc = require.resolve('typescript/lib/tsc.js');
const r = spawnSync(process.execPath, [tsc, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
if (r.error) throw r.error;
process.exit(r.status === null ? 1 : r.status);
