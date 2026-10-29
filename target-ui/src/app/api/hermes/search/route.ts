import { NextRequest, NextResponse } from "next/server";
import { searchMessagesFTS, searchSkillsFTS } from "@/lib/db/sqlite";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({
      query: "",
      messages: [],
      skills: [],
    });
  }

  try {
    const messages = searchMessagesFTS(q, 20);
    const skills = searchSkillsFTS(q, undefined, undefined, 10);

    return NextResponse.json({
      query: q,
      messages,
      skills,
      engine: "sqlite-fts5",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to search" },
      { status: 500 }
    );
  }
}
