-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('FINANZAS', 'LEGAL', 'COMPRAS', 'OPERACIONES');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('PENDIENTE', 'COMPLETADA', 'FALLIDA');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "requestText" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "category" "TicketCategory",
    "priority" "TicketPriority",
    "summary" TEXT,
    "classificationStatus" "ClassificationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "classificationError" TEXT,
    "classifiedAt" TIMESTAMP(3),
    "status" "TicketStatus" NOT NULL DEFAULT 'ABIERTO',
    "assignee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_category_idx" ON "Ticket"("category");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_ticketId_idx" ON "Comment"("ticketId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
