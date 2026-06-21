import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type AuthenticatedUser, AuthService } from './auth.service';

type RequestWithAuth = {
  headers: {
    authorization?: string;
    cookie?: string;
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const sessionToken = this.extractSessionToken(request);

    if (!sessionToken) {
      throw new UnauthorizedException('Missing session token');
    }

    const user = await this.authService.verifySession(sessionToken);
    request.user = user;
    return true;
  }

  private extractSessionToken(request: RequestWithAuth): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const cookie = request.headers.cookie;
    if (cookie) {
      const match = cookie.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }

    return null;
  }
}
