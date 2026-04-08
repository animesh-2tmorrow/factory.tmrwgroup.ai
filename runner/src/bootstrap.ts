import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

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

interface BootstrapConfig {
  enabled: boolean;
  profile: string;
  repo?: string;
  branch: string;
  workdir: string;
  installCommand?: string;
  buildCommand?: string;
  workspaceRoot: string;
}

function deriveWorkdirFromRepo(repo: string): string {
  const match = repo.match(/([^/:]+?)(?:\.git)?$/);
  return match?.[1] ?? "project";
}

function parseBootstrapConfig(workspaceRoot: string): BootstrapConfig {
  const repo = process.env.AGENT_BOOTSTRAP_REPO?.trim();
  const requested = process.env.AGENT_BOOTSTRAP_ENABLED === "1";
  const enabled = requested || Boolean(repo);
  const branch = process.env.AGENT_BOOTSTRAP_BRANCH?.trim() || "main";
  const workdir =
    process.env.AGENT_BOOTSTRAP_WORKDIR?.trim() ||
    (repo ? deriveWorkdirFromRepo(repo) : "workspace-project");

  return {
    enabled,
    profile: process.env.AGENT_RUNTIME_PROFILE ?? "GENERAL",
    repo,
    branch,
    workdir,
    installCommand: process.env.AGENT_BOOTSTRAP_INSTALL_COMMAND?.trim(),
    buildCommand: process.env.AGENT_BOOTSTRAP_BUILD_COMMAND?.trim(),
    workspaceRoot,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function runProcess(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number; label: string }
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  console.log(`[runner][bootstrap] ${options.label}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let combinedOutput = "";
    const append = (chunk: string) => {
      combinedOutput += chunk;
      if (combinedOutput.length > 8000) {
        combinedOutput = combinedOutput.slice(-8000);
      }
    };

    child.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      append(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (data: Buffer) => {
      const chunk = data.toString();
      append(chunk);
      process.stderr.write(chunk);
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${options.label} timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      const context = combinedOutput.trim();
      reject(new Error(`${options.label} failed with exit code ${code}${context ? `\n${context}` : ""}`));
    });
  });
}

async function runShell(command: string, cwd: string, label: string): Promise<void> {
  await runProcess("bash", ["-lc", command], { cwd, label });
}

async function setupGitSsh(summary: BootstrapSummary): Promise<void> {
  const keyB64 = process.env.AGENT_GIT_SSH_PRIVATE_KEY_B64?.trim();
  const keyPlain = process.env.AGENT_GIT_SSH_PRIVATE_KEY?.trim();
  const privateKey = keyB64
    ? Buffer.from(keyB64, "base64").toString("utf8").trim()
    : keyPlain;

  if (!privateKey) {
    summary.steps.push("ssh_key_missing");
    return;
  }

  const sshDir = join(homedir(), ".ssh");
  const keyPath = join(sshDir, "id_ed25519");
  const knownHostsPath = join(sshDir, "known_hosts");

  await mkdir(sshDir, { recursive: true, mode: 0o700 });
  await writeFile(keyPath, `${privateKey}\n`, { mode: 0o600 });
  await writeFile(knownHostsPath, "", { flag: "a", mode: 0o600 });

  process.env.GIT_SSH_COMMAND = `ssh -i ${keyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new`;
  summary.steps.push("ssh_key_ready");
}

async function ensureRepo(config: BootstrapConfig, summary: BootstrapSummary): Promise<void> {
  if (!config.repo) {
    throw new Error("Bootstrap is enabled but AGENT_BOOTSTRAP_REPO is missing");
  }

  const projectDir = summary.projectDir;
  const gitDir = join(projectDir, ".git");
  const hasProject = await pathExists(projectDir);
  const hasGit = await pathExists(gitDir);

  if (!hasProject) {
    await runShell(
      `git clone --depth 1 --branch ${config.branch} ${config.repo} ${projectDir}`,
      config.workspaceRoot,
      `clone repo ${config.repo}`
    );
    summary.steps.push("repo_cloned");
    return;
  }

  if (!hasGit) {
    summary.steps.push("project_exists_without_git");
    return;
  }

  await runShell(`git -C ${projectDir} fetch origin ${config.branch} --depth 1`, config.workspaceRoot, "git fetch");
  await runShell(`git -C ${projectDir} checkout ${config.branch}`, config.workspaceRoot, "git checkout");
  await runShell(`git -C ${projectDir} reset --hard origin/${config.branch}`, config.workspaceRoot, "git reset");
  summary.steps.push("repo_synced");
}

export async function bootstrapWorkspace(workspaceRoot: string): Promise<BootstrapSummary> {
  const config = parseBootstrapConfig(workspaceRoot);
  const summary: BootstrapSummary = {
    enabled: config.enabled,
    state: config.enabled ? "running" : "disabled",
    profile: config.profile,
    repo: config.repo,
    branch: config.branch,
    projectDir: join(config.workspaceRoot, config.workdir),
    steps: [],
    startedAt: new Date().toISOString(),
  };

  process.env.AGENT_PROJECT_DIR = summary.projectDir;
  process.env.AGENT_BOOTSTRAP_STATE = summary.state;

  if (!config.enabled) {
    summary.finishedAt = new Date().toISOString();
    process.env.AGENT_BOOTSTRAP_STATE = summary.state;
    return summary;
  }

  try {
    await setupGitSsh(summary);
    await ensureRepo(config, summary);

    if (config.installCommand) {
      await runShell(config.installCommand, summary.projectDir, `install dependencies: ${config.installCommand}`);
      summary.steps.push("install_complete");
    }

    if (config.buildCommand) {
      await runShell(config.buildCommand, summary.projectDir, `build project: ${config.buildCommand}`);
      summary.steps.push("build_complete");
    }

    summary.state = "ready";
  } catch (error) {
    summary.state = "failed";
    summary.error = error instanceof Error ? error.message : "Bootstrap failed";
  } finally {
    summary.finishedAt = new Date().toISOString();
    process.env.AGENT_BOOTSTRAP_STATE = summary.state;
  }

  return summary;
}
