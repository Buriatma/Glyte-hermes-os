import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const sessionId = json.id || json.sessionId || `session_${Date.now()}`;
    const message = json.message || json.text || "";

    // Forward prompt to Hermes core gateway
    const res = await forwardHermesRequest("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        text: message,
      }),
    });

    if (res.ok) {
      return res;
    }

    return NextResponse.json({
      role: "assistant",
      content: "Message forwarded to Hermes OS.",
      sessionId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
