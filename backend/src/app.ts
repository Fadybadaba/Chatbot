import express from 'express';
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
  return app;
}

// Vercel (Root Directory = backend) auto-detects `src/app.ts` and requires a
// default export that is the Express app (or a Node handler).
const app = createApp();
export default app;
