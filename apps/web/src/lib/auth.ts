import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer, organization, twoFactor } from 'better-auth/plugins';
import { sendEmail } from './email';
import { renderEmailVerification, renderPasswordReset, renderTwoFactorCode } from './email/templates';
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
      const { subject, html, text } = renderPasswordReset({ name: user.name ?? undefined, url });
      await sendEmail({ to: user.email, subject, html, text });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, html, text } = renderEmailVerification({ name: user.name ?? undefined, url });
      await sendEmail({ to: user.email, subject, html, text });
    },
  },
  plugins: [
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          const { subject, html, text } = renderTwoFactorCode({ name: user.name ?? undefined, code: otp });
          await sendEmail({ to: user.email, subject, html, text });
        },
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
    }),
    admin(),
    bearer(),
  ],
});

export type Session = typeof auth.$Infer.Session;
