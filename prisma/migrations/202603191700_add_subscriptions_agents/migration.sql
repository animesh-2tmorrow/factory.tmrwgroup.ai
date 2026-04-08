-- Create enums
CREATE TYPE "BillingPlan" AS ENUM ('FREE', 'STARTER', 'PRO');
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'PENDING', 'ACTIVE', 'CANCELED', 'PAST_DUE');
CREATE TYPE "AgentPlatform" AS ENUM ('SLACK', 'DISCORD');
CREATE TYPE "AgentStatus" AS ENUM ('QUEUED', 'PROVISIONING', 'RUNNING', 'FAILED', 'STOPPED');

-- Create subscriptions table
CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "plan" "BillingPlan" NOT NULL DEFAULT 'FREE',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
  "stripe_customer_id" TEXT,
  "stripe_checkout_session_id" TEXT,
  "current_period_end" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Create agents table
CREATE TABLE "agents" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "platform" "AgentPlatform" NOT NULL,
  "instructions" TEXT,
  "input_config" JSONB,
  "status" "AgentStatus" NOT NULL DEFAULT 'QUEUED',
  "ecs_cluster_arn" TEXT,
  "ecs_task_arn" TEXT,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- Uniques and indexes
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");
CREATE INDEX "agents_user_id_created_at_idx" ON "agents"("user_id", "created_at");

-- Foreign keys
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agents"
  ADD CONSTRAINT "agents_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
