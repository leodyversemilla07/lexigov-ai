"use client";
import { createAuthClient } from "better-auth/react";
import {
    twoFactorClient,
    organizationClient,
    adminClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [
        twoFactorClient(),
        organizationClient(),
        adminClient(),
    ],
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient;
