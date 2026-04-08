-- Agent Zero parity foundations: projects, skills, memory, scheduler, delegation, A2A, voice

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SkillScope') THEN
    CREATE TYPE "SkillScope" AS ENUM ('GLOBAL', 'PROJECT');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemoryKind') THEN
    CREATE TYPE "MemoryKind" AS ENUM ('NOTE', 'FACT', 'DECISION', 'SUMMARY', 'KNOWLEDGE');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskStatus') THEN
    CREATE TYPE "TaskStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FAILED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoiceProvider') THEN
    CREATE TYPE "VoiceProvider" AS ENUM ('BROWSER', 'AWS');
  END IF;
END
$$;

ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "project_id" UUID,
  ADD COLUMN IF NOT EXISTS "parent_agent_id" UUID;

CREATE TABLE IF NOT EXISTS "projects" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "workspace_root" TEXT,
  "memory_isolation" BOOLEAN NOT NULL DEFAULT true,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "skills" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "scope" "SkillScope" NOT NULL DEFAULT 'GLOBAL',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "tags" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "memory_entries" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "agent_id" UUID,
  "kind" "MemoryKind" NOT NULL DEFAULT 'NOTE',
  "title" TEXT,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "scheduled_tasks" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "agent_id" UUID,
  "title" TEXT NOT NULL,
  "instruction" TEXT NOT NULL,
  "cron_expr" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "status" "TaskStatus" NOT NULL DEFAULT 'ACTIVE',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "next_run_at" TIMESTAMP(3),
  "last_run_at" TIMESTAMP(3),
  "last_error" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "a2a_connections" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "name" TEXT NOT NULL,
  "endpoint_url" TEXT NOT NULL,
  "shared_secret" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "a2a_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "voice_profiles" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "provider" "VoiceProvider" NOT NULL DEFAULT 'BROWSER',
  "voice_name" TEXT,
  "stt_enabled" BOOLEAN NOT NULL DEFAULT true,
  "tts_enabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voice_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "projects_user_id_slug_key" ON "projects"("user_id", "slug");
CREATE INDEX IF NOT EXISTS "projects_user_id_created_at_idx" ON "projects"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "skills_user_id_scope_created_at_idx" ON "skills"("user_id", "scope", "created_at");
CREATE INDEX IF NOT EXISTS "skills_project_id_created_at_idx" ON "skills"("project_id", "created_at");

CREATE INDEX IF NOT EXISTS "memory_entries_user_id_created_at_idx" ON "memory_entries"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "memory_entries_project_id_created_at_idx" ON "memory_entries"("project_id", "created_at");
CREATE INDEX IF NOT EXISTS "memory_entries_agent_id_created_at_idx" ON "memory_entries"("agent_id", "created_at");

CREATE INDEX IF NOT EXISTS "scheduled_tasks_user_id_status_created_at_idx" ON "scheduled_tasks"("user_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "scheduled_tasks_project_id_created_at_idx" ON "scheduled_tasks"("project_id", "created_at");
CREATE INDEX IF NOT EXISTS "scheduled_tasks_agent_id_created_at_idx" ON "scheduled_tasks"("agent_id", "created_at");

CREATE INDEX IF NOT EXISTS "a2a_connections_user_id_created_at_idx" ON "a2a_connections"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "a2a_connections_project_id_created_at_idx" ON "a2a_connections"("project_id", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "voice_profiles_user_id_project_id_key" ON "voice_profiles"("user_id", "project_id");
CREATE INDEX IF NOT EXISTS "voice_profiles_user_id_created_at_idx" ON "voice_profiles"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "agents_project_id_created_at_idx" ON "agents"("project_id", "created_at");
CREATE INDEX IF NOT EXISTS "agents_parent_agent_id_created_at_idx" ON "agents"("parent_agent_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_user_id_fkey') THEN
    ALTER TABLE "projects"
      ADD CONSTRAINT "projects_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skills_user_id_fkey') THEN
    ALTER TABLE "skills"
      ADD CONSTRAINT "skills_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skills_project_id_fkey') THEN
    ALTER TABLE "skills"
      ADD CONSTRAINT "skills_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_entries_user_id_fkey') THEN
    ALTER TABLE "memory_entries"
      ADD CONSTRAINT "memory_entries_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_entries_project_id_fkey') THEN
    ALTER TABLE "memory_entries"
      ADD CONSTRAINT "memory_entries_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_entries_agent_id_fkey') THEN
    ALTER TABLE "memory_entries"
      ADD CONSTRAINT "memory_entries_agent_id_fkey"
      FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_tasks_user_id_fkey') THEN
    ALTER TABLE "scheduled_tasks"
      ADD CONSTRAINT "scheduled_tasks_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_tasks_project_id_fkey') THEN
    ALTER TABLE "scheduled_tasks"
      ADD CONSTRAINT "scheduled_tasks_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_tasks_agent_id_fkey') THEN
    ALTER TABLE "scheduled_tasks"
      ADD CONSTRAINT "scheduled_tasks_agent_id_fkey"
      FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'a2a_connections_user_id_fkey') THEN
    ALTER TABLE "a2a_connections"
      ADD CONSTRAINT "a2a_connections_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'a2a_connections_project_id_fkey') THEN
    ALTER TABLE "a2a_connections"
      ADD CONSTRAINT "a2a_connections_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voice_profiles_user_id_fkey') THEN
    ALTER TABLE "voice_profiles"
      ADD CONSTRAINT "voice_profiles_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voice_profiles_project_id_fkey') THEN
    ALTER TABLE "voice_profiles"
      ADD CONSTRAINT "voice_profiles_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_project_id_fkey') THEN
    ALTER TABLE "agents"
      ADD CONSTRAINT "agents_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_parent_agent_id_fkey') THEN
    ALTER TABLE "agents"
      ADD CONSTRAINT "agents_parent_agent_id_fkey"
      FOREIGN KEY ("parent_agent_id") REFERENCES "agents"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
