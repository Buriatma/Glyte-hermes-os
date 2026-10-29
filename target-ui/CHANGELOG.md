# Changelog

All notable changes to **GlyteOS Hermes** will be documented in this file.

The project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-29

### ⚡ Sovereign Core & Architecture
- **REA Sovereign Architecture**: Decoupled all external cloud database dependencies (PostgreSQL, Drizzle, Redis, OAuth) and Vercel AI SDK wrappers.
- **Native JSON-RPC 2.0 Gateway Client**: Direct persistent WebSocket bridge (`ws://127.0.0.1:9119`) with automatic reconnect, request ID tracking, and typed payload handling.
- **Human-In-The-Loop (HITL) Approvals**: Real-time interceptor for `approval_request` events (`terminal`, `patch`, `write_file`, `cronjob`) with interactive unified diffs and 1-click Approve/Reject callbacks.
- **Single-Password Sovereign Auth**: Protected session middleware against `HERMES_WEBUI_PASSWORD` via HTTP-only cookie.

### 🎨 App-Like UI & Interface
- **ChatGPT & Gemini Hybrid Aesthetic**: Sleek glassmorphism, floating panels, collapsible drawers, and custom dark mode palette.
- **Dockable Right Sidebar**:
  - **Live Workspace Explorer**: Real-time directory tree, search filter, syntax-highlighted code viewer, unified git diff viewer, and 1-click raw file download generator.
  - **Live Artifact Canvas**: Interactive preview and source inspector for rendered HTML, SVG, and Mermaid diagrams.
  - **Embedded Terminal & TUI**: Split-screen and full-screen in-browser terminal powered by `@xterm/xterm` connecting to host PTY.
- **950+ Built-in Official Skills & Plugins**: Complete catalog compiled directly from Nous Research Hermes Agent (44 core skills + 910 official plugins) with in-UI markdown inspection and direct save-to-user (`~/.hermes/skills/`).
- **Visual Context Annotator**: Canvas tool for vision models allowing users to upload screenshots, draw bounding boxes, and place coordinate pins.
- **Dynamic Variable Pill Bar**: Fast chips (`#workspace-file`, `#git-diff`, `#recent-error`, `#active-skill`, `#tree`, `#last-command`).
- **Live Voice Chat**: Web Audio API frequency waveform visualizer and silence-detecting hands-free auto-send.
- **OpenClaw Secret Vault**: Secure credential manager for `~/.hermes/.env` with masked fields and live API key validation tests.

### 🚀 Automation & Deployment
- **1-Command Quick Installer (`install.sh`)**: Automated detection of Node.js and PNPM, sovereign `.env.local` provisioning, build generation, and port 4000 launch.
- **Autonomous Agent 1-Prompt Install**: Copy-paste prompt allowing any running Hermes agent CLI to self-install and launch the WebUI.
- **Production Docker Compose**: Multi-stage lightweight Alpine container deployment.
