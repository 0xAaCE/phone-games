-- CreateEnum
CREATE TYPE "public"."PartyStatus" AS ENUM ('WAITING', 'ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "public"."parties" (
    "id" TEXT NOT NULL,
    "party_name" TEXT NOT NULL,
    "game_name" TEXT NOT NULL,
    "status" "public"."PartyStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);
