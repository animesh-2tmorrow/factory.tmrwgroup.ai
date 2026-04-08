import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    service: "venture-factory",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
