import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerBehindAuthGuard } from './common/throttler-behind-auth.guard';
import { ComplianceModule } from './compliance/compliance.module';
import { DraftsModule } from './drafts/drafts.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TemplatesModule } from './templates/templates.module';

/**
 * Rate-limit tiers:
 *  - 'default': 120 requests / minute / user (general API surface)
 *  - 'ai':      10 requests / minute / user (Azure OpenAI-backed endpoints)
 *
 * Both tiers are independent, so a user can spend their AI quota independently
 * of their general API usage. Tighter tier is applied per-endpoint via @Throttle.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'ai', ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    AuthModule,
    DraftsModule,
    TemplatesModule,
    ComplianceModule,
    AiModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerBehindAuthGuard }],
})
export class AppModule {}
