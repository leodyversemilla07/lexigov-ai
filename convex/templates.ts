import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List templates (public or user's own)
 */
export const list = query({
    args: {
        category: v.optional(v.string()),
        publicOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        let templates = await ctx.db
            .query("templates")
            .withIndex("by_public", (q) => q.eq("isPublic", true))
            .collect();

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (user) {
                const userTemplates = await ctx.db
                    .query("templates")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();

                const publicIds = new Set(templates.map((t) => t._id));
                for (const t of userTemplates) {
                    if (!publicIds.has(t._id)) {
                        templates.push(t);
                    }
                }
            }
        }

        if (args.category) {
            templates = templates.filter((t) => t.category === args.category);
        }

        return templates.sort((a, b) => b.usageCount - a.usageCount);
    },
});

/**
 * Get a single template
 */
export const get = query({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) return null;

        if (template.isPublic) return template;

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || template.userId !== user._id) return null;

        return template;
    },
});

/**
 * Create a new template
 */
export const create = mutation({
    args: {
        name: v.string(),
        category: v.string(),
        subcategory: v.optional(v.string()),
        jurisdiction: v.array(v.string()),
        structure: v.any(),
        exampleContent: v.optional(v.any()),
        isPublic: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const now = Date.now();

        return await ctx.db.insert("templates", {
            ...args,
            usageCount: 0,
            userId: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Increment template usage count
 */
export const incrementUsage = mutation({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) throw new Error("Template not found");

        await ctx.db.patch(args.id, {
            usageCount: template.usageCount + 1,
        });
    },
});
