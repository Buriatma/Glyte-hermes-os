"use client";

import { useEffect, useState } from "react";
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Save,
  Plus,
  FileKey,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SecretItem {
  key: string;
  value: string;
  masked: string;
  category: string;
  description?: string;
  status: "configured" | "missing";
  isStandard: boolean;
  rotationAlert: boolean;
}

export function SecretManager() {
  const [secrets, setSecrets] = useState<SecretItem[]>([]);
  const [envPath, setEnvPath] = useState<string>("");
  const [mtime, setMtime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [unmaskedKeys, setUnmaskedKeys] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { testing: boolean; message?: string; success?: boolean }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyValue, setNewKeyValue] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hermes/secrets");
      const data = await res.json();
      if (data.secrets) {
        setSecrets(data.secrets);
        setEnvPath(data.envPath || "~/.hermes/.env");
        setMtime(data.mtime || "");
      }
    } catch (err) {
      console.error("Failed to load Hermes secrets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const handleToggleMask = (key: string) => {
    setUnmaskedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleValueChange = (key: string, val: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleTestKey = async (key: string) => {
    const val = editedValues[key] !== undefined ? editedValues[key] : (secrets.find((s) => s.key === key)?.value || "");
    setTestResults((prev) => ({
      ...prev,
      [key]: { testing: true },
    }));

    try {
      const res = await fetch("/api/hermes/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", key, value: val }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [key]: { testing: false, success: data.success, message: data.message },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [key]: { testing: false, success: false, message: "Error: " + err.message },
      }));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await fetch("/api/hermes/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secrets: editedValues }),
      });
      setEditedValues({});
      await fetchSecrets();
    } catch (err) {
      console.error("Failed to save secrets:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustom = async () => {
    if (!newKeyName.trim()) return;
    const cleanKey = newKeyName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    setSaving(true);
    try {
      await fetch("/api/hermes/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey, value: newKeyValue.trim() }),
      });
      setNewKeyName("");
      setNewKeyValue("");
      setShowAddModal(false);
      await fetchSecrets();
    } catch (err) {
      console.error("Failed to add custom secret:", err);
    } finally {
      setSaving(false);
    }
  };

  const hasDirtyChanges = Object.keys(editedValues).length > 0;

  const categories = [
    { id: "all", label: "All Secrets" },
    { id: "llm", label: "LLM Providers" },
    { id: "gateway", label: "Hermes Gateway" },
    { id: "messaging", label: "Bot & Messaging" },
    { id: "tools", label: "Tools & Search" },
  ];

  const filteredSecrets = secrets.filter(
    (s) => filterCategory === "all" || s.category === filterCategory
  );

  return (
    <div className="flex flex-col h-full w-full bg-background/95 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Key className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Secret Vault</h2>
              <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                OpenClaw Pattern
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
              <span>Path: {envPath}</span>
              {mtime && (
                <span className="text-[10px] text-zinc-500">
                  · Modified {new Date(mtime).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="h-8 gap-1.5 text-xs border-border/50 bg-card/40 hover:bg-card"
          >
            <Plus className="size-3.5" />
            Add Secret
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecrets}
            className="h-8 gap-1.5 text-xs border-border/50 bg-card/40 hover:bg-card"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Reload
          </Button>

          <Button
            size="sm"
            disabled={!hasDirtyChanges || saving}
            onClick={handleSaveAll}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Save className="size-3.5" />
            {saving ? "Saving..." : `Save Changes ${hasDirtyChanges ? `(${Object.keys(editedValues).length})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Category Pills & Info */}
      <div className="px-6 py-2.5 border-b border-border/30 bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                filterCategory === cat.id
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-zinc-500 hidden sm:flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Strict isolation: Secrets in .env · Config in config.yaml
        </div>
      </div>

      {/* Secret Cards List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filteredSecrets.map((secret) => {
          const currentVal =
            editedValues[secret.key] !== undefined ? editedValues[secret.key] : secret.value;
          const isUnmasked = unmaskedKeys[secret.key];
          const isConfigured = Boolean(currentVal);
          const isDirty = editedValues[secret.key] !== undefined;
          const testStatus = testResults[secret.key];

          return (
            <div
              key={secret.key}
              className={cn(
                "rounded-xl border p-4 transition-all bg-card/30 backdrop-blur-sm space-y-3",
                isConfigured ? "border-border/50" : "border-dashed border-border/60 bg-muted/5",
                isDirty && "border-amber-500/40 bg-amber-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {secret.key}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px] px-1.5 py-0 uppercase",
                      isConfigured
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-zinc-500 border-border/40"
                    )}
                  >
                    {isConfigured ? "Configured" : "Unset"}
                  </Badge>

                  {secret.rotationAlert && (
                    <Badge
                      variant="outline"
                      className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[9px] font-mono flex items-center gap-1"
                    >
                      <AlertTriangle className="size-2.5" />
                      Attention Needed
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!currentVal || testStatus?.testing}
                    onClick={() => handleTestKey(secret.key)}
                    className="h-7 px-2 text-[11px] gap-1 text-zinc-400 hover:text-foreground"
                  >
                    <Zap className={cn("size-3", testStatus?.testing && "animate-spin text-amber-400")} />
                    {testStatus?.testing ? "Testing..." : "Test"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!currentVal}
                    onClick={() => handleCopy(secret.key, currentVal)}
                    className="size-7 text-zinc-400 hover:text-foreground"
                  >
                    {copiedKey === secret.key ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>

              {secret.description && (
                <p className="text-xs text-muted-foreground">{secret.description}</p>
              )}

              {/* Masked / Plain Input Box */}
              <div className="relative flex items-center">
                <Input
                  type={isUnmasked ? "text" : "password"}
                  value={currentVal}
                  onChange={(e) => handleValueChange(secret.key, e.target.value)}
                  placeholder={`Set ${secret.key}...`}
                  className="font-mono text-xs pr-10 bg-background/60 border-border/50 text-foreground"
                />
                <button
                  type="button"
                  onClick={() => handleToggleMask(secret.key)}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {isUnmasked ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              {/* Test Result Feedback */}
              {testStatus && testStatus.message && (
                <div
                  className={cn(
                    "text-[11px] font-mono p-2 rounded-lg border flex items-center gap-1.5",
                    testStatus.success
                      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                      : "text-rose-300 bg-rose-500/10 border-rose-500/30"
                  )}
                >
                  {testStatus.success ? (
                    <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="size-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Secret Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <FileKey className="size-5 text-primary" />
              <h3>Add Custom Secret</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Define a new environment variable to be stored safely in <code className="text-foreground">~/.hermes/.env</code>.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-muted-foreground mb-1 block">Key Name</label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. CUSTOM_API_KEY"
                  className="text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block">Value</label>
                <Input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Secret value..."
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newKeyName.trim() || saving}
                onClick={handleAddCustom}
                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add to Vault
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
