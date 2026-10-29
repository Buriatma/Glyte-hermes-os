"use client";

import { useState } from "react";
import {
  ApprovalRequestPayload,
  ApprovalDecision,
  getGatewayClient,
} from "@/lib/hermes/gateway-client";
import {
  ShieldAlert,
  Terminal,
  FileCode,
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ApprovalRequest = ApprovalRequestPayload;

export interface ApprovalCardProps {
  approval: ApprovalRequestPayload;
  onRespond?: (decision: ApprovalDecision) => void;
  isSettled?: boolean;
  settledDecision?: ApprovalDecision;
  className?: string;
}

export function ApprovalCard({
  approval,
  onRespond,
  isSettled: initialSettled = false,
  settledDecision: initialDecision,
  className,
}: ApprovalCardProps) {
  const [submitting, setSubmitting] = useState<ApprovalDecision | null>(null);
  const [settled, setSettled] = useState(initialSettled);
  const [decision, setDecision] = useState<ApprovalDecision | undefined>(initialDecision);
  const [copied, setCopied] = useState(false);
  const [showArgs, setShowArgs] = useState(false);

  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case "terminal":
      case "bash":
      case "sh":
      case "exec":
        return <Terminal className="size-4 text-amber-500" />;
      case "write_file":
      case "create_file":
        return <FileCode className="size-4 text-blue-500" />;
      case "patch":
      case "replace_file_content":
        return <FileEdit className="size-4 text-purple-500" />;
      case "cronjob":
      case "cron":
        return <Clock className="size-4 text-emerald-500" />;
      default:
        return <ShieldAlert className="size-4 text-orange-500" />;
    }
  };

  const getRiskBadge = (risk?: string) => {
    const r = (risk || "medium").toLowerCase();
    if (r === "high" || r === "critical") {
      return (
        <Badge variant="destructive" className="text-[10px] uppercase font-mono px-1.5 py-0">
          High Risk
        </Badge>
      );
    }
    if (r === "low") {
      return (
        <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          Low Risk
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10">
        Medium Risk
      </Badge>
    );
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDecision = async (chosen: ApprovalDecision) => {
    if (settled || submitting) return;
    setSubmitting(chosen);
    try {
      const client = getGatewayClient();
      await client.respondApproval(approval.requestId, chosen);
      setSettled(true);
      setDecision(chosen);
      onRespond?.(chosen);
    } catch (e) {
      console.error("Failed to submit approval decision:", e);
    } finally {
      setSubmitting(null);
    }
  };

  const commandText = approval.command || (typeof approval.args === "string" ? approval.args : "");
  const hasDiff = Boolean(approval.diff);

  return (
    <Card
      className={cn(
        "my-3 border rounded-xl overflow-hidden shadow-lg transition-all",
        settled
          ? decision === "approved" || decision === "once" || decision === "always" || decision === "session"
            ? "border-emerald-500/30 bg-emerald-950/10"
            : "border-red-500/30 bg-red-950/10"
          : "border-amber-500/40 bg-zinc-900/90 dark:bg-zinc-950/95 shadow-amber-500/5",
        className
      )}
    >
      {/* Header */}
      <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-background border border-border/60">
            {getToolIcon(approval.toolName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-xs text-foreground">
                {approval.toolName}
              </span>
              {getRiskBadge(approval.risk)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {approval.description || "Approval required to execute tool"}
            </p>
          </div>
        </div>

        {settled && (
          <div className="flex items-center gap-1.5">
            {decision === "approved" || decision === "once" || decision === "always" || decision === "session" ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1 text-xs">
                <CheckCircle2 className="size-3" />
                Approved ({decision})
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 text-xs">
                <XCircle className="size-3" />
                Rejected
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="p-3.5 space-y-3">
        {/* Command View */}
        {commandText && (
          <div className="relative rounded-lg border border-border/50 bg-black/50 p-2.5 font-mono text-xs">
            <div className="flex items-center justify-between mb-1 text-[11px] text-muted-foreground select-none">
              <span className="flex items-center gap-1 text-zinc-400">
                <Terminal className="size-3" />
                Command to execute
              </span>
              <button
                type="button"
                onClick={() => handleCopy(commandText)}
                className="hover:text-foreground transition-colors p-1"
                title="Copy command"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all text-amber-200/90 font-mono text-xs leading-relaxed max-h-48">
              {commandText}
            </pre>
          </div>
        )}

        {/* Unified Diff View */}
        {hasDiff && approval.diff && (
          <div className="rounded-lg border border-border/50 bg-black/60 overflow-hidden font-mono text-xs">
            <div className="bg-zinc-800/60 px-3 py-1.5 border-b border-border/40 text-[11px] text-zinc-300 flex items-center gap-1.5">
              <FileEdit className="size-3 text-purple-400" />
              Unified Diff Preview
            </div>
            <div className="p-2.5 overflow-x-auto max-h-56 leading-relaxed">
              {approval.diff.split("\n").map((line, idx) => {
                const isAdd = line.startsWith("+");
                const isDel = line.startsWith("-");
                return (
                  <div
                    key={idx}
                    className={cn(
                      "px-1.5 py-0.5 rounded-sm whitespace-pre font-mono text-[11px]",
                      isAdd && "bg-emerald-500/15 text-emerald-300",
                      isDel && "bg-rose-500/15 text-rose-300",
                      !isAdd && !isDel && "text-zinc-400"
                    )}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Structured Args Drawer */}
        {approval.args && typeof approval.args === "object" && Object.keys(approval.args).length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowArgs(!showArgs)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-foreground transition-colors"
            >
              {showArgs ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              <span>{showArgs ? "Hide details" : "Show invocation arguments"}</span>
            </button>
            {showArgs && (
              <pre className="mt-2 rounded-lg border border-border/40 bg-black/40 p-2.5 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-40">
                {JSON.stringify(approval.args, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      {!settled && (
        <CardFooter className="p-3 pt-0 flex items-center justify-between gap-2 border-t border-border/30 bg-muted/20">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="size-3 text-amber-500" />
            <span>Agent paused until approval</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={Boolean(submitting)}
              onClick={() => handleDecision("deny")}
              className="h-8 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 border-rose-500/30"
            >
              {submitting === "deny" ? "Rejecting..." : "Reject"}
            </Button>

            {approval.choices?.includes("always") && (
              <Button
                variant="secondary"
                size="sm"
                disabled={Boolean(submitting)}
                onClick={() => handleDecision("always")}
                className="h-8 text-xs"
              >
                Always Allow
              </Button>
            )}

            <Button
              size="sm"
              disabled={Boolean(submitting)}
              onClick={() => handleDecision("once")}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
            >
              {submitting === "once" ? "Approving..." : "Approve"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
