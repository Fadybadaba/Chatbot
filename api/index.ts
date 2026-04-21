// IMPORTANT: Do not import backend/src/server.ts here (it calls listen()).
// Vercel runs Express by default-exporting the app (see Express on Vercel docs).
import { createApp } from '../backend/src/app';

export default createApp();

