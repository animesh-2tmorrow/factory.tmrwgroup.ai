import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

const SLACK_WEBHOOK_URL = process.env.WEBSTER_SLACK_WEBHOOK_URL;

interface FeedbackPayload {
  messageId: string;
  feedback: string;
  messageContent: string;
  rating?: "positive" | "negative";
  source?: string;
}

async function sendToSlack(
  agentId: string,
  agentName: string,
  userName: string,
  payload: FeedbackPayload
): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.log("[feedback] No WEBSTER_SLACK_WEBHOOK_URL configured, skipping Slack notification");
    return false;
  }

  const isPositive = payload.rating === "positive";
  const emoji = isPositive ? ":thumbsup:" : ":thumbsdown:";
  const color = isPositive ? "#22c55e" : "#f59e0b";

  const slackMessage = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${emoji} *Webster Feedback* from *${userName}*`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Agent:*\n${agentName}`,
              },
              {
                type: "mrkdwn",
                text: `*Rating:*\n${isPositive ? "Helpful" : "Needs Improvement"}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Feedback:*\n${payload.feedback}`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*AI Response Preview:*\n>${payload.messageContent.slice(0, 300).replace(/\n/g, "\n>")}${payload.messageContent.length > 300 ? "..." : ""}`,
              },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Agent ID: \`${agentId}\` | Message ID: \`${payload.messageId}\` | Source: ${payload.source ?? "unknown"}`,
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      console.error(`[feedback] Slack webhook failed: ${response.status}`);
      return false;
    }

    console.log("[feedback] Slack notification sent");
    return true;
  } catch (error) {
    console.error("[feedback] Slack webhook error:", error);
    return false;
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  // Allow unauthenticated feedback from extension (CORS handled by extension origin)
  const session = await auth();
  const { id: agentId } = await context.params;

  let payload: FeedbackPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { messageId, feedback, messageContent, rating, source } = payload;

  if (!messageId || !feedback || !messageContent) {
    return NextResponse.json(
      { success: false, error: "Required: messageId, feedback, messageContent" },
      { status: 400 }
    );
  }

  // Get agent info for Slack message
  const agent = await prisma.agent.findFirst({
    where: { id: agentId },
    select: { id: true, name: true, userId: true },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  // Get user name if available
  let userName = "Anonymous";
  if (session?.user?.name) {
    userName = session.user.name;
  } else if (agent.userId) {
    const user = await prisma.user.findUnique({
      where: { id: agent.userId },
      select: { name: true, email: true },
    });
    userName = user?.name ?? user?.email ?? "Unknown User";
  }

  // Store feedback in database if we have a feedback model
  // For now, just log it and send to Slack
  console.log(`[feedback] Agent: ${agentId}, Rating: ${rating}, Feedback: ${feedback.slice(0, 100)}`);

  // Send to Slack
  const slackSent = await sendToSlack(agentId, agent.name, userName, {
    messageId,
    feedback,
    messageContent,
    rating,
    source,
  });

  return NextResponse.json({
    success: true,
    data: {
      received: true,
      slackNotified: slackSent,
    },
  });
}
