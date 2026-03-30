import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCurrentUser } from "./lib/currentUser";

const templateCategoryValidator = v.union(
    v.literal("Environment"),
    v.literal("Health"),
    v.literal("Public Safety"),
    v.literal("Revenue"),
    v.literal("Social Welfare"),
    v.literal("Infrastructure"),
    v.literal("Education"),
    v.literal("Other"),
);
const jurisdictionValidator = v.union(
    v.literal("barangay"),
    v.literal("city"),
    v.literal("municipal"),
    v.literal("provincial"),
);

function validateTemplateName(name: string) {
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 200) {
        throw new Error("Template name must be between 3 and 200 characters");
    }

    return trimmedName;
}

function normalizeOptionalText(value?: string) {
    if (value === undefined) {
        return undefined;
    }

    const trimmedValue = value.trim();
    return trimmedValue || undefined;
}

function validateJurisdictions(jurisdictions: string[]) {
    if (jurisdictions.length === 0) {
        throw new Error("At least one jurisdiction is required");
    }

    return jurisdictions;
}

/**
 * List templates (public or user's own)
 */
export const list = query({
    args: {
        category: v.optional(v.string()),
        publicOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const publicTemplates = args.category
            ? (await ctx.db
                .query("templates")
                .withIndex("by_category", (q) => q.eq("category", args.category!))
                .collect()).filter((template) => template.isPublic)
            : await ctx.db
                .query("templates")
                .withIndex("by_public", (q) => q.eq("isPublic", true))
                .collect();

        const templates = [...publicTemplates];

        const user = await getCurrentUser(ctx);
        if (!args.publicOnly && user) {
            let userTemplates = await ctx.db
                .query("templates")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect();

            if (args.category) {
                userTemplates = userTemplates.filter((template) => template.category === args.category);
            }

            const publicIds = new Set(templates.map((t) => t._id));
            for (const t of userTemplates) {
                if (!publicIds.has(t._id)) {
                    templates.push(t);
                    publicIds.add(t._id);
                }
            }
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
        category: templateCategoryValidator,
        subcategory: v.optional(v.string()),
        jurisdiction: v.array(jurisdictionValidator),
        structure: v.any(),
        exampleContent: v.optional(v.any()),
        isPublic: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const now = Date.now();
        const name = validateTemplateName(args.name);
        const jurisdiction = validateJurisdictions(args.jurisdiction);
        const subcategory = normalizeOptionalText(args.subcategory);

        const templateId = await ctx.db.insert("templates", {
            ...args,
            name,
            jurisdiction,
            usageCount: 0,
            userId: user._id,
            createdAt: now,
            updatedAt: now,
            ...(subcategory ? { subcategory } : {}),
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
        category: v.optional(templateCategoryValidator),
        subcategory: v.optional(v.string()),
        jurisdiction: v.optional(v.array(jurisdictionValidator)),
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
        const normalizedUpdates: Record<string, unknown> = {};

        if (updates.name !== undefined) {
            normalizedUpdates.name = validateTemplateName(updates.name);
        }
        if (updates.category !== undefined) {
            normalizedUpdates.category = updates.category;
        }
        if (updates.subcategory !== undefined) {
            normalizedUpdates.subcategory = normalizeOptionalText(updates.subcategory);
        }
        if (updates.jurisdiction !== undefined) {
            normalizedUpdates.jurisdiction = validateJurisdictions(updates.jurisdiction);
        }
        if (updates.structure !== undefined) {
            normalizedUpdates.structure = updates.structure;
        }
        if (updates.exampleContent !== undefined) {
            normalizedUpdates.exampleContent = updates.exampleContent;
        }
        if (updates.isPublic !== undefined) {
            normalizedUpdates.isPublic = updates.isPublic;
        }

        await ctx.db.patch(id, {
            ...normalizedUpdates,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "UPDATE",
            entityType: "templates",
            entityId: id,
            userId: user._id,
            changes: normalizedUpdates,
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
