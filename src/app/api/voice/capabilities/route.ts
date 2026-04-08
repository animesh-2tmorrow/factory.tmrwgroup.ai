import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const capabilities = {
    providers: [
      { id: "BROWSER", label: "Browser WebSpeech", available: true },
      {
        id: "AWS",
        label: "AWS Polly + Transcribe",
        available: Boolean(process.env.AWS_REGION),
      },
    ],
    notes: [
      "Browser provider uses client-side speech APIs.",
      "AWS provider requires IAM policy for Polly/Transcribe in runtime role.",
    ],
  };

  return NextResponse.json({ success: true, data: capabilities });
}
