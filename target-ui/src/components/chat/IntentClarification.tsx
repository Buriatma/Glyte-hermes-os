"use client";

import React from "react";
import {
  Bug,
  Code2,
  TestTube2,
  BookOpen,
  Zap,
  ShieldCheck,
  FileTerminal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IntentOption {
  id: string;
  label: string;
  icon: React.ElementType;
  prefix: string;
  badge?: string;
}

export const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "fix-bug",
    label: "Fix Bug",
    icon: Bug,
    prefix: "Investigate and resolve the following bug: ",
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: Code2,
    prefix: "Refactor and modernize this code for readability and performance: ",
  },
  {
    id: "write-tests",
    label: "Write Tests",
    icon: TestTube2,
    prefix: "Write comprehensive unit and integration tests for: ",
  },
  {
    id: "explain",
    label: "Explain Architecture",
    icon: BookOpen,
    prefix: "Break down and explain the architecture of: ",
  },
  {
    id: "optimize",
    label: "Optimize Speed",
    icon: Zap,
    prefix: "Profile and optimize the performance bottlenecks in: ",
  },
  {
    id: "security",
    label: "Security Audit",
    icon: ShieldCheck,
    prefix: "Perform a security analysis and vulnerability audit on: ",
  },
  {
    id: "script",
    label: "Generate Shell Script",
    icon: FileTerminal,
    prefix: "Generate an idempotent, safe shell script to: ",
  },
];

interface IntentClarificationProps {
  onSelectIntent: (intent: IntentOption) => void;
  className?: string;
}

export function IntentClarification({ onSelectIntent, className = "" }: IntentClarificationProps) {
  return (
    <div className={`p-2.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Sparkles className="size-3.5" />
        <span>Clarify Intent with 1-Click:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {INTENT_OPTIONS.map((intent) => {
          const Icon = intent.icon;
          return (
            <Button
              key={intent.id}
              variant="outline"
              size="sm"
              onClick={() => onSelectIntent(intent)}
              className="h-7 text-xs gap-1.5 border-border/60 hover:border-primary hover:bg-primary/10 transition-all rounded-lg"
            >
              <Icon className="size-3.5 text-muted-foreground group-hover:text-primary" />
              <span>{intent.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
