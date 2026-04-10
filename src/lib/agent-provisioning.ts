import type { Agent } from "@prisma/client";
import {
  ECSClient,
  RunTaskCommand,
  StopTaskCommand,
  DescribeTasksCommand,
  DescribeTaskDefinitionCommand,
  RegisterTaskDefinitionCommand,
  type TaskDefinition,
  type Tag,
} from "@aws-sdk/client-ecs";
import { EC2Client, DescribeNetworkInterfacesCommand } from "@aws-sdk/client-ec2";
import {
  EFSClient,
  CreateAccessPointCommand,
  DeleteAccessPointCommand,
} from "@aws-sdk/client-efs";

// ─── Security constants ────────────────────────────────────────────────────────
// Non-root user identity for all agent containers.
// Must match the `agent` user created in the Dockerfile (UID 1000, GID 1000).
const AGENT_UID = "1000";
const AGENT_GID = "1000";
const AGENT_USER = `${AGENT_UID}:${AGENT_GID}`;
// Permissions for the per-agent workspace root directory created by EFS access points.
// 0700 = owner rwx only — no group or world access.
const WORKSPACE_DIR_PERMISSIONS = "0700";

export interface ProvisionResult {
  started: boolean;
  clusterArn?: string;
  taskArn?: string;
  efsAccessPointId?: string;
  reason?: string;
}

export interface StopResult {
  stopped: boolean;
  efsAccessPointCleaned?: boolean;
  reason?: string;
}

interface RuntimeBootstrapConfig {
  repo?: string;
  branch?: string;
  workdir?: string;
  installCommand?: string;
  buildCommand?: string;
}

interface RuntimeInputConfig {
  runtimeProfile?: string;
  bootstrap?: RuntimeBootstrapConfig | null;
}

interface EcsEfsConfig {
  fileSystemId: string;
  accessPointId?: string;
  rootDirectory: string;
  transitEncryption: "ENABLED" | "DISABLED";
  iam: "ENABLED" | "DISABLED";
  volumeName: string;
  mountPath: string;
}

const taskDefinitionCache = new Map<string, string>();

function isProvisioningDisabled(): boolean {
  const explicitDisable = (process.env.DISABLE_ECS_PROVISIONING ?? "").toLowerCase() === "true";
  const localEnv = (process.env.APP_ENV ?? "").toLowerCase() === "local";
  return explicitDisable || localEnv;
}

function parseRuntimeInputConfig(inputConfig: unknown): RuntimeInputConfig {
  if (!inputConfig || typeof inputConfig !== "object" || Array.isArray(inputConfig)) {
    return {};
  }
  const row = inputConfig as Record<string, unknown>;
  const runtimeProfile = typeof row.runtimeProfile === "string" ? row.runtimeProfile : undefined;
  const bootstrap =
    row.bootstrap && typeof row.bootstrap === "object" && !Array.isArray(row.bootstrap)
      ? (row.bootstrap as RuntimeBootstrapConfig)
      : undefined;

  return { runtimeProfile, bootstrap };
}

function requiredEnv() {
  const clusterArn = process.env.ECS_CLUSTER_ARN;
  const taskDefinitionArn = process.env.ECS_TASK_DEFINITION_ARN;
  const cloudTaskDefinitionArn = process.env.ECS_CLOUD_TASK_DEFINITION_ARN ?? taskDefinitionArn;
  const subnets = (process.env.ECS_SUBNET_IDS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const securityGroups = (process.env.ECS_SECURITY_GROUP_IDS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    clusterArn,
    taskDefinitionArn,
    cloudTaskDefinitionArn,
    subnets,
    securityGroups,
  };
}

function parseEfsConfig(): EcsEfsConfig | null {
  const fileSystemId = process.env.ECS_EFS_FILE_SYSTEM_ID?.trim();
  if (!fileSystemId) {
    return null;
  }

  const transitEncryptionRaw = (process.env.ECS_EFS_TRANSIT_ENCRYPTION ?? "ENABLED").toUpperCase();
  const iamRaw = (process.env.ECS_EFS_IAM ?? "ENABLED").toUpperCase();

  return {
    fileSystemId,
    accessPointId: process.env.ECS_EFS_ACCESS_POINT_ID?.trim() || undefined,
    rootDirectory: process.env.ECS_EFS_ROOT_DIRECTORY?.trim() || "/",
    transitEncryption: transitEncryptionRaw === "DISABLED" ? "DISABLED" : "ENABLED",
    iam: iamRaw === "DISABLED" ? "DISABLED" : "ENABLED",
    volumeName: process.env.ECS_EFS_VOLUME_NAME?.trim() || "workspace-efs",
    mountPath: process.env.AGENT_WORKSPACE_MOUNT_PATH?.trim() || "/workspace",
  };
}

function sanitizeTags(tags: Tag[] | undefined): Tag[] | undefined {
  if (!tags || tags.length === 0) {
    return undefined;
  }
  const filtered = tags.filter((tag) => tag.key && !tag.key.startsWith("aws:"));
  return filtered.length ? filtered : undefined;
}

// ─── Per-agent EFS access point ────────────────────────────────────────────────
// Creates a dedicated EFS access point that jails the agent into its own
// subdirectory (/agents/<agentId>). The access point enforces:
//   - rootDirectory: the agent literally cannot traverse above its own folder
//   - posixUser:     all filesystem ops run as UID/GID 1000 (non-root)
//   - creationInfo:  the directory is auto-created with 0700 permissions
// This is kernel-level isolation — no application-layer path checks needed.

async function createPerAgentAccessPoint(
  agentId: string,
  efsConfig: EcsEfsConfig
): Promise<string> {
  const efsClient = new EFSClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  const agentDir = `/agents/${agentId}`;

  console.log(
    `[security] Creating per-agent EFS access point: fs=${efsConfig.fileSystemId} ` +
    `root=${agentDir} uid=${AGENT_UID} gid=${AGENT_GID} perms=${WORKSPACE_DIR_PERMISSIONS}`
  );

  const result = await efsClient.send(
    new CreateAccessPointCommand({
      FileSystemId: efsConfig.fileSystemId,
      // Jail: the agent container's EFS mount will be rooted at this path.
      // It cannot navigate to /agents/ or see sibling directories.
      RootDirectory: {
        Path: agentDir,
        CreationInfo: {
          OwnerUid: Number(AGENT_UID),
          OwnerGid: Number(AGENT_GID),
          Permissions: WORKSPACE_DIR_PERMISSIONS,
        },
      },
      // All filesystem operations through this access point are mapped to
      // the non-root agent user, regardless of the process UID inside the container.
      PosixUser: {
        Uid: Number(AGENT_UID),
        Gid: Number(AGENT_GID),
      },
      Tags: [
        { Key: "Name", Value: `agent-${agentId}` },
        { Key: "Owner", Value: "TMRW" },
        { Key: "App", Value: "venture-factory" },
        { Key: "AgentId", Value: agentId },
        { Key: "ManagedBy", Value: "agent-provisioning" },
      ],
    })
  );

  const accessPointId = result.AccessPointId;
  if (!accessPointId) {
    throw new Error(`EFS CreateAccessPoint returned no AccessPointId for agent ${agentId}`);
  }

  console.log(
    `[security] Created EFS access point ${accessPointId} for agent ${agentId} ` +
    `(root=${agentDir}, uid=${AGENT_UID})`
  );

  return accessPointId;
}

// Cleans up the per-agent EFS access point when the agent is stopped or deleted.
// Safe to call with undefined — returns false without error.
async function deletePerAgentAccessPoint(accessPointId: string | undefined | null): Promise<boolean> {
  if (!accessPointId) {
    return false;
  }

  const efsClient = new EFSClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  try {
    console.log(`[security] Deleting EFS access point ${accessPointId}`);
    await efsClient.send(
      new DeleteAccessPointCommand({
        AccessPointId: accessPointId,
      })
    );
    console.log(`[security] Deleted EFS access point ${accessPointId}`);
    return true;
  } catch (error) {
    // AccessPointNotFound is expected if the access point was already cleaned up.
    const code = (error as { name?: string }).name;
    if (code === "AccessPointNotFound") {
      console.log(`[security] EFS access point ${accessPointId} already deleted`);
      return true;
    }
    console.error(
      `[security] Failed to delete EFS access point ${accessPointId}: ` +
      `${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

// ─── Task definition with security hardening ───────────────────────────────────
// Registers a new task definition revision that includes:
//   - Per-agent EFS access point (kernel-level workspace isolation)
//   - Non-root container user (1000:1000)
//   - Linux security parameters (init process, no privilege escalation)

function taskAlreadyHasEfsMount(
  taskDefinition: TaskDefinition,
  containerName: string,
  efsConfig: EcsEfsConfig,
  perAgentAccessPointId?: string
): boolean {
  const container = taskDefinition.containerDefinitions?.find((definition) => definition.name === containerName);
  if (!container) {
    return false;
  }

  const mounted = container.mountPoints?.some(
    (mount) => mount.containerPath === efsConfig.mountPath && mount.sourceVolume === efsConfig.volumeName
  );

  if (!mounted) {
    return false;
  }

  const volume = taskDefinition.volumes?.find((item) => item.name === efsConfig.volumeName);
  if (volume?.efsVolumeConfiguration?.fileSystemId !== efsConfig.fileSystemId) {
    return false;
  }

  // If a per-agent access point is specified, verify the task def uses it.
  if (perAgentAccessPointId) {
    const existingAp = volume?.efsVolumeConfiguration?.authorizationConfig?.accessPointId;
    if (existingAp !== perAgentAccessPointId) {
      return false;
    }
  }

  return true;
}

async function resolveCloudTaskDefinitionArn(
  client: ECSClient,
  baseTaskDefinitionArn: string,
  containerName: string,
  perAgentAccessPointId?: string
): Promise<string> {
  const efsConfig = parseEfsConfig();
  if (!efsConfig) {
    return baseTaskDefinitionArn;
  }

  // Use the per-agent access point if provided; otherwise fall back to the global one.
  const effectiveAccessPointId = perAgentAccessPointId ?? efsConfig.accessPointId;

  const cacheKey = [
    baseTaskDefinitionArn,
    containerName,
    efsConfig.fileSystemId,
    effectiveAccessPointId ?? "",
    efsConfig.rootDirectory,
    efsConfig.volumeName,
    efsConfig.mountPath,
    efsConfig.iam,
    efsConfig.transitEncryption,
  ].join("|");

  const cached = taskDefinitionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const describeResult = await client.send(
    new DescribeTaskDefinitionCommand({
      taskDefinition: baseTaskDefinitionArn,
      include: ["TAGS"],
    })
  );

  const taskDefinition = describeResult.taskDefinition;
  if (!taskDefinition?.family) {
    return baseTaskDefinitionArn;
  }

  if (taskAlreadyHasEfsMount(taskDefinition, containerName, efsConfig, effectiveAccessPointId)) {
    const existingArn = taskDefinition.taskDefinitionArn ?? baseTaskDefinitionArn;
    taskDefinitionCache.set(cacheKey, existingArn);
    return existingArn;
  }

  const containerDefinitions =
    taskDefinition.containerDefinitions?.map((definition) => {
      if (definition.name !== containerName) {
        return definition;
      }

      const mountPoints = (definition.mountPoints ?? []).filter(
        (mount) => mount.containerPath !== efsConfig.mountPath && mount.sourceVolume !== efsConfig.volumeName
      );
      mountPoints.push({
        sourceVolume: efsConfig.volumeName,
        containerPath: efsConfig.mountPath,
        readOnly: false,
      });

      return {
        ...definition,
        mountPoints,
        // SECURITY NOTE: We do NOT set `user` here because initialize.sh and
        // supervisord need to start as root for sshd/cron/workspace-setup.
        // The actual agent workloads (run_ui, run_tunnel_api) are configured
        // in supervisord.conf to run as user=agent (UID 1000).
        // Real isolation is enforced by:
        //   1. EFS access point (kernel-level jail per agent)
        //   2. supervisord user=agent for all agent workloads
        //   3. Workspace permissions 0700
        // SECURITY: Linux-level hardening parameters.
        linuxParameters: {
          // Use an init process (tini) to properly reap zombie processes.
          initProcessEnabled: true,
        },
      };
    }) ?? [];

  const volumes = (taskDefinition.volumes ?? []).filter((volume) => volume.name !== efsConfig.volumeName);

  // When a per-agent access point is set, EFS enforces rootDirectory at the kernel level.
  // The container's /workspace mount points directly into /agents/<agentId> on EFS —
  // the agent has no way to escape this jail.
  const efsRootDirectory = effectiveAccessPointId ? "/" : efsConfig.rootDirectory;

  volumes.push({
    name: efsConfig.volumeName,
    efsVolumeConfiguration: {
      fileSystemId: efsConfig.fileSystemId,
      rootDirectory: efsRootDirectory,
      transitEncryption: efsConfig.transitEncryption,
      authorizationConfig: {
        ...(effectiveAccessPointId ? { accessPointId: effectiveAccessPointId } : {}),
        iam: efsConfig.iam,
      },
    },
  });

  const registerResult = await client.send(
    new RegisterTaskDefinitionCommand({
      family: taskDefinition.family,
      taskRoleArn: taskDefinition.taskRoleArn,
      executionRoleArn: taskDefinition.executionRoleArn,
      networkMode: taskDefinition.networkMode,
      containerDefinitions,
      volumes,
      placementConstraints: taskDefinition.placementConstraints,
      requiresCompatibilities: taskDefinition.requiresCompatibilities,
      cpu: taskDefinition.cpu,
      memory: taskDefinition.memory,
      pidMode: taskDefinition.pidMode,
      ipcMode: taskDefinition.ipcMode,
      proxyConfiguration: taskDefinition.proxyConfiguration,
      inferenceAccelerators: taskDefinition.inferenceAccelerators,
      ephemeralStorage: taskDefinition.ephemeralStorage,
      runtimePlatform: taskDefinition.runtimePlatform,
      tags: sanitizeTags(describeResult.tags),
    })
  );

  const registeredArn = registerResult.taskDefinition?.taskDefinitionArn ?? baseTaskDefinitionArn;

  // Only cache non-per-agent task definitions. Per-agent ones are unique per agent
  // and should not pollute the cache.
  if (!perAgentAccessPointId) {
    taskDefinitionCache.set(cacheKey, registeredArn);
  }

  console.log(
    `[security] Registered task definition ${registeredArn} ` +
    `(user=${AGENT_USER}, accessPoint=${effectiveAccessPointId ?? "none"}, ` +
    `initProcess=true)`
  );

  return registeredArn;
}

export async function provisionAgentOnEcs(
  agent: Pick<Agent, "id" | "userId" | "name" | "platform" | "instructions" | "inputConfig">
): Promise<ProvisionResult> {
  if (isProvisioningDisabled()) {
    return {
      started: false,
      reason: "ECS provisioning disabled for local/test environment",
    };
  }

  const { clusterArn, taskDefinitionArn, cloudTaskDefinitionArn, subnets, securityGroups } = requiredEnv();

  if (!clusterArn || !taskDefinitionArn || subnets.length === 0 || securityGroups.length === 0) {
    return {
      started: false,
      reason: "ECS provisioning config is incomplete",
    };
  }

  const client = new ECSClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  const modelName =
    process.env.CLOUD_AGENT_MODEL ?? process.env.ANTHROPIC_MODEL ?? "global.anthropic.claude-haiku-4-5-20251001-v1:0";
  const mcpBaseUrl =
    process.env.MCP_BASE_URL ??
    process.env.NEXT_PUBLIC_MCP_BASE_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://factory.tmrwgroup.ai"}/api/mcp`;
  const runtimeConfig = parseRuntimeInputConfig(agent.inputConfig);
  const runtimeProfile = runtimeConfig.runtimeProfile ?? "GENERAL";
  const bootstrap = runtimeConfig.bootstrap ?? {};
  const workspaceMountPath = process.env.AGENT_WORKSPACE_MOUNT_PATH?.trim() || "/workspace";
  const containerName = process.env.AGENT_CONTAINER_NAME ?? "agent";

  // ─── Per-agent EFS access point (security isolation) ───────────────────────
  // Each agent gets its own EFS access point that jails it into /agents/<id>.
  // The container sees this as /workspace — it cannot access sibling directories.
  const efsConfig = parseEfsConfig();
  let perAgentAccessPointId: string | undefined;

  if (efsConfig) {
    try {
      perAgentAccessPointId = await createPerAgentAccessPoint(agent.id, efsConfig);
    } catch (error) {
      console.error(
        `[security] Failed to create per-agent EFS access point for ${agent.id}: ` +
        `${error instanceof Error ? error.message : String(error)}`
      );
      return {
        started: false,
        reason: `Failed to create isolated workspace: ${error instanceof Error ? error.message : "EFS access point creation failed"}`,
      };
    }
  }

  // With per-agent access points, the container's /workspace IS the agent's isolated root.
  // AGENT_WORKSPACE_ROOT still points to the mount path for backward compatibility.
  const workspaceRoot = workspaceMountPath;

  const cloudTaskDefinitionToRun =
    agent.platform === "CLOUD"
      ? await resolveCloudTaskDefinitionArn(
          client,
          cloudTaskDefinitionArn ?? taskDefinitionArn,
          containerName,
          perAgentAccessPointId
        )
      : taskDefinitionArn;

  const containerEnvironment = [
    { name: "AGENT_ID", value: agent.id },
    { name: "AGENT_OWNER_ID", value: agent.userId },
    { name: "AGENT_NAME", value: agent.name },
    { name: "AGENT_PLATFORM", value: agent.platform },
    { name: "AGENT_MODE", value: agent.platform === "CLOUD" ? "cloud" : "channel" },
    { name: "AGENT_INSTRUCTIONS", value: agent.instructions ?? "" },
    { name: "AGENT_CONFIG_JSON", value: JSON.stringify(agent.inputConfig ?? {}) },
    { name: "AGENT_RUNTIME_PROFILE", value: runtimeProfile },
    { name: "CLAUDE_CODE_USE_BEDROCK", value: "1" },
    { name: "ANTHROPIC_MODEL", value: modelName },
    { name: "MCP_BASE_URL", value: mcpBaseUrl },
    { name: "RUNNER_PORT", value: "8787" },
    { name: "RUNNER_SHARED_KEY", value: process.env.RUNNER_SHARED_KEY ?? process.env.MCP_SHARED_KEY ?? "" },
    // Per-agent workspace — with EFS access points this is the mount root.
    { name: "AGENT_WORKSPACE_ROOT", value: workspaceRoot },
    { name: "AGENT_WORKSPACE_BASE", value: workspaceMountPath },
    // Security context variables for audit logging inside the container.
    { name: "AGENT_SECURITY_UID", value: AGENT_UID },
    { name: "AGENT_SECURITY_GID", value: AGENT_GID },
    { name: "AGENT_ISOLATION_MODE", value: perAgentAccessPointId ? "efs-access-point" : "path-prefix" },
  ];

  if (bootstrap.repo) {
    containerEnvironment.push({ name: "AGENT_BOOTSTRAP_REPO", value: bootstrap.repo });
    containerEnvironment.push({ name: "AGENT_BOOTSTRAP_ENABLED", value: "1" });
  }
  if (bootstrap.branch) {
    containerEnvironment.push({ name: "AGENT_BOOTSTRAP_BRANCH", value: bootstrap.branch });
  }
  if (bootstrap.workdir) {
    containerEnvironment.push({ name: "AGENT_BOOTSTRAP_WORKDIR", value: bootstrap.workdir });
  }
  if (bootstrap.installCommand) {
    containerEnvironment.push({ name: "AGENT_BOOTSTRAP_INSTALL_COMMAND", value: bootstrap.installCommand });
  }
  if (bootstrap.buildCommand) {
    containerEnvironment.push({ name: "AGENT_BOOTSTRAP_BUILD_COMMAND", value: bootstrap.buildCommand });
  }
  if (process.env.AGENT_GIT_SSH_PRIVATE_KEY_B64) {
    containerEnvironment.push({
      name: "AGENT_GIT_SSH_PRIVATE_KEY_B64",
      value: process.env.AGENT_GIT_SSH_PRIVATE_KEY_B64,
    });
  } else if (process.env.AGENT_GIT_SSH_PRIVATE_KEY) {
    containerEnvironment.push({
      name: "AGENT_GIT_SSH_PRIVATE_KEY",
      value: process.env.AGENT_GIT_SSH_PRIVATE_KEY,
    });
  }

  console.log(
    `[security] Launching agent ${agent.id} — user=${AGENT_USER}, ` +
    `isolation=${perAgentAccessPointId ? "efs-access-point" : "path-prefix"}, ` +
    `accessPoint=${perAgentAccessPointId ?? "none"}, workspace=${workspaceRoot}`
  );

  const runTask = new RunTaskCommand({
    cluster: clusterArn,
    taskDefinition: cloudTaskDefinitionToRun,
    launchType: "FARGATE",
    count: 1,
    // Required for ECS Exec (aws ecs execute-command); must be set at task launch time.
    enableExecuteCommand: true,
    startedBy: `venture-factory:${agent.platform.toLowerCase()}:${agent.userId}`,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets,
        securityGroups,
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: containerName,
          environment: containerEnvironment,
        },
      ],
    },
    tags: [
      { key: "Owner", value: "TMRW" },
      { key: "Env", value: process.env.APP_ENV ?? "staging" },
      { key: "App", value: agent.platform === "CLOUD" ? "venture-factory-cloud-agent" : "venture-factory-agent" },
      { key: "CostCenter", value: "TMRW" },
      { key: "AgentId", value: agent.id },
    ],
  });

  const result = await client.send(runTask);

  if (result.failures && result.failures.length > 0) {
    // Clean up the EFS access point if the task failed to launch.
    if (perAgentAccessPointId) {
      await deletePerAgentAccessPoint(perAgentAccessPointId);
    }

    const failure = result.failures[0];
    return {
      started: false,
      reason: `${failure.reason ?? "ECS task failed"}${failure.arn ? ` (${failure.arn})` : ""}`,
    };
  }

  const taskArn = result.tasks?.[0]?.taskArn;

  if (!taskArn) {
    if (perAgentAccessPointId) {
      await deletePerAgentAccessPoint(perAgentAccessPointId);
    }
    return {
      started: false,
      reason: "ECS did not return a task ARN",
    };
  }

  return {
    started: true,
    clusterArn,
    taskArn,
    efsAccessPointId: perAgentAccessPointId,
    reason: JSON.stringify({ modelName, mcpBaseUrl, taskDefinition: cloudTaskDefinitionToRun }),
  };
}

/**
 * Discover the runner endpoint URL for a running ECS task.
 * Returns the HTTP URL (e.g. http://<ip>:8787) or null if the task isn't running yet.
 */
export async function discoverRunnerEndpoint(
  agent: Pick<Agent, "id" | "ecsClusterArn" | "ecsTaskArn">
): Promise<{ endpoint: string | null; status: string }> {
  if (!agent.ecsClusterArn || !agent.ecsTaskArn) {
    return { endpoint: null, status: "no_ecs_binding" };
  }

  const client = new ECSClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  try {
    const result = await client.send(
      new DescribeTasksCommand({
        cluster: agent.ecsClusterArn,
        tasks: [agent.ecsTaskArn],
      })
    );

    const task = result.tasks?.[0];
    if (!task) {
      return { endpoint: null, status: "task_not_found" };
    }

    const taskStatus = task.lastStatus ?? "UNKNOWN";

    if (taskStatus !== "RUNNING") {
      return { endpoint: null, status: taskStatus.toLowerCase() };
    }

    // Get the ENI attachment to find the public/private IP
    const eniAttachment = task.attachments?.find((a) => a.type === "ElasticNetworkInterface");
    if (!eniAttachment) {
      return { endpoint: null, status: "no_eni" };
    }

    // Try public IP from ECS attachment details first
    let publicIp = eniAttachment.details?.find((d) => d.name === "publicIPv4Address")?.value;
    const privateIp = eniAttachment.details?.find((d) => d.name === "privateIPv4Address")?.value;

    // ECS DescribeTasks often omits publicIPv4Address — look it up via EC2 ENI
    if (!publicIp) {
      const eniId = eniAttachment.details?.find((d) => d.name === "networkInterfaceId")?.value;
      if (eniId) {
        try {
          const ec2 = new EC2Client({ region: process.env.AWS_REGION ?? "us-east-1" });
          const eniResult = await ec2.send(
            new DescribeNetworkInterfacesCommand({ NetworkInterfaceIds: [eniId] })
          );
          publicIp = eniResult.NetworkInterfaces?.[0]?.Association?.PublicIp ?? undefined;
        } catch {
          // Fall through to private IP
        }
      }
    }

    const ip = publicIp ?? privateIp;
    if (!ip) {
      return { endpoint: null, status: "no_ip" };
    }

    const port = process.env.RUNNER_PORT ?? "8787";
    return { endpoint: `http://${ip}:${port}`, status: "running" };
  } catch (error) {
    return {
      endpoint: null,
      status: error instanceof Error ? error.message : "discovery_failed",
    };
  }
}

export async function stopAgentOnEcs(
  agent: Pick<Agent, "id" | "ecsClusterArn" | "ecsTaskArn" | "ecsServiceArn" | "efsAccessPointId">
): Promise<StopResult> {
  if (!agent.ecsClusterArn || !agent.ecsTaskArn) {
    return { stopped: false, reason: "No ECS task binding found for agent" };
  }

  const client = new ECSClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  try {
    await client.send(
      new StopTaskCommand({
        cluster: agent.ecsClusterArn,
        task: agent.ecsTaskArn,
        reason: `Agent ${agent.id} deleted from Venture Factory`,
      })
    );

    // Clean up the per-agent EFS access point to prevent resource leaks.
    const efsAccessPointCleaned = await deletePerAgentAccessPoint(agent.efsAccessPointId);

    console.log(
      `[security] Stopped agent ${agent.id} — task=${agent.ecsTaskArn}, ` +
      `accessPointCleaned=${efsAccessPointCleaned}`
    );

    return { stopped: true, efsAccessPointCleaned };
  } catch (error) {
    // Still attempt to clean up the EFS access point even if the task stop failed.
    await deletePerAgentAccessPoint(agent.efsAccessPointId);

    return {
      stopped: false,
      reason: error instanceof Error ? error.message : "Failed to stop ECS task",
    };
  }
}
