import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
    "/account(.*)",
    "/ai(.*)",
    "/dashboard(.*)",
    "/compare(.*)",
    "/compliance(.*)",
    "/drafts(.*)",
    "/export(.*)",
    "/settings(.*)",
    "/templates(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        "/account(.*)",
        "/ai(.*)",
        "/dashboard(.*)",
        "/compare(.*)",
        "/compliance(.*)",
        "/drafts(.*)",
        "/export(.*)",
        "/settings(.*)",
        "/templates(.*)",
    ],
};
