import { z } from "zod";

export const ventureSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or less")
    .regex(/^[a-z0-9-]+$/, "Lowercase alphanumeric and hyphens only"),
  type: z.enum([
    "microapp",
    "marketplace",
    "saas",
    "service",
    "fullstack",
    "api",
    "mobile",
    "pipeline",
  ]),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type VentureInput = z.infer<typeof ventureSchema>;
