import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AuthenticatedUser {
    userId: string;
    email: string;
    name?: string;
}

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async verifySession(sessionToken: string): Promise<AuthenticatedUser> {
        const session = await this.prisma.session.findUnique({
            where: { token: sessionToken },
            include: { user: true },
        });

        if (!session || session.expiresAt < new Date()) {
            throw new UnauthorizedException("Invalid or expired session");
        }

        return {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name ?? undefined,
        };
    }
}
