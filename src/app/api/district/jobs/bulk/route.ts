import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "us-east-1" });
const TABLE = "tmrw-job-board";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titles, factory, priority, cityBlock, jobs: richJobs, autoExecute } = body;

    // Support two formats:
    // 1. Simple: { titles: ["a","b"], factory, priority, cityBlock }
    // 2. Rich:   { jobs: [{ title, description, factory, priority, cityBlock }] }
    type JobEntry = {
      title: string;
      description?: string;
      factory?: string;
      priority?: string;
      cityBlock?: string;
    };

    let entries: JobEntry[] = [];

    if (richJobs && Array.isArray(richJobs)) {
      entries = richJobs.filter((j: any) => j.title?.trim());
    } else if (titles && Array.isArray(titles)) {
      entries = titles
        .filter((t: string) => t?.trim())
        .map((t: string) => ({ title: t.trim() }));
    } else {
      return NextResponse.json(
        { ok: false, error: "titles (array) or jobs (array) is required" },
        { status: 400 }
      );
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { ok: false, error: "no valid jobs provided" },
        { status: 400 }
      );
    }

    const now = new Date();
    const jobIds: string[] = [];

    // BatchWriteItem supports max 25 items per call
    for (let i = 0; i < entries.length; i += 25) {
      const batch = entries.slice(i, i + 25);
      const requests = batch.map((entry, idx) => {
        const jobId = randomUUID();
        jobIds.push(jobId);
        // Offset createdAt by ms to ensure unique sort keys
        const createdAt = new Date(now.getTime() + i + idx).toISOString();
        return {
          PutRequest: {
            Item: {
              jobId: { S: jobId },
              createdAt: { S: createdAt },
              title: { S: entry.title.trim() },
              description: { S: entry.description || "" },
              status: { S: "open" },
              priority: { S: entry.priority || priority || "medium" },
              createdBy: { S: "dashboard-bulk" },
              assignedTo: { S: "unassigned" },
              cityBlock: { S: entry.cityBlock || cityBlock || "shared" },
              factory: { S: entry.factory || factory || "general" },
              input: { S: "{}" },
              output: { S: "{}" },
              updatedAt: { S: now.toISOString() },
              autoExecute: { BOOL: autoExecute !== undefined ? Boolean(autoExecute) : true },
            },
          },
        };
      });

      await client.send(
        new BatchWriteItemCommand({
          RequestItems: { [TABLE]: requests },
        })
      );
    }

    return NextResponse.json({ ok: true, created: jobIds.length, jobIds });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
