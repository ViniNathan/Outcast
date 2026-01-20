-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "statRewardCode" TEXT,
ADD COLUMN     "statRewardValue" INTEGER;

-- AlterTable
ALTER TABLE "PlayerSettings" ALTER COLUMN "autoMissionGeneration" SET DEFAULT false;
