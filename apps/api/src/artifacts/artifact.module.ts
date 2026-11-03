import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ARTIFACT_STORAGE } from './artifact.constants';
import { ArtifactController } from './artifact.controller';
import { type ArtifactStorage, type ArtifactStorageEnv, createArtifactStorage } from './artifact-storage.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [ArtifactController],
  providers: [
    {
      provide: ARTIFACT_STORAGE,
      useFactory: (): ArtifactStorage => createArtifactStorage(process.env as unknown as ArtifactStorageEnv),
    },
  ],
  exports: [ARTIFACT_STORAGE],
})
export class ArtifactModule {}
