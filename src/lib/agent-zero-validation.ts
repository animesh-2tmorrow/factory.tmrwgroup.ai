import { z } from "zod";

const trimmed = () => z.string().trim();
const optionalText = (max: number) => trimmed().max(max).optional();
const uuid = z.string().uuid();

export const projectCreateSchema = z.object({
  name: trimmed().min(2, "Project name must be at least 2 characters").max(80),
  slug: optionalText(80),
  description: optionalText(1_000),
  instructions: optionalText(5_000),
  workspaceRoot: optionalText(300),
  memoryIsolation: z.boolean().optional(),
});

export const projectUpdateSchema = z.object({
  name: optionalText(80),
  slug: optionalText(80),
  description: optionalText(1_000),
  instructions: optionalText(5_000),
  workspaceRoot: optionalText(300),
  memoryIsolation: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const skillScopeSchema = z.enum(["GLOBAL", "PROJECT"]);

export const skillCreateSchema = z.object({
  name: trimmed().min(2, "Skill name must be at least 2 characters").max(120),
  slug: optionalText(120),
  description: optionalText(1_000),
  content: trimmed().min(1, "Skill content is required").max(20_000),
  scope: skillScopeSchema.optional(),
  projectId: uuid.optional(),
  tags: z.array(trimmed().max(40)).max(20).optional(),
  isActive: z.boolean().optional(),
});

export const skillUpdateSchema = z.object({
  name: optionalText(120),
  slug: optionalText(120),
  description: optionalText(1_000),
  content: optionalText(20_000),
  scope: skillScopeSchema.optional(),
  projectId: z.union([uuid, z.literal(null)]).optional(),
  tags: z.array(trimmed().max(40)).max(20).optional(),
  isActive: z.boolean().optional(),
});

export const memoryKindSchema = z.enum(["NOTE", "FACT", "DECISION", "SUMMARY", "KNOWLEDGE"]);

export const memoryCreateSchema = z.object({
  kind: memoryKindSchema.optional(),
  title: optionalText(140),
  content: trimmed().min(1, "Memory content is required").max(10_000),
  projectId: uuid.optional(),
  agentId: uuid.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const memoryUpdateSchema = z.object({
  kind: memoryKindSchema.optional(),
  title: z.union([optionalText(140), z.literal(null)]).optional(),
  content: optionalText(10_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const taskStatusSchema = z.enum(["ACTIVE", "PAUSED", "FAILED"]);

export const scheduledTaskCreateSchema = z.object({
  title: trimmed().min(2).max(140),
  instruction: trimmed().min(1).max(8_000),
  cronExpr: trimmed().min(3).max(120),
  timezone: trimmed().min(1).max(120).optional(),
  status: taskStatusSchema.optional(),
  enabled: z.boolean().optional(),
  projectId: uuid.optional(),
  agentId: uuid.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const scheduledTaskUpdateSchema = z.object({
  title: optionalText(140),
  instruction: optionalText(8_000),
  cronExpr: optionalText(120),
  timezone: optionalText(120),
  status: taskStatusSchema.optional(),
  enabled: z.boolean().optional(),
  projectId: z.union([uuid, z.literal(null)]).optional(),
  agentId: z.union([uuid, z.literal(null)]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  nextRunAt: z.union([z.coerce.date(), z.literal(null)]).optional(),
  lastRunAt: z.union([z.coerce.date(), z.literal(null)]).optional(),
  lastError: z.union([optionalText(4_000), z.literal(null)]).optional(),
});

export const delegationSchema = z.object({
  parentAgentId: uuid,
  childAgentId: uuid,
});

export const a2aConnectionCreateSchema = z.object({
  name: trimmed().min(2).max(120),
  endpointUrl: z.string().trim().url("Endpoint URL must be valid").max(500),
  sharedSecret: optionalText(500),
  enabled: z.boolean().optional(),
  projectId: uuid.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const a2aConnectionUpdateSchema = z.object({
  name: optionalText(120),
  endpointUrl: z.string().trim().url("Endpoint URL must be valid").max(500).optional(),
  sharedSecret: z.union([optionalText(500), z.literal(null)]).optional(),
  enabled: z.boolean().optional(),
  projectId: z.union([uuid, z.literal(null)]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const a2aRelaySchema = z.object({
  connectionId: uuid,
  path: optionalText(200),
  payload: z.record(z.string(), z.unknown()),
});

export const voiceProfileUpsertSchema = z.object({
  projectId: z.union([uuid, z.literal(null)]).optional(),
  provider: z.enum(["BROWSER", "AWS"]).optional(),
  voiceName: z.union([optionalText(120), z.literal(null)]).optional(),
  sttEnabled: z.boolean().optional(),
  ttsEnabled: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export function isCronExpressionValid(value: string): boolean {
  const raw = value.trim();
  if (!raw) return false;
  if (raw.startsWith("@")) {
    return ["@yearly", "@annually", "@monthly", "@weekly", "@daily", "@hourly", "@reboot"].includes(raw);
  }
  const fields = raw.split(/\s+/);
  return fields.length === 5 || fields.length === 6;
}
