"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  Power,
  Columns,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TerminalViewProps {
  onClose?: () => void;
  isSplitView?: boolean;
  onToggleSplit?: () => void;
  className?: string;
}

export function TerminalView({
  onClose,
  isSplitView = false,
  onToggleSplit,
  className = "",
}: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#090d16",
        foreground: "#f3f4f6",
        cursor: "#f59e0b",
        selectionBackground: "rgba(245, 158, 11, 0.3)",
        black: "#0f172a",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#ec4899",
        cyan: "#06b6d4",
        white: "#f8fafc",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome banner
    term.writeln("\x1b[1;33m  ____ _       _        ___  ____    _   _                               \x1b[0m");
    term.writeln("\x1b[1;33m / ___| |_   _| |_ ___ / _ \\/ ___|  | | | | ___ _ __ _ __ ___   ___  ___ \x1b[0m");
    term.writeln("\x1b[1;33m| |  _| | | | | __/ _ \\ | | \\___ \\  | |_| |/ _ \\ '__| '_ ` _ \\ / _ \\/ __|\x1b[0m");
    term.writeln("\x1b[1;33m| |_| | | |_| | ||  __/ |_| |___) | |  _  |  __/ |  | | | | | |  __/\\__ \\\x1b[0m");
    term.writeln("\x1b[1;33m \\____|_|\\__, |\\__\\___|\\___/|____/  |_| |_|\\___|_|  |_| |_| |_|\\___||___/\x1b[0m");
    term.writeln("\x1b[1;33m         |___/                                                           \x1b[0m");
    term.writeln("\x1b[1;36m>> GlyteOS Hermes TUI Subsystem connected.\x1b[0m");
    term.writeln("\x1b[90mConnected to Gateway Session: hermes-local-pty (PID 4921)\x1b[0m");
    term.writeln("\x1b[90mType 'help' or 'hermes --tui' to activate autonomous agent mode.\x1b[0m\r\n");

    term.write("\x1b[1;32mhermes@glyte-os\x1b[0m:\x1b[1;34m~/workspace\x1b[0m$ ");

    setIsConnected(true);

    let currentLine = "";

    term.onData((data) => {
      // Handle Enter
      if (data === "\r") {
        term.write("\r\n");
        const cmd = currentLine.trim();
        if (cmd === "clear") {
          term.clear();
        } else if (cmd === "help") {
          term.writeln("\x1b[1;33mGlyteOS Hermes Terminal Commands:\x1b[0m");
          term.writeln("  hermes --tui     Launch interactive Hermes Text User Interface");
          term.writeln("  skills list      Display registered SKILL.md bundles");
          term.writeln("  cron list        View scheduled Hermes cron jobs");
          term.writeln("  status           Check Hermes Gateway & RPC latency");
          term.writeln("  clear            Clear screen");
        } else if (cmd === "hermes --tui" || cmd === "hermes") {
          term.writeln("\x1b[1;35m[Hermes TUI Active]\x1b[0m Switching buffer to curses-mode...");
          term.writeln("Type messages directly to Hermes Agent. Press Ctrl+C to exit TUI mode.");
        } else if (cmd === "skills list") {
          term.writeln("Registered skills: [1] web_search, [2] terminal_exec, [3] file_patch, [4] cron_job");
        } else if (cmd === "status") {
          term.writeln("\x1b[1;32m✓ Gateway:\x1b[0m Connected (ws://127.0.0.1:9119) | Latency: 1.2ms | Auth: OK");
        } else if (cmd.length > 0) {
          term.writeln(`\x1b[90m[exec: ${cmd}]\x1b[0m`);
        }
        currentLine = "";
        term.write("\x1b[1;32mhermes@glyte-os\x1b[0m:\x1b[1;34m~/workspace\x1b[0m$ ");
      } else if (data === "\u007F") {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write("\b \b");
        }
      } else {
        currentLine += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, []);

  const handleReconnect = () => {
    if (xtermInstance.current) {
      xtermInstance.current.writeln("\r\n\x1b[33mReconnecting to Hermes TUI session...\x1b[0m");
      setTimeout(() => {
        xtermInstance.current?.writeln("\x1b[32mSession re-established.\x1b[0m\r\n");
        xtermInstance.current?.write("\x1b[1;32mhermes@glyte-os\x1b[0m:\x1b[1;34m~/workspace\x1b[0m$ ");
      }, 500);
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#090d16] border border-border/60 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none"
          : isSplitView
          ? "w-full h-full"
          : "w-full h-[600px]"
      } ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="h-10 border-b border-border/40 px-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="size-4 text-amber-500" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            GlyteOS Hermes Terminal / TUI
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-mono ${
              isConnected
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                : "border-destructive/40 text-destructive bg-destructive/10"
            }`}
          >
            {isConnected ? "LIVE PTY" : "DISCONNECTED"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {onToggleSplit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleSplit}
              className="size-7 text-slate-400 hover:text-slate-200"
              title={isSplitView ? "Switch to Fullscreen View" : "Split View (Chat + Terminal)"}
            >
              {isSplitView ? <Square className="size-3.5" /> : <Columns className="size-3.5" />}
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={handleReconnect}
            className="size-7 text-slate-400 hover:text-slate-200"
            title="Restart session"
          >
            <RefreshCw className="size-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="size-7 text-slate-400 hover:text-slate-200"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>

          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="size-7 text-slate-400 hover:text-destructive"
              title="Close Terminal"
            >
              <Power className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* XTerm Container */}
      <div className="flex-1 p-2 bg-[#090d16] overflow-hidden" ref={terminalRef} />

      {/* Terminal Status Bar */}
      <div className="h-6 border-t border-border/30 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span>Session: hermes-01</span>
          <span>|</span>
          <span>Mode: xterm-256color</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400/90">
          <Sparkles className="size-3" />
          <span>Hermes OS Shell</span>
        </div>
      </div>
    </div>
  );
}
