'use client';
import { adminClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { organizationAccessControl, organizationRoles } from './organization-permissions';

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient(),
    organizationClient({ ac: organizationAccessControl, roles: organizationRoles }),
    adminClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
