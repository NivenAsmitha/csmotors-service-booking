import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { type AuthenticatedUser } from '../../auth/auth.service';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
