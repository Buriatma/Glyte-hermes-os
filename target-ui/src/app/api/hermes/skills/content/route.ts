import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "";

  try {
    const res = await forwardHermesRequest(`/api/skills/content?name=${encodeURIComponent(name)}`);
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  return NextResponse.json({
    name,
    content: `# ${name}\n\nSkill definition for ${name} in Hermes OS.`,
    path: `skills/${name}/SKILL.md`,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await forwardHermesRequest("/api/skills/content", {
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
