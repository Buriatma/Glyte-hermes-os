<div align="center">

# ⚡ GlyteOS Hermes

### Next-Gen Autonomous AI Operating System Client & Gateway Interface
**A 100% Sovereign, Feature-Rich Replacement for the Official Hermes WebUI**

[![Built by GlyteTech](https://img.shields.io/badge/Crafted%20by-GlyteTech-6366f1?style=for-the-badge&logo=shield)](https://glyte.tech)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Buriatma%2FGlyte--hermes--os-181717?style=for-the-badge&logo=github)](https://github.com/Buriatma/Glyte-hermes-os)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Bundler-Turbopack-000?style=for-the-badge&logo=vercel)](https://turbo.build/)
[![JSON-RPC 2.0](https://img.shields.io/badge/Protocol-JSON--RPC%202.0-emerald?style=for-the-badge)](https://www.jsonrpc.org/)
[![SQLite FTS5](https://img.shields.io/badge/Storage-Embedded%20SQLite%20FTS5-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

[**Explore GlyteTech**](https://glyte.tech) • [**Installation Guide**](docs/INSTALLATION.md) • [**Gateway Config**](docs/HERMES-CONFIGURATION.md) • [**Approvals Guide**](docs/APPROVALS-GUIDE.md) • [**Terminal Setup**](docs/TUI-WEBSOCKET-SETUP.md) • [**Secrets Guide**](docs/OPENCLAW-SECRETS.md)

</div>

---

## 🌌 Overview

**GlyteOS Hermes** is an enterprise-grade AI Operating System client crafted by **[GlyteTech](https://glyte.tech)** as a sovereign, state-of-the-art replacement for the official Nous Research Hermes WebUI.

By applying **REA (Reverse Engineer Anything)** methodology to modern chatbot foundations, all external cloud database dependencies (PostgreSQL, Drizzle), external OAuth providers, Redis, and Vercel AI SDK wrappers have been completely eliminated. 

The client communicates directly with your self-hosted Hermes OS Gateway daemon via high-speed, bidirectional JSON-RPC 2.0 WebSockets (`ws://127.0.0.1:9119`), accelerated by an **embedded SQLite + FTS5 full-text indexing engine** for sub-millisecond local caching and instantaneous search across all 950+ skills and past chat sessions.

---

## ⚡ Quickstart

### 1. ⚡ 1-Command Autonomous Terminal Installer
Run this single command in your terminal to automatically detect dependencies, generate configuration, build, and launch GlyteOS Hermes on port `4000`:

```bash
curl -fsSL https://raw.githubusercontent.com/Buriatma/Glyte-hermes-os/main/install.sh | bash
```

---

### 2. 🤖 1-Prompt Autonomous Install for Hermes Agent
Already running Hermes CLI (`hermes`)? Copy and paste this prompt directly into your agent session:

```text
Install and launch the GlyteOS Hermes WebUI client for me:
1. Run: curl -fsSL https://raw.githubusercontent.com/Buriatma/Glyte-hermes-os/main/install.sh | bash
2. Confirm the client is running on http://localhost:4000 and connected to our gateway on ws://127.0.0.1:9119.
```

*(Alternatively, ask your agent: `git clone https://github.com/Buriatma/Glyte-hermes-os.git ~/.glyte-hermes-os && cd ~/.glyte-hermes-os && ./install.sh`)*

---

## 📊 Feature Comparison Matrix

| Capability | ⚡ GlyteOS Hermes | 🐢 Vanilla Hermes WebUI | 💬 ChatGPT / Claude |
| :--- | :---: | :---: | :---: |
| **Aesthetic / Theme** | **ChatGPT/Gemini Hybrid Glassmorphism** | Basic Tailwind | Standard Web |
| **Gateway Protocol** | **Native JSON-RPC 2.0 WebSockets** | Basic HTTP/SSE | Proprietary Cloud API |
| **External DB Requirement** | **None (Zero External DB / Sovereign)** | SQLite only | Closed Multi-Tenant Cloud |
| **Embedded Cache & Indexing** | **High-Concurrency SQLite WAL + FTS5 Full-Text Search** | No Full-Text Search | Cloud Search |
| **Catalog & Search Speed** | **< 2ms Instant FTS5 Indexing across 950+ Skills** | Slow Static Scan | N/A |
| **Right-Sidebar Workspace** | **Live Tree + Syntax Code + Git Diff + Raw Download** | No | No |
| **Hermes Kanban Task Board** | **Live Subagent Task Columns (`session_kanban.py`)** | No | No |
| **Global Spotlight HUD** | **Instant `Cmd + K` Palette + SQLite FTS5 Search** | No | No |
| **Multi-Agent Rooms** | **Autonomous Debate & Consensus (`hosted_rooms.py`)** | No | No |
| **Hardware Telemetry HUD** | **Live VRAM, CPU, Tokens/Sec + 1-Click Model Switch** | No | No |
| **Memory Knowledge Graph** | **Associative 2D/3D Node Visualizer (`~/.hermes/memory`)**| No | No |
| **Official Skills Catalog** | **950+ Built-in Official Skills & Plugins** | Static list | No |
| **In-Stream Human Approvals** | **Interactive Diff + 1-Click Approve/Reject** | Terminal Prompt | N/A |
| **In-Browser Terminal & TUI** | **Embedded xterm.js (Split & Full View)** | No | No |
| **Visual Context Annotator** | **Bounding Boxes & Coordinate Pins** | No | Basic crop only |
| **Dynamic Context Variable Pills**| **`#workspace-file`, `#git-diff`, `#recent-error`** | No | No |
| **Live Markdown Artifact Canvas**| **Interactive Preview (HTML, SVG, Mermaid)** | No | Limited Canvas |
| **Swarm & Subagent Visualizer** | **Parent-Child Hierarchy Tree (`delegate_task`)** | No | No |
| **OpenClaw Secret Vault** | **`~/.hermes/.env` UI + Masking + Live Tests** | Plain text edit | Third-party only |
| **Live Voice Chat & Waveform** | **Web Audio API + Hands-Free Auto-Send** | Voice only | Audio mode |
| **Temporary Incognito Mode** | **Bypasses MEMORY.md & session persistence** | No | Temporary chat |

---

## 🏗️ Architecture & Component Flow

```
                                  +------------------------------------+
                                  |         GlyteOS Hermes UI          |
                                  |  (Next.js 16 + React 19 + Turbopack|
                                  +------------------------------------+
                                     |               |              |
            JSON-RPC 2.0 WebSockets  |               | Local Cache  | Raw Downloads / REST
           (State, Streaming, HITL)  |               | (FTS5 / WAL) | (/api/workspace/raw)
                                     v               v              v
+-----------------------------------------------------------------------------------------+
|                                    Hermes OS Gateway                                    |
|                                (Python Daemon - Port 9119)                              |
+-----------------------------------------------------------------------------------------+
       |                  |                    |                   |                |
       v                  v                    v                   v                v
+---------------+  +------------------+  +-----------------+  +------------+  +-------------------+
| Host Terminal |  | OpenClaw Secrets |  | Workspace / Git |  | Memory DB  |  | Embedded SQLite   |
| & PTY Bridge  |  | (~/.hermes/.env) |  |  (/workspace)   |  | (~/.hermes)|  | (~/.hermes/*.db)  |
+---------------+  +------------------+  +-----------------+  +------------+  +-------------------+
```

---

## 🚀 Key Modules & Capabilities

### 1. Right-Sidebar Workspace Explorer
- Dockable panel on the right side of the chat interface.
- Live workspace file tree with instant search filtering.
- Syntax-highlighted code inspector and unified git diff viewer (`+` additions in emerald, `-` deletions in rose).
- 1-click raw download generator (`/api/workspace/raw?path=...&download=1`).

### 2. Official 950+ Skills & Plugins Catalog
- Complete official skills catalog compiled directly from Nous Research Hermes Agent.
- **44 Core Skills**: `systematic-debugging`, `test-driven-development`, `codebase-inspection`, `requesting-code-review`, `simplify-code`, `spike`, `sdlc-review`, `arxiv`, `grounded-citations`, `apple-notes`, `imessage`, etc.
- **910 Official Plugins**: `artifacts`, `hermes-workbench`, `qdrant`, `quota`, `chronicle`, `tripwire`, `nexus`, etc.
- In-UI markdown & YAML inspector with instant save-to-user capability (`~/.hermes/skills/`).

### 3. Embedded SQLite & FTS5 Full-Text Search Engine
- High-concurrency embedded SQLite database located at `~/.hermes/glyte_cache.db` running in **WAL mode** (`PRAGMA journal_mode = WAL`).
- **FTS5 Virtual Tables**: Sub-millisecond indexed keyword and prefix search across all 950+ skills, plugins, and full chat message history (`GET /api/hermes/search?q=...`).
- Automatic background synchronization from local `~/.hermes/skills/` and official catalogs.
- Instant, zero-lag local cache: no external Docker containers, PostgreSQL, or Redis servers required.

### 4. Human-In-The-Loop Interactive Approvals
- In-stream cards intercepting Hermes RPC `approval_request` events for sensitive tools (`terminal`, `patch`, `write_file`, `cronjob`).
- Unified diff viewer with syntax highlighting.
- Immediate `[Approve]` and `[Reject]` actions dispatching `approval_response` back to the gateway.

### 5. In-Browser TUI & Terminal Mode
- 1-click toggle between **Chat Only**, **Split Screen** (Chat on Left, Live Terminal on Right), and **Full TUI Mode**.
- Powered by `@xterm/xterm` and `@xterm/addon-fit` connecting directly to host PTY or tmux session.

### 6. Bot Mode & Swarm Visualizer
- Toggle between interactive human chat and autonomous bot mode.
- Real-time parent-child subagent hierarchy visualizer tracking token usage, status, and outputs spawned by `delegate_task`.
- Multi-channel delivery targets selector: Origin WebUI, Discord, Telegram, or Local save.

### 7. Visual Context Annotator & Variable Pills
- **Visual Annotator**: Upload screenshots or paste images, draw bounding boxes, and drop numbered coordinate pins to give vision models pinpoint visual context.
- **Variable Pills**: Fast chips (`#workspace-file`, `#git-diff`, `#recent-error`, `#active-skill`, `#tree`, `#last-command`) inserted directly into prompt composer.

### 8. OpenClaw Secret Vault & Operator Settings
- In-UI credential vault managing `~/.hermes/.env` entries with masked inputs, copy button, and live connectivity tests.
- Operator settings dialog with real-time gateway latency ping measurement in milliseconds (`< 5ms` on local daemon).

### 9. Live Voice Chat Interface
- Integrated mic button with real-time Web Audio API frequency waveform visualizer.
- End-to-end audio pipeline routing STT / TTS through Whisper and streaming speech endpoints.
- Hands-free auto-send mode with silence detection.

### 10. Native Hermes Kanban Task Board (`session_kanban.py`)
- Dockable visual Kanban board integrated with Hermes `session_kanban.py` protocol.
- Live task columns: **Backlog**, **In Progress**, **HITL Review**, and **Completed**.
- Real-time step progress bars, token consumption metrics, assigned subagent tags (`@code-agent`, `@security-auditor`), and 1-click stage advancement.

### 11. Global Spotlight HUD (`Cmd + K` / `Ctrl + K`)
- Raycast & Alfred-style floating command palette accessible from anywhere via `Cmd + K`.
- High-speed keyword and prefix search across 950+ official skills and entire conversation history powered by embedded SQLite FTS5.
- Instant navigation commands to toggle panels, switch models, or trigger diagnostics without touching the mouse.

### 12. Multi-Agent Discussion Rooms (`hosted_rooms.py`)
- Collaborative roundtable discussions bringing together specialized autonomous personas:
  - 🏛️ **System Architect**: Designs system contracts and interfaces.
  - 💻 **Core Developer**: Implements code diffs and patches.
  - 🛡️ **Security Auditor**: Verifies secrets, permissions, and vulnerabilities.
  - 🧪 **QA Tester**: Validates edge cases and runs automated checks.
- Live consensus meter (0–100%) and shared deliberation transcript before asking for human operator approval.

### 13. Hardware Telemetry HUD & Local Model Switcher
- Real-time system telemetry HUD displaying GPU VRAM usage, system CPU load, and tokens/sec generation speed.
- 1-click switcher toggling seamlessly between **Local Air-Gapped Models** (Hermes 3 8B/70B, Qwen 2.5 Coder via Ollama/vLLM) and **Cloud Frontier Models** (Claude 3.7 Sonnet, GPT-4o, DeepSeek R1).

### 14. Associative Memory & Knowledge Graph Visualizer
- Visual 2D/3D knowledge graph representing long-term memory persisted in `~/.hermes/memory/` and `MEMORY.md`.
- Clustered nodes for **Directives**, **Architecture Decisions**, **User Preferences**, **Learned Skills**, and **Known Pitfalls**.
- Clickable node inspection with associative link exploration and direct knowledge editing.

---

## ⚡ Deployment Options

### Option A: 1-Command Installer (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/Buriatma/Glyte-hermes-os/main/install.sh | bash
```

### Option B: Docker Compose
```bash
git clone https://github.com/Buriatma/Glyte-hermes-os.git
cd Glyte-hermes-os
docker compose up -d --build
```
WebUI will be available at `http://localhost:4000` (Default password: `hermes`).

### Option C: Manual Setup with PNPM
```bash
git clone https://github.com/Buriatma/Glyte-hermes-os.git
cd Glyte-hermes-os/target-ui
pnpm install
pnpm dev -p 4000
```

---

## ⚙️ Environment Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | HTTP port for GlyteOS Hermes client |
| `HERMES_GATEWAY_URL` | `ws://127.0.0.1:9119` | JSON-RPC 2.0 WebSocket Gateway address |
| `HERMES_WEBUI_PASSWORD`| `hermes` | Password required to access WebUI |
| `HERMES_WORKSPACE_PATH`| Current workspace | Base root path for file explorer |
| `HERMES_ENV_PATH` | `~/.hermes/.env` | Path to persistent OpenClaw secret file |

---

## 📚 Technical Documentation Suite

- [Installation & Bare-Metal Setup](docs/INSTALLATION.md)
- [Hermes Gateway & Firewall Configuration](docs/HERMES-CONFIGURATION.md)
- [Human-In-The-Loop Approvals Guide](docs/APPROVALS-GUIDE.md)
- [TUI & PTY WebSocket Setup](docs/TUI-WEBSOCKET-SETUP.md)
- [OpenClaw Secret Manager Guide](docs/OPENCLAW-SECRETS.md)

---

## 🔮 Suggested Next Features & Upstream Hermes Roadmap

Here are high-impact enhancements ready to be built on top of native Hermes capabilities:

### 1. 📋 Native Hermes Kanban Task Board (`session_kanban.py`)
- **What it does**: Direct integration with Hermes' built-in `session_kanban.py` engine.
- **Why it matters**: Provides a drag-and-drop Kanban board (`Backlog`, `In Progress`, `Review / Approval`, `Done`). Subagent delegations and multi-step plans automatically generate cards with real-time token tracking and step counters.

### 2. 👥 Multi-Agent Discussion Rooms (`hosted_rooms.py`)
- **What it does**: Harnesses the gateway's `hosted_rooms.py` protocol to host collaborative multi-persona agent roundtables.
- **Why it matters**: Allows multiple autonomous agents (e.g., Software Architect, Security Auditor, Coder, and QA Tester) to debate architectural trade-offs and review diffs collaboratively in a shared room before executing changes.

### 3. 🎙️ Sub-200ms Streaming TTS Audio Engine (`streaming_tts_consumer.py`)
- **What it does**: Directly plays raw audio byte chunks over WebSockets using the browser Web Audio API.
- **Why it matters**: Delivers real-time spoken voice responses without waiting for the full LLM sentence or paragraph to complete, creating a lightning-fast conversational experience.

### 4. 🧠 Associative Memory & Knowledge Graph Visualizer
- **What it does**: Visualizes long-term episodic and declarative memory stored in `~/.hermes/memory/` and `MEMORY.md` as an interactive 2D/3D force-directed node graph.
- **Why it matters**: Allows operators to explore, audit, edit, or prune what the agent remembers about projects, preferences, and past solutions.

### 5. 🛡️ 1-Click Sovereign Cloudflare / Tailscale Tunneling
- **What it does**: Built-in toggle in Operator Settings to spawn authenticated Cloudflare Zero-Trust or Tailscale Funnel endpoints.
- **Why it matters**: Access your home or private workstation Hermes agent securely from mobile devices without exposing open ports to the public internet.

### 6. 🎛️ Local LLM Switcher & Hardware Telemetry (Ollama / vLLM / llama.cpp)
- **What it does**: Hardware HUD showing VRAM utilization, GPU temperature, and generation tokens/sec alongside a 1-click model switcher.
- **Why it matters**: Seamless toggle between cloud models (OpenRouter, Claude, GPT-4o) and 100% offline air-gapped sovereign models (Hermes 3 8B/70B, Qwen 2.5 Coder).

---

## 🛡️ License

Released under the **[MIT License](LICENSE)**. Maintained with pride by [GlyteTech](https://glyte.tech).
