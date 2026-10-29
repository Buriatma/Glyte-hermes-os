# In-Browser TUI & Terminal WebSocket Setup

> **Product**: GlyteOS Hermes  
> **Organization**: [GlyteTech](https://glyte.tech)

GlyteOS Hermes features a native in-browser terminal emulator powered by `@xterm/xterm` and `@xterm/addon-fit`. It connects directly to the Hermes TUI / PTY session or multiplexed tmux session.

---

## 1. How It Works

- The browser client instantiates `xterm.js` with custom high-contrast dark theme tokens (`#090d16` background, cyan accents, ANSI 256 color support).
- Connects over WebSocket to the Hermes TUI socket or node-pty bridge on port `9119` (or custom `8787`).
- Users can switch between:
  1. **Interactive Chat Only**
  2. **Split Screen** (Chat on Left, Live Terminal on Right)
  3. **Full-Screen TUI** (`hermes` or `hermes --tui`)

---

## 2. Setting Up the Host PTY Bridge (Optional Node-PTY Server)

If you are running a custom headless VPS and want full pseudo-terminal multiplexing:

### 1. Install Dependencies
```bash
npm install -g ws node-pty
```

### 2. Standalone Bridge Script (`pty-server.js`)
```javascript
const WebSocket = require("ws");
const os = require("os");
const pty = require("node-pty");

const wss = new WebSocket.Server({ port: 8787 });
const shell = process.env.SHELL || (os.platform() === "win32" ? "powershell.exe" : "bash");

console.log(`[GlyteOS PTY Bridge] Listening on ws://127.0.0.1:8787`);

wss.on("connection", (ws) => {
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  ws.on("message", (msg) => {
    ptyProcess.write(msg.toString());
  });

  ws.on("close", () => {
    ptyProcess.kill();
  });
});
```

Run with `pm2` or systemd:
```bash
pm2 start pty-server.js --name "hermes-pty"
```

---

## 3. Keyboard Shortcuts & Controls

- **Split Screen Toggle**: Click the `[Split]` badge in the status bar or run `/terminal`.
- **Fit Terminal**: Automatic resize handler adjusts columns and rows to container width and height.
- **Clear Terminal**: Click the Refresh icon or send `clear` command.
- **Copy/Paste**: Standard clipboard support (`Cmd+C`/`Cmd+V` on macOS, `Ctrl+Shift+C`/`Ctrl+Shift+V` on Linux/Windows).
