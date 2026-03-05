import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Clerk webhook handler - syncs user data from Clerk to Convex
 */
http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const payload = await request.json();

        const eventType = payload.type;
        const userData = payload.data;

        if (eventType === "user.created" || eventType === "user.updated") {
            await ctx.runMutation(internal.users.upsertUser, {
                clerkId: userData.id,
                email: userData.email_addresses?.[0]?.email_address ?? "",
                name: `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim() || undefined,
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

export default http;
