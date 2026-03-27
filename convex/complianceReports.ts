import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCurrentUser } from "./lib/currentUser";

const complianceIssueValidator = v.object({
    type: v.union(v.literal("critical"), v.literal("warning"), v.literal("suggestion")),
    section: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    suggestion: v.string(),
});

export const listByDraft = query({
    args: {
        draftId: v.id("drafts"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const draft = await ctx.db.get(args.draftId);
        if (!draft || draft.userId !== user._id) {
            return [];
        }

        const reports = await ctx.db
            .query("complianceReports")
            .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
            .collect();

        return reports
            .sort((a, b) => b.checkedAt - a.checkedAt)
            .slice(0, args.limit ?? 10);
    },
});

export const save = mutation({
    args: {
        draftId: v.id("drafts"),
        draftVersion: v.number(),
        revisionDraftId: v.optional(v.id("drafts")),
        overallScore: v.number(),
        isValid: v.boolean(),
        issues: v.array(complianceIssueValidator),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        const draft = await ctx.db.get(args.draftId);

        if (!draft || draft.userId !== user._id) {
            throw new Error("Draft not found");
        }

        const reportId = await ctx.db.insert("complianceReports", {
            draftId: args.draftId,
            draftVersion: args.draftVersion,
            revisionDraftId: args.revisionDraftId,
            overallScore: args.overallScore,
            isValid: args.isValid,
            issuesCount: args.issues.length,
            warningsCount: args.issues.filter((issue) => issue.type === "warning").length,
            suggestionsCount: args.issues.filter((issue) => issue.type === "suggestion").length,
            issues: args.issues,
            checkedAt: Date.now(),
        });

        await ctx.db.insert("auditLogs", {
            action: "CHECK_COMPLIANCE",
            entityType: "drafts",
            entityId: args.draftId,
            userId: user._id,
            changes: {
                complianceReportId: reportId,
                draftVersion: args.draftVersion,
                overallScore: args.overallScore,
                isValid: args.isValid,
                issuesCount: args.issues.length,
            },
            createdAt: Date.now(),
        });

        return reportId;
    },
});
