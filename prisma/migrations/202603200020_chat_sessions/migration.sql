CREATE TABLE IF NOT EXISTS "agent_chat_sessions" (
  "id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'New chat',
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "agent_chat_sessions_agent_id_user_id_last_message_at_idx"
  ON "agent_chat_sessions"("agent_id", "user_id", "last_message_at");

DO $$
BEGIN
  ALTER TABLE "agent_chat_sessions"
    ADD CONSTRAINT "agent_chat_sessions_agent_id_fkey"
    FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "agent_chat_sessions"
    ADD CONSTRAINT "agent_chat_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "agent_chat_messages"
  ADD COLUMN IF NOT EXISTS "session_id" UUID;

CREATE INDEX IF NOT EXISTS "agent_chat_messages_session_id_created_at_idx"
  ON "agent_chat_messages"("session_id", "created_at");

DO $$
BEGIN
  ALTER TABLE "agent_chat_messages"
    ADD CONSTRAINT "agent_chat_messages_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "agent_chat_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
