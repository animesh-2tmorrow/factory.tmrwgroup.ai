/**
 * Marketo REST API Client with OAuth 2.0 Token Management
 *
 * Implements the official Adobe Marketo REST API:
 * https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/rest/rest-api
 *
 * Tokens expire after 1 hour. This client handles automatic refresh.
 * Credentials are stored per-agent in the inputConfig JSON field.
 */

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry
const API_TIMEOUT_MS = 30_000;
const MAX_RETURN = 200;

export interface MarketoCredentials {
  instanceUrl: string;   // e.g. https://123-ABC-456.mktorest.com
  clientId: string;
  clientSecret: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// In-memory token cache keyed by instanceUrl
const tokenCache = new Map<string, TokenCache>();

/**
 * Get a valid OAuth 2.0 access token, refreshing if needed.
 */
export async function getAccessToken(creds: MarketoCredentials): Promise<string> {
  const cached = tokenCache.get(creds.instanceUrl);
  if (cached && cached.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return cached.accessToken;
  }

  // Request new token via client_credentials grant
  const identityUrl = creds.instanceUrl.replace(/\/rest\/?$/, "").replace(/\/$/, "");
  const tokenUrl = `${identityUrl}/identity/oauth/token?grant_type=client_credentials&client_id=${encodeURIComponent(creds.clientId)}&client_secret=${encodeURIComponent(creds.clientSecret)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(tokenUrl, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Marketo OAuth failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error(`Marketo OAuth response missing access_token: ${JSON.stringify(data).slice(0, 200)}`);
    }

    const token: TokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    tokenCache.set(creds.instanceUrl, token);

    return token.accessToken;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make an authenticated request to the Marketo REST API.
 */
async function marketoFetch(
  creds: MarketoCredentials,
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string> } = {}
): Promise<unknown> {
  const token = await getAccessToken(creds);
  const baseUrl = creds.instanceUrl.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/rest${path}`);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Marketo API error (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = await response.json();

    // Marketo wraps errors in success:false
    if (data.success === false && data.errors?.length > 0) {
      const errMsg = data.errors.map((e: any) => `${e.code}: ${e.message}`).join("; ");
      throw new Error(`Marketo API error: ${errMsg}`);
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Marketo API timeout after ${API_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ═══════════════════════════════════════════════════════════════
// REST API Methods — Programs, Campaigns, Emails, Leads, etc.
// ═══════════════════════════════════════════════════════════════

export async function listPrograms(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/asset/v1/programs.json", {
    params: { maxReturn: String(maxReturn) },
  }) as any;
  const programs = data.result || [];
  return {
    success: true,
    data: programs.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      channel: p.channel,
      status: p.status,
      workspace: p.workspace,
      folder: p.folder?.value,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    count: programs.length,
    source: "rest_api",
  };
}

export async function getProgram(creds: MarketoCredentials, programId: number) {
  const data = await marketoFetch(creds, `/asset/v1/program/${programId}.json`) as any;
  return { success: true, data: data.result?.[0] ?? null, source: "rest_api" };
}

export async function listSmartCampaigns(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/v1/campaigns.json", {
    params: { maxReturn: String(maxReturn) },
  }) as any;
  const campaigns = data.result || [];
  return {
    success: true,
    data: campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      isActive: c.active,
      workspace: c.workspace,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    count: campaigns.length,
    source: "rest_api",
  };
}

export async function listEmails(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/asset/v1/emails.json", {
    params: { maxReturn: String(maxReturn) },
  }) as any;
  const emails = data.result || [];
  return {
    success: true,
    data: emails.map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      subject: e.subject?.value,
      fromName: e.fromName?.value,
      fromEmail: e.fromEmail?.value,
      folder: e.folder?.value,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
    count: emails.length,
    source: "rest_api",
  };
}

export async function listForms(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/asset/v1/forms.json", {
    params: { maxReturn: String(maxReturn) },
  }) as any;
  const forms = data.result || [];
  return {
    success: true,
    data: forms.map((f: any) => ({
      id: f.id,
      name: f.name,
      status: f.status,
      folder: f.folder?.value,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    count: forms.length,
    source: "rest_api",
  };
}

export async function listLandingPages(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/asset/v1/landingPages.json", {
    params: { maxReturn: String(maxReturn) },
  }) as any;
  const pages = data.result || [];
  return {
    success: true,
    data: pages.map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      url: p.URL,
      folder: p.folder?.value,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    count: pages.length,
    source: "rest_api",
  };
}

export async function listFolders(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/asset/v1/folders.json", {
    params: { maxReturn: String(maxReturn), root: JSON.stringify({ id: 1, type: "Folder" }) },
  }) as any;
  const folders = data.result || [];
  return {
    success: true,
    data: folders.map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      parent: f.parent?.value,
      workspace: f.workspace,
    })),
    count: folders.length,
    source: "rest_api",
  };
}

export async function listSmartLists(creds: MarketoCredentials, maxReturn = MAX_RETURN) {
  const data = await marketoFetch(creds, "/asset/v1/smartLists.json", {
    params: { maxReturn: String(maxReturn) },
  }) as any;
  const lists = data.result || [];
  return {
    success: true,
    data: lists.map((l: any) => ({
      id: l.id,
      name: l.name,
      folder: l.folder?.value,
      createdAt: l.createdAt,
    })),
    count: lists.length,
    source: "rest_api",
  };
}

export async function getLeadsByFilter(
  creds: MarketoCredentials,
  filterType: string,
  filterValues: string[],
  fields?: string[]
) {
  const params: Record<string, string> = {
    filterType,
    filterValues: filterValues.join(","),
  };
  if (fields?.length) {
    params.fields = fields.join(",");
  }
  const data = await marketoFetch(creds, "/v1/leads.json", { params }) as any;
  return {
    success: true,
    data: data.result || [],
    count: (data.result || []).length,
    source: "rest_api",
  };
}

export async function createProgram(
  creds: MarketoCredentials,
  name: string,
  type: string,
  channel: string,
  folderId: number,
  folderType = "Folder",
  description?: string
) {
  const data = await marketoFetch(creds, "/asset/v1/programs.json", {
    method: "POST",
    body: { name, type, channel, folder: { id: folderId, type: folderType }, description },
  }) as any;
  return { success: true, data: data.result?.[0] ?? null, source: "rest_api" };
}

export async function getInstanceInfo(creds: MarketoCredentials) {
  // No direct "instance info" endpoint — use a simple identity check
  const token = await getAccessToken(creds);
  const baseUrl = creds.instanceUrl.replace(/\/$/, "").replace(/\/rest\/?$/, "");

  // Extract munchkin from URL
  const munchkinMatch = baseUrl.match(/(\d{3}-\w{3}-\d{3})/);
  return {
    success: true,
    data: {
      instanceUrl: creds.instanceUrl,
      munchkinId: munchkinMatch ? munchkinMatch[1] : null,
      authenticated: true,
      tokenValid: !!token,
    },
    source: "rest_api",
  };
}

/**
 * Test connection by fetching a single program.
 */
export async function testConnection(creds: MarketoCredentials): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken(creds);
    const data = await marketoFetch(creds, "/v1/campaigns.json", {
      params: { maxReturn: "1" },
    }) as any;
    return {
      success: true,
      message: `Connected to Marketo (${creds.instanceUrl}). Found ${data.result?.length ?? 0} campaign(s).`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Execute a Marketo REST API tool by name.
 * Returns formatted result or error.
 */
export async function executeMarketoRestTool(
  creds: MarketoCredentials,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "list_programs":
      return listPrograms(creds);
    case "list_smart_campaigns":
      return listSmartCampaigns(creds);
    case "list_emails":
      return listEmails(creds);
    case "list_forms":
      return listForms(creds);
    case "list_folders":
      return listFolders(creds);
    case "list_landing_pages":
      return listLandingPages(creds);
    case "list_smart_lists":
      return listSmartLists(creds);
    case "get_instance_info":
      return getInstanceInfo(creds);
    case "get_program": {
      const programId = typeof args.programId === "number" ? args.programId : parseInt(String(args.programId), 10);
      if (isNaN(programId)) return { success: false, error: "Invalid programId" };
      return getProgram(creds, programId);
    }
    case "get_leads": {
      const filterType = typeof args.filterType === "string" ? args.filterType : "email";
      const filterValues = Array.isArray(args.filterValues) ? args.filterValues : [String(args.filterValues ?? "")];
      const fields = Array.isArray(args.fields) ? args.fields : undefined;
      return getLeadsByFilter(creds, filterType, filterValues as string[], fields as string[] | undefined);
    }
    case "create_program": {
      const { name, type, channel, folderId, folderType, description } = args as any;
      if (!name || !type || !channel || !folderId) return { success: false, error: "Required: name, type, channel, folderId" };
      return createProgram(creds, name, type, channel, folderId, folderType, description);
    }
    default:
      return { success: false, error: `REST API fallback not implemented for tool: ${toolName}` };
  }
}
