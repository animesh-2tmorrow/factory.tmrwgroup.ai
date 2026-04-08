import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { a2aRelaySchema } from "@/lib/agent-zero-validation";

const MAX_RESPONSE_CHARS = 12_000;

function truncate(value: string): string {
  if (value.length <= MAX_RESPONSE_CHARS) return value;
  return `${value.slice(0, MAX_RESPONSE_CHARS)}\n... [truncated]`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = a2aRelaySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const connection = await prisma.a2AConnection.findFirst({
    where: {
      id: parsed.data.connectionId,
      userId: session.user.id,
      enabled: true,
    },
    select: {
      id: true,
      endpointUrl: true,
      sharedSecret: true,
      name: true,
    },
  });
  if (!connection) {
    return NextResponse.json({ success: false, error: "A2A connection not found or disabled" }, { status: 404 });
  }

  const base = connection.endpointUrl.replace(/\/+$/, "");
  const path = (parsed.data.path ?? "").replace(/^\/+/, "");
  const target = path ? `${base}/${path}` : base;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-a2a-source": "factory.tmrwgroup.ai",
        ...(connection.sharedSecret ? { "x-a2a-key": connection.sharedSecret } : {}),
      },
      body: JSON.stringify(parsed.data.payload),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let body: unknown = truncate(text);
    try {
      body = JSON.parse(text);
    } catch {
      // keep raw text
    }

    return NextResponse.json({
      success: true,
      data: {
        connectionId: connection.id,
        connectionName: connection.name,
        target,
        status: response.status,
        ok: response.ok,
        body,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof DOMException && error.name === "AbortError"
            ? "A2A relay request timed out"
            : error instanceof Error
              ? error.message
              : "A2A relay failed",
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
