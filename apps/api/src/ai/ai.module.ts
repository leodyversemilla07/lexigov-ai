import { Module } from '@nestjs/common';
import { STATUTORY_VECTOR_STORE } from './ai.constants';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PgVectorStatutoryStore } from './pgvector-statutory-store.service';

@Module({
  controllers: [AiController],
  providers: [
    PgVectorStatutoryStore,
    {
      provide: STATUTORY_VECTOR_STORE,
      useExisting: PgVectorStatutoryStore,
    },
    AiService,
  ],
  exports: [AiService, PgVectorStatutoryStore],
})
export class AiModule {}
