ALTER TABLE "SupportTicket" ADD COLUMN "rideId" TEXT;

CREATE INDEX "SupportTicket_tenantId_rideId_idx" ON "SupportTicket"("tenantId", "rideId");

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
