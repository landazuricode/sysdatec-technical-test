-- CreateTable
CREATE TABLE "Assignee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignee_name_key" ON "Assignee"("name");

-- Add ticketNumber with auto-increment
CREATE SEQUENCE "Ticket_ticketNumber_seq";
ALTER TABLE "Ticket" ADD COLUMN "ticketNumber" INTEGER;
UPDATE "Ticket" SET "ticketNumber" = nextval('"Ticket_ticketNumber_seq"') WHERE "ticketNumber" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "ticketNumber" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "ticketNumber" SET DEFAULT nextval('"Ticket_ticketNumber_seq"');
ALTER SEQUENCE "Ticket_ticketNumber_seq" OWNED BY "Ticket"."ticketNumber";

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_ticketNumber_idx" ON "Ticket"("ticketNumber");

-- Migrate existing assignee strings to Assignee records
INSERT INTO "Assignee" ("id", "name", "createdAt")
SELECT
    'asg_' || substr(md5(trim("assignee")), 1, 20),
    trim("assignee"),
    CURRENT_TIMESTAMP
FROM "Ticket"
WHERE "assignee" IS NOT NULL AND trim("assignee") <> ''
ON CONFLICT ("name") DO NOTHING;

-- Add assigneeId foreign key
ALTER TABLE "Ticket" ADD COLUMN "assigneeId" TEXT;

UPDATE "Ticket" AS t
SET "assigneeId" = a."id"
FROM "Assignee" AS a
WHERE trim(t."assignee") = a."name";

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "Assignee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old assignee column
ALTER TABLE "Ticket" DROP COLUMN "assignee";
