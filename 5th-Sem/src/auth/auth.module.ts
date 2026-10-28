import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

/**
 * AuthModule registers AuthGuard globally via APP_GUARD.
 * Every endpoint automatically requires a valid Basic auth header.
 * PrismaService is available because PrismaModule is @Global().
 */
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
