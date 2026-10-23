import { Module } from '@nestjs/common';
import { OfficialDocumentExportService } from '../exports/official-document-export.service';
import { InMemoryPresenceService } from '../presence/presence.service';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';

@Module({
  controllers: [DraftsController],
  providers: [DraftsService, InMemoryPresenceService, OfficialDocumentExportService],
})
export class DraftsModule {}
