import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "us-east-1" });
const TABLE = "tmrw-job-board";

function unmar(item: Record<string, any>) {
  return {
    jobId: item.jobId?.S ?? "",
    title: item.title?.S ?? "",
    description: item.description?.S ?? "",
    status: item.status?.S ?? "",
    priority: item.priority?.S ?? "",
    createdBy: item.createdBy?.S ?? "",
    assignedTo: item.assignedTo?.S ?? "",
    cityBlock: item.cityBlock?.S ?? "",
    factory: item.factory?.S ?? "",
    input: item.input?.S ?? "{}",
    output: item.output?.S ?? "{}",
    createdAt: item.createdAt?.S ?? "",
    updatedAt: item.updatedAt?.S ?? "",
    completedAt: item.completedAt?.S ?? "",
    tags: item.tags?.SS ?? [],
    autoExecute: item.autoExecute?.BOOL ?? false,
    attempts: item.attempts?.N ? Number(item.attempts.N) : 0,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const cityBlock = url.searchParams.get("cityBlock");
    const factory = url.searchParams.get("factory");

    let items: any[] = [];

    if (status) {
      const res = await client.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: "status-index",
          KeyConditionExpression: "#s = :s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": { S: status } },
          ScanIndexForward: false,
        })
      );
      items = res.Items ?? [];
    } else if (cityBlock) {
      const res = await client.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: "cityBlock-index",
          KeyConditionExpression: "cityBlock = :cb",
          ExpressionAttributeValues: { ":cb": { S: cityBlock } },
          ScanIndexForward: false,
        })
      );
      items = res.Items ?? [];
    } else if (factory) {
      const res = await client.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: "factory-index",
          KeyConditionExpression: "factory = :f",
          ExpressionAttributeValues: { ":f": { S: factory } },
          ScanIndexForward: false,
        })
      );
      items = res.Items ?? [];
    } else {
      const res = await client.send(new ScanCommand({ TableName: TABLE }));
      items = res.Items ?? [];
    }

    const jobs = items.map(unmar);
    jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ ok: true, jobs });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, factory, priority, cityBlock, assignedTo } =
      body;

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "title is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const jobId = randomUUID();

    const item: Record<string, any> = {
      jobId: { S: jobId },
      createdAt: { S: now },
      title: { S: title },
      description: { S: description || "" },
      status: { S: "open" },
      priority: { S: priority || "medium" },
      createdBy: { S: body.createdBy || "dashboard" },
      assignedTo: { S: assignedTo || "unassigned" },
      cityBlock: { S: cityBlock || "shared" },
      factory: { S: factory || "general" },
      input: { S: body.input || "{}" },
      output: { S: "{}" },
      updatedAt: { S: now },
    };

    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      item.tags = { SS: body.tags };
    }

    // autoExecute defaults to true for dashboard, false for collective-intake
    const autoExecute = body.autoExecute !== undefined
      ? Boolean(body.autoExecute)
      : (body.createdBy !== "collective-intake");
    item.autoExecute = { BOOL: autoExecute };

    await client.send(new PutItemCommand({ TableName: TABLE, Item: item }));

    return NextResponse.json({ ok: true, jobId, status: "created" });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, createdAt, status, assignedTo, output } = body;

    if (!jobId || !createdAt) {
      return NextResponse.json(
        { ok: false, error: "jobId and createdAt are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const exprs: string[] = ["#u = :u"];
    const names: Record<string, string> = { "#u": "updatedAt" };
    const vals: Record<string, any> = { ":u": { S: now } };

    if (status) {
      exprs.push("#s = :s");
      names["#s"] = "status";
      vals[":s"] = { S: status };
      if (status === "completed") {
        exprs.push("completedAt = :ca");
        vals[":ca"] = { S: now };
      }
    }
    if (assignedTo) {
      exprs.push("assignedTo = :a");
      vals[":a"] = { S: assignedTo };
    }
    if (output) {
      exprs.push("#o = :o");
      names["#o"] = "output";
      vals[":o"] = { S: typeof output === "string" ? output : JSON.stringify(output) };
    }

    await client.send(
      new UpdateItemCommand({
        TableName: TABLE,
        Key: { jobId: { S: jobId }, createdAt: { S: createdAt } },
        UpdateExpression: "SET " + exprs.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: vals,
      })
    );

    return NextResponse.json({ ok: true, jobId, updated: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
