import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const sessionToken = this.extractSessionToken(request);

        if (!sessionToken) {
            throw new UnauthorizedException("Missing session token");
        }

        const user = await this.authService.verifySession(sessionToken);
        request.user = user;
        return true;
    }

    private extractSessionToken(request: any): string | null {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            return authHeader.slice(7);
        }

        const cookie = request.headers.cookie;
        if (cookie) {
            const match = cookie.match(/better-auth\.session_token=([^;]+)/);
            if (match) return decodeURIComponent(match[1]);
        }

        return null;
    }
}
