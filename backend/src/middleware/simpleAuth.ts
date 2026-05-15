import { NextFunction, Request, Response } from 'express';

// Payload type that our auth middleware attaches to the request.
export interface UserPayload {
  id: string;
  role: 'candidate' | 'hr' | 'admin';
}

// Augment the Express Request type so TypeScript knows about `req.user`.
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

/**
 * Very simple auth shim.
 *
 * In production you should replace this with real JWT/SSO validation
 * and user lookup. For now, we just read headers:
 *   x-user-id, x-user-role
 */
export function attachAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const id = req.header('x-user-id') || 'anonymous';
  const roleHeader = (req.header('x-user-role') || 'candidate').toLowerCase();

  const role = (['candidate', 'hr', 'admin'].includes(roleHeader)
    ? roleHeader
    : 'candidate') as UserPayload['role'];

  req.user = { id, role };
  next();
}

