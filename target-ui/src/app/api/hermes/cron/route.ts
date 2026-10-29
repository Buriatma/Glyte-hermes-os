import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function GET() {
  try {
    const res = await forwardHermesRequest("/api/cron/jobs");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (_) {}

  return NextResponse.json({
    jobs: [
      {
        id: "daily-memory-audit",
        name: "Daily Memory & Knowledge Audit",
        schedule: "0 0 * * *",
        prompt: "Review recent session notes and consolidate standing facts in MEMORY.md",
        deliver: "local",
        status: "active",
      },
    ],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await forwardHermesRequest("/api/cron/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  return NextResponse.json({
    id: `cron_${Date.now()}`,
    status: "active",
  });
}
