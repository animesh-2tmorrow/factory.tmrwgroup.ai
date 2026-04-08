import { NextResponse } from "next/server";
import { templates } from "@/lib/templates";

export async function GET() {
  return NextResponse.json({ success: true, data: templates });
}
