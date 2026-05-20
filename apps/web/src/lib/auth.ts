import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import {
    twoFactor,
    organization,
    admin,
    bearer,
} from "better-auth/plugins";

export const auth = betterAuth({
    appName: "LexiGov",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            console.log("Password reset URL:", url);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            console.log("Verification URL:", url);
        },
    },
    plugins: [
        twoFactor(),
        organization({
            allowUserToCreateOrganization: true,
        }),
        admin(),
        bearer(),
    ],
});

export type Session = typeof auth.$Infer.Session;
