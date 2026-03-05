"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </ConvexProviderWithClerk>
    );
}
