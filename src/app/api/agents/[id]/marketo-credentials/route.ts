/**
 * Marketo Credentials API — per-agent credential management.
 *
 * GET  /api/agents/{id}/marketo-credentials — check if credentials are configured
 * POST /api/agents/{id}/marketo-credentials — store or update credentials
 * POST /api/agents/{id}/marketo-credentials?action=test — test connection
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { testConnection, type MarketoCredentials } from "@/lib/marketo-api";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const agent = await prisma.agent.findFirst({
    where: { id, userId },
    select: { inputConfig: true },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  const config = agent.inputConfig as Record<string, unknown> | null;
  const mkto = config?.marketo as Record<string, unknown> | undefined;

  return NextResponse.json({
    success: true,
    configured: !!(mkto?.instanceUrl && mkto?.clientId && mkto?.clientSecret),
    instanceUrl: mkto?.instanceUrl ?? null,
    // Never expose clientSecret
    clientId: mkto?.clientId ? `${String(mkto.clientId).slice(0, 8)}...` : null,
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const agent = await prisma.agent.findFirst({
    where: { id, userId },
    select: { id: true, inputConfig: true },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  const creds: MarketoCredentials = {
    instanceUrl: typeof body.instanceUrl === "string" ? body.instanceUrl.trim() : "",
    clientId: typeof body.clientId === "string" ? body.clientId.trim() : "",
    clientSecret: typeof body.clientSecret === "string" ? body.clientSecret.trim() : "",
  };

  if (!creds.instanceUrl || !creds.clientId || !creds.clientSecret) {
    return NextResponse.json(
      { success: false, error: "Required: instanceUrl, clientId, clientSecret" },
      { status: 400 }
    );
  }

  // Normalize instance URL
  if (!creds.instanceUrl.startsWith("http")) {
    creds.instanceUrl = `https://${creds.instanceUrl}`;
  }
  creds.instanceUrl = creds.instanceUrl.replace(/\/+$/, "");

  // Test connection
  if (action === "test") {
    const result = await testConnection(creds);
    return NextResponse.json(result);
  }

  // Test first, then save
  const testResult = await testConnection(creds);
  if (!testResult.success) {
    return NextResponse.json(
      { success: false, error: `Connection test failed: ${testResult.message}` },
      { status: 400 }
    );
  }

  // Save credentials in inputConfig
  const existingConfig = (agent.inputConfig as Record<string, unknown>) ?? {};
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      inputConfig: {
        ...existingConfig,
        marketo: {
          instanceUrl: creds.instanceUrl,
          clientId: creds.clientId,
          clientSecret: creds.clientSecret,
          configuredAt: new Date().toISOString(),
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: testResult.message,
  });
}
