-- Manual SQL patch for live Postgres databases when applying the richer listing field change
-- Repo note: this project currently uses `prisma db push` and does not yet keep Prisma migrations checked in.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VehicleType') THEN
    CREATE TYPE "VehicleType" AS ENUM ('PICKUP', 'BOX_TRUCK', 'CARGO_VAN', 'OTHER');
  END IF;
END $$;

ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "vehicleType" "VehicleType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS "boxSizeFeet" INTEGER,
  ADD COLUMN IF NOT EXISTS "passengerCapacity" INTEGER,
  ADD COLUMN IF NOT EXISTS "hasRamp" BOOLEAN NOT NULL DEFAULT false;
