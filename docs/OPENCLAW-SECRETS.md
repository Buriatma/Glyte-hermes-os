# OpenClaw Secret Manager Security Architecture

> **Product**: GlyteOS Hermes  
> **Organization**: [GlyteTech](https://glyte.tech)

GlyteOS Hermes implements the **OpenClaw Isolation Pattern** for credentials, ensuring that API keys and authentication tokens are kept strictly separated from code repositories and general configuration.

---

## 1. Core Principles

1. **Strict File Segregation**:
   - **Secrets** (`*_API_KEY`, `*_TOKEN`, `*_PASSWORD`) reside exclusively in `~/.hermes/.env` (mode `0600`).
   - **Configuration** (model names, risk thresholds, allowed tools) resides in `~/.hermes/config.yaml`.
   - Secrets are **never** written to `config.yaml`, session databases (`state.db`), or version-controlled files.

2. **In-UI Credential Vault**:
   - Visual status indicators (`Configured`, `Unset`, `Attention Needed`).
   - One-click live connectivity test buttons for OpenRouter, OpenAI, and Telegram without refreshing.
   - Masked inputs with toggle visibility icons.
   - Safe copy-to-clipboard functionality.

3. **Rotation & Hygiene Alerts**:
   - Keys missing or shorter than standard vendor prefixes flag an "Attention Needed" warning badge.

---

## 2. Standard Secret Variables Reference

| Variable Name | Category | Vendor / Purpose | Format Example |
|---------------|----------|------------------|----------------|
| `OPENROUTER_API_KEY` | LLM | OpenRouter unified model router | `sk-or-v1-...` |
| `OPENAI_API_KEY` | LLM / STT | OpenAI GPT-4o & Whisper Speech | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | LLM | Claude 3.5 Sonnet & Haiku | `sk-ant-...` |
| `DEEPSEEK_API_KEY` | LLM | DeepSeek-V3 / R1 reasoning models | `sk-...` |
| `GROQ_API_KEY` | LLM | Ultra-low latency LPU inference | `gsk_...` |
| `BRAVE_API_KEY` | Tools | Brave Search API for web tools | `BSA...` |
| `GITHUB_TOKEN` | Tools | Personal Access Token for PR / Git | `ghp_...` |
| `TELEGRAM_BOT_TOKEN` | Messaging | Telegram Bot API integration | `123456:ABC...` |
| `DISCORD_BOT_TOKEN` | Messaging | Discord autonomous bot relay | `OTI...` |
| `HERMES_WEBUI_PASSWORD` | Gateway | Web Client authentication token | string |

---

## 3. Best Practices for Production

- **Chmod `0600`**: Ensure `~/.hermes/.env` has read/write permissions restricted exclusively to the process owner:
  ```bash
  chmod 600 ~/.hermes/.env
  ```
- **Backup Strategy**: Back up `~/.hermes/.env` to an encrypted cold vault (such as pass, 1Password CLI, or GPG).
- **Zero Logging**: Hermes Gateway loggers automatically sanitize any string matching vendor key regexes before persisting to `~/.hermes/logs/`.
