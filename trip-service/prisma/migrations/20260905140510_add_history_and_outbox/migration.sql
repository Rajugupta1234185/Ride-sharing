-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('REQUESTED', 'MATCHED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "driverId" TEXT,
    "pickupLat" DECIMAL(65,30) NOT NULL,
    "pickupLng" DECIMAL(65,30) NOT NULL,
    "dropoffLat" DECIMAL(65,30) NOT NULL,
    "dropoffLng" DECIMAL(65,30) NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'REQUESTED',
    "fareEstimate" DECIMAL(65,30),
    "finalFare" DECIMAL(65,30),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStatusHistory" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
