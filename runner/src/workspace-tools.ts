import { execFile } from "node:child_process";
import { readFile, writeFile, mkdir, readdir, stat, realpath } from "node:fs/promises";
import { resolve, dirname } from "node:path";

// ─── Configuration ───

const WORKSPACE_ROOT = process.env.AGENT_WORKSPACE_ROOT ?? "/workspace";
const MAX_OUTPUT_BYTES = 25_000;
const MAX_FILE_SIZE = 5_000_000; // 5MB
const MAX_DIR_ENTRIES = 250;
const COMMAND_TIMEOUT_MS = 120_000; // 2 minutes
const WEB_FETCH_TIMEOUT_MS = 30_000;

// ─── Path Helpers ───

async function ensureWorkspaceRoot(): Promise<string> {
  await mkdir(WORKSPACE_ROOT, { recursive: true });
  return realpath(WORKSPACE_ROOT);
}

function truncate(text: string, max: number = MAX_OUTPUT_BYTES): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n... [truncated at ${max} bytes, ${text.length} total]`;
}

// ─── Tool Definitions (Bedrock Converse format) ───

export const WORKSPACE_TOOL_SPECS = [
  {
    toolSpec: {
      name: "shell_command",
      description:
        "Execute shell commands to complete the user's task. " +
        "Prefer project/workspace operations and avoid exposing internal platform details. " +
        "Commands run with a 2 minute timeout. Working directory is /workspace by default.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The shell command to execute (e.g. 'ls -la', 'pip install pandas', 'ping -c 4 google.com')",
            },
            working_dir: {
              type: "string",
              description: "Optional working directory. Defaults to /workspace.",
            },
          },
          required: ["command"],
          additionalProperties: false,
        },
      },
    },
  },
  {
    toolSpec: {
      name: "read_file",
      description:
        "Read the contents of a file needed for the task. Prefer workspace/project files. Max 5MB.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path or path relative to /workspace (e.g. 'src/index.ts', '/etc/hosts')",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
    },
  },
  {
    toolSpec: {
      name: "write_file",
      description:
        "Write content to a file for task execution. Creates parent directories if needed. Max 5MB.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path or path relative to /workspace",
            },
            content: {
              type: "string",
              description: "File content to write",
            },
          },
          required: ["path", "content"],
          additionalProperties: false,
        },
      },
    },
  },
  {
    toolSpec: {
      name: "list_dir",
      description:
        "List the contents of a directory. Returns file names, sizes, and types.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path or path relative to /workspace. Defaults to /workspace.",
            },
          },
          additionalProperties: false,
        },
      },
    },
  },
  {
    toolSpec: {
      name: "web_fetch",
      description:
        "Fetch the content of a URL. Returns the response body as text. " +
        "Use this for downloading files, reading web pages, calling APIs, " +
        "fetching documentation, etc. Supports HTTP/HTTPS.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch (e.g. 'https://example.com', 'https://api.github.com/repos/...')",
            },
            headers: {
              type: "object",
              description: "Optional HTTP headers as key-value pairs",
              additionalProperties: { type: "string" },
            },
          },
          required: ["url"],
          additionalProperties: false,
        },
      },
    },
  },
  {
    toolSpec: {
      name: "web_search",
      description:
        "Search the web and return results. Use this when the user asks a question " +
        "that requires current information, asks you to look something up, or needs " +
        "data you don't have in your training. Returns titles, URLs, and snippets.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query",
            },
            num_results: {
              type: "number",
              description: "Number of results to return (1-10, default 5)",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    },
  },
];

// ─── Tool Execution ───

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export async function executeShellCommand(command: string, workingDir?: string): Promise<ToolResult> {
  if (!command || typeof command !== "string") {
    return { success: false, error: "Command is required" };
  }

  const cwd = workingDir || (await ensureWorkspaceRoot());

  return new Promise((resolve) => {
    const child = execFile(
      "/bin/bash",
      ["-c", command],
      {
        cwd,
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES * 2,
        env: {
          ...process.env,
          HOME: "/root",
          PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
          TERM: "xterm-256color",
        },
      },
      (error, stdout, stderr) => {
        if (error && error.killed) {
          resolve({
            success: false,
            error: `Command timed out after ${COMMAND_TIMEOUT_MS / 1000}s`,
            output: truncate((stdout || "") + (stderr ? `\n[stderr]\n${stderr}` : "")),
          });
          return;
        }

        const combinedOutput = truncate(
          (stdout || "") + (stderr ? `\n[stderr]\n${stderr}` : "")
        );

        if (error) {
          resolve({
            success: false,
            error: `Exit code ${error.code ?? 1}`,
            output: combinedOutput || error.message,
          });
          return;
        }

        resolve({
          success: true,
          output: combinedOutput || "(no output)",
        });
      }
    );
  });
}

export async function executeReadFile(path: string): Promise<ToolResult> {
  if (!path || typeof path !== "string") {
    return { success: false, error: "Path is required" };
  }

  try {
    // Resolve relative paths against workspace root
    const resolved = path.startsWith("/") ? path : resolve(WORKSPACE_ROOT, path);
    const info = await stat(resolved);

    if (!info.isFile()) {
      return { success: false, error: `Not a file: ${path}` };
    }

    if (info.size > MAX_FILE_SIZE) {
      return { success: false, error: `File too large: ${info.size} bytes (max ${MAX_FILE_SIZE})` };
    }

    const content = await readFile(resolved, "utf-8");
    return { success: true, output: truncate(content) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeWriteFile(path: string, content: string): Promise<ToolResult> {
  if (!path || typeof path !== "string") {
    return { success: false, error: "Path is required" };
  }
  if (typeof content !== "string") {
    return { success: false, error: "Content must be a string" };
  }
  if (content.length > MAX_FILE_SIZE) {
    return { success: false, error: `Content too large: ${content.length} bytes (max ${MAX_FILE_SIZE})` };
  }

  try {
    const resolved = path.startsWith("/") ? path : resolve(WORKSPACE_ROOT, path);
    await mkdir(dirname(resolved), { recursive: true });
    await writeFile(resolved, content, "utf-8");
    return { success: true, output: `Wrote ${content.length} bytes to ${resolved}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeListDir(path?: string): Promise<ToolResult> {
  const dirPath = path || WORKSPACE_ROOT;

  try {
    const resolved = dirPath.startsWith("/") ? dirPath : resolve(WORKSPACE_ROOT, dirPath);
    const info = await stat(resolved);

    if (!info.isDirectory()) {
      return { success: false, error: `Not a directory: ${dirPath}` };
    }

    const entries = await readdir(resolved, { withFileTypes: true });

    if (entries.length > MAX_DIR_ENTRIES) {
      return {
        success: true,
        output: {
          path: resolved,
          totalEntries: entries.length,
          truncated: true,
          entries: entries.slice(0, MAX_DIR_ENTRIES).map((e) => ({
            name: e.name,
            type: e.isDirectory() ? "directory" : e.isFile() ? "file" : "other",
          })),
        },
      };
    }

    const detailed = await Promise.all(
      entries.map(async (e) => {
        const entryPath = resolve(resolved, e.name);
        try {
          const s = await stat(entryPath);
          return {
            name: e.name,
            type: e.isDirectory() ? "directory" : e.isFile() ? "file" : "other",
            size: e.isFile() ? s.size : undefined,
          };
        } catch {
          return {
            name: e.name,
            type: e.isDirectory() ? "directory" : e.isFile() ? "file" : "other",
          };
        }
      })
    );

    return {
      success: true,
      output: { path: resolved, entries: detailed },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executeWebFetch(
  url: string,
  headers?: Record<string, string>
): Promise<ToolResult> {
  if (!url || typeof url !== "string") {
    return { success: false, error: "URL is required" };
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { success: false, error: "URL must start with http:// or https://" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TMRW-Agent/1.0",
        ...(headers ?? {}),
      },
      signal: controller.signal,
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();

    return {
      success: true,
      output: {
        status: response.status,
        statusText: response.statusText,
        contentType,
        bodyLength: body.length,
        body: truncate(body, 10_000),
        url: response.url,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.name === "AbortError" ? `Request timed out after ${WEB_FETCH_TIMEOUT_MS / 1000}s` : err.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeWebSearch(query: string, numResults?: number): Promise<ToolResult> {
  if (!query || typeof query !== "string") {
    return { success: false, error: "Query is required" };
  }

  const count = Math.min(Math.max(numResults ?? 5, 1), 10);

  // Use DuckDuckGo HTML search (no API key needed) via curl
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TMRW-Agent/1.0)",
      },
      signal: controller.signal,
    });

    const html = await response.text();

    // Parse results from DuckDuckGo HTML response
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const resultPattern = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>.*?<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gs;

    let match;
    while ((match = resultPattern.exec(html)) !== null && results.length < count) {
      const rawUrl = match[1];
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      const snippet = match[3].replace(/<[^>]+>/g, "").trim();

      // DuckDuckGo wraps URLs in a redirect — extract the actual URL
      let url = rawUrl;
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        url = decodeURIComponent(uddgMatch[1]);
      }

      if (title && url) {
        results.push({ title, url, snippet });
      }
    }

    // Fallback: try simpler pattern if the above didn't match
    if (results.length === 0) {
      const simplePattern = /<a[^>]+class="result__a"[^>]*>(.*?)<\/a>/gs;
      while ((match = simplePattern.exec(html)) !== null && results.length < count) {
        const title = match[1].replace(/<[^>]+>/g, "").trim();
        if (title) {
          results.push({ title, url: "", snippet: "" });
        }
      }
    }

    return {
      success: true,
      output: {
        query,
        resultCount: results.length,
        results,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.name === "AbortError" ? "Search timed out" : err.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Dispatcher ───

export async function invokeWorkspaceTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const agentId = process.env.AGENT_ID ?? "unknown";

  console.log(`[runner] Tool call: ${name} args=${JSON.stringify(args).slice(0, 200)} agent=${agentId}`);

  switch (name) {
    case "shell_command":
      return executeShellCommand(args.command as string, args.working_dir as string | undefined);

    case "read_file":
      return executeReadFile(args.path as string);

    case "write_file":
      return executeWriteFile(args.path as string, args.content as string);

    case "list_dir":
      return executeListDir(args.path as string | undefined);

    case "web_fetch":
      return executeWebFetch(args.url as string, args.headers as Record<string, string> | undefined);

    case "web_search":
      return executeWebSearch(args.query as string, args.num_results as number | undefined);

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
