import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

const g = globalThis as typeof globalThis & {
  __recruitment_backend_child__?: ChildProcessWithoutNullStreams;
};

function maybeSpawnBackend() {
  const enabled =
    (process.env.VITE_SPAWN_BACKEND || 'true').toLowerCase() !== 'false';
  if (!enabled) return;

  if (g.__recruitment_backend_child__) return;

  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const backendDir = path.resolve(thisDir, '../backend');
  // Windows: direct `spawn('npm.cmd', …)` often throws EINVAL; use cmd /c (no `shell: true` + args).
  const child =
    process.platform === 'win32'
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run dev'], {
          cwd: backendDir,
          stdio: 'inherit',
          env: { ...process.env },
          windowsHide: true,
        })
      : spawn('npm', ['run', 'dev'], {
          cwd: backendDir,
          stdio: 'inherit',
          env: { ...process.env },
        });

  g.__recruitment_backend_child__ = child;

  const shutdown = () => {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  };

  process.on('exit', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default defineConfig(({ command, isPreview }) => {
  // `vite dev` uses `command: 'serve'`. `vite preview` also reports `serve`, so gate previews out.
  if (command === 'serve' && !isPreview) {
    maybeSpawnBackend();
  }

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});

