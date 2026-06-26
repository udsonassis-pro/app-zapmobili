-- CreateTable
CREATE TABLE "DriverRideDecline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverRideDecline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverRideDecline_rideId_driverId_key" ON "DriverRideDecline"("rideId", "driverId");

-- CreateIndex
CREATE INDEX "DriverRideDecline_tenantId_driverId_idx" ON "DriverRideDecline"("tenantId", "driverId");

-- CreateIndex
CREATE INDEX "DriverRideDecline_tenantId_rideId_idx" ON "DriverRideDecline"("tenantId", "rideId");

-- AddForeignKey
ALTER TABLE "DriverRideDecline" ADD CONSTRAINT "DriverRideDecline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRideDecline" ADD CONSTRAINT "DriverRideDecline_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRideDecline" ADD CONSTRAINT "DriverRideDecline_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
