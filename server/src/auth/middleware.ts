import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string | undefined>)?.token;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
