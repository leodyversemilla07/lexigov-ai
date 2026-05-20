import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { DraftsModule } from "./drafts/drafts.module";
import { TemplatesModule } from "./templates/templates.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { AuthModule } from "./auth/auth.module";
import { AiModule } from "./ai/ai.module";

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        DraftsModule,
        TemplatesModule,
        ComplianceModule,
        AiModule,
    ],
})
export class AppModule {}
