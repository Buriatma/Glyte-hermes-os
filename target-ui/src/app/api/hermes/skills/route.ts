import { NextRequest, NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";
import fs from "fs";
import path from "path";
import os from "os";
import { searchSkillsFTS, syncSkillsToSQLite, getDatabase } from "@/lib/db/sqlite";

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

let isInitialized = false;

function ensureSQLiteSeeded() {
  if (isInitialized) return;
  try {
    const db = getDatabase();
    const countRow = db.prepare("SELECT count(*) as count FROM skills").get() as { count: number };
    if (!countRow || countRow.count === 0) {
      let initialList: SkillItem[] = (officialCatalog as SkillItem[]) || [];
      // Read local custom skills
      const userSkillsDir = path.join(os.homedir(), ".hermes", "skills");
      if (fs.existsSync(userSkillsDir)) {
        const entries = fs.readdirSync(userSkillsDir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory()) {
            const skillMd = path.join(userSkillsDir, ent.name, "SKILL.md");
            let desc = "User-created custom skill";
            if (fs.existsSync(skillMd)) {
              const raw = fs.readFileSync(skillMd, "utf-8");
              const m = raw.match(/description:\s*["'`]?([^"'`\n]+)/);
              if (m) desc = m[1].trim();
            }
            if (!initialList.some((s) => s.name === ent.name)) {
              initialList.push({
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
      syncSkillsToSQLite(initialList);
    }
    isInitialized = true;
  } catch (err) {
    console.warn("SQLite initialization warning:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get("type"); // "skill" | "plugin"
  const catFilter = searchParams.get("category");
  const query = (searchParams.get("q") || "").trim();

  ensureSQLiteSeeded();

  // Try Hermes Gateway REST for live enabled status sync if requested
  try {
    const res = await forwardHermesRequest("/api/skills");
    if (res.ok) {
      const liveData = await res.json();
      if (Array.isArray(liveData)) {
        const db = getDatabase();
        const updateStmt = db.prepare("UPDATE skills SET enabled = ? WHERE name = ?");
        for (const item of liveData) {
          updateStmt.run(item.enabled ? 1 : 0, item.name);
        }
      }
    }
  } catch (_) {}

  try {
    // High-performance FTS5 query via SQLite
    const results = searchSkillsFTS(
      query,
      typeFilter || undefined,
      catFilter || undefined,
      1000
    ) as any[];

    const mappedSkills: SkillItem[] = results.map((row) => ({
      name: row.name,
      title: row.title,
      description: row.description,
      category: row.category,
      type: row.type as "skill" | "plugin",
      author: row.author,
      tier: row.tier,
      repo: row.repo,
      provenance: row.provenance as "official" | "community" | "custom",
      enabled: row.enabled === 1,
      filePath: row.filePath,
    }));

    return NextResponse.json({
      total: mappedSkills.length,
      skills: mappedSkills,
      storage: "sqlite-fts5",
    });
  } catch (err) {
    console.error("SQLite query error, falling back to memory:", err);
    let fallback = (officialCatalog as SkillItem[]) || [];
    if (typeFilter && typeFilter !== "all") {
      fallback = fallback.filter((s) => s.type === typeFilter);
    }
    if (catFilter && catFilter !== "all") {
      fallback = fallback.filter((s) => s.category.toLowerCase() === catFilter.toLowerCase());
    }
    if (query) {
      fallback = fallback.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    return NextResponse.json({
      total: fallback.length,
      skills: fallback,
      storage: "memory-fallback",
    });
  }
}
