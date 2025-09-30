-- CreateEnum
CREATE TYPE "public"."PlayerRole" AS ENUM ('MANAGER', 'PLAYER');

-- CreateTable
CREATE TABLE "public"."party_players" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "public"."PlayerRole" NOT NULL DEFAULT 'PLAYER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "party_players_party_id_user_id_key" ON "public"."party_players"("party_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."party_players" ADD CONSTRAINT "party_players_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."party_players" ADD CONSTRAINT "party_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
