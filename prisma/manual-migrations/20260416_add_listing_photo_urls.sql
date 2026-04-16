-- Manual SQL patch for live Postgres databases when applying the photo gallery change
-- Repo note: this project currently uses `prisma db push` and does not yet keep Prisma migrations checked in.

ALTER TABLE "Listing"
ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
