// IMPORTANT: Do not import backend/src/server.ts here (it calls listen()).
// Same Express instance as `backend/src/app.ts` (default export).
import app from '../backend/src/app';

export default app;
