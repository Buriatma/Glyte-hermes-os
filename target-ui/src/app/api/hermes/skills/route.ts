import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function GET() {
  try {
    const res = await forwardHermesRequest("/api/skills");
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  // Fallback skills list
  return NextResponse.json([
    {
      name: "terminal",
      description: "Execute shell commands and system tools safely inside Hermes OS",
      enabled: true,
      provenance: "bundled",
    },
    {
      name: "write_file",
      description: "Create or replace source code and configuration files",
      enabled: true,
      provenance: "bundled",
    },
    {
      name: "patch",
      description: "Apply unified diff patches to modify files without rewrites",
      enabled: true,
      provenance: "bundled",
    },
    {
      name: "web_search",
      description: "Search the web for current documentation and live references",
      enabled: true,
      provenance: "bundled",
    },
  ]);
}
