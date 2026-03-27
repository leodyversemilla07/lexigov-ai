import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCurrentUser } from "./lib/currentUser";

/**
 * List templates (public or user's own)
 */
export const list = query({
    args: {
        category: v.optional(v.string()),
        publicOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let templates = await ctx.db
            .query("templates")
            .withIndex("by_public", (q) => q.eq("isPublic", true))
            .collect();

        const user = await getCurrentUser(ctx);
        if (!args.publicOnly && user) {
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

        const user = await getCurrentUser(ctx);
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
        const user = await requireCurrentUser(ctx);

        const now = Date.now();

        const templateId = await ctx.db.insert("templates", {
            ...args,
            usageCount: 0,
            userId: user._id,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "CREATE",
            entityType: "templates",
            entityId: templateId,
            userId: user._id,
            changes: {
                name: args.name,
                category: args.category,
                isPublic: args.isPublic,
            },
            createdAt: now,
        });

        return templateId;
    },
});

/**
 * Update a template owned by the current user
 */
export const update = mutation({
    args: {
        id: v.id("templates"),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        subcategory: v.optional(v.string()),
        jurisdiction: v.optional(v.array(v.string())),
        structure: v.optional(v.any()),
        exampleContent: v.optional(v.any()),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const template = await ctx.db.get(args.id);
        if (!template || template.userId !== user._id) {
            throw new Error("Template not found");
        }

        const now = Date.now();
        const { id, ...updates } = args;

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "UPDATE",
            entityType: "templates",
            entityId: id,
            userId: user._id,
            changes: updates,
            createdAt: now,
        });

        return { success: true };
    },
});

/**
 * Delete a template owned by the current user
 */
export const remove = mutation({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const template = await ctx.db.get(args.id);
        if (!template || template.userId !== user._id) {
            throw new Error("Template not found");
        }

        await ctx.db.delete(args.id);

        await ctx.db.insert("auditLogs", {
            action: "DELETE",
            entityType: "templates",
            entityId: args.id,
            userId: user._id,
            createdAt: Date.now(),
        });

        return { success: true };
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
