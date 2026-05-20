import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer, organization, twoFactor } from 'better-auth/plugins';
import { prisma } from './prisma';

export const auth = betterAuth({
  appName: 'LexiGov',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log('Password reset URL:', url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log('Verification URL:', url);
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
