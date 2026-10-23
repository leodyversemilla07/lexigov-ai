import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer, organization, twoFactor } from 'better-auth/plugins';
import { sendEmail } from './email';
import {
  renderEmailVerification,
  renderOrganizationInvitation,
  renderPasswordReset,
  renderTwoFactorCode,
} from './email/templates';
import { assignableOrganizationRoles, organizationAccessControl, organizationRoles } from './organization-permissions';
import { prisma } from './prisma';

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: 'LexiGov',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  trustedOrigins,
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
      ac: organizationAccessControl,
      roles: organizationRoles,
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const configuredBaseUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
        const invitationUrl = new URL('/accept-invitation', configuredBaseUrl);
        invitationUrl.searchParams.set('id', data.id);
        const roleLabel =
          assignableOrganizationRoles.find((role) => role.value === data.role)?.label ?? 'workspace member';
        const { subject, html, text } = renderOrganizationInvitation({
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name || data.inviter.user.email,
          roleLabel,
          url: invitationUrl.toString(),
        });
        await sendEmail({ to: data.email, subject, html, text });
      },
    }),
    admin(),
    bearer(),
  ],
});

export type Session = typeof auth.$Infer.Session;
