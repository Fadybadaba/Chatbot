'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const frontendRoot = path.resolve(__dirname, '..');
const vitePkgDir = path.dirname(require.resolve('vite/package.json'));
const viteCli = path.join(vitePkgDir, 'bin', 'vite.js');
const r = spawnSync(
  process.execPath,
  [viteCli, 'build', ...process.argv.slice(2)],
  { stdio: 'inherit', cwd: frontendRoot, env: process.env },
);
if (r.error) throw r.error;
process.exit(r.status === null ? 1 : r.status);
