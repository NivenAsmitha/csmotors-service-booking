-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_expires_at" TIMESTAMP(3),
ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT;

-- Existing internal users predate email verification and must remain usable.
UPDATE "users"
SET "email_verified" = true
WHERE "role" IN ('developer', 'admin', 'it_support', 'employee');
