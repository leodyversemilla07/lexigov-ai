ALTER TABLE "ExportHistory" ADD COLUMN "draftVersion" INTEGER, ADD COLUMN "titleSnapshot" TEXT;

UPDATE "ExportHistory" AS history
SET "draftVersion" = draft."version", "titleSnapshot" = draft."title"
FROM "Draft" AS draft
WHERE history."draftId" = draft."id";

-- Historical rows whose parent draft was previously deleted retain explicit unknown markers.
UPDATE "ExportHistory" SET "draftVersion" = 0 WHERE "draftVersion" IS NULL;
UPDATE "ExportHistory" SET "titleSnapshot" = '[unavailable historical title]' WHERE "titleSnapshot" IS NULL;

ALTER TABLE "ExportHistory" ALTER COLUMN "draftVersion" SET NOT NULL;
ALTER TABLE "ExportHistory" ALTER COLUMN "titleSnapshot" SET NOT NULL;
CREATE INDEX "ExportHistory_draftId_draftVersion_idx" ON "ExportHistory"("draftId", "draftVersion");
