type BootstrapState = "disabled" | "running" | "ready" | "failed";
export interface BootstrapSummary {
    enabled: boolean;
    state: BootstrapState;
    profile: string;
    repo?: string;
    branch?: string;
    projectDir: string;
    steps: string[];
    error?: string;
    startedAt: string;
    finishedAt?: string;
}
export declare function bootstrapWorkspace(workspaceRoot: string): Promise<BootstrapSummary>;
export {};
