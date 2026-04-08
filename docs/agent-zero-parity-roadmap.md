# Agent Zero Parity Roadmap for Venture Factory

## Goal

Build `factory.tmrwgroup.ai` into an Agent Zero-style cloud runtime while keeping TMRW multi-tenant billing, auth, and ECS deployment architecture.

## Source Baseline

- Agent Zero reference: `tmrw/venture-factory/agent-zero-ref/README.md`
- Agent Zero docs: `tmrw/venture-factory/agent-zero-ref/docs/**`

## Parity Matrix (Current)

| Capability | Agent Zero | Factory Today | Gap |
|---|---|---|---|
| Dockerized isolated runtime | Yes | Yes (ECS Fargate runner) | Low |
| Shell + file tool execution | Yes | Yes | Low |
| Per-workspace isolation | Yes (projects/workdirs) | Partial (now per-agent workspace root) | Medium |
| Git project bootstrap | Yes | Yes (runtime profiles + bootstrap) | Medium |
| Persistent memory system | Yes (vector + dashboard) | Partial (chat persistence, no full memory dashboard) | High |
| Skills (`SKILL.md`) | Yes | Not implemented | High |
| Multi-agent hierarchy | Yes | Not implemented | High |
| Scheduler/tasks | Yes | Not implemented | High |
| MCP server + MCP client | Yes | Partial (MCP tools endpoint; no dedicated MCP host yet) | Medium |
| Advanced file browser/editor UI | Yes | Partial | Medium |
| Voice (TTS/STT) | Yes | Not implemented in Factory runtime | Medium |
| A2A protocol | Yes | Not implemented | High |
| Real-time streaming UX polish | Yes | Partial (improved, still maturing) | Medium |

## What Was Implemented Now

1. Default per-agent workspace isolation in provisioning:
   - `AGENT_WORKSPACE_ROOT=/workspace/agents/<agent_id>`
   - `AGENT_WORKSPACE_BASE=/workspace/agents` (configurable)
2. Runtime docs updated to reflect this isolation baseline.
3. Agent Zero parity foundations shipped in app layer (Phase 2/3 baseline):
   - Project model + API + dashboard page (`/projects`)
   - Skills model + API + dashboard page (`/skills`)
   - Memory model + API + dashboard page (`/memory`)
   - Scheduler model + API + dashboard page (`/scheduler`)
   - Multi-agent delegation API + dashboard page (`/multi-agent`)
   - A2A connections + relay API + integrations page (`/integrations`)
   - Voice profile API + capabilities + dashboard page (`/voice`)
   - MCP hardening: key-auth requests now validate agent ownership server-side
   - Chat runtime context now injects project instructions + active skills + recent memory recalls
   - Assistant turn summaries now persist to `memory_entries`

This is the first required building block for Agent Zero-like project isolation and safer multi-tenant execution.

## Execution Plan

### Phase 1: Runtime Foundation (Immediate)

1. Persist agent workspace storage with EFS mount to `/workspace`.
2. Add workspace lifecycle policy (retain, archive, delete).
3. Add runtime capabilities endpoint (`tools`, `limits`, `workspace info`) for UI and policy checks.
4. Enforce path jail + denylist rules for shell/file tools.

### Phase 2: Agent Zero Core Behaviors

1. Skills system:
   - `skills/` directory support in workspace
   - loader for `SKILL.md`
   - semantic skill selection in chat loop
2. Project model:
   - project entity, secrets, instructions, isolated memory scope
   - assign agent to project
3. Memory:
   - memory write/read tool contracts
   - memory dashboard page in Factory
   - auto summarization and recall

### Phase 3: Product-Grade Agent Platform

1. Scheduler/task runner for recurring jobs.
2. Multi-agent delegation model (parent/sub-agent chain).
3. MCP hardening:
   - dedicated host `mcp.tmrwgroup.ai`
   - policy, auth scopes, audit trail
4. Voice + richer workspace UI (file browser/editor).

## Suggested Next Implementation Slice

Implement EFS-backed persistent workspaces and wire ECS task definition volume mounts for runner container.  
Without persistence, project and skill workflows lose most of their value.
