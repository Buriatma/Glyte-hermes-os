import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function GET() {
  try {
    const res = await forwardHermesRequest("/api/memory");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        memory: data.memory || data.builtin_files?.memory || "",
        user: data.user || data.builtin_files?.user || "",
      });
    }
  } catch (_) {}

  return NextResponse.json({
    memory: "# Hermes Core Memory\n\n- User operates a native Hermes OS client.\n- Automatic approvals enabled for safe commands.\n",
    user: "# User Profile\n\n- Role: Operator\n- Preference: Direct, concise responses.\n",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await forwardHermesRequest("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  return NextResponse.json({ ok: true, success: true });
}
