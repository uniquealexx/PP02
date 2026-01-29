import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserDto } from '@servicedesk/shared';
import type { AuthenticatedRequest } from './jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserDto => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error('Current user is missing in request.');
    }
    return request.user;
  },
);
