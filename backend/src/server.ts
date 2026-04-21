// Load environment variables from backend/.env as early as possible.
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import { createApp } from './app';

// Local/dev server entrypoint. Vercel uses `api/index.ts` instead.
const app = createApp();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Recruitment chatbot backend listening on port ${port}`);
});

