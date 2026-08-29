import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { SanggunianRolesGuard } from './sanggunian-roles.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuthService, AuthGuard, RolesGuard, SanggunianRolesGuard],
  exports: [AuthService, AuthGuard, RolesGuard, SanggunianRolesGuard],
})
export class AuthModule {}
