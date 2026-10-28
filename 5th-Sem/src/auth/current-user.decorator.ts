import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the authenticated user
 * from the request object (populated by AuthGuard).
 *
 * Usage: getProfile(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
