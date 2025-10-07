-- DropIndex
DROP INDEX "public"."users_username_key";

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL;
