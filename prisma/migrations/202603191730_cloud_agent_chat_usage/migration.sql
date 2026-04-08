-- Add CLOUD platform option
ALTER TYPE "AgentPlatform" ADD VALUE IF NOT EXISTS 'CLOUD';

-- Add chat role enum
DO $$
BEGIN
  CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Extend agents table for cloud runtime metadata
ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "ecs_service_arn" TEXT,
  ADD COLUMN IF NOT EXISTS "cloud_chat_endpoint" TEXT,
  ADD COLUMN IF NOT EXISTS "mcp_endpoint" TEXT,
  ADD COLUMN IF NOT EXISTS "model_name" TEXT;

-- Usage events table
CREATE TABLE IF NOT EXISTS "agent_usage_events" (
  "id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "model" TEXT NOT NULL,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "latency_ms" INTEGER NOT NULL DEFAULT 0,
  "tool_calls" JSONB,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "agent_usage_events_agent_id_created_at_idx"
  ON "agent_usage_events"("agent_id", "created_at");

CREATE INDEX IF NOT EXISTS "agent_usage_events_user_id_created_at_idx"
  ON "agent_usage_events"("user_id", "created_at");

DO $$
BEGIN
  ALTER TABLE "agent_usage_events"
    ADD CONSTRAINT "agent_usage_events_agent_id_fkey"
    FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "agent_usage_events"
    ADD CONSTRAINT "agent_usage_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Chat message history table
CREATE TABLE IF NOT EXISTS "agent_chat_messages" (
  "id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "ChatRole" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "agent_chat_messages_agent_id_created_at_idx"
  ON "agent_chat_messages"("agent_id", "created_at");

CREATE INDEX IF NOT EXISTS "agent_chat_messages_user_id_created_at_idx"
  ON "agent_chat_messages"("user_id", "created_at");

DO $$
BEGIN
  ALTER TABLE "agent_chat_messages"
    ADD CONSTRAINT "agent_chat_messages_agent_id_fkey"
    FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "agent_chat_messages"
    ADD CONSTRAINT "agent_chat_messages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
