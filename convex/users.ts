import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
    getCurrentUser as getStoredCurrentUser,
    requireCurrentUser,
} from "./lib/currentUser";

/**
 * Get current authenticated user
 */
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return await getStoredCurrentUser(ctx);
    },
});

/**
 * Ensure the current authenticated user exists in Convex
 */
export const ensureCurrentUser = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireCurrentUser(ctx);
        return user;
    },
});

/**
 * Create or update user from Clerk webhook
 */
export const upsertUser = internalMutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const now = Date.now();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                name: args.name,
                updatedAt: now,
            });
            return existingUser._id;
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            name: args.name,
            role: "LEGISLATIVE_STAFF",
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        organization: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        await ctx.db.patch(user._id, {
            ...args,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
