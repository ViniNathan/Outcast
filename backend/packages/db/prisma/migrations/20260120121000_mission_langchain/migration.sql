-- AlterEnum
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MissionCategory" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MissionDifficulty" AS ENUM ('E', 'D', 'C', 'B', 'A', 'S');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MissionSource" AS ENUM ('AUTOMATIC', 'USER_REQUEST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "attributes" JSONB;

-- AlterTable
ALTER TABLE "Mission"
ADD COLUMN IF NOT EXISTS "category" "MissionCategory",
ADD COLUMN IF NOT EXISTS "title" TEXT,
ADD COLUMN IF NOT EXISTS "difficulty" "MissionDifficulty",
ADD COLUMN IF NOT EXISTS "xpPenalty" INTEGER,
ADD COLUMN IF NOT EXISTS "attributesRewarded" JSONB,
ADD COLUMN IF NOT EXISTS "progressCurrent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "progressTarget" INTEGER,
ADD COLUMN IF NOT EXISTS "progressUnit" TEXT,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "source" "MissionSource";

-- Backfill existing missions
UPDATE "Mission"
SET "category" = CASE
    WHEN "type" = 'WEEKLY' THEN 'WEEKLY'::"MissionCategory"
    ELSE 'DAILY'::"MissionCategory"
  END,
    "title" = COALESCE("title", "description"),
    "difficulty" = 'E'::"MissionDifficulty",
    "xpPenalty" = "penaltyXp",
    "progressTarget" = 1,
    "progressUnit" = 'acao',
    "source" = 'AUTOMATIC'::"MissionSource"
WHERE "category" IS NULL
   OR "title" IS NULL
   OR "difficulty" IS NULL
   OR "xpPenalty" IS NULL
   OR "progressTarget" IS NULL
   OR "progressUnit" IS NULL
   OR "source" IS NULL;

-- AlterTable
ALTER TABLE "Mission" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "Mission" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Mission" ALTER COLUMN "difficulty" SET NOT NULL;
ALTER TABLE "Mission" ALTER COLUMN "xpPenalty" SET NOT NULL;
ALTER TABLE "Mission" ALTER COLUMN "progressTarget" SET NOT NULL;
ALTER TABLE "Mission" ALTER COLUMN "progressUnit" SET NOT NULL;
ALTER TABLE "Mission" ALTER COLUMN "source" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Mission" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Mission" DROP COLUMN IF EXISTS "penaltyXp";

-- DropEnum
DROP TYPE IF EXISTS "MissionType";

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlayerSettings" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "autoMissionGeneration" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerSettings_playerId_key" ON "PlayerSettings"("playerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlayerSettings_playerId_autoMissionGeneration_idx" ON "PlayerSettings"("playerId", "autoMissionGeneration");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PlayerSettings" ADD CONSTRAINT "PlayerSettings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
