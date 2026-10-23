import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSessionToken, type SessionCredential } from './session-token';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
  role?: string;
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async verifySession(
    sessionToken: string,
    source: SessionCredential['source'] = 'bearer',
  ): Promise<AuthenticatedUser> {
    const token = resolveSessionToken(
      { token: sessionToken, source },
      process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
    );
    if (!token) throw new UnauthorizedException('Invalid session credential');

    // Do not cache authorization here: logout, bans, and role changes must take effect immediately.
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    const now = Date.now();
    if (!session || session.expiresAt.getTime() <= now) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    if (session.user.banned && (!session.user.banExpires || session.user.banExpires.getTime() > now)) {
      throw new UnauthorizedException('Account is suspended');
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      ...(session.user.name ? { name: session.user.name } : {}),
      ...(session.user.role ? { role: session.user.role } : {}),
    };
  }
}
