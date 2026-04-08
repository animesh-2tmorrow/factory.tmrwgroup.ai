import { z } from "zod";

export const agentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or less")
    // Keep naming flexible for operators while still blocking obvious HTML token injection.
    .refine((value) => !/[<>]/.test(value), "Name cannot contain angle brackets"),
  platform: z.literal("CLOUD"),
  instructions: z.string().trim().max(2000, "Instructions are too long").optional(),
  runtimeProfile: z.enum(["GENERAL", "WEBSTER_EXTENSION"]).optional(),
  projectId: z.string().uuid().optional(),
  parentAgentId: z.string().uuid().optional(),
  workspaceId: z.string().trim().max(120).optional(),
  channelId: z.string().trim().max(120).optional(),
  webhookUrl: z.string().trim().url("Webhook URL must be valid").max(500).optional(),
});

export type AgentInput = z.infer<typeof agentSchema>;
