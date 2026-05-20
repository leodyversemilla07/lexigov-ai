import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ComplianceModule } from './compliance/compliance.module';
import { DraftsModule } from './drafts/drafts.module';
import { PrismaModule } from './prisma/prisma.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [PrismaModule, AuthModule, DraftsModule, TemplatesModule, ComplianceModule, AiModule],
})
export class AppModule {}
