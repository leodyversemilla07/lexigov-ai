import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCurrentUser } from "./lib/currentUser";
import { extractDraftBody, normalizeDraftContent } from "../src/lib/draft-content";

const documentTypeValidator = v.union(
    v.literal("ORDINANCE"),
    v.literal("RESOLUTION"),
    v.literal("MEMORANDUM"),
    v.literal("POLICY"),
);
const jurisdictionValidator = v.union(
    v.literal("barangay"),
    v.literal("city"),
    v.literal("municipal"),
    v.literal("provincial"),
);
const statusValidator = v.union(
    v.literal("DRAFT"),
    v.literal("REVIEW"),
    v.literal("FINAL"),
    v.literal("ARCHIVED"),
);

function contentEquals(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function sanitizeFilename(title: string) {
    return title.replace(/[^a-z0-9]/gi, "_");
}

function validateTitle(title: string) {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 500) {
        throw new Error("Title must be between 5 and 500 characters");
    }

    return trimmedTitle;
}

function validateJurisdictionName(jurisdictionName: string) {
    const trimmedJurisdictionName = jurisdictionName.trim();
    if (!trimmedJurisdictionName) {
        throw new Error("Jurisdiction name is required");
    }

    return trimmedJurisdictionName;
}

function validateCommitMessage(commitMessage?: string) {
    if (commitMessage === undefined) {
        return undefined;
    }

    const trimmedCommitMessage = commitMessage.trim();
    if (trimmedCommitMessage.length > 500) {
        throw new Error("Commit message must be 500 characters or fewer");
    }

    return trimmedCommitMessage || undefined;
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

        const drafts = args.status
            ? await ctx.db
                .query("drafts")
                .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", args.status!))
                .collect()
            : await ctx.db
                .query("drafts")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect();

        const filtered = drafts.filter((d) => {
            if (d.parentDraftId) {
                return false;
            }

            return true;
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
        documentType: documentTypeValidator,
        jurisdiction: jurisdictionValidator,
        jurisdictionName: v.string(),
        aiGenerated: v.optional(v.boolean()),
        content: v.optional(v.any()),
        templateId: v.optional(v.id("templates")),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const now = Date.now();
        const title = validateTitle(args.title);
        const jurisdictionName = validateJurisdictionName(args.jurisdictionName);

        const draftId = await ctx.db.insert("drafts", {
            title,
            documentType: args.documentType,
            jurisdiction: args.jurisdiction,
            jurisdictionName,
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
        status: v.optional(statusValidator),
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
        const nextTitle = updates.title !== undefined ? validateTitle(updates.title) : draft.title;
        const nextContent = normalizeDraftContent(updates.content ?? draft.content);
        const nextStatus = updates.status ?? draft.status;
        const nextCommitMessage = validateCommitMessage(updates.commitMessage ?? draft.commitMessage);
        const hasMeaningfulChange =
            nextTitle !== draft.title ||
            nextStatus !== draft.status ||
            nextCommitMessage !== draft.commitMessage ||
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
            commitMessage: nextCommitMessage,
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
 * Restore a saved version into the current working draft.
 */
export const restoreVersion = mutation({
    args: {
        draftId: v.id("drafts"),
        versionId: v.id("drafts"),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const requestedDraft = await ctx.db.get(args.draftId);
        if (!requestedDraft || requestedDraft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        const rootDraft = requestedDraft.parentDraftId
            ? await ctx.db.get(requestedDraft.parentDraftId)
            : requestedDraft;
        if (!rootDraft || rootDraft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        const versionDraft = await ctx.db.get(args.versionId);
        if (!versionDraft || versionDraft.userId !== user._id) {
            throw new Error("Version not found");
        }

        const belongsToRoot =
            versionDraft._id === rootDraft._id || versionDraft.parentDraftId === rootDraft._id;
        if (!belongsToRoot) {
            throw new Error("Version does not belong to this draft");
        }

        if (versionDraft._id === rootDraft._id) {
            return {
                success: true,
                version: rootDraft.version,
                restoredFromVersion: versionDraft.version,
            };
        }

        const now = Date.now();
        const snapshotId = await ctx.db.insert("drafts", {
            title: rootDraft.title,
            documentType: rootDraft.documentType,
            jurisdiction: rootDraft.jurisdiction,
            jurisdictionName: rootDraft.jurisdictionName,
            content: normalizeDraftContent(rootDraft.content),
            status: rootDraft.status,
            aiGenerated: rootDraft.aiGenerated,
            userId: rootDraft.userId,
            templateId: rootDraft.templateId,
            version: rootDraft.version,
            parentDraftId: rootDraft._id,
            commitMessage: rootDraft.commitMessage,
            createdAt: now,
            updatedAt: rootDraft.updatedAt,
        });

        const historicalReports = await ctx.db
            .query("complianceReports")
            .withIndex("by_draft", (q) => q.eq("draftId", rootDraft._id))
            .collect();

        for (const report of historicalReports) {
            if (report.draftVersion === rootDraft.version && !report.revisionDraftId) {
                await ctx.db.patch(report._id, {
                    revisionDraftId: snapshotId,
                });
            }
        }

        await ctx.db.patch(rootDraft._id, {
            title: versionDraft.title,
            content: normalizeDraftContent(versionDraft.content),
            status: versionDraft.status,
            aiGenerated: versionDraft.aiGenerated,
            templateId: versionDraft.templateId,
            commitMessage: `Restore version v${versionDraft.version}`,
            version: rootDraft.version + 1,
            updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
            action: "RESTORE_VERSION",
            entityType: "drafts",
            entityId: rootDraft._id,
            userId: user._id,
            changes: {
                restoredFromVersion: versionDraft.version,
                previousVersion: rootDraft.version,
                nextVersion: rootDraft.version + 1,
                snapshotId,
            },
            createdAt: now,
        });

        return {
            success: true,
            version: rootDraft.version + 1,
            restoredFromVersion: versionDraft.version,
        };
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

        const [revisions, complianceReports, exportHistory] = await Promise.all([
            ctx.db
                .query("drafts")
                .withIndex("by_parent_draft", (q) => q.eq("parentDraftId", args.id))
                .collect(),
            ctx.db
                .query("complianceReports")
                .withIndex("by_draft", (q) => q.eq("draftId", args.id))
                .collect(),
            ctx.db
                .query("exportHistory")
                .withIndex("by_draft", (q) => q.eq("draftId", args.id))
                .collect(),
        ]);

        for (const revision of revisions) {
            await ctx.db.delete(revision._id);
        }

        for (const report of complianceReports) {
            await ctx.db.delete(report._id);
        }

        for (const exportRecord of exportHistory) {
            await ctx.db.delete(exportRecord._id);
        }

        await ctx.db.delete(args.id);

        await ctx.db.insert("auditLogs", {
            action: "DELETE",
            entityType: "drafts",
            entityId: args.id,
            userId: user._id,
            changes: {
                deletedRevisions: revisions.length,
                deletedComplianceReports: complianceReports.length,
                deletedExportRecords: exportHistory.length,
            },
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
