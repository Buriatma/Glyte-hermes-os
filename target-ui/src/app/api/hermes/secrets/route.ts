import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

function getHermesEnvPath(): string {
  const custom = process.env.HERMES_ENV_PATH;
  if (custom) return path.resolve(custom);
  return path.join(os.homedir(), ".hermes", ".env");
}

function parseEnv(content: string): Array<{ key: string; value: string; rawLine: string }> {
  const lines = content.split("\n");
  const entries: Array<{ key: string; value: string; rawLine: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      entries.push({ key: "", value: "", rawLine: line });
      continue;
    }
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      entries.push({ key, value, rawLine: line });
    } else {
      entries.push({ key: "", value: "", rawLine: line });
    }
  }
  return entries;
}

function maskSecret(val: string): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••••••" + val.slice(-4);
}

function categorizeKey(key: string): "llm" | "messaging" | "gateway" | "tools" | "custom" {
  const upper = key.toUpperCase();
  if (
    upper.includes("API_KEY") ||
    upper.includes("OPENAI") ||
    upper.includes("ANTHROPIC") ||
    upper.includes("OPENROUTER") ||
    upper.includes("GROQ") ||
    upper.includes("MISTRAL") ||
    upper.includes("GEMINI") ||
    upper.includes("DEEPSEEK") ||
    upper.includes("COHERE")
  ) {
    return "llm";
  }
  if (
    upper.includes("TELEGRAM") ||
    upper.includes("DISCORD") ||
    upper.includes("SLACK") ||
    upper.includes("TWITTER") ||
    upper.includes("WHATSAPP") ||
    upper.includes("ZALO")
  ) {
    return "messaging";
  }
  if (upper.includes("GATEWAY") || upper.includes("HERMES") || upper.includes("AUTH") || upper.includes("PORT")) {
    return "gateway";
  }
  if (
    upper.includes("BRAVE") ||
    upper.includes("TAVILY") ||
    upper.includes("SERPER") ||
    upper.includes("SEARCH") ||
    upper.includes("GITHUB") ||
    upper.includes("ELEVENLABS")
  ) {
    return "tools";
  }
  return "custom";
}

// Recommended / standard Hermes keys
const STANDARD_KEYS = [
  { key: "HERMES_GATEWAY_URL", description: "JSON-RPC Gateway WebSocket endpoint", category: "gateway", placeholder: "ws://127.0.0.1:9119" },
  { key: "HERMES_WEBUI_PASSWORD", description: "Client WebUI access password", category: "gateway", placeholder: "admin" },
  { key: "OPENROUTER_API_KEY", description: "OpenRouter primary LLM inference key", category: "llm", placeholder: "sk-or-v1-..." },
  { key: "OPENAI_API_KEY", description: "OpenAI GPT-4o / Whisper speech endpoint", category: "llm", placeholder: "sk-proj-..." },
  { key: "ANTHROPIC_API_KEY", description: "Anthropic Claude model access key", category: "llm", placeholder: "sk-ant-..." },
  { key: "DEEPSEEK_API_KEY", description: "DeepSeek-V3 and R1 reasoning key", category: "llm", placeholder: "sk-..." },
  { key: "GROQ_API_KEY", description: "Groq ultra-fast LPU inference endpoint", category: "llm", placeholder: "gsk_..." },
  { key: "BRAVE_API_KEY", description: "Brave Search API for web tools", category: "tools", placeholder: "BSA..." },
  { key: "GITHUB_TOKEN", description: "GitHub Personal Access Token for PR/repo tools", category: "tools", placeholder: "ghp_..." },
  { key: "TELEGRAM_BOT_TOKEN", description: "Telegram Bot API token for multi-channel", category: "messaging", placeholder: "123456:ABC..." },
  { key: "DISCORD_BOT_TOKEN", description: "Discord Bot Token for autonomous swarm relay", category: "messaging", placeholder: "OTI..." },
];

export async function GET() {
  try {
    const envPath = getHermesEnvPath();
    let content = "";
    let exists = false;
    let mtime = new Date().toISOString();

    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
      exists = true;
      const stat = fs.statSync(envPath);
      mtime = stat.mtime.toISOString();
    } else {
      // Check local .env.local as fallback
      const localEnv = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(localEnv)) {
        content = fs.readFileSync(localEnv, "utf-8");
      }
    }

    const parsed = parseEnv(content);
    const existingMap = new Map<string, string>();
    for (const item of parsed) {
      if (item.key) existingMap.set(item.key, item.value);
    }

    // Build comprehensive list
    const secretItems: Array<{
      key: string;
      value: string;
      masked: string;
      category: string;
      description?: string;
      status: "configured" | "missing";
      isStandard: boolean;
      rotationAlert: boolean;
    }> = [];

    // Add configured standard + custom
    const processedKeys = new Set<string>();

    for (const [key, value] of existingMap.entries()) {
      processedKeys.add(key);
      const std = STANDARD_KEYS.find((s) => s.key === key);
      secretItems.push({
        key,
        value,
        masked: maskSecret(value),
        category: std ? std.category : categorizeKey(key),
        description: std?.description,
        status: value ? "configured" : "missing",
        isStandard: !!std,
        rotationAlert: !value || value.length < 5,
      });
    }

    // Add remaining standard keys that aren't configured yet
    for (const std of STANDARD_KEYS) {
      if (!processedKeys.has(std.key)) {
        secretItems.push({
          key: std.key,
          value: "",
          masked: "",
          category: std.category,
          description: std.description,
          status: "missing",
          isStandard: true,
          rotationAlert: false,
        });
      }
    }

    return NextResponse.json({
      envPath,
      exists,
      mtime,
      secrets: secretItems,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load secrets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, key, value, secrets } = body;

    const envPath = getHermesEnvPath();
    const envDir = path.dirname(envPath);

    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true, mode: 0o700 });
    }

    // Connectivity Test
    if (action === "test") {
      const testKey = key as string;
      const testVal = (value as string) || process.env[testKey] || "";

      if (!testVal) {
        return NextResponse.json({ success: false, message: "No value provided for connectivity test" });
      }

      // Perform provider test based on key type
      if (testKey.includes("OPENROUTER")) {
        try {
          const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
            headers: { Authorization: `Bearer ${testVal}` },
          });
          const ok = res.status === 200;
          return NextResponse.json({
            success: ok,
            message: ok ? "OpenRouter API Key is valid and active" : `OpenRouter returned HTTP ${res.status}`,
          });
        } catch (e: any) {
          return NextResponse.json({ success: false, message: "Network test error: " + e.message });
        }
      }

      if (testKey.includes("OPENAI")) {
        try {
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${testVal}` },
          });
          const ok = res.status === 200;
          return NextResponse.json({
            success: ok,
            message: ok ? "OpenAI API Key is valid" : `OpenAI returned HTTP ${res.status}`,
          });
        } catch (e: any) {
          return NextResponse.json({ success: false, message: "Network test error: " + e.message });
        }
      }

      if (testKey.includes("TELEGRAM")) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${testVal}/getMe`);
          const data = await res.json();
          return NextResponse.json({
            success: data.ok,
            message: data.ok ? `Telegram Bot @${data.result?.username} connected` : "Invalid Telegram Token",
          });
        } catch (e: any) {
          return NextResponse.json({ success: false, message: "Network test error: " + e.message });
        }
      }

      // Default generic test
      return NextResponse.json({
        success: true,
        message: `Secret ${testKey} format looks valid (${testVal.length} chars)`,
      });
    }

    // Save single or batch secrets
    let existingContent = "";
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, "utf-8");
    }

    const updates = new Map<string, string>();
    if (secrets && typeof secrets === "object") {
      for (const [k, v] of Object.entries(secrets)) {
        updates.set(k, String(v));
      }
    } else if (key) {
      updates.set(key, String(value ?? ""));
    }

    const lines = existingContent ? existingContent.split("\n") : [];
    const modifiedLines: string[] = [];
    const handledKeys = new Set<string>();

    for (const line of lines) {
      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1 && !line.trim().startsWith("#")) {
        const lineKey = line.slice(0, eqIdx).trim();
        if (updates.has(lineKey)) {
          const newVal = updates.get(lineKey)!;
          modifiedLines.push(`${lineKey}="${newVal}"`);
          handledKeys.add(lineKey);
          continue;
        }
      }
      modifiedLines.push(line);
    }

    // Append newly added keys
    for (const [k, v] of updates.entries()) {
      if (!handledKeys.has(k)) {
        modifiedLines.push(`${k}="${v}"`);
      }
    }

    const finalContent = modifiedLines.join("\n").replace(/\n{3,}/g, "\n\n");
    fs.writeFileSync(envPath, finalContent, { mode: 0o600 });

    return NextResponse.json({
      success: true,
      message: `Successfully saved secrets to ${envPath}`,
      updatedKeys: Array.from(updates.keys()),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update secrets" }, { status: 500 });
  }
}
