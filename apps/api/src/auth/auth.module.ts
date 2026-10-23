import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { SanggunianRolesGuard } from './sanggunian-roles.guard';
import { InMemorySessionCache, RedisSessionCache, SESSION_CACHE, type SessionCache } from './session-cache.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: SESSION_CACHE,
      useFactory: (): SessionCache => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          return new RedisSessionCache(redisUrl);
        }
        return new InMemorySessionCache();
      },
    },
    AuthService,
    AuthGuard,
    RolesGuard,
    SanggunianRolesGuard,
  ],
  exports: [AuthService, AuthGuard, RolesGuard, SanggunianRolesGuard],
})
export class AuthModule {}
