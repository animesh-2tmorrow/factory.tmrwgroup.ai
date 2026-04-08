-- Security hardening: Store per-agent EFS access point ID for lifecycle management.
-- Each agent gets a dedicated EFS access point that jails it into its own directory,
-- preventing cross-tenant workspace visibility. The ID is stored here so it can be
-- cleaned up when the agent is stopped or deleted.
ALTER TABLE "agents" ADD COLUMN "efs_access_point_id" TEXT;
