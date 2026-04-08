export type RuntimeProfileId = "GENERAL" | "WEBSTER_EXTENSION";

export interface RuntimeBootstrapConfig {
  repo?: string;
  branch?: string;
  workdir?: string;
  installCommand?: string;
  buildCommand?: string;
}

export interface RuntimeProfileDefinition {
  id: RuntimeProfileId;
  label: string;
  summary: string;
  runtime: string;
  toolsLabel: string;
  bootstrap?: RuntimeBootstrapConfig;
}

export const DEFAULT_RUNTIME_PROFILE: RuntimeProfileId = "GENERAL";

export const RUNTIME_PROFILES: Record<RuntimeProfileId, RuntimeProfileDefinition> = {
  GENERAL: {
    id: "GENERAL",
    label: "TMRW Cloud Runtime",
    summary: "General-purpose cloud runtime for coding, ops, and research.",
    runtime: "AWS ECS Fargate",
    toolsLabel: "Shell, Read/Write, Web",
  },
  WEBSTER_EXTENSION: {
    id: "WEBSTER_EXTENSION",
    label: "Webster Chrome Runtime",
    summary: "Prepares the Webster Chrome extension workspace on startup.",
    runtime: "AWS ECS Fargate",
    toolsLabel: "Shell, Git, npm, Build",
    bootstrap: {
      repo: "git@github.com:tmrwgroup/webster-chrome-extension.git",
      branch: "main",
      workdir: "webster-chrome-extension",
      installCommand: "npm ci",
      buildCommand: "npm run build",
    },
  },
};

export function normalizeRuntimeProfile(input: unknown): RuntimeProfileId {
  if (typeof input !== "string") return DEFAULT_RUNTIME_PROFILE;
  const value = input.trim().toUpperCase();
  if (value === "WEBSTER_EXTENSION") return "WEBSTER_EXTENSION";
  return DEFAULT_RUNTIME_PROFILE;
}

export function runtimeProfileLabel(profile: RuntimeProfileId): string {
  return RUNTIME_PROFILES[profile].label;
}

export function runtimeProfileBootstrap(profile: RuntimeProfileId): RuntimeBootstrapConfig | undefined {
  return RUNTIME_PROFILES[profile].bootstrap;
}
