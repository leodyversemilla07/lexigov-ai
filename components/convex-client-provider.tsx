"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { useCallback, useMemo } from "react";
import { ThemeProvider } from "next-themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useConvexClerkAuth() {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const fetchAccessToken = useCallback(
        async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            const skipCache = forceRefreshToken;

            try {
                const templateToken = await getToken({
                    template: "convex",
                    skipCache,
                });

                if (templateToken) {
                    return templateToken;
                }
            } catch {
                // Fall through to the default session token when no `convex` JWT template exists.
            }

            try {
                return await getToken({ skipCache });
            } catch {
                return null;
            }
        },
        [getToken],
    );

    return useMemo(
        () => ({
            isLoading: !isLoaded,
            isAuthenticated: isSignedIn ?? false,
            fetchAccessToken,
        }),
        [fetchAccessToken, isLoaded, isSignedIn],
    );
}

export function ConvexClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConvexProviderWithAuth client={convex} useAuth={useConvexClerkAuth}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </ConvexProviderWithAuth>
    );
}
