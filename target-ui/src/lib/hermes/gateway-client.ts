/**
 * Hermes OS Gateway Client
 * 
 * Persistent WebSocket & JSON-RPC 2.0 protocol client for Hermes Core Gateway.
 * Supports bidirectional streaming, tool telemetry badges, interactive approvals,
 * session management, skills, memory, and cron jobs with automatic reconnect & heartbeats.
 */

export type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

export interface HermesToolCall {
  id: string;
  toolName: string;
  args?: Record<string, unknown> | string;
  command?: string;
  status: "running" | "complete" | "failed" | "needs_approval";
  output?: string;
  diff?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface TextAttachment {
  id: string;
  name: string;
  content: string;
  lineCount: number;
  sizeKB: string;
}

export interface HermesLogEntry {
  id: string;
  timestamp: number;
  level: "info" | "rpc" | "tool" | "warn" | "error";
  message: string;
  details?: any;
}

export interface HermesMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning?: string;
  toolCalls?: HermesToolCall[];
  status?: "pending" | "streaming" | "complete" | "error";
  attachments?: TextAttachment[];
  createdAt: number;
}

export interface ApprovalRequestPayload {
  requestId: string;
  toolName: string;
  command?: string;
  args?: Record<string, unknown> | string;
  diff?: string;
  description?: string;
  choices?: string[];
  risk?: string;
  sessionId?: string;
  timestamp?: number;
}

export type ApprovalDecision = "approved" | "rejected" | "once" | "session" | "always" | "deny";

export interface HermesSession {
  id: string;
  title: string;
  createdAt: string | number;
  updatedAt: string | number;
  messageCount?: number;
  model?: string;
  lineage?: string[];
}

export interface HermesSkill {
  name: string;
  title?: string;
  description?: string;
  enabled: boolean;
  provenance?: "bundled" | "hub" | "external" | "agent" | "official" | "community" | "custom";
  category?: string;
  type?: "skill" | "plugin";
  author?: string;
  tier?: string;
  repo?: string;
  content?: string;
  path?: string;
}

export interface HermesCronJob {
  id: string;
  name?: string;
  schedule: string;
  prompt?: string;
  deliver?: string;
  status?: "active" | "paused" | "error";
  lastRun?: string | number;
  nextRun?: string | number;
}

export interface JsonRpcFrame {
  jsonrpc: "2.0";
  id?: string | number | null;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export type EventHandler = (data: any) => void;

class GatewayClient {
  private socket: WebSocket | null = null;
  private state: ConnectionState = "idle";
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private nextRequestId = 1;
  private pendingRequests = new Map<string | number, {
    resolve: (res: any) => void;
    reject: (err: any) => void;
    timer: NodeJS.Timeout;
  }>();
  private pendingServerRequests = new Map<string, { frameId: string | number; params: any }>();
  private listeners = new Map<string, Set<EventHandler>>();
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private logListeners = new Set<(entry: HermesLogEntry) => void>();
  private logHistory: HermesLogEntry[] = [
    {
      id: "log_init_0",
      timestamp: Date.now() - 5000,
      level: "info",
      message: "GlyteOS Hermes Sovereign Kernel initialized",
    },
    {
      id: "log_init_1",
      timestamp: Date.now() - 4000,
      level: "info",
      message: "Gateway JSON-RPC 2.0 client prepared for native agent routing",
    },
  ];
  private activeSessionId: string | null = null;
  private gatewayUrl: string;

  constructor(url?: string) {
    this.gatewayUrl = url || this.resolveGatewayUrl();
  }

  public log(level: HermesLogEntry["level"], message: string, details?: any) {
    const entry: HermesLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      level,
      message,
      details,
    };
    this.logHistory.push(entry);
    if (this.logHistory.length > 500) {
      this.logHistory.shift();
    }
    for (const listener of this.logListeners) {
      try {
        listener(entry);
      } catch (e) {
        console.error("Error in log listener:", e);
      }
    }
  }

  public getLogs(): HermesLogEntry[] {
    return [...this.logHistory];
  }

  public onLog(listener: (entry: HermesLogEntry) => void): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public clearLogs() {
    this.logHistory = [];
  }

  public resolveGatewayUrl(): string {
    if (typeof window !== "undefined") {
      const envUrl = process.env.NEXT_PUBLIC_HERMES_GATEWAY_URL;
      if (envUrl) return envUrl;
      const host = window.location.hostname || "localhost";
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const port = window.location.port || "9121";
      return `${protocol}//${host}:${port}/api/ws`;
    }
    return process.env.HERMES_GATEWAY_URL || "ws://localhost:9121/api/ws";
  }

  public setGatewayUrl(url: string) {
    if (url !== this.gatewayUrl) {
      this.gatewayUrl = url;
      if (this.socket) {
        this.disconnect();
        this.connect();
      }
    }
  }

  public getGatewayUrl(): string {
    return this.gatewayUrl;
  }

  public getState(): ConnectionState {
    return this.state;
  }

  private setState(state: ConnectionState) {
    if (this.state !== state) {
      this.state = state;
      for (const listener of this.stateListeners) {
        try {
          listener(state);
        } catch (e) {
          console.error("Error in state listener:", e);
        }
      }
    }
  }

  public onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  public emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e);
        }
      }
    }
    // Wildcard handler
    const anyHandlers = this.listeners.get("*");
    if (anyHandlers) {
      for (const handler of anyHandlers) {
        try {
          handler({ event, data });
        } catch (e) {
          console.error(`Error in wildcard handler for ${event}:`, e);
        }
      }
    }
  }

  public connect(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.setState("connecting");
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    return new Promise((resolve, reject) => {
      let isSettled = false;
      try {
        const ws = new WebSocket(this.gatewayUrl);
        this.socket = ws;

        const connectTimeout = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            this.setState("error");
            try { ws.close(); } catch (_) {}
            reject(new Error(`WebSocket connection timeout to ${this.gatewayUrl}`));
            this.scheduleReconnect();
          }
        }, 8000);

        ws.onopen = () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(connectTimeout);
          this.reconnectAttempts = 0;
          this.setState("open");
          this.startHeartbeat();
          this.log("info", `Connected to Hermes Gateway at ${this.gatewayUrl}`);
          this.emit("gateway.ready", { url: this.gatewayUrl });
          resolve();
        };

        ws.onmessage = (event) => {
          this.handleInboundFrame(event.data);
        };

        ws.onerror = (_event) => {
          const errObj = new Error(`WebSocket connection failed to ${this.gatewayUrl}`);
          this.log("error", `Gateway WebSocket connection error at ${this.gatewayUrl}`);
          this.emit("error", errObj);
          if (!isSettled) {
            isSettled = true;
            clearTimeout(connectTimeout);
            this.setState("error");
            reject(errObj);
          }
        };

        ws.onclose = (event) => {
          this.stopHeartbeat();
          this.socket = null;
          this.rejectPendingRequests("WebSocket closed");
          this.setState("closed");
          this.log("warn", `Gateway WebSocket closed (code ${event.code})`);
          this.emit("closed", { code: event.code, reason: event.reason });
          this.scheduleReconnect();
        };
      } catch (err) {
        if (!isSettled) {
          isSettled = true;
          this.setState("error");
          reject(err);
        }
        this.scheduleReconnect();
      }
    });
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      try {
        this.socket.close();
      } catch (_) {}
      this.socket = null;
    }
    this.setState("idle");
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.emit("gateway.reconnecting", { attempt: this.reconnectAttempts, delayMs: delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((e) => {
        console.warn("Reconnect attempt failed:", e.message);
      });
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.request("gateway.ping", {}, 5000).catch(() => {
          // Heartbeat failed; socket may be dead
        });
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private rejectPendingRequests(reason: string) {
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error(`${reason} while waiting for RPC response`));
      this.pendingRequests.delete(id);
    }
  }

  private handleInboundFrame(rawData: any) {
    let frame: JsonRpcFrame;
    try {
      frame = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    } catch (e) {
      console.warn("Failed to parse WebSocket frame:", rawData);
      return;
    }

    // 1. Check if frame is a response to our client request
    if (frame.id !== undefined && frame.id !== null && !frame.method) {
      const pending = this.pendingRequests.get(frame.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(frame.id);
        if (frame.error) {
          this.log("error", `<-- rpc.error (${frame.id}): ${frame.error.message || frame.error.code}`);
          pending.reject(new Error(frame.error.message || `RPC Error code ${frame.error.code}`));
        } else {
          this.log("rpc", `<-- rpc.result (${frame.id})`);
          pending.resolve(frame.result);
        }
      }
      return;
    }

    // 2. Check if frame is an Inbound Server-to-Client Request (e.g. approval)
    if (frame.id !== undefined && frame.id !== null && frame.method && frame.method !== "event") {
      this.log("rpc", `<-- server.call: ${frame.method} (${frame.id})`);
      this.handleServerRequest(frame);
      return;
    }

    // 3. Event / Notification frame
    if (frame.method === "event" || (!frame.id && frame.params)) {
      const eventType = frame.params?.type || frame.params?.event || frame.method;
      const payload = frame.params?.payload ?? frame.params;
      if (eventType?.includes("tool")) {
        this.log("tool", `tool event: ${payload?.name || eventType}`);
      } else {
        this.log("info", `gateway event: ${eventType}`);
      }
      this.handleEventPayload(eventType, payload, frame.params?.session_id);
      return;
    }

    // Direct event dispatch
    if (frame.method) {
      this.emit(frame.method, frame.params);
    }
  }

  private handleServerRequest(frame: JsonRpcFrame) {
    const { id, method, params } = frame;
    const reqIdStr = String(params?.request_id || id);
    this.pendingServerRequests.set(reqIdStr, { frameId: id!, params });

    if (method === "approval" || method === "approval.request") {
      const approvalPayload: ApprovalRequestPayload = {
        requestId: reqIdStr,
        toolName: params?.tool_name || params?.tool || "terminal",
        command: params?.command || params?.cmd || "",
        args: params?.args,
        diff: params?.diff,
        description: params?.description || params?.desc || "Tool execution requires confirmation",
        choices: params?.choices || ["once", "session", "always", "deny"],
        risk: params?.risk || "medium",
        sessionId: params?.session_id || this.activeSessionId || undefined,
        timestamp: Date.now(),
      };
      this.emit("approval.request", approvalPayload);
    } else if (method) {
      this.emit(method, params);
    }
  }

  private handleEventPayload(type: string, payload: any, sessionId?: string) {
    this.emit(type, payload);

    switch (type) {
      case "message.delta":
      case "chat.stream_chunk":
      case "content.delta": {
        const text = payload?.text || payload?.delta || payload?.content || "";
        this.emit("chat.stream_chunk", { text, sessionId });
        break;
      }
      case "reasoning":
      case "message.reasoning_delta": {
        const text = payload?.text || payload?.delta || "";
        this.emit("chat.reasoning", { text, sessionId });
        break;
      }
      case "tool.start":
      case "tool.progress":
      case "tool.end": {
        this.emit("tool.telemetry", { type, ...payload, sessionId });
        break;
      }
      case "approval.request": {
        const reqId = String(payload?.request_id || `req_${Date.now()}`);
        const approvalPayload: ApprovalRequestPayload = {
          requestId: reqId,
          toolName: payload?.tool_name || payload?.tool || "terminal",
          command: payload?.command || payload?.cmd,
          args: payload?.args,
          diff: payload?.diff,
          description: payload?.description || "Tool execution requires confirmation",
          choices: payload?.choices || ["once", "session", "always", "deny"],
          risk: payload?.risk || "medium",
          sessionId: payload?.session_id || sessionId,
          timestamp: Date.now(),
        };
        this.emit("approval.request", approvalPayload);
        break;
      }
      case "approval.settled":
      case "approval.cancelled": {
        this.emit("approval.settled", payload);
        break;
      }
      case "turn.end":
      case "turn.complete":
      case "message.complete": {
        this.emit("chat.complete", { sessionId });
        break;
      }
    }
  }

  public async request<T = any>(method: string, params: Record<string, unknown> = {}, timeoutMs = 30000): Promise<T> {
    // If not open, wait or attempt to connect
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        // Wait up to 4s for existing connection attempt to open
        await new Promise<void>((resolve, reject) => {
          const check = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
              clearInterval(check);
              resolve();
            } else if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
              clearInterval(check);
              reject(new Error(`WebSocket connection closed to ${this.gatewayUrl}`));
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            reject(new Error(`Gateway connection pending. Ensure Hermes daemon is running at ${this.gatewayUrl}`));
          }, 4000);
        });
      } else {
        // Attempt fresh connect
        try {
          await this.connect();
        } catch {
          throw new Error(`Cannot reach Hermes Gateway at ${this.gatewayUrl}. Please verify the daemon is running with 'hermes gateway --port 9119'.`);
        }
      }
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(`Cannot call ${method}: Gateway WebSocket not connected. Run 'hermes gateway --port 9119' to start daemon.`);
    }

    const id = `req_${this.nextRequestId++}`;
    const frame: JsonRpcFrame = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`RPC request '${method}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      try {
        this.log("rpc", `--> ${method} (${id})`);
        this.socket!.send(JSON.stringify(frame));
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  // --- High-Level Hermes Client API ---

  public setActiveSession(sessionId: string) {
    this.activeSessionId = sessionId;
  }

  public getActiveSession(): string | null {
    return this.activeSessionId;
  }

  /**
   * Send a chat message / prompt to Hermes Gateway
   */
  public async sendMessage(sessionId: string, text: string, attachments: any[] = []): Promise<any> {
    this.activeSessionId = sessionId;
    try {
      return await this.request("prompt.submit", {
        session_id: sessionId,
        text,
        attachments,
      });
    } catch (e: any) {
      // Fallback method
      return await this.request("chat.send_message", {
        session_id: sessionId,
        text,
        attachments,
      });
    }
  }

  /**
   * Respond to an approval request
   */
  public async respondApproval(requestId: string, decision: ApprovalDecision, edit?: any): Promise<void> {
    const choice = decision === "approved" ? "once" : (decision === "rejected" ? "deny" : decision);

    // 1. If this was an inbound server-request, reply to its frame id
    const pendingServer = this.pendingServerRequests.get(requestId);
    if (pendingServer && this.socket && this.socket.readyState === WebSocket.OPEN) {
      const responseFrame: JsonRpcFrame = {
        jsonrpc: "2.0",
        id: pendingServer.frameId,
        result: { choice, decision, edit },
      };
      this.socket.send(JSON.stringify(responseFrame));
      this.pendingServerRequests.delete(requestId);
    }

    // 2. Send explicit approval.respond RPC
    try {
      await this.request("approval.respond", {
        request_id: requestId,
        choice,
        decision,
        session_id: this.activeSessionId || undefined,
        edit,
      }, 300000);
    } catch (e) {
      console.warn("approval.respond RPC result:", e);
    }

    this.emit("approval.settled", { requestId, decision });
  }

  /**
   * Sessions management
   */
  public async listSessions(): Promise<HermesSession[]> {
    try {
      const res = await this.request<{ sessions?: HermesSession[] }>("session.list", {}, 10000);
      return res?.sessions || [];
    } catch (_) {
      // Fallback to REST endpoint
      const resp = await fetch("/api/hermes/sessions");
      if (resp.ok) {
        const data = await resp.json();
        return data.sessions || [];
      }
      return [];
    }
  }

  public async createSession(title?: string): Promise<{ session_id: string }> {
    try {
      return await this.request("session.create", { title }, 10000);
    } catch (_) {
      const resp = await fetch("/api/hermes/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (resp.ok) return await resp.json();
      throw new Error("Failed to create session");
    }
  }

  public async getSession(sessionId: string): Promise<any> {
    try {
      return await this.request("session.get", { session_id: sessionId }, 10000);
    } catch (_) {
      const resp = await fetch(`/api/hermes/sessions/${sessionId}`);
      if (resp.ok) return await resp.json();
      return null;
    }
  }

  /**
   * Skills management
   */
  public async listSkills(): Promise<HermesSkill[]> {
    try {
      const res = await this.request<{ skills?: HermesSkill[] }>("skills.list", {}, 10000);
      if (res?.skills) return res.skills;
    } catch (_) {}

    const resp = await fetch("/api/hermes/skills");
    if (resp.ok) {
      const data = await resp.json();
      return Array.isArray(data) ? data : (data.skills || []);
    }
    return [];
  }

  public async readSkill(name: string): Promise<{ name: string; content: string; path?: string }> {
    try {
      return await this.request("skills.read", { name }, 10000);
    } catch (_) {
      const resp = await fetch(`/api/hermes/skills/content?name=${encodeURIComponent(name)}`);
      if (resp.ok) return await resp.json();
      throw new Error(`Failed to read skill ${name}`);
    }
  }

  public async writeSkill(name: string, content: string): Promise<any> {
    try {
      return await this.request("skills.write", { name, content }, 10000);
    } catch (_) {
      const resp = await fetch("/api/hermes/skills/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      if (resp.ok) return await resp.json();
      throw new Error(`Failed to update skill ${name}`);
    }
  }

  public async toggleSkill(name: string, enabled: boolean): Promise<any> {
    try {
      return await this.request("skills.toggle", { name, enabled }, 10000);
    } catch (_) {
      const resp = await fetch("/api/hermes/skills/toggle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, enabled }),
      });
      if (resp.ok) return await resp.json();
      throw new Error(`Failed to toggle skill ${name}`);
    }
  }

  /**
   * Memory management
   */
  public async getMemory(): Promise<{ memory: string; user: string }> {
    try {
      return await this.request("memory.read", {}, 10000);
    } catch (_) {
      const resp = await fetch("/api/hermes/memory");
      if (resp.ok) return await resp.json();
      return { memory: "", user: "" };
    }
  }

  public async saveMemory(memory: string, user: string): Promise<any> {
    try {
      return await this.request("memory.patch", { memory, user }, 10000);
    } catch (_) {
      const resp = await fetch("/api/hermes/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory, user }),
      });
      if (resp.ok) return await resp.json();
      throw new Error("Failed to save memory");
    }
  }

  /**
   * Cron management
   */
  public async listCronJobs(): Promise<HermesCronJob[]> {
    try {
      const res = await this.request<{ jobs?: HermesCronJob[] }>("cron.list", {}, 10000);
      if (res?.jobs) return res.jobs;
    } catch (_) {}

    const resp = await fetch("/api/hermes/cron");
    if (resp.ok) {
      const data = await resp.json();
      return Array.isArray(data) ? data : (data.jobs || []);
    }
    return [];
  }

  public async runCronJob(jobId: string): Promise<any> {
    try {
      return await this.request("cron.run", { job_id: jobId }, 10000);
    } catch (_) {
      const resp = await fetch(`/api/hermes/cron/${jobId}/trigger`, { method: "POST" });
      if (resp.ok) return await resp.json();
      throw new Error(`Failed to trigger cron job ${jobId}`);
    }
  }

  public async deleteCronJob(jobId: string): Promise<any> {
    try {
      return await this.request("cron.delete", { job_id: jobId }, 10000);
    } catch (_) {
      const resp = await fetch(`/api/hermes/cron/${jobId}`, { method: "DELETE" });
      if (resp.ok) return await resp.json();
      throw new Error(`Failed to delete cron job ${jobId}`);
    }
  }

  public async createCronJob(job: Partial<HermesCronJob>): Promise<any> {
    try {
      return await this.request("cron.create", job, 10000);
    } catch (_) {
      const resp = await fetch("/api/hermes/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (resp.ok) return await resp.json();
      throw new Error("Failed to create cron job");
    }
  }
}

// Global singleton instance for the client
let globalGatewayClient: GatewayClient | null = null;

export function getGatewayClient(url?: string): GatewayClient {
  if (!globalGatewayClient) {
    globalGatewayClient = new GatewayClient(url);
  } else if (url && url !== globalGatewayClient.getGatewayUrl()) {
    globalGatewayClient.setGatewayUrl(url);
  }
  return globalGatewayClient;
}

export { GatewayClient };
