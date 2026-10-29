import { NextRequest, NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";
import fs from "fs";
import path from "path";
import os from "os";
import officialCatalog from "@/lib/hermes/official-skills-catalog.json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";

  if (!name) {
    return NextResponse.json({ error: "Missing skill name" }, { status: 400 });
  }

  // 1. Check if Hermes REST server can answer
  try {
    const res = await forwardHermesRequest(`/api/skills/content?name=${encodeURIComponent(name)}`);
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  // 2. Check user's ~/.hermes/skills/<name>/SKILL.md
  const userSkillMd = path.join(os.homedir(), ".hermes", "skills", name, "SKILL.md");
  if (fs.existsSync(userSkillMd)) {
    const content = fs.readFileSync(userSkillMd, "utf-8");
    return NextResponse.json({
      name,
      content,
      path: userSkillMd,
      readOnly: false,
    });
  }

  // 3. Check official skills catalog
  const entry = (officialCatalog as any[]).find((s) => s.name === name);
  if (entry && entry.filePath) {
    // Resolve relative to repo root
    const resolvedPath = path.resolve(process.cwd(), "..", entry.filePath);
    if (fs.existsSync(resolvedPath)) {
      const content = fs.readFileSync(resolvedPath, "utf-8");
      return NextResponse.json({
        name,
        content,
        path: entry.filePath,
        readOnly: true,
        type: entry.type,
      });
    }
  }

  // 4. Default fallback template
  return NextResponse.json({
    name,
    content: `# ${name}\n\nOfficial Hermes OS capability: ${entry?.description || "Skill definition."}\n\nCategory: ${entry?.category || "general"}\nAuthor: ${entry?.author || "Hermes Agent"}`,
    path: `skills/${name}/SKILL.md`,
    readOnly: false,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, content } = body;

    if (!name || content === undefined) {
      return NextResponse.json({ error: "Missing name or content" }, { status: 400 });
    }

    // Forward to Gateway REST if alive
    try {
      const res = await forwardHermesRequest("/api/skills/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (_) {}

    // Save to user skills directory ~/.hermes/skills/<name>/SKILL.md
    const skillDir = path.join(os.homedir(), ".hermes", "skills", name);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }
    const skillFile = path.join(skillDir, "SKILL.md");
    fs.writeFileSync(skillFile, content, "utf-8");

    return NextResponse.json({
      success: true,
      path: skillFile,
      message: `Saved ${name} to ~/.hermes/skills/${name}/SKILL.md`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save skill" }, { status: 500 });
  }
}
