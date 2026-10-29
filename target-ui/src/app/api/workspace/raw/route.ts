import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Workspace base directory
function getWorkspaceRoot(): string {
  if (process.env.HERMES_WORKSPACE_PATH) {
    return path.resolve(process.env.HERMES_WORKSPACE_PATH);
  }
  // Default to parent workspace or current project cwd
  const cwd = process.cwd();
  const parent = path.resolve(cwd, "..");
  // If parent has .git or looks like Glyte-hermes-os, use parent, else cwd
  if (fs.existsSync(path.join(parent, "hermes-core")) || fs.existsSync(path.join(parent, "target-ui"))) {
    return parent;
  }
  return cwd;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPath = searchParams.get("path") || "";
    const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true";
    const wantsGit = searchParams.get("git") === "1" || searchParams.get("git") === "true";

    const workspaceRoot = getWorkspaceRoot();
    const safeTarget = path.resolve(workspaceRoot, requestedPath.replace(/^(\.\.(\/|\\|$))+/, ""));

    // Prevent directory traversal outside root
    if (!safeTarget.startsWith(workspaceRoot)) {
      return NextResponse.json({ error: "Access denied: Path outside workspace" }, { status: 403 });
    }

    // Git Status / Diff query
    if (wantsGit) {
      try {
        const { stdout: status } = await execAsync("git status --porcelain", { cwd: workspaceRoot });
        const { stdout: diff } = await execAsync("git diff -U3", { cwd: workspaceRoot });
        const { stdout: branch } = await execAsync("git branch --show-current", { cwd: workspaceRoot });
        return NextResponse.json({
          branch: branch.trim() || "main",
          status: status.trim().split("\n").filter(Boolean),
          diff: diff.slice(0, 50000), // Cap diff to 50KB for responsiveness
        });
      } catch (err: any) {
        return NextResponse.json({
          branch: "main",
          status: [],
          diff: "",
          warning: "Git not initialized or error running git: " + err.message,
        });
      }
    }

    if (!fs.existsSync(safeTarget)) {
      return NextResponse.json({ error: "File or directory not found" }, { status: 404 });
    }

    const stat = fs.statSync(safeTarget);

    // If it's a directory, return directory items
    if (stat.isDirectory()) {
      const dirents = fs.readdirSync(safeTarget, { withFileTypes: true });
      const items = dirents
        .filter((d) => !d.name.startsWith(".git") && d.name !== "node_modules")
        .map((d) => {
          const itemPath = path.join(safeTarget, d.name);
          const relPath = path.relative(workspaceRoot, itemPath);
          try {
            const itemStat = fs.statSync(itemPath);
            return {
              name: d.name,
              path: relPath,
              isDir: d.isDirectory(),
              size: itemStat.size,
              mtime: itemStat.mtime.toISOString(),
              ext: d.isDirectory() ? "" : path.extname(d.name).slice(1),
            };
          } catch {
            return {
              name: d.name,
              path: relPath,
              isDir: d.isDirectory(),
              size: 0,
              mtime: new Date().toISOString(),
              ext: "",
            };
          }
        })
        .sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });

      return NextResponse.json({
        root: workspaceRoot,
        currentPath: path.relative(workspaceRoot, safeTarget) || ".",
        items,
      });
    }

    // It's a file
    const filename = path.basename(safeTarget);
    const fileBuffer = fs.readFileSync(safeTarget);

    if (isDownload) {
      return new Response(fileBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Type": "application/octet-stream",
          "Content-Length": String(stat.size),
        },
      });
    }

    // Content preview (UTF-8 if text, otherwise base64)
    const isText = /\.(txt|md|json|ts|tsx|js|jsx|css|html|yaml|yml|sh|py|sql|toml|env|gitignore)$/i.test(filename);
    if (isText) {
      return new Response(fileBuffer.toString("utf-8"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Binary file preview: return base64 data url or raw
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process workspace request" }, { status: 500 });
  }
}
