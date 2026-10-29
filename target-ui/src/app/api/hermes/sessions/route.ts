import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function GET() {
  try {
    const res = await forwardHermesRequest("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (_) {}

  // Fallback default session
  return NextResponse.json({
    sessions: [
      {
        id: "hermes-default-session",
        title: "Default Hermes Lineage",
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        model: "hermes-3-llama-3.1-8b",
        lineage: ["root", "turn-1"],
      },
    ],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await forwardHermesRequest("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  const newId = `session_${Date.now()}`;
  return NextResponse.json({ session_id: newId, id: newId });
}
