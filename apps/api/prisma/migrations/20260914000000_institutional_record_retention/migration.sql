-- Preserve institutional records and prevent shared drafts from silently becoming personal records.
ALTER TABLE "Draft" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "WorkflowTransition" ADD COLUMN "organizationId" TEXT, ALTER COLUMN "actorId" DROP NOT NULL;
ALTER TABLE "ComplianceReport" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ExportHistory" ADD COLUMN "organizationId" TEXT, ALTER COLUMN "exportedBy" DROP NOT NULL;
ALTER TABLE "AuditLog" ADD COLUMN "organizationId" TEXT, ALTER COLUMN "userId" DROP NOT NULL;

-- Backfill organization ownership while the draft relationship is available.
UPDATE "WorkflowTransition" AS record SET "organizationId" = draft."organizationId" FROM "Draft" AS draft WHERE record."draftId" = draft."id";
UPDATE "ComplianceReport" AS record SET "organizationId" = draft."organizationId" FROM "Draft" AS draft WHERE record."draftId" = draft."id";
UPDATE "ExportHistory" AS record SET "organizationId" = draft."organizationId" FROM "Draft" AS draft WHERE record."draftId" = draft."id";
UPDATE "AuditLog" AS record SET "organizationId" = draft."organizationId" FROM "Draft" AS draft WHERE record."entityType" = 'drafts' AND record."entityId" = draft."id";

ALTER TABLE "Draft" DROP CONSTRAINT "Draft_userId_fkey";
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Draft" DROP CONSTRAINT "Draft_organizationId_fkey";
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowTransition" DROP CONSTRAINT "WorkflowTransition_actorId_fkey";
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceReport" ADD CONSTRAINT "ComplianceReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExportHistory" DROP CONSTRAINT "ExportHistory_exportedBy_fkey";
ALTER TABLE "ExportHistory" ADD CONSTRAINT "ExportHistory_exportedBy_fkey" FOREIGN KEY ("exportedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExportHistory" ADD CONSTRAINT "ExportHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Draft_organizationId_deletedAt_updatedAt_idx" ON "Draft"("organizationId", "deletedAt", "updatedAt");
CREATE INDEX "Draft_userId_deletedAt_updatedAt_idx" ON "Draft"("userId", "deletedAt", "updatedAt");
CREATE INDEX "WorkflowTransition_organizationId_createdAt_idx" ON "WorkflowTransition"("organizationId", "createdAt");
CREATE INDEX "ComplianceReport_organizationId_checkedAt_idx" ON "ComplianceReport"("organizationId", "checkedAt");
CREATE INDEX "ExportHistory_organizationId_createdAt_idx" ON "ExportHistory"("organizationId", "createdAt");
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");
