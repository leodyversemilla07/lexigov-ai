import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyWebhook } from "@clerk/backend/webhooks";

const http = httpRouter();

/**
 * Clerk webhook handler - syncs user data from Clerk to Convex
 */
http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
        if (!signingSecret) {
            return new Response(JSON.stringify({ success: false, error: "CLERK_WEBHOOK_SIGNING_SECRET not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        let event;
        try {
            event = await verifyWebhook(request, { signingSecret });
        } catch (error) {
            console.error("Clerk webhook verification failed", error);
            return new Response(JSON.stringify({ success: false, error: "Invalid webhook signature" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (event.type === "user.created" || event.type === "user.updated") {
            const userData = event.data;
            const primaryEmail =
                userData.email_addresses.find((emailAddress) => emailAddress.id === userData.primary_email_address_id)?.email_address ??
                userData.email_addresses[0]?.email_address ??
                `${userData.id}@clerk.local`;
            const fullName = `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim();

            await ctx.runMutation(internal.users.upsertUser, {
                clerkId: userData.id,
                email: primaryEmail,
                name: fullName || userData.username || undefined,
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

export default http;
