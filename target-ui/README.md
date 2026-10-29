<div align="center">

# ⚡ GlyteOS Hermes

### Next-Gen Autonomous AI Operating System Client & Gateway Interface
**A 100% Complete, Sovereign Replacement for the Official Hermes WebUI**

[![Built by GlyteTech](https://img.shields.io/badge/Crafted%20by-GlyteTech-6366f1?style=for-the-badge&logo=shield)](https://glyte.tech)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Bundler-Turbopack-000?style=for-the-badge&logo=vercel)](https://turbo.build/)
[![JSON-RPC 2.0](https://img.shields.io/badge/Protocol-JSON--RPC%202.0-emerald?style=for-the-badge)](https://www.jsonrpc.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

[**Explore GlyteTech**](https://glyte.tech) • [**Installation Guide**](docs/INSTALLATION.md) • [**Gateway Config**](docs/HERMES-CONFIGURATION.md) • [**Approvals Guide**](docs/APPROVALS-GUIDE.md) • [**Terminal Setup**](docs/TUI-WEBSOCKET-SETUP.md) • [**Secrets Guide**](docs/OPENCLAW-SECRETS.md)

</div>

---

## 🌌 Overview

**GlyteOS Hermes** is an enterprise-grade AI OS Client built from the ground up by **GlyteTech** as a full sovereign replacement for the official Nous Research Hermes WebUI. 

By applying **REA (Reverse Engineer Anything)** methodology to modern chatbot foundations, all external cloud database dependencies (PostgreSQL, Drizzle), external OAuth providers, Redis, and Vercel AI SDK wrappers have been eliminated. The client connects directly to self-hosted Hermes OS Gateway daemons via high-performance JSON-RPC 2.0 WebSockets.

---

## 📊 Feature Comparison Matrix

| Feature | ⚡ GlyteOS Hermes | 🐢 Vanilla Hermes WebUI | 💬 ChatGPT / Claude |
| :--- | :---: | :---: | :---: |
| **Aesthetic / Theme** | **ChatGPT/Gemini Hybrid Glassmorphism** | Basic Tailwind | Standard Web |
| **Gateway Protocol** | **Native JSON-RPC 2.0 WebSockets** | Basic HTTP/SSE | Proprietary Cloud API |
| **External DB Requirement** | **None (Zero DB / Sovereign)** | SQLite only | Closed Multi-Tenant Cloud |
| **In-Stream Human Approvals** | **Interactive Diff + 1-Click Approve/Reject** | Terminal Prompt | N/A |
| **In-Browser Terminal & TUI** | **Embedded xterm.js (Split & Full View)** | No | No |
| **Visual Context Annotator** | **Bounding Boxes & Coordinate Pins** | No | Basic crop only |
| **Dynamic Context Variable Pills**| **`#workspace-file`, `#git-diff`, `#recent-error`** | No | No |
| **Intent Clarification Cards**| **1-Click Chips (`[Fix Bug]`, `[Refactor]`)** | No | Suggestions only |
| **Live Markdown Artifact Canvas**| **Interactive Preview (HTML, SVG, Mermaid)** | No | Limited Canvas |
| **Swarm & Subagent Visualizer** | **Parent-Child Hierarchy Tree (`delegate_task`)** | No | No |
| **OpenClaw Secret Vault** | **`~/.hermes/.env` UI + Masking + Live Tests** | Plain text edit | Third-party only |
| **Workspace Explorer & Git Diff** | **Directory Tree + 1-Click Raw Download** | No | No |
| **Live Voice Chat & Waveform** | **Web Audio API + Hands-Free Auto-Send** | Voice only | Audio mode |
| **Temporary Incognito Mode** | **Bypasses MEMORY.md & session persistence** | No | Temporary chat |

---

## 🏗️ Architecture & Component Flow

```
                                  +------------------------------------+
                                  |         GlyteOS Hermes UI          |
                                  |  (Next.js 16 + React 19 + Turbopack|
                                  +------------------------------------+
                                             |              |
                    JSON-RPC 2.0 WebSockets  |              |  Raw Downloads / REST
                   (State, Streaming, HITL)  |              |  (/api/workspace/raw)
                                             v              v
+-----------------------------------------------------------------------------------------+
|                                    Hermes OS Gateway                                    |
|                                (Python Daemon - Port 9119)                              |
+-----------------------------------------------------------------------------------------+
       |                           |                          |                     |
       v                           v                          v                     v
+---------------+        +-------------------+       +------------------+    +--------------+
| Host Terminal |        |  OpenClaw Secrets |       | Workspace / Git  |    | Memory Engine|
| & PTY Bridge  |        | (~/.hermes/.env)  |       |  (/workspace)    |    | (~/.hermes)  |
+---------------+        +-------------------+       +------------------+    +--------------+
```

---

## 🚀 Key Modules & Capabilities

### 1. Intelligent UI: Context Bridge
- **Visual Context Annotator**: Upload screenshots or paste images, draw bounding boxes, and drop numbered coordinate pins to give vision models pinpoint visual context.
- **Intent Clarification Cards**: One-click contextual chips (`[Fix Bug]`, `[Refactor]`, `[Write Tests]`, `[Explain Code]`, `[Optimize]`, `[Security Audit]`) to instantly sharpen instructions.
- **Dynamic Variable Pill Bar**: Fast chips (`#workspace-file`, `#git-diff`, `#recent-error`, `#active-skill`, `#tree`, `#last-command`) inserted directly into prompt composer.
- **Live Markdown Artifact Canvas**: Dedicated right-hand dockable canvas with Preview and Code tabs for HTML, SVG, Mermaid diagrams, and formatted markdown documentation.

### 2. Hermes Native Gateway & Streaming
- Persistent WebSocket client connecting directly to `HERMES_GATEWAY_URL` (`ws://127.0.0.1:9119` or `8787`).
- Real-time token streaming with collapsible thought process / reasoning blocks.
- Dynamic tool telemetry badges displaying live progress:
  - `[Running: terminal("git status")]`
  - `[web_search: "latest nextjs docs"]`
  - `[read_file: "package.json"]`

### 3. Human-In-The-Loop Interactive Approvals
- In-stream cards intercepting Hermes RPC `approval_request` events for sensitive tools (`terminal`, `patch`, `write_file`, `cronjob`).
- Unified diff viewer with syntax highlighting (additions in emerald, deletions in rose).
- Immediate `[Approve]` and `[Reject]` actions dispatching `approval_response` back to the gateway.

### 4. In-Browser TUI & Terminal Mode
- One-click toggle switch between **Web Chat**, **Split Screen** (Chat on Left, Live Terminal on Right), and **Full TUI Mode**.
- Powered by `@xterm/xterm` and `@xterm/addon-fit` connecting directly to host PTY or tmux session.

### 5. Bot Mode & Swarm Visualizer
- Switch between interactive human chat and autonomous bot mode.
- Real-time parent-child subagent hierarchy visualizer tracking token usage, status, and outputs spawned by `delegate_task`.
- Multi-channel delivery targets selector: Origin WebUI, Discord, Telegram, or Local save.

### 6. Workspace Drawer & Temporary Chat
- **Workspace Explorer**: Live directory tree, file preview, git status, diff viewer, and instant 1-click raw download generator (`/api/workspace/raw?path=...&download=1`).
- **Temporary Chat Mode**: Incognito switch that marks sessions as transient, bypassing `MEMORY.md` updates, disabling SQLite persistence, and blocking scheduled cron side-effects.

### 7. Voice Chat Interface
- Integrated mic button with real-time Web Audio API frequency waveform visualizer.
- End-to-end audio pipeline routing STT / TTS through Whisper and streaming speech endpoints.
- Hands-free auto-send mode with silence detection.

### 8. OpenClaw Secret Vault
- In-UI credential vault managing `~/.hermes/.env` entries.
- Masked inputs, copy button, key rotation alerts, and live connectivity test button for OpenRouter, OpenAI, and Telegram.
- Strictly separates secrets in `.env` and configuration in `config.yaml`.

### 9. Native Slash Commands & System Drawers
- Native slash-command menu (`/help`, `/clear`, `/model`, `/skills`, `/memory`, `/cron`, `/sessions`, `/workspace`, `/secrets`, `/swarm`, `/terminal`, `/doctor`).
- Dedicated drawer pages for **Skills Manager**, **Memory & Profile View**, **Cron Control**, and **Sessions Lineage**.

---

## ⚡ Quickstart

### Run with Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/Buriatma/Glyte-hermes-os.git
cd Glyte-hermes-os

# 2. Start container
docker compose up -d --build

# 3. Open WebUI
open http://localhost:4000
```

### Run Locally with PNPM

```bash
cd target-ui
pnpm install
pnpm dev -p 4000
```

---

## ⚙️ Environment Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | HTTP port for GlyteOS Hermes client |
| `HERMES_GATEWAY_URL` | `ws://127.0.0.1:9119` | JSON-RPC 2.0 WebSocket Gateway address |
| `HERMES_WEBUI_PASSWORD`| `admin` | Password required to access WebUI |
| `HERMES_WORKSPACE_PATH`| Current workspace | Base root path for file explorer |
| `HERMES_ENV_PATH` | `~/.hermes/.env` | Path to persistent OpenClaw secret file |

---

## 📚 Detailed Documentation

- [Installation & Bare-Metal Setup](docs/INSTALLATION.md)
- [Hermes Gateway & Firewall Configuration](docs/HERMES-CONFIGURATION.md)
- [Human-In-The-Loop Approvals Guide](docs/APPROVALS-GUIDE.md)
- [TUI & PTY WebSocket Setup](docs/TUI-WEBSOCKET-SETUP.md)
- [OpenClaw Secret Manager Guide](docs/OPENCLAW-SECRETS.md)

---

## 🛡️ License

Released under the **MIT License**. Maintained with pride by [GlyteTech](https://glyte.tech).
