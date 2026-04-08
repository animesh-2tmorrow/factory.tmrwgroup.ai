"use client";

import { useState } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  FolderOpen,
  Globe,
  Key,
  LayoutGrid,
  Mail,
  Pencil,
  PlusCircle,
  Search,
  Server,
  Settings,
  Terminal,
  Zap,
} from "lucide-react";

interface ToolExecution {
  tool: string;
  input?: Record<string, unknown>;
  output?: string;
  technicalOutput?: string;
  status?: "success" | "error";
  duration_ms?: number;
}

const TOOL_CONFIG: Record<string, { icon: typeof Terminal; color: string; label: string }> = {
  // System tools
  shell_command: { icon: Terminal, color: "var(--teal)", label: "Shell Command" },
  read_file: { icon: FileText, color: "var(--blue)", label: "Read File" },
  write_file: { icon: Pencil, color: "var(--gold)", label: "Write File" },
  list_dir: { icon: FolderOpen, color: "var(--blue)", label: "List Directory" },
  web_fetch: { icon: Globe, color: "var(--orange)", label: "Web Fetch" },
  get_time: { icon: Activity, color: "var(--text-muted)", label: "Get Time" },
  get_agent_status: { icon: Server, color: "var(--teal)", label: "Agent Status" },
  runtime_info: { icon: Settings, color: "var(--text-muted)", label: "Runtime Info" },
  recent_usage: { icon: Activity, color: "var(--blue)", label: "Recent Usage" },
  // Marketo — Read
  list_programs: { icon: LayoutGrid, color: "#7c6ee6", label: "List Programs" },
  list_smart_campaigns: { icon: Zap, color: "#e6a23c", label: "List Smart Campaigns" },
  list_emails: { icon: Mail, color: "#5b8def", label: "List Emails" },
  list_forms: { icon: ClipboardList, color: "#67c23a", label: "List Forms" },
  list_folders: { icon: FolderOpen, color: "#909399", label: "List Folders" },
  list_tokens: { icon: Key, color: "#e6a23c", label: "List Tokens" },
  list_channels: { icon: Database, color: "#909399", label: "List Channels" },
  list_workspaces: { icon: Database, color: "#5b8def", label: "List Workspaces" },
  list_email_templates: { icon: Mail, color: "#909399", label: "Email Templates" },
  list_lp_templates: { icon: BookOpen, color: "#909399", label: "LP Templates" },
  list_landing_pages: { icon: BookOpen, color: "#67c23a", label: "Landing Pages" },
  list_smart_lists: { icon: Search, color: "#e6a23c", label: "Smart Lists" },
  list_uploaded_files: { icon: FileText, color: "#909399", label: "Uploaded Files" },
  get_instance_info: { icon: Server, color: "#7c6ee6", label: "Instance Info" },
  get_program: { icon: LayoutGrid, color: "#7c6ee6", label: "Get Program" },
  get_leads: { icon: Search, color: "#5b8def", label: "Get Leads" },
  // Marketo — Write
  create_program: { icon: PlusCircle, color: "#67c23a", label: "Create Program" },
  clone_program: { icon: PlusCircle, color: "#67c23a", label: "Clone Program" },
  delete_program: { icon: Terminal, color: "var(--error)", label: "Delete Program" },
  create_smart_campaign: { icon: PlusCircle, color: "#e6a23c", label: "Create Campaign" },
  clone_smart_campaign: { icon: PlusCircle, color: "#e6a23c", label: "Clone Campaign" },
  activate_smart_campaign: { icon: CheckCircle2, color: "#67c23a", label: "Activate Campaign" },
  deactivate_smart_campaign: { icon: Activity, color: "#909399", label: "Deactivate Campaign" },
  create_email: { icon: PlusCircle, color: "#5b8def", label: "Create Email" },
  clone_email: { icon: PlusCircle, color: "#5b8def", label: "Clone Email" },
  approve_email: { icon: CheckCircle2, color: "#67c23a", label: "Approve Email" },
  send_test_email: { icon: Mail, color: "#e6a23c", label: "Send Test Email" },
  create_landing_page: { icon: PlusCircle, color: "#67c23a", label: "Create Landing Page" },
  clone_landing_page: { icon: PlusCircle, color: "#67c23a", label: "Clone Landing Page" },
  approve_landing_page: { icon: CheckCircle2, color: "#67c23a", label: "Approve Landing Page" },
  clone_form: { icon: PlusCircle, color: "#67c23a", label: "Clone Form" },
  approve_form: { icon: CheckCircle2, color: "#67c23a", label: "Approve Form" },
  create_folder: { icon: PlusCircle, color: "#909399", label: "Create Folder" },
  rename_folder: { icon: Pencil, color: "#909399", label: "Rename Folder" },
  move_asset: { icon: FolderOpen, color: "#909399", label: "Move Asset" },
  create_token: { icon: PlusCircle, color: "#e6a23c", label: "Create Token" },
  delete_token: { icon: Terminal, color: "var(--error)", label: "Delete Token" },
  // Marketo — Credentials
  check_marketo_credentials: { icon: Key, color: "#7c6ee6", label: "Check Credentials" },
  store_marketo_credentials: { icon: Key, color: "#67c23a", label: "Store Credentials" },
};

interface ToolExecutionCardProps {
  execution: ToolExecution;
}

export default function ToolExecutionCard({ execution }: ToolExecutionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasTechnicalDetails = Boolean(
    (execution.technicalOutput && execution.technicalOutput.trim().length > 0) || execution.input
  );
  const config = TOOL_CONFIG[execution.tool] ?? {
    icon: Terminal,
    color: "var(--text-muted)",
    label: execution.tool,
  };
  const Icon = config.icon;

  const isSuccess = execution.status !== "error";
  const isDispatched = execution.output?.includes("dispatched") || execution.output?.includes("arriving");

  return (
    <div
      className="cc-tool-card"
      style={{
        borderColor: `color-mix(in srgb, ${config.color} 25%, var(--border))`,
        background: `color-mix(in srgb, ${config.color} 3%, var(--bg-card))`,
      }}
    >
      <div
        className="cc-tool-card-header"
        onClick={() => hasTechnicalDetails && setExpanded(!expanded)}
        style={{ cursor: hasTechnicalDetails ? "pointer" : "default" }}
      >
        <span
          className="cc-tool-card-icon"
          style={{
            color: config.color,
            background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
            padding: "4px",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} />
        </span>
        <span className="cc-tool-card-name">{config.label}</span>

        {/* Status badge */}
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            background: isDispatched
              ? "color-mix(in srgb, var(--blue) 12%, transparent)"
              : isSuccess
                ? "color-mix(in srgb, var(--success, #67c23a) 12%, transparent)"
                : "color-mix(in srgb, var(--error) 12%, transparent)",
            color: isDispatched
              ? "var(--blue)"
              : isSuccess
                ? "var(--success, #67c23a)"
                : "var(--error)",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
          {isDispatched ? "Running" : isSuccess ? "Done" : "Error"}
        </span>

        {execution.duration_ms != null && (
          <span className="cc-tool-card-status" style={{ marginLeft: 6 }}>{execution.duration_ms}ms</span>
        )}
        {hasTechnicalDetails && (
          <ChevronDown
            size={14}
            className={`cc-tool-card-chevron ${expanded ? "is-expanded" : ""}`}
            style={{ marginLeft: 4 }}
          />
        )}
      </div>

      {execution.output && (
        <div className={`cc-tool-card-summary ${execution.status === "error" ? "is-error" : ""}`}>
          {execution.output}
        </div>
      )}

      {expanded && hasTechnicalDetails && (
        <div className="cc-tool-card-body">
          {execution.input && (
            <div style={{ marginBottom: 8 }}>
              <div className="cc-tool-card-label">Input</div>
              <pre>{JSON.stringify(execution.input, null, 2)}</pre>
            </div>
          )}
          {execution.technicalOutput && (
            <div>
              <div className="cc-tool-card-label">Technical Details</div>
              <pre>{execution.technicalOutput}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
