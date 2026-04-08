import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "us-east-1" });
const TABLE = "tmrw-job-board";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, name, email, description, budget, builder, timeline, source } = body;

    if (!company || !name || !email || !description || !budget) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: company, name, email, description, budget" },
        { status: 400 }
      );
    }

    const jobId = randomUUID();
    const now = new Date().toISOString();

    await client.send(
      new PutItemCommand({
        TableName: TABLE,
        Item: {
          jobId: { S: jobId },
          createdAt: { S: now },
          title: { S: `[COLLECTIVE] ${company} — ${budget}` },
          description: {
            S: JSON.stringify({
              company,
              contact: name,
              email,
              need: description,
              budget,
              preferredBuilder: builder || "none",
              timeline: timeline || "not specified",
              source: source || "",
            }),
          },
          status: { S: "open" },
          priority: { S: "high" },
          createdBy: { S: "collective-intake" },
          assignedTo: { S: builder || "unassigned" },
          cityBlock: { S: builder || "edward" },
          factory: { S: "ops" },
          input: { S: JSON.stringify({ source: "collective", type: "client-intake" }) },
          output: { S: "{}" },
          updatedAt: { S: now },
        },
      })
    );

    return NextResponse.json({ ok: true, jobId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
