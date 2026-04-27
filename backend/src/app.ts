import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';
import { registerRoutes } from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    }),
  );
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true }));

  registerRoutes(app);

  // Ensure API errors return JSON (not HTML).
  // This keeps frontend error handling readable and avoids `[object Object]` pages.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Internal Server Error';

    // Log full error server-side for debugging.
    // eslint-disable-next-line no-console
    console.error(err);

    res.status(500).json({ error: message });
  });

  return app;
}

// Vercel (Root Directory = backend) auto-detects `src/app.ts` and requires a
// default export that is the Express app (or a Node handler).
const app = createApp();
export default app;
