# Hermes Gateway Configuration & Daemon Guide

> **Product**: GlyteOS Hermes  
> **Organization**: [GlyteTech](https://glyte.tech)

This document details how to configure and run the Hermes Gateway daemon, manage ports, bind network interfaces, and secure WebSocket traffic.

---

## 1. Starting the Gateway Daemon

Hermes Agent provides two methods to start the daemon:

### Standard Foreground Mode
```bash
hermes gateway --port 9119 --host 127.0.0.1
```

### Background Service Mode (Systemd / Supervisor)
```bash
hermes serve --daemon --port 9119
```

Check gateway status:
```bash
hermes gateway status
```

---

## 2. Gateway Configuration File (`~/.hermes/config.yaml`)

Configure gateway parameters in your global Hermes configuration file:

```yaml
gateway:
  host: "127.0.0.1" # Keep on loopback unless using Tailscale/WireGuard
  port: 9119
  auth_required: false # When binding to localhost, token is handled by WebUI password
  allowed_origins:
    - "http://localhost:4000"
    - "http://127.0.0.1:4000"
    - "https://*.glyte.tech"

security:
  command_allowlist:
    - "git status"
    - "git diff"
    - "ls -la"
  approval_timeout_seconds: 300
  default_risk_level: "prompt" # prompt | deny | allow

tools:
  terminal:
    enabled: true
    timeout: 120
  patch:
    enabled: true
    unified_diff: true
  web_search:
    provider: "brave" # brave | serper | tavily
```

---

## 3. Firewall & Reverse Proxy (Nginx / Caddy)

If exposing GlyteOS Hermes over the internet, never expose port 9119 directly. Terminate SSL at Nginx or Cloudflare and proxy WebSocket traffic:

### Nginx Configuration Snippet
```nginx
server {
    server_name hermes.yourdomain.com;
    listen 443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/hermes.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hermes.yourdomain.com/privkey.pem;

    # GlyteOS Hermes Next.js Web App
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Hermes OS Gateway WebSocket RPC
    location /rpc {
        proxy_pass http://127.0.0.1:9119;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Tailscale Deployment (Zero-Exposition)
Recommended setup: Bind Hermes Gateway to your Tailscale IP (e.g. `100.x.y.z`), making it accessible securely without opening public firewall ports.
