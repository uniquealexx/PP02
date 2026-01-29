import type { AuthUserDto } from '@servicedesk/shared';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthUserDto;
    }
  }
}

export {};
