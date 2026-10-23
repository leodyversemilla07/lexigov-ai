import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type AuthenticatedUser, AuthService } from './auth.service';
import { extractSessionCredential } from './session-token';

interface RequestWithAuth {
  method?: string;
  headers: { authorization?: unknown; cookie?: unknown; origin?: unknown };
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const credential = extractSessionCredential(request.headers);
    if (!credential) throw new UnauthorizedException('Missing or invalid session token');

    if (credential.source === 'cookie' && !['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET')) {
      const trustedOrigins = [
        process.env.CORS_ORIGIN,
        process.env.BETTER_AUTH_TRUSTED_ORIGINS,
        process.env.BETTER_AUTH_URL,
        process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined,
      ]
        .flatMap((value) => value?.split(',') ?? [])
        .map((value) => {
          try { return new URL(value.trim()).origin; } catch { return ''; }
        })
        .filter(Boolean);
      let requestOrigin = '';
      if (typeof request.headers.origin === 'string') {
        try { requestOrigin = new URL(request.headers.origin).origin; } catch { requestOrigin = ''; }
      }
      if (!requestOrigin || !trustedOrigins.includes(requestOrigin)) {
        throw new ForbiddenException('Untrusted request origin');
      }
    }

    request.user = await this.authService.verifySession(credential.token, credential.source);
    return true;
  }
}
