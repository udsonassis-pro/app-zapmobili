CREATE TABLE "SupportTicketEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" "SupportTicketStatus",
    "toStatus" "SupportTicketStatus",
    "fromPriority" INTEGER,
    "toPriority" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicketEvent_tenantId_createdAt_idx" ON "SupportTicketEvent"("tenantId", "createdAt");
CREATE INDEX "SupportTicketEvent_ticketId_createdAt_idx" ON "SupportTicketEvent"("ticketId", "createdAt");
CREATE INDEX "SupportTicketEvent_actorId_idx" ON "SupportTicketEvent"("actorId");

ALTER TABLE "SupportTicketEvent" ADD CONSTRAINT "SupportTicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicketEvent" ADD CONSTRAINT "SupportTicketEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicketEvent" ADD CONSTRAINT "SupportTicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
