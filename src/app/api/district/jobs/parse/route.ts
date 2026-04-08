import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { ok: false, error: "transcript is required" },
        { status: 400 }
      );
    }

    const prompt = `Extract individual task/job titles from this voice transcript. Return ONLY a JSON array of strings, each being a clear, concise job title. No explanations, no markdown, just the JSON array.

Transcript: "${transcript}"

Return format: ["job title 1", "job title 2", "job title 3"]`;

    const response = await bedrock.send(
      new InvokeModelCommand({
        modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      })
    );

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const text = result.content?.[0]?.text ?? "";

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const jobs: string[] = JSON.parse(match[0]);
      return NextResponse.json({ ok: true, jobs });
    }

    // Fallback: return whole transcript as a single job
    return NextResponse.json({ ok: true, jobs: [transcript.trim()] });
  } catch (err: any) {
    // Fallback on any error: return transcript as-is
    try {
      const { transcript } = await req.json().catch(() => ({ transcript: "" }));
      return NextResponse.json({
        ok: true,
        jobs: transcript ? [transcript.trim()] : [],
        warning: err.message,
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 500 }
      );
    }
  }
}
