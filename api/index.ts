import type { VercelRequest, VercelResponse } from '@vercel/node';

// IMPORTANT: Do not import backend/src/server.ts here (it calls listen()).
import { createApp } from '../backend/src/app';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express is a valid (req, res) handler.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (app as any)(req, res);
}

