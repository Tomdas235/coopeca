import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedPrincipal } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal =>
    context.switchToHttp().getRequest<{ user: AuthenticatedPrincipal }>().user,
);