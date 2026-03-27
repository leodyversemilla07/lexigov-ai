import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCurrentUser } from "./lib/currentUser";
import { extractDraftBody, normalizeDraftContent } from "../lib/draft-content";

function contentEquals(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function sanitizeFilename(title: string) {
    return title.replace(/[^a-z0-9]/gi, "_");
}

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

        const filtered = drafts.filter((d) => {
            if (d.parentDraftId) {
                return false;
            }

            return args.status ? d.status === args.status : true;
        });

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
 * List saved versions for a draft, including the current working version.
 */
export const listVersions = query({
    args: { draftId: v.id("drafts") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const requestedDraft = await ctx.db.get(args.draftId);
        if (!requestedDraft || requestedDraft.userId !== user._id) {
            return [];
        }

        const rootDraft =
            requestedDraft.parentDraftId
                ? await ctx.db.get(requestedDraft.parentDraftId)
                : requestedDraft;

        if (!rootDraft || rootDraft.userId !== user._id) {
            return [];
        }

        const revisions = await ctx.db
            .query("drafts")
            .withIndex("by_parent_draft", (q) => q.eq("parentDraftId", rootDraft._id))
            .collect();

        return [...revisions, rootDraft]
            .sort((a, b) => b.version - a.version)
            .map((draftVersion) => ({
                _id: draftVersion._id,
                title: draftVersion.title,
                status: draftVersion.status,
                version: draftVersion.version,
                updatedAt: draftVersion.updatedAt,
                createdAt: draftVersion.createdAt,
                commitMessage: draftVersion.commitMessage,
                isCurrent: draftVersion._id === rootDraft._id,
                body: extractDraftBody(draftVersion.content),
            }));
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
        aiGenerated: v.optional(v.boolean()),
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
            content: normalizeDraftContent(args.content ?? {}),
            status: "DRAFT",
            aiGenerated: args.aiGenerated ?? false,
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
        if (draft.parentDraftId) {
            throw new Error("Saved revisions are read-only");
        }

        const now = Date.now();
        const { id, ...updates } = args;
        const nextTitle = updates.title ?? draft.title;
        const nextContent = normalizeDraftContent(updates.content ?? draft.content);
        const nextStatus = updates.status ?? draft.status;
        const hasMeaningfulChange =
            nextTitle !== draft.title ||
            nextStatus !== draft.status ||
            !contentEquals(nextContent, draft.content);

        if (!hasMeaningfulChange) {
            return { success: true, version: draft.version };
        }

        const snapshotId = await ctx.db.insert("drafts", {
            title: draft.title,
            documentType: draft.documentType,
            jurisdiction: draft.jurisdiction,
            jurisdictionName: draft.jurisdictionName,
            content: normalizeDraftContent(draft.content),
            status: draft.status,
            aiGenerated: draft.aiGenerated,
            userId: draft.userId,
            templateId: draft.templateId,
            version: draft.version,
            parentDraftId: draft._id,
            commitMessage: draft.commitMessage,
            createdAt: now,
            updatedAt: draft.updatedAt,
        });

        const historicalReports = await ctx.db
            .query("complianceReports")
            .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
            .collect();

        for (const report of historicalReports) {
            if (report.draftVersion === draft.version && !report.revisionDraftId) {
                await ctx.db.patch(report._id, {
                    revisionDraftId: snapshotId,
                });
            }
        }

        await ctx.db.patch(id, {
            title: nextTitle,
            content: nextContent,
            status: nextStatus,
            commitMessage: updates.commitMessage ?? draft.commitMessage,
            version: draft.version + 1,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "UPDATE",
            entityType: "drafts",
            entityId: id,
            userId: user._id,
            changes: {
                ...updates,
                previousVersion: draft.version,
                nextVersion: draft.version + 1,
                snapshotId,
            },
            createdAt: now,
        });

        return { success: true, version: draft.version + 1 };
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
        if (draft.parentDraftId) {
            throw new Error("Saved revisions cannot be deleted directly");
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

/**
 * Export a draft to various formats
 */
export const exportDraft = mutation({
    args: {
        id: v.id("drafts"),
        format: v.union(v.literal("txt"), v.literal("md")),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const draft = await ctx.db.get(args.id);
        if (!draft || draft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        const content = typeof draft.content === "string" 
            ? draft.content
            : extractDraftBody(draft.content);

        const formattedContent = formatForExport(draft, content, args.format);
        
        await ctx.db.insert("exportHistory", {
            draftId: args.id,
            exportType: args.format.toUpperCase(),
            exportedBy: user._id,
            createdAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            action: "EXPORT",
            entityType: "drafts",
            entityId: args.id,
            userId: user._id,
            changes: { format: args.format, version: draft.version },
            createdAt: Date.now(),
        });

        return {
            filename: `${sanitizeFilename(draft.title)}_v${draft.version}.${args.format}`,
            content: formattedContent,
            mimeType: getMimeType(args.format),
        };
    },
});

/**
 * Record an export that was generated on the client.
 */
export const recordExport = mutation({
    args: {
        id: v.id("drafts"),
        format: v.union(v.literal("txt"), v.literal("md"), v.literal("docx"), v.literal("pdf")),
        fileSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const draft = await ctx.db.get(args.id);
        if (!draft || draft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        const now = Date.now();

        await ctx.db.insert("exportHistory", {
            draftId: args.id,
            exportType: args.format.toUpperCase(),
            fileSize: args.fileSize,
            exportedBy: user._id,
            createdAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "EXPORT",
            entityType: "drafts",
            entityId: args.id,
            userId: user._id,
            changes: {
                format: args.format,
                version: draft.version,
                fileSize: args.fileSize,
            },
            createdAt: now,
        });

        return {
            success: true,
            filename: `${sanitizeFilename(draft.title)}_v${draft.version}.${args.format}`,
        };
    },
});

function formatForExport(
    draft: { title: string; documentType: string; jurisdiction: string; jurisdictionName: string; version: number; status: string },
    content: string,
    format: string,
): string {
    const header = `${draft.documentType.toUpperCase()}\n${draft.title}\n${draft.jurisdictionName} (${draft.jurisdiction.toUpperCase()})\nVersion: ${draft.version}\nStatus: ${draft.status}\n${"=".repeat(50)}\n\n`;
    
    if (format === "md") {
        return `# ${draft.title}\n\n**Type:** ${draft.documentType}\n**Jurisdiction:** ${draft.jurisdictionName}\n**Version:** ${draft.version}\n**Status:** ${draft.status}\n\n---\n\n${content}`;
    }
    
    return header + content;
}

function getMimeType(format: string): string {
    switch (format) {
        case "txt": return "text/plain";
        case "md": return "text/markdown";
        default: return "text/plain";
    }
}
