import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users table
    users: defineTable({
        email: v.string(),
        name: v.optional(v.string()),
        role: v.string(), // ADMIN, LEGISLATIVE_STAFF, BARANGAY_SECRETARY, CITY_COUNCIL, RESEARCHER
        organization: v.optional(v.string()),
        clerkId: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),

    // Drafts table - ordinance drafts
    drafts: defineTable({
        title: v.string(),
        documentType: v.string(), // ORDINANCE, RESOLUTION, MEMORANDUM, POLICY
        jurisdiction: v.string(), // barangay, city, municipal, provincial
        jurisdictionName: v.string(),
        content: v.any(), // JSON object with ordinance structure
        status: v.string(), // DRAFT, REVIEW, FINAL, ARCHIVED
        aiGenerated: v.boolean(),
        userId: v.id("users"),
        templateId: v.optional(v.id("templates")),
        version: v.number(),
        parentDraftId: v.optional(v.id("drafts")), // For versioning
        commitMessage: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"])
        .index("by_user_status", ["userId", "status"]),

    // Templates table
    templates: defineTable({
        name: v.string(),
        category: v.string(),
        subcategory: v.optional(v.string()),
        jurisdiction: v.array(v.string()),
        structure: v.any(), // Template structure with placeholders
        exampleContent: v.optional(v.any()),
        isPublic: v.boolean(),
        usageCount: v.number(),
        userId: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_category", ["category"])
        .index("by_public", ["isPublic"])
        .index("by_user", ["userId"]),

    // Compliance reports
    complianceReports: defineTable({
        draftId: v.id("drafts"),
        overallScore: v.number(), // 0-100
        isValid: v.boolean(),
        issuesCount: v.number(),
        warningsCount: v.number(),
        suggestionsCount: v.number(),
        issues: v.any(), // Array of compliance issues
        checkedAt: v.number(),
    }).index("by_draft", ["draftId"]),

    // Export history
    exportHistory: defineTable({
        draftId: v.id("drafts"),
        exportType: v.string(), // PDF, DOCX
        fileUrl: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        pageCount: v.optional(v.number()),
        exportedBy: v.id("users"),
        createdAt: v.number(),
    }).index("by_draft", ["draftId"]),

    // Audit logs
    auditLogs: defineTable({
        action: v.string(), // CREATE, UPDATE, DELETE, EXPORT, AI_GENERATE, etc.
        entityType: v.string(), // drafts, templates, etc.
        entityId: v.string(),
        userId: v.id("users"),
        changes: v.optional(v.any()),
        ipAddress: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_entity", ["entityType", "entityId"]),
});
