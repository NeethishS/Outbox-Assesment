import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if ((req.session as any)?.user) {
    req.user = (req.session as any).user;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if ((req.session as any)?.user) {
    req.user = (req.session as any).user;
    return next();
  }
  res.status(401).json({ success: false, message: 'Unauthorized' });
}
