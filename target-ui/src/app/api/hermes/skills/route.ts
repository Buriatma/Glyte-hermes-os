import { NextRequest, NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";
import fs from "fs";
import path from "path";
import os from "os";

// Load precompiled official catalog
import officialCatalog from "@/lib/hermes/official-skills-catalog.json";

interface SkillItem {
  name: string;
  title: string;
  description: string;
  category: string;
  type: "skill" | "plugin";
  author?: string;
  tier?: string;
  repo?: string;
  provenance: "official" | "community" | "custom";
  enabled: boolean;
  filePath?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get("type"); // "skill" | "plugin"
  const catFilter = searchParams.get("category");
  const query = (searchParams.get("q") || "").toLowerCase();

  let skillsList: SkillItem[] = (officialCatalog as SkillItem[]) || [];

  // 1. Try to read user-installed skills from ~/.hermes/skills
  try {
    const userSkillsDir = path.join(os.homedir(), ".hermes", "skills");
    if (fs.existsSync(userSkillsDir)) {
      const entries = fs.readdirSync(userSkillsDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          const skillMd = path.join(userSkillsDir, ent.name, "SKILL.md");
          let desc = "User-created skill";
          if (fs.existsSync(skillMd)) {
            const raw = fs.readFileSync(skillMd, "utf-8");
            const m = raw.match(/description:\s*["'`]?([^"'`\n]+)/);
            if (m) desc = m[1].trim();
          }
          // Avoid duplicate name
          if (!skillsList.some((s) => s.name === ent.name)) {
            skillsList.unshift({
              name: ent.name,
              title: ent.name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
              description: desc,
              category: "custom",
              type: "skill",
              author: "Local User",
              provenance: "custom",
              enabled: true,
              filePath: skillMd,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not read ~/.hermes/skills:", err);
  }

  // 2. Try Hermes Gateway REST for live enabled status
  try {
    const res = await forwardHermesRequest("/api/skills");
    if (res.ok) {
      const liveData = await res.json();
      if (Array.isArray(liveData)) {
        const liveMap = new Map(liveData.map((s: any) => [s.name, s.enabled]));
        skillsList = skillsList.map((item) => ({
          ...item,
          enabled: liveMap.has(item.name) ? !!liveMap.get(item.name) : item.enabled,
        }));
      }
    }
  } catch (_) {}

  // Apply search and category filtering
  if (typeFilter && typeFilter !== "all") {
    skillsList = skillsList.filter((s) => s.type === typeFilter);
  }
  if (catFilter && catFilter !== "all") {
    skillsList = skillsList.filter((s) => s.category.toLowerCase() === catFilter.toLowerCase());
  }
  if (query) {
    skillsList = skillsList.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    total: skillsList.length,
    skills: skillsList,
  });
}
