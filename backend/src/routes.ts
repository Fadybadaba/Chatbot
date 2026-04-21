import { Express, Request, Response, Router } from 'express';
import { attachAuthMiddleware } from './simpleAuth';
import { createChatRouter } from './chatbot';
import { createJobsRouter } from './jobs';
import { createHrRouter } from './hr';

export function registerRoutes(app: Express) {
  // Basic health endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Attach minimal auth shim so req.user is available.
  app.use(attachAuthMiddleware);

  const apiRouter = Router();

  apiRouter.use('/chat', createChatRouter());
  apiRouter.use('/jobs', createJobsRouter());
  apiRouter.use('/hr', createHrRouter());

  app.use('/api', apiRouter);
}

