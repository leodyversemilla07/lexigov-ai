import { Global, Module } from '@nestjs/common';
import { ArtifactController } from './artifact.controller';
import { type ArtifactStorage, type ArtifactStorageEnv, createArtifactStorage } from './artifact-storage.service';

export const ARTIFACT_STORAGE = 'ARTIFACT_STORAGE';

@Global()
@Module({
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
