#!/usr/bin/env bash
# ==============================================================================
# ⚡ GlyteOS Hermes - Autonomous 1-Command Installer
# Organization: GlyteTech (https://glyte.tech)
# Target: Sovereign WebUI client for Nous Hermes Agent
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
   ____ _       _        ____  ____     _   _                            
  / ___| |_   _| |_ ___ / ___|/ ___|   | | | | ___ _ __ _ __ ___   ___  ___ 
 | |  _| | | | | __/ _ \\___ \\\\___ \\---| |_| |/ _ \\ '__| '_ ` _ \\ / _ \\/ __|
 | |_| | | |_| | ||  __/___) |___) |---|  _  |  __/ |  | | | | | |  __/\\__ \\
  \\____|_|\\__, |\\__\\___|____/|____/    |_| |_|\\___|_|  |_| |_| |_|\\___||___/
          |___/                                                              
                  Enterprise AI OS Client by GlyteTech
EOF
echo -e "${NC}"

REPO_URL="https://github.com/Buriatma/Glyte-hermes-os.git"
INSTALL_DIR="${HOME}/.glyte-hermes-os"
PORT="${PORT:-4000}"
GATEWAY_URL="${HERMES_GATEWAY_URL:-ws://127.0.0.1:9119}"
PASSWORD="${HERMES_WEBUI_PASSWORD:-hermes}"

# 1. Determine directory
if [ -d "target-ui" ] && [ -f "package.json" ]; then
  APP_DIR="$(pwd)/target-ui"
elif [ -f "package.json" ] && [ -f "src/proxy.ts" ]; then
  APP_DIR="$(pwd)"
else
  echo -e "${CYAN}==>${NC} Cloning GlyteOS Hermes into ${INSTALL_DIR}..."
  if [ -d "${INSTALL_DIR}" ]; then
    cd "${INSTALL_DIR}"
    git pull origin main || true
  else
    git clone "${REPO_URL}" "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"
  fi
  APP_DIR="${INSTALL_DIR}/target-ui"
fi

cd "${APP_DIR}"

# 2. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[!] Node.js 20+ is required but not installed.${NC}"
  echo -e "Please install Node.js: https://nodejs.org/"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 20 ]; then
  echo -e "${AMBER}[!] Node.js version $NODE_VER detected. Recommended: Node.js 20+ LTS.${NC}"
fi

# 3. Check / Install PNPM
if ! command -v pnpm >/dev/null 2>&1; then
  echo -e "${CYAN}==>${NC} Installing pnpm package manager..."
  corepack enable 2>/dev/null || npm install -g pnpm
fi

# 4. Prepare Environment Configuration
if [ ! -f ".env.local" ]; then
  echo -e "${CYAN}==>${NC} Configuring sovereign environment variables..."
  cat << EOF > .env.local
PORT=${PORT}
HERMES_GATEWAY_URL=${GATEWAY_URL}
NEXT_PUBLIC_HERMES_GATEWAY_URL=${GATEWAY_URL}
HERMES_REST_URL=http://127.0.0.1:8787
NEXT_PUBLIC_HERMES_REST_URL=http://127.0.0.1:8787
HERMES_WEBUI_PASSWORD=${PASSWORD}
BETTER_AUTH_SECRET=glyte-hermes-os-sovereign-auth-token-32-chars
EOF
fi

# 5. Install Dependencies
echo -e "${CYAN}==>${NC} Installing dependencies via pnpm..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 6. Build Production Bundle
echo -e "${CYAN}==>${NC} Building production client bundle..."
pnpm build

# 7. Success Banner & Launch
echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  ✔ GlyteOS Hermes Successfully Installed!                      ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "  • Web Interface:    ${CYAN}http://localhost:${PORT}${NC}"
echo -e "  • Gateway Target:   ${CYAN}${GATEWAY_URL}${NC}"
echo -e "  • Access Password:  ${AMBER}${PASSWORD}${NC}"
echo -e "  • OpenClaw Vault:   ~/.hermes/.env"
echo -e "  • Official Skills:  950+ Built-in & Loaded"
echo -e "${GREEN}================================================================${NC}"
echo ""

echo -e "${CYAN}==>${NC} Launching GlyteOS Hermes on port ${PORT}..."
PORT=${PORT} pnpm start
