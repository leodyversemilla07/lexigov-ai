import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ArtifactModule } from './artifacts/artifact.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerBehindAuthGuard } from './common/throttler-behind-auth.guard';
import { ComplianceModule } from './compliance/compliance.module';
import { DraftsModule } from './drafts/drafts.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TemplatesModule } from './templates/templates.module';

/**
 * Default API rate limit: 120 requests / minute / user.
 *
 * Azure OpenAI-backed endpoints override this at the controller level with a
 * tighter 10 requests / minute cap so non-AI routes do not consume AI quota.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    PrismaModule,
    ArtifactModule,
    AdminModule,
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
