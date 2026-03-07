import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCurrentUser } from "./lib/currentUser";

/**
 * List drafts for the current user
 */
export const list = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const draftsQuery = ctx.db
            .query("drafts")
            .withIndex("by_user", (q) => q.eq("userId", user._id));

        const drafts = await draftsQuery.collect();

        const filtered = args.status
            ? drafts.filter((d) => d.status === args.status)
            : drafts;

        return filtered
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, args.limit ?? 50);
    },
});

/**
 * Get a single draft by ID
 */
export const get = query({
    args: { id: v.id("drafts") },
    handler: async (ctx, args) => {
        const draft = await ctx.db.get(args.id);
        if (!draft) return null;

        const user = await getCurrentUser(ctx);
        if (!user || draft.userId !== user._id) return null;

        return draft;
    },
});

/**
 * Create a new draft
 */
export const create = mutation({
    args: {
        title: v.string(),
        documentType: v.string(),
        jurisdiction: v.string(),
        jurisdictionName: v.string(),
        content: v.optional(v.any()),
        templateId: v.optional(v.id("templates")),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const now = Date.now();

        const draftId = await ctx.db.insert("drafts", {
            title: args.title,
            documentType: args.documentType,
            jurisdiction: args.jurisdiction,
            jurisdictionName: args.jurisdictionName,
            content: args.content ?? {},
            status: "DRAFT",
            aiGenerated: false,
            userId: user._id,
            templateId: args.templateId,
            version: 1,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "CREATE",
            entityType: "drafts",
            entityId: draftId,
            userId: user._id,
            createdAt: now,
        });

        return draftId;
    },
});

/**
 * Update a draft
 */
export const update = mutation({
    args: {
        id: v.id("drafts"),
        title: v.optional(v.string()),
        content: v.optional(v.any()),
        status: v.optional(v.string()),
        commitMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const draft = await ctx.db.get(args.id);
        if (!draft || draft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        const now = Date.now();
        const { id, ...updates } = args;

        await ctx.db.patch(id, {
            ...updates,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "UPDATE",
            entityType: "drafts",
            entityId: id,
            userId: user._id,
            changes: updates,
            createdAt: now,
        });

        return { success: true };
    },
});

/**
 * Delete a draft
 */
export const remove = mutation({
    args: { id: v.id("drafts") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const draft = await ctx.db.get(args.id);
        if (!draft || draft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        await ctx.db.delete(args.id);

        await ctx.db.insert("auditLogs", {
            action: "DELETE",
            entityType: "drafts",
            entityId: args.id,
            userId: user._id,
            createdAt: Date.now(),
        });

        return { success: true };
    },
});
