import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const TABLE = "tmrw-job-board";

async function countByStatus(status: string): Promise<number> {
  const res = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "status-index",
      KeyConditionExpression: "#s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": { S: status } },
      Select: "COUNT",
    })
  );
  return res.Count ?? 0;
}

export async function GET() {
  try {
    const [openCount, claimedCount, inProgressCount, completedItems] =
      await Promise.all([
        countByStatus("open"),
        countByStatus("claimed"),
        countByStatus("in_progress"),
        client.send(
          new QueryCommand({
            TableName: TABLE,
            IndexName: "status-index",
            KeyConditionExpression: "#s = :s",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":s": { S: "completed" } },
          })
        ),
      ]);

    const today = new Date().toISOString().slice(0, 10);
    const completedToday = (completedItems.Items ?? []).filter((item) => {
      const ca = item.completedAt?.S ?? item.updatedAt?.S ?? "";
      return ca.startsWith(today);
    }).length;

    // Active agents = unique assignedTo values that are not "unassigned"
    const allItems = await client.send(new ScanCommand({
      TableName: TABLE,
      ProjectionExpression: "assignedTo, #s",
      ExpressionAttributeNames: { "#s": "status" },
    }));
    const activeAgents = new Set(
      (allItems.Items ?? [])
        .filter(
          (i) =>
            (i.status?.S === "claimed" || i.status?.S === "in_progress") &&
            i.assignedTo?.S &&
            i.assignedTo.S !== "unassigned"
        )
        .map((i) => i.assignedTo!.S)
    ).size;

    // Per city-block stats
    const blockStats: Record<string, { jobs: number; active: number }> = {};
    for (const item of allItems.Items ?? []) {
      const block = item.assignedTo?.S ?? "unassigned";
      if (block === "unassigned") continue;
      if (!blockStats[block]) blockStats[block] = { jobs: 0, active: 0 };
      blockStats[block].jobs++;
      if (item.status?.S === "claimed" || item.status?.S === "in_progress") {
        blockStats[block].active++;
      }
    }

    return NextResponse.json({
      ok: true,
      stats: {
        open: openCount,
        inProgress: claimedCount + inProgressCount,
        completedToday,
        activeAgents,
        blockStats,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
