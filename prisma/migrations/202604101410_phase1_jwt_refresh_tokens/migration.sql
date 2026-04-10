ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT,
  ADD COLUMN IF NOT EXISTS "plan_id" TEXT NOT NULL DEFAULT 'free_trial',
  ADD COLUMN IF NOT EXISTS "plan_status" TEXT NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "quota_monthly_tokens" INTEGER NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS "bedrock_agent_id" TEXT,
  ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "token_prefix" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_used_at" TIMESTAMP(3),
  "user_agent" TEXT,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_prefix_idx" ON "refresh_tokens"("token_prefix");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_user_id_fkey') THEN
    ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "refresh_tokens_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "monthly_quota" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "period_start" DATE NOT NULL,
  "period_end" DATE NOT NULL,
  "tokens_included" INTEGER NOT NULL,
  "tokens_used" INTEGER NOT NULL DEFAULT 0,
  "overage_tokens" INTEGER NOT NULL DEFAULT 0,
  "overage_charged_cents" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "monthly_quota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "monthly_quota_user_id_period_start_key" ON "monthly_quota"("user_id", "period_start");
CREATE INDEX IF NOT EXISTS "monthly_quota_user_id_period_start_idx" ON "monthly_quota"("user_id", "period_start");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_quota_user_id_fkey') THEN
    ALTER TABLE "monthly_quota"
      ADD CONSTRAINT "monthly_quota_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;