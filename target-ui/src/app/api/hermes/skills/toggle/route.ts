import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await forwardHermesRequest("/api/skills/toggle", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  return NextResponse.json({ ok: true, success: true });
}
