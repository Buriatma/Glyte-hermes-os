"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApprovalRequestPayload,
  ConnectionState,
  getGatewayClient,
  HermesMessage,
  HermesToolCall,
  TextAttachment,
} from "@/lib/hermes/gateway-client";
import { ApprovalCard } from "@/components/chat/ApprovalCard";
import { Markdown } from "@/components/markdown";
import {
  Send,
  Terminal,
  ShieldAlert,
  Loader2,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp,
  Mic,
  Image as ImageIcon,
  Columns,
  EyeOff,
  Code2,
  Lock,
  Layers,
  X,
  FolderKanban,
  Users,
  Search,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VisualAnnotator, VisualAnnotation } from "@/components/chat/VisualAnnotator";
import { VariablePills } from "@/components/chat/VariablePills";
import { ArtifactCanvas, ArtifactContent } from "@/components/chat/ArtifactCanvas";
import { TerminalView } from "@/components/hermes/TerminalView";
import { VoiceChatModal } from "@/components/chat/VoiceChatModal";
import { WorkspaceDrawer } from "@/components/hermes/WorkspaceDrawer";
import { KanbanBoard } from "@/components/hermes/KanbanBoard";
import { GlobalSpotlightHUD } from "@/components/hermes/GlobalSpotlightHUD";
import { MultiAgentRooms } from "@/components/hermes/MultiAgentRooms";
import { MemoryGraphVisualizer } from "@/components/hermes/MemoryGraphVisualizer";
import { appStore } from "@/app/store";

interface ChatBotProps {
  threadId: string;
  initialMessages?: HermesMessage[];
}

const SLASH_COMMANDS = [
  { command: "/help", desc: "Show Hermes OS command reference", action: "help" },
  { command: "/clear", desc: "Clear active conversation history", action: "clear" },
  { command: "/logs", desc: "View Gateway & Agent runtime logs", action: "logs" },
  { command: "/resources", desc: "Open System Resource Manager", action: "resources" },
  { command: "/workspace", desc: "Toggle Right-Sidebar Workspace Explorer", action: "toggle:workspace" },
  { command: "/terminal", desc: "Toggle In-Browser TUI & Terminal", action: "terminal" },
  { command: "/skills", desc: "Open Official Hermes Skills Catalog", action: "nav:/skills" },
  { command: "/memory", desc: "Open MEMORY.md & USER.md editor", action: "nav:/memory" },
  { command: "/cron", desc: "Open Cron Schedule Manager", action: "nav:/cron" },
  { command: "/sessions", desc: "Search & resume SQLite sessions", action: "nav:/sessions" },
  { command: "/secrets", desc: "Open OpenClaw Secret Vault", action: "nav:/secrets" },
  { command: "/swarm", desc: "View Autonomous Swarm & Subagents", action: "nav:/swarm" },
  { command: "/doctor", desc: "Run gateway system diagnostics", action: "doctor" },
];

export default function ChatBot({ threadId, initialMessages = [] }: ChatBotProps) {
  const [messages, setMessages] = useState<HermesMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequestPayload[]>([]);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  // Layout View Mode: "chat" | "split" | "terminal"
  const [viewMode, setViewMode] = useState<"chat" | "split" | "terminal">("chat");

  // Right-Sidebar Panel: "none" | "workspace" | "canvas" | "kanban" | "rooms" | "memory"
  const [rightPanel, setRightPanel] = useState<"none" | "workspace" | "canvas" | "kanban" | "rooms" | "memory">("none");

  // Global Spotlight HUD
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  // Temporary / Incognito Chat Mode
  const [isTemporaryChat, setIsTemporaryChat] = useState<boolean>(false);

  // Active Artifact Canvas
  const [activeArtifact, setActiveArtifact] = useState<ArtifactContent | null>(null);

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [annotatingImageUrl, setAnnotatingImageUrl] = useState<string | null>(null);

  // Large pasted text attachments & previews
  const [attachments, setAttachments] = useState<TextAttachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<TextAttachment | null>(null);
  const [expandedAttachmentIds, setExpandedAttachmentIds] = useState<Record<string, boolean>>({});
  const [copiedAttachmentId, setCopiedAttachmentId] = useState<string | null>(null);

  // Handle large text paste: convert into a neat .txt attachment chip
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;

    const lines = text.split("\n");
    // If text is longer than 300 characters OR contains 5 or more lines
    if (text.length > 300 || lines.length >= 5) {
      e.preventDefault();

      let ext = "txt";
      if (text.includes("import ") || text.includes("export ") || text.includes("function ") || text.includes("const ")) ext = "ts";
      else if (text.includes("<html") || text.includes("<div") || text.includes("className=")) ext = "tsx";
      else if (text.includes("SELECT ") || text.includes("CREATE TABLE")) ext = "sql";
      else if (text.trim().startsWith("{") && text.trim().endsWith("}")) ext = "json";
      else if (text.includes("error:") || text.includes("Exception:") || text.includes("Traceback")) ext = "log";

      const newAttachment: TextAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `pasted-text-${attachments.length + 1}.${ext}`,
        content: text,
        lineCount: lines.length,
        sizeKB: `${(text.length / 1024).toFixed(1)} KB`,
      };

      setAttachments((prev) => [...prev, newAttachment]);
    }
  };

  // Slash commands dropdown
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, pendingApprovals, scrollToBottom]);

  // Global Cmd + K / Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSpotlightAction = (action: string, payload?: any) => {
    switch (action) {
      case "action:kanban":
        setRightPanel("kanban");
        break;
      case "action:workspace":
        setRightPanel("workspace");
        break;
      case "action:terminal":
        setViewMode("split");
        break;
      case "action:rooms":
        setRightPanel("rooms");
        break;
      case "action:memory":
        setRightPanel("memory");
        break;
      case "action:resources":
        appStore.getState().mutate({ openUserSettings: true, userSettingsTab: "resources" });
        break;
      case "action:logs":
        appStore.getState().mutate({ openUserSettings: true, userSettingsTab: "logs" });
        break;
      case "action:secrets":
        window.location.href = "/secrets";
        break;
      case "skill:inspect":
        if (payload?.name) {
          handleSendMessage(`Explain and show usage instructions for skill: ${payload.name}`);
        }
        break;
      case "session:load":
        if (payload) {
          window.location.href = `/chat/${payload}`;
        }
        break;
      default:
        break;
    }
  };

  // Connect to Hermes Gateway
  useEffect(() => {
    const client = getGatewayClient();
    setGatewayUrl(client.getGatewayUrl());
    client.setActiveSession(threadId);

    const unsubState = client.onStateChange((state) => {
      setConnectionState(state);
    });

    // Inbound stream chunk
    const unsubChunk = client.on("chat.stream_chunk", (data: { text: string; sessionId?: string }) => {
      setIsStreaming(true);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.status === "streaming") {
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + data.text },
          ];
        }
        const newMsg: HermesMessage = {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: data.text,
          status: "streaming",
          createdAt: Date.now(),
        };
        return [...prev, newMsg];
      });
    });

    // Inbound reasoning delta
    const unsubReasoning = client.on("chat.reasoning", (data: { text: string; sessionId?: string }) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...last, reasoning: (last.reasoning || "") + data.text },
          ];
        }
        const newMsg: HermesMessage = {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: "",
          reasoning: data.text,
          status: "streaming",
          createdAt: Date.now(),
        };
        return [...prev, newMsg];
      });
    });

    // Tool Telemetry (Badges)
    const unsubTelemetry = client.on("tool.telemetry", (data: any) => {
      const { type, call_id, tool_name, args, command, output, error } = data;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;

        const currentToolCalls = last.toolCalls || [];
        const existingIdx = currentToolCalls.findIndex((t) => t.id === call_id);

        let updatedToolCalls: HermesToolCall[];
        if (type === "tool.start") {
          const newTool: HermesToolCall = {
            id: call_id || `tool_${Date.now()}`,
            toolName: tool_name || "terminal",
            command,
            args,
            status: "running",
            startTime: Date.now(),
          };
          updatedToolCalls = existingIdx >= 0
            ? currentToolCalls.map((t, idx) => (idx === existingIdx ? newTool : t))
            : [...currentToolCalls, newTool];
        } else if (type === "tool.end") {
          updatedToolCalls = currentToolCalls.map((t, idx) => {
            if (idx === existingIdx || (!call_id && idx === currentToolCalls.length - 1)) {
              return {
                ...t,
                status: error ? "failed" : "complete",
                output,
                error,
                endTime: Date.now(),
              };
            }
            return t;
          });
        } else {
          updatedToolCalls = currentToolCalls;
        }

        return [
          ...prev.slice(0, -1),
          { ...last, toolCalls: updatedToolCalls },
        ];
      });
    });

    // Inbound Approval Request
    const unsubApproval = client.on("approval.request", (payload: ApprovalRequestPayload) => {
      setPendingApprovals((prev) => {
        if (prev.some((p) => p.requestId === payload.requestId)) return prev;
        return [...prev, payload];
      });
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          const tools = last.toolCalls || [];
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              toolCalls: [
                ...tools,
                {
                  id: payload.requestId,
                  toolName: payload.toolName,
                  command: payload.command,
                  args: payload.args,
                  diff: payload.diff,
                  status: "needs_approval",
                },
              ],
            },
          ];
        }
        return prev;
      });
    });

    // Approval Settled
    const unsubSettled = client.on("approval.settled", (data: { requestId: string }) => {
      setPendingApprovals((prev) => prev.filter((p) => p.requestId !== data.requestId));
    });

    // Stream complete
    const unsubComplete = client.on("chat.complete", () => {
      setIsStreaming(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          // If message contains code artifact, auto-open canvas
          if (last.content && (last.content.includes("```html") || last.content.includes("```tsx") || last.content.includes("```mermaid"))) {
            const match = last.content.match(/```(html|tsx|typescript|jsx|mermaid|svg)\n([\s\S]*?)```/);
            if (match) {
              setActiveArtifact({
                id: `art_${last.id}`,
                title: "Generated Artifact",
                language: match[1],
                code: match[2],
              });
              setRightPanel("canvas");
            }
          }
          return [
            ...prev.slice(0, -1),
            { ...last, status: "complete" },
          ];
        }
        return prev;
      });
    });

    // Safe connect (catches non-Error event objects)
    client.connect().catch((err: any) => {
      console.warn("Gateway connection failed at mount:", err?.message || "Failed to reach gateway");
    });

    return () => {
      unsubState();
      unsubChunk();
      unsubReasoning();
      unsubTelemetry();
      unsubApproval();
      unsubSettled();
      unsubComplete();
    };
  }, [threadId]);

  // Handle message submit
  const handleSendMessage = async (customText?: string) => {
    const text = (customText || input).trim();
    if ((!text && attachments.length === 0) || isStreaming) return;

    // Intercept client slash commands
    if (text.startsWith("/")) {
      const cmd = text.toLowerCase().split(" ")[0];
      if (cmd === "/clear") {
        setMessages([]);
        setInput("");
        setAttachments([]);
        return;
      }
      if (cmd === "/workspace") {
        setRightPanel((prev) => (prev === "workspace" ? "none" : "workspace"));
        setInput("");
        return;
      }
      if (cmd === "/terminal") {
        setViewMode((m) => (m === "terminal" ? "chat" : "terminal"));
        setInput("");
        return;
      }
      if (cmd === "/skills") {
        window.location.href = "/skills";
        return;
      }
      if (cmd === "/memory") {
        window.location.href = "/memory";
        return;
      }
      if (cmd === "/cron") {
        window.location.href = "/cron";
        return;
      }
      if (cmd === "/sessions") {
        window.location.href = "/sessions";
        return;
      }
      if (cmd === "/secrets") {
        window.location.href = "/secrets";
        return;
      }
      if (cmd === "/logs") {
        appStore.getState().mutate({ openUserSettings: true, userSettingsTab: "logs" });
        setInput("");
        return;
      }
      if (cmd === "/resources") {
        appStore.getState().mutate({ openUserSettings: true, userSettingsTab: "resources" });
        setInput("");
        return;
      }
      if (cmd === "/swarm") {
        window.location.href = "/swarm";
        return;
      }
    }

    // Build payload: user prompt + attached text documents
    let payloadText = text;
    if (attachments.length > 0) {
      const attachmentsBlock = attachments
        .map((a) => `\n\n--- [Attached Document: ${a.name} (${a.lineCount} lines)] ---\n${a.content}`)
        .join("\n");
      payloadText = text ? `${text}\n${attachmentsBlock}` : `Attached context:\n${attachmentsBlock}`;
    }

    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: HermesMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text || (currentAttachments.length > 0 ? `Attached context (${currentAttachments[0].name})` : ""),
      attachments: currentAttachments,
      createdAt: Date.now(),
    };

    const pendingAssistantMsg: HermesMessage = {
      id: `asst_${Date.now() + 1}`,
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: Date.now() + 1,
    };

    setMessages((prev) => [...prev, userMsg, pendingAssistantMsg]);
    setIsStreaming(true);

    try {
      const client = getGatewayClient();
      const finalPayload = isTemporaryChat
        ? `[SYSTEM: TEMPORARY_INCOGNITO_MODE=TRUE - Do not write to MEMORY.md, do not persist to SQLite session db, block scheduled cron jobs]\n\n${payloadText}`
        : payloadText;

      await client.sendMessage(threadId, finalPayload);
    } catch (err: any) {
      console.warn("Failed to send message to Hermes Gateway:", err?.message || err);
      setIsStreaming(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content: `⚠️ **Gateway WebSocket Not Connected**\n\n${err?.message || "Could not dispatch message to the Hermes Gateway."}\n\n**To start your local Hermes gateway:**\n\`\`\`bash\nhermes gateway --port 9119\n\`\`\`\n*Ensure port 9119 is running and click **[Reconnect Gateway]** below.*`,
              status: "error",
            },
          ];
        }
        return prev;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(val.slice(1).toLowerCase());
    } else {
      setShowSlashMenu(false);
    }
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Image Upload for Visual Annotator
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAnnotatingImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAnnotations = (_annotations: VisualAnnotation[], promptSnippet: string) => {
    setInput((prev) => (prev ? `${prev}\n\n${promptSnippet}` : promptSnippet));
    setAnnotatingImageUrl(null);
  };

  const renderToolBadge = (tool: HermesToolCall) => {
    const isRunning = tool.status === "running";
    const isComplete = tool.status === "complete";
    const isFailed = tool.status === "failed";
    const needsApproval = tool.status === "needs_approval";

    const label = tool.command
      ? `${tool.toolName}("${tool.command}")`
      : tool.toolName;

    return (
      <div
        key={tool.id}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-all",
          isRunning && "bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse",
          isComplete && "bg-zinc-800/60 border-border/40 text-zinc-300",
          isFailed && "bg-rose-500/10 border-rose-500/30 text-rose-300",
          needsApproval && "bg-orange-500/15 border-orange-500/40 text-orange-300"
        )}
      >
        {isRunning && <Loader2 className="size-3 animate-spin text-amber-500" />}
        {isComplete && <Terminal className="size-3 text-emerald-500" />}
        {isFailed && <ShieldAlert className="size-3 text-rose-500" />}
        {needsApproval && <ShieldAlert className="size-3 text-orange-500" />}
        <span>
          {isRunning && `[Running: ${label}]`}
          {isComplete && `[Done: ${tool.toolName}]`}
          {isFailed && `[Failed: ${tool.toolName}]`}
          {needsApproval && `[Waiting Approval: ${tool.toolName}]`}
        </span>
      </div>
    );
  };

  const quickPrompts = [
    "Run `git status` in terminal",
    "Inspect official Hermes skills catalog",
    "Show active memory profile status",
    "Check scheduled cron jobs in ~/.hermes",
  ];

  const filteredSlashCommands = SLASH_COMMANDS.filter((sc) =>
    sc.command.toLowerCase().includes(slashFilter) || sc.desc.toLowerCase().includes(slashFilter)
  );

  return (
    <div className="flex h-full w-full bg-background relative overflow-hidden select-text">
      {/* Ambient background glow for app vibe */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Main Chat / Split Left Pane */}
      <div
        className={cn(
          "flex flex-col h-full overflow-hidden transition-all duration-200 relative z-10",
          viewMode === "split" ? "w-1/2 border-r border-border/40" : "flex-1",
          viewMode === "terminal" && "hidden"
        )}
      >
        {/* Top Protocol Status Bar */}
        <div className="px-4 py-2 border-b border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className={cn(
                  "size-2 rounded-full",
                  connectionState === "open" && "bg-emerald-500 animate-pulse",
                  connectionState === "connecting" && "bg-amber-500 animate-ping",
                  connectionState === "error" && "bg-rose-500",
                  connectionState === "closed" && "bg-zinc-500"
                )}
              />
              <span className="font-semibold text-foreground tracking-tight">GlyteOS Hermes</span>
            </div>

            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border/40 text-zinc-300">
              {connectionState === "open" ? "CONNECTED" : connectionState.toUpperCase()}
            </Badge>

            {isTemporaryChat && (
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-amber-400 border-amber-500/30 bg-amber-500/10 flex items-center gap-1">
                <EyeOff className="size-2.5" />
                Incognito
              </Badge>
            )}

            <span className="text-[10px] text-muted-foreground font-mono hidden lg:inline truncate max-w-xs">
              {gatewayUrl}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Gateway & Agent Logs */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => appStore.getState().mutate({ openUserSettings: true, userSettingsTab: "logs" })}
              className="h-7 px-2 text-[11px] font-mono gap-1.5 border-border/50 text-amber-400 hover:text-amber-300 hover:border-amber-500/40 bg-amber-500/5 transition-all"
              title="Open Gateway & Agent Live Logs"
            >
              <Terminal className="size-3" />
              <span className="hidden sm:inline">Logs</span>
            </Button>

            {/* Global Spotlight (Cmd + K) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSpotlightOpen(true)}
              className="h-7 px-2 text-[11px] font-mono gap-1 border-border/50 text-zinc-300 hover:text-foreground"
              title="Global Spotlight HUD (Cmd + K)"
            >
              <Search className="size-3 text-primary" />
              <span className="hidden sm:inline">Spotlight</span>
              <kbd className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono">⌘K</kbd>
            </Button>

            {/* Kanban Task Board */}
            <Button
              variant={rightPanel === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setRightPanel((prev) => (prev === "kanban" ? "none" : "kanban"))}
              className={cn(
                "h-7 px-2 text-[11px] font-mono gap-1 transition-all",
                rightPanel === "kanban" ? "bg-amber-600 text-white shadow-sm" : "border-border/50 text-zinc-300 hover:text-foreground"
              )}
              title="Toggle Hermes Kanban Task Board"
            >
              <FolderKanban className="size-3.5" />
              <span className="hidden lg:inline">Kanban</span>
            </Button>

            {/* Multi-Agent Rooms */}
            <Button
              variant={rightPanel === "rooms" ? "default" : "outline"}
              size="sm"
              onClick={() => setRightPanel((prev) => (prev === "rooms" ? "none" : "rooms"))}
              className={cn(
                "h-7 px-2 text-[11px] font-mono gap-1 transition-all",
                rightPanel === "rooms" ? "bg-purple-600 text-white shadow-sm" : "border-border/50 text-zinc-300 hover:text-foreground"
              )}
              title="Toggle Multi-Agent Collaborative Room"
            >
              <Users className="size-3.5" />
              <span className="hidden lg:inline">Rooms</span>
            </Button>

            {/* Memory Graph */}
            <Button
              variant={rightPanel === "memory" ? "default" : "outline"}
              size="sm"
              onClick={() => setRightPanel((prev) => (prev === "memory" ? "none" : "memory"))}
              className={cn(
                "h-7 px-2 text-[11px] font-mono gap-1 transition-all",
                rightPanel === "memory" ? "bg-indigo-600 text-white shadow-sm" : "border-border/50 text-zinc-300 hover:text-foreground"
              )}
              title="Toggle Associative Memory Graph"
            >
              <Brain className="size-3.5" />
              <span className="hidden lg:inline">Memory</span>
            </Button>

            {/* Workspace Explorer */}
            <Button
              variant={rightPanel === "workspace" ? "default" : "outline"}
              size="sm"
              onClick={() => setRightPanel((prev) => (prev === "workspace" ? "none" : "workspace"))}
              className={cn(
                "h-7 px-2 text-[11px] font-mono gap-1 transition-all",
                rightPanel === "workspace" ? "bg-primary text-primary-foreground shadow-sm" : "border-border/50 text-zinc-300 hover:text-foreground"
              )}
              title="Toggle Workspace Explorer on right sidebar"
            >
              <Layers className="size-3.5" />
              <span className="hidden lg:inline">Workspace</span>
            </Button>

            {activeArtifact && (
              <Button
                variant={rightPanel === "canvas" ? "default" : "outline"}
                size="sm"
                onClick={() => setRightPanel((prev) => (prev === "canvas" ? "none" : "canvas"))}
                className={cn(
                  "h-7 px-2 text-[11px] font-mono gap-1 transition-all",
                  rightPanel === "canvas" ? "bg-primary text-primary-foreground" : "border-primary/40 text-primary"
                )}
                title="Toggle Live Code Artifact Canvas"
              >
                <Code2 className="size-3.5" />
                <span className="hidden lg:inline">Canvas</span>
              </Button>
            )}

            {/* View Mode Switcher */}
            <div className="flex rounded-lg bg-muted/60 p-0.5 border border-border/40 text-[11px] font-mono">
              <button
                onClick={() => setViewMode("chat")}
                className={cn(
                  "px-2 py-0.5 rounded transition-all",
                  viewMode === "chat" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                title="Chat Only"
              >
                Chat
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={cn(
                  "px-2 py-0.5 rounded transition-all flex items-center gap-1",
                  viewMode === "split" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                title="Split Terminal View"
              >
                <Columns className="size-3" />
                Split
              </button>
              <button
                onClick={() => setViewMode("terminal")}
                className={cn(
                  "px-2 py-0.5 rounded transition-all flex items-center gap-1",
                  viewMode === "terminal" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                title="Full Terminal / TUI"
              >
                <Terminal className="size-3" />
                TUI
              </button>
            </div>

            {connectionState !== "open" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => getGatewayClient().connect()}
                className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
              >
                <RefreshCw className="size-3" />
                Reconnect
              </Button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/5">
                <Sparkles className="size-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  GlyteOS Hermes Native Client
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Autonomous AI OS Client connected directly via JSON-RPC 2.0 to your local or remote Hermes Agent.
                  Execute terminal commands, manage skills, and inspect files with in-stream interactive approvals.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-4 text-left">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="p-3 rounded-2xl border border-border/50 bg-card/30 hover:bg-card hover:border-primary/40 transition-all text-xs text-zinc-300 font-mono text-left shadow-sm hover:scale-[1.01]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              const showReasoning = Boolean(message.reasoning);
              const isReasoningOpen = expandedReasoning[message.id] ?? true;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-3xl mx-auto",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isUser && (
                    <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1 shadow-sm">
                      <Bot className="size-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex flex-col space-y-2 max-w-[85%]",
                      isUser ? "items-end" : "items-start w-full"
                    )}
                  >
                    {/* User Bubble */}
                    {isUser && (
                      <div className="space-y-2 max-w-full">
                        {message.content && (
                          <div className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm leading-relaxed shadow-sm">
                            {message.content}
                          </div>
                        )}

                        {/* Collapsible Attached Text Documents */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-1.5 w-full">
                            {message.attachments.map((att) => {
                              const isExpanded = expandedAttachmentIds[att.id] ?? false;
                              const isCopied = copiedAttachmentId === att.id;

                              return (
                                <div
                                  key={att.id}
                                  className="rounded-xl border border-primary/20 bg-card/70 backdrop-blur-sm p-2.5 space-y-2 text-xs shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 rounded-md bg-primary/10 text-primary">
                                        <FileText className="size-3.5" />
                                      </div>
                                      <span className="font-mono font-medium text-foreground">{att.name}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        ({att.lineCount} lines · {att.sizeKB})
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedAttachmentIds((prev) => ({
                                          ...prev,
                                          [att.id]: !prev[att.id],
                                        }))
                                      }
                                      className="text-[11px] font-mono text-primary hover:underline"
                                    >
                                      {isExpanded ? "Hide Text" : "View Text"}
                                    </button>
                                  </div>

                                  {isExpanded && (
                                    <div className="relative mt-2 p-2.5 rounded-lg bg-zinc-950/90 border border-border/40 font-mono text-xs text-zinc-300 max-h-60 overflow-y-auto whitespace-pre-wrap select-text">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(att.content);
                                          setCopiedAttachmentId(att.id);
                                          setTimeout(() => setCopiedAttachmentId(null), 2000);
                                        }}
                                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-muted/80 text-[10px] text-zinc-300 hover:text-foreground border border-border/40"
                                      >
                                        {isCopied ? <Check className="size-2.5 text-emerald-400" /> : <Copy className="size-2.5" />}
                                        <span>{isCopied ? "Copied" : "Copy"}</span>
                                      </button>
                                      {att.content}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assistant Content */}
                    {!isUser && (
                      <div className="w-full space-y-3">
                        {/* Streaming Reasoning Block */}
                        {showReasoning && (
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => toggleReasoning(message.id)}
                              className="w-full px-3 py-1.5 bg-amber-500/10 flex items-center justify-between text-amber-300 font-mono text-[11px] select-none hover:bg-amber-500/15 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Brain className="size-3 text-amber-400" />
                                Thought Process
                                {message.status === "streaming" && (
                                  <Loader2 className="size-2.5 animate-spin text-amber-400 ml-1" />
                                )}
                              </span>
                              {isReasoningOpen ? (
                                <ChevronUp className="size-3" />
                              ) : (
                                <ChevronDown className="size-3" />
                              )}
                            </button>
                            {isReasoningOpen && (
                              <div className="p-3 font-mono text-[11px] text-zinc-400 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {message.reasoning}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tool Telemetry Badges */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {message.toolCalls.map(renderToolBadge)}
                          </div>
                        )}

                        {/* Markdown Text */}
                        {message.content && (
                          <div className="text-sm text-foreground leading-relaxed relative group">
                            <Markdown>{message.content}</Markdown>

                            {/* Artifact open suggestion button */}
                            {(message.content.includes("```") || message.content.includes("<svg") || message.content.includes("mermaid")) && (
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const match = message.content.match(/```(html|tsx|typescript|jsx|mermaid|svg|json|markdown)\n([\s\S]*?)```/);
                                    setActiveArtifact({
                                      id: `art_${message.id}`,
                                      title: "Rendered Artifact",
                                      language: match ? match[1] : "markdown",
                                      code: match ? match[2] : message.content,
                                    });
                                    setRightPanel("canvas");
                                  }}
                                  className="h-7 px-2.5 text-[11px] font-mono gap-1.5 border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
                                >
                                  <Code2 className="size-3" />
                                  Open in Live Artifact Canvas
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Streaming Indicator */}
                        {message.status === "streaming" && !message.content && !message.reasoning && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <Loader2 className="size-3 animate-spin text-primary" />
                            <span>Hermes is thinking...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="size-8 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-muted-foreground shrink-0 mt-1 shadow-sm">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Interactive Approval Cards */}
          {pendingApprovals.map((approval) => (
            <div key={approval.requestId} className="max-w-3xl mx-auto">
              <ApprovalCard
                approval={approval}
                onRespond={() => {
                  setPendingApprovals((prev) =>
                    prev.filter((p) => p.requestId !== approval.requestId)
                  );
                }}
              />
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer Area with Pills & Annotator */}
        <div className="p-4 border-t border-border/40 bg-card/20 backdrop-blur-md relative">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Context variable pill bar & Incognito Mode */}
            <div className="flex items-center justify-between">
              <VariablePills
                onInsert={(variable) => {
                  setInput((prev) => (prev ? `${prev} ${variable.insertText}` : variable.insertText));
                  textareaRef.current?.focus();
                }}
              />

              {/* Temporary Incognito Toggle */}
              <button
                type="button"
                onClick={() => setIsTemporaryChat(!isTemporaryChat)}
                title="Toggle Temporary Chat Mode (bypasses MEMORY.md updates & SQLite storage)"
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1",
                  isTemporaryChat
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "border-border/40 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {isTemporaryChat ? <EyeOff className="size-3" /> : <Lock className="size-3" />}
                {isTemporaryChat ? "Incognito Active" : "Normal Mode"}
              </button>
            </div>

            {/* Slash command autocomplete overlay */}
            {showSlashMenu && (
              <div className="absolute bottom-24 left-4 right-4 max-w-3xl mx-auto z-20 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl p-2 max-h-60 overflow-y-auto">
                <div className="text-[10px] font-mono text-zinc-400 px-3 py-1 border-b border-border/30">
                  Hermes Native Slash Commands
                </div>
                {filteredSlashCommands.map((sc) => (
                  <button
                    key={sc.command}
                    onClick={() => {
                      if (sc.action === "toggle:workspace") {
                        setRightPanel((prev) => (prev === "workspace" ? "none" : "workspace"));
                        setInput("");
                        setShowSlashMenu(false);
                      } else if (sc.action.startsWith("nav:")) {
                        window.location.href = sc.action.slice(4);
                      } else if (sc.action === "terminal") {
                        setViewMode("terminal");
                        setInput("");
                        setShowSlashMenu(false);
                      } else if (sc.action === "clear") {
                        setMessages([]);
                        setInput("");
                        setShowSlashMenu(false);
                      } else {
                        setInput(sc.command + " ");
                        setShowSlashMenu(false);
                        textareaRef.current?.focus();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-bold text-foreground">{sc.command}</span>
                    <span className="text-[11px] text-muted-foreground">{sc.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Box with subtle neon border */}
            <div className="relative rounded-2xl border border-border/60 bg-background/80 focus-within:border-primary/60 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all shadow-lg overflow-hidden">
              {/* Attached Pasted Text Chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pt-2.5 pb-2 border-b border-border/40 bg-muted/20">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/90 border border-primary/30 text-xs shadow-sm"
                    >
                      <FileText className="size-3.5 text-primary" />
                      <span className="font-mono font-medium text-foreground text-[11px]">{att.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({att.lineCount} lines · {att.sizeKB})
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="text-[10px] font-mono text-primary hover:underline ml-1"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                        className="text-muted-foreground hover:text-rose-400 p-0.5 ml-0.5"
                        title="Remove attachment"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={connectionState !== "open" && connectionState !== "connecting"}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  connectionState === "open"
                    ? "Message Hermes Agent... (Type / for commands, or paste large logs/prompts to attach as .txt)"
                    : "Connecting to Hermes Gateway..."
                }
                className="w-full px-4 pt-3.5 pb-12 bg-transparent text-sm text-foreground resize-none focus:outline-none placeholder:text-muted-foreground"
              />

              <div className="absolute left-3 bottom-2.5 flex items-center gap-1.5 text-muted-foreground">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload screenshot to annotate with bounding boxes"
                  className="size-7 rounded-lg text-zinc-400 hover:text-foreground"
                >
                  <ImageIcon className="size-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsVoiceOpen(true)}
                  title="Live Voice Chat & Waveform Visualizer"
                  className="size-7 rounded-lg text-zinc-400 hover:text-primary"
                >
                  <Mic className="size-4" />
                </Button>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-zinc-400 ml-1">
                  JSON-RPC 2.0
                </span>
              </div>

              <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                <Button
                  size="icon"
                  disabled={(!input.trim() && attachments.length === 0) || isStreaming || (connectionState !== "open" && connectionState !== "connecting")}
                  onClick={() => handleSendMessage()}
                  className="size-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95"
                >
                  {isStreaming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              GlyteOS Hermes · Enterprise AI OS Client by GlyteTech · RPC & Approvals Active
            </p>
          </div>
        </div>
      </div>

      {/* Split Terminal View Right Pane */}
      {viewMode === "split" && (
        <div className="w-1/2 h-full bg-[#090d16]">
          <TerminalView
            isSplitView={true}
            onToggleSplit={() => setViewMode("chat")}
            onClose={() => setViewMode("chat")}
          />
        </div>
      )}

      {/* Full Terminal / TUI View */}
      {viewMode === "terminal" && (
        <div className="w-full h-full bg-[#090d16]">
          <TerminalView
            isSplitView={false}
            onToggleSplit={() => setViewMode("split")}
            onClose={() => setViewMode("chat")}
          />
        </div>
      )}

      {/* Right Sidebar: Workspace Explorer */}
      {rightPanel === "workspace" && (
        <div className="w-80 sm:w-96 lg:w-[460px] h-full border-l border-border/50 flex flex-col bg-[#0b0f19] shadow-2xl relative z-20">
          <div className="px-4 py-2 border-b border-border/40 bg-card/30 flex items-center justify-between text-xs">
            <span className="font-mono text-primary font-semibold flex items-center gap-1.5">
              <Layers className="size-3.5" /> Workspace Drawer
            </span>
            <button
              onClick={() => setRightPanel("none")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <WorkspaceDrawer />
          </div>
        </div>
      )}

      {/* Right Sidebar: Live Markdown Artifact Canvas */}
      {rightPanel === "canvas" && activeArtifact && (
        <div className="w-80 sm:w-96 lg:w-[480px] h-full border-l border-border/50 flex flex-col bg-[#0b0f19] shadow-2xl relative z-20">
          <ArtifactCanvas
            artifact={activeArtifact}
            onClose={() => setRightPanel("none")}
            className="w-full h-full shadow-none border-none"
          />
        </div>
      )}

      {/* Right Sidebar: Hermes Kanban Task Board */}
      {rightPanel === "kanban" && (
        <div className="w-80 sm:w-96 lg:w-[540px] xl:w-[620px] h-full border-l border-border/50 flex flex-col bg-[#0b0f19] shadow-2xl relative z-20">
          <KanbanBoard onClose={() => setRightPanel("none")} />
        </div>
      )}

      {/* Right Sidebar: Multi-Agent Rooms */}
      {rightPanel === "rooms" && (
        <div className="w-80 sm:w-96 lg:w-[480px] xl:w-[560px] h-full border-l border-border/50 flex flex-col bg-[#0b0f19] shadow-2xl relative z-20">
          <MultiAgentRooms onClose={() => setRightPanel("none")} />
        </div>
      )}

      {/* Right Sidebar: Memory Graph Visualizer */}
      {rightPanel === "memory" && (
        <div className="w-80 sm:w-96 lg:w-[520px] xl:w-[600px] h-full border-l border-border/50 flex flex-col bg-[#0b0f19] shadow-2xl relative z-20">
          <MemoryGraphVisualizer onClose={() => setRightPanel("none")} />
        </div>
      )}

      {/* Global Spotlight HUD (Cmd + K) */}
      <GlobalSpotlightHUD
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onSelectAction={handleSpotlightAction}
      />

      {/* Visual Context Annotator Modal */}
      {annotatingImageUrl && (
        <VisualAnnotator
          imageUrl={annotatingImageUrl}
          onSave={handleSaveAnnotations}
          onCancel={() => setAnnotatingImageUrl(null)}
        />
      )}

      {/* Live Voice Chat Modal */}
      <VoiceChatModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendTranscript={(transcriptText) => {
          handleSendMessage(transcriptText);
        }}
      />

      {/* Large Text Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0b0f19] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {previewAttachment.name}
                    <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                      {previewAttachment.sizeKB}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">{previewAttachment.lineCount} lines document preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(previewAttachment.content);
                    setCopiedAttachmentId(previewAttachment.id);
                    setTimeout(() => setCopiedAttachmentId(null), 2000);
                  }}
                >
                  {copiedAttachmentId === previewAttachment.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </>
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setPreviewAttachment(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-muted-foreground/90 bg-black/40 leading-relaxed select-text whitespace-pre">
              {previewAttachment.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

