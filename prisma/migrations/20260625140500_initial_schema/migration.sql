-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'FINANCE', 'SUPPORT', 'DRIVER', 'PASSENGER');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DriverAvailability" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED_BY_PASSENGER', 'CANCELED_BY_DRIVER', 'CANCELED_BY_SYSTEM', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'PIX', 'CARD', 'WALLET', 'INVOICED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('RIDE_EARNING', 'PLATFORM_FEE', 'TENANT_FEE', 'PAYOUT', 'ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'SMS');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f766e',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "serviceArea" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "maxDrivers" INTEGER,
    "maxRidesMonth" INTEGER,
    "features" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassengerProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "document" TEXT,
    "birthDate" TIMESTAMP(3),
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PassengerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "document" TEXT,
    "licenseNumber" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'PENDING',
    "availability" "DriverAvailability" NOT NULL DEFAULT 'OFFLINE',
    "currentLat" DECIMAL(10,7),
    "currentLng" DECIMAL(10,7),
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 4,
    "acceptsMoto" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FareRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleCategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseFare" DECIMAL(10,2) NOT NULL,
    "pricePerKm" DECIMAL(10,2) NOT NULL,
    "pricePerMinute" DECIMAL(10,2) NOT NULL,
    "minimumFare" DECIMAL(10,2) NOT NULL,
    "cancellationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformCommissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "tenantCommissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FareRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "vehicleCategoryId" TEXT NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "originAddress" TEXT NOT NULL,
    "originLat" DECIMAL(10,7) NOT NULL,
    "originLng" DECIMAL(10,7) NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DECIMAL(10,7) NOT NULL,
    "destinationLng" DECIMAL(10,7) NOT NULL,
    "estimatedDistanceKm" DECIMAL(10,2) NOT NULL,
    "estimatedDurationMin" INTEGER NOT NULL,
    "estimatedPrice" DECIMAL(10,2) NOT NULL,
    "finalDistanceKm" DECIMAL(10,2),
    "finalDurationMin" INTEGER,
    "finalPrice" DECIMAL(10,2),
    "platformCommission" DECIMAL(10,2),
    "tenantCommission" DECIMAL(10,2),
    "paymentMethod" "PaymentMethod" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideStatusHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "from" "RideStatus",
    "to" "RideStatus" NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "driverId" TEXT,
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "heading" DECIMAL(6,2),
    "speedKmh" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "blockedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "rideId" TEXT,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPayout" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "DriverPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "maxDiscount" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "passengerId" TEXT,
    "driverId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant"("deletedAt");

-- CreateIndex
CREATE INDEX "TenantSetting_tenantId_idx" ON "TenantSetting"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key_key" ON "TenantSetting"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "TenantSubscription_tenantId_status_idx" ON "TenantSubscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantSubscription_planId_idx" ON "TenantSubscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE INDEX "Role_userId_idx" ON "Role"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_userId_name_key" ON "Role"("tenantId", "userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_roleId_action_subject_key" ON "Permission"("roleId", "action", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "PassengerProfile_userId_key" ON "PassengerProfile"("userId");

-- CreateIndex
CREATE INDEX "PassengerProfile_tenantId_idx" ON "PassengerProfile"("tenantId");

-- CreateIndex
CREATE INDEX "PassengerProfile_deletedAt_idx" ON "PassengerProfile"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE INDEX "DriverProfile_tenantId_availability_idx" ON "DriverProfile"("tenantId", "availability");

-- CreateIndex
CREATE INDEX "DriverProfile_tenantId_status_idx" ON "DriverProfile"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DriverProfile_deletedAt_idx" ON "DriverProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "DriverDocument_tenantId_status_idx" ON "DriverDocument"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_idx" ON "DriverDocument"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_status_idx" ON "Vehicle"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_tenantId_plate_key" ON "Vehicle"("tenantId", "plate");

-- CreateIndex
CREATE INDEX "VehicleCategory_tenantId_active_idx" ON "VehicleCategory"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_tenantId_slug_key" ON "VehicleCategory"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "FareRule_tenantId_active_idx" ON "FareRule"("tenantId", "active");

-- CreateIndex
CREATE INDEX "FareRule_vehicleCategoryId_idx" ON "FareRule"("vehicleCategoryId");

-- CreateIndex
CREATE INDEX "Ride_tenantId_status_idx" ON "Ride"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Ride_tenantId_requestedAt_idx" ON "Ride"("tenantId", "requestedAt");

-- CreateIndex
CREATE INDEX "Ride_passengerId_idx" ON "Ride"("passengerId");

-- CreateIndex
CREATE INDEX "Ride_driverId_idx" ON "Ride"("driverId");

-- CreateIndex
CREATE INDEX "RideStatusHistory_tenantId_rideId_idx" ON "RideStatusHistory"("tenantId", "rideId");

-- CreateIndex
CREATE INDEX "RideLocation_tenantId_rideId_createdAt_idx" ON "RideLocation"("tenantId", "rideId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_tenantId_status_idx" ON "Payment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Payment_rideId_idx" ON "Payment"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_driverId_key" ON "Wallet"("driverId");

-- CreateIndex
CREATE INDEX "Wallet_tenantId_idx" ON "Wallet"("tenantId");

-- CreateIndex
CREATE INDEX "WalletTransaction_tenantId_createdAt_idx" ON "WalletTransaction"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "DriverPayout_tenantId_status_idx" ON "DriverPayout"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DriverPayout_driverId_idx" ON "DriverPayout"("driverId");

-- CreateIndex
CREATE INDEX "Coupon_tenantId_active_idx" ON "Coupon"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_tenantId_code_key" ON "Coupon"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_rideId_key" ON "CouponUsage"("couponId", "rideId");

-- CreateIndex
CREATE INDEX "Rating_tenantId_rideId_idx" ON "Rating"("tenantId", "rideId");

-- CreateIndex
CREATE INDEX "Rating_driverId_idx" ON "Rating"("driverId");

-- CreateIndex
CREATE INDEX "Rating_passengerId_idx" ON "Rating"("passengerId");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_status_idx" ON "SupportTicket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterId_idx" ON "SupportTicket"("requesterId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_subject_subjectId_idx" ON "AuditLog"("subject", "subjectId");

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassengerProfile" ADD CONSTRAINT "PassengerProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassengerProfile" ADD CONSTRAINT "PassengerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleCategory" ADD CONSTRAINT "VehicleCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareRule" ADD CONSTRAINT "FareRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareRule" ADD CONSTRAINT "FareRule_vehicleCategoryId_fkey" FOREIGN KEY ("vehicleCategoryId") REFERENCES "VehicleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "PassengerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_vehicleCategoryId_fkey" FOREIGN KEY ("vehicleCategoryId") REFERENCES "VehicleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideStatusHistory" ADD CONSTRAINT "RideStatusHistory_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideStatusHistory" ADD CONSTRAINT "RideStatusHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideLocation" ADD CONSTRAINT "RideLocation_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideLocation" ADD CONSTRAINT "RideLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPayout" ADD CONSTRAINT "DriverPayout_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPayout" ADD CONSTRAINT "DriverPayout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "PassengerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
