-- Bring the deployed database in line with the enabled Better Auth plugins and draft models.
-- Legacy User.twoFactorSecret/twoFactorBackupCodes columns are intentionally retained.
ALTER TABLE "User"
    ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "banReason" TEXT,
    ADD COLUMN "banExpires" TIMESTAMP(3);

ALTER TABLE "Session"
    ADD COLUMN "activeOrganizationId" TEXT,
    ADD COLUMN "impersonatedBy" TEXT;

ALTER TABLE "Organization" ADD COLUMN "metadata" TEXT;

CREATE TABLE "TwoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TwoFactor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TwoFactor_secret_idx" ON "TwoFactor"("secret");
CREATE INDEX "TwoFactor_userId_idx" ON "TwoFactor"("userId");

ALTER TABLE "Draft"
    ADD COLUMN "organizationId" TEXT;
CREATE INDEX "Draft_organizationId_idx" ON "Draft"("organizationId");
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkflowTransition_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WorkflowTransition_draftId_idx" ON "WorkflowTransition"("draftId");
CREATE INDEX "WorkflowTransition_actorId_idx" ON "WorkflowTransition"("actorId");
