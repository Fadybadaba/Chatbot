// Load environment variables from backend/.env as early as possible.
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import app from './app';

// Local/dev server entrypoint. Vercel uses the default export from `app.ts`
// when Root Directory is `backend`, or `api/index.ts` at the repo root.

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Recruitment chatbot backend listening on port ${port}`);
});

