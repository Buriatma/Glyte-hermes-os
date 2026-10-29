"use client";

import {
  FileCode2,
  GitCompare,
  AlertTriangle,
  Zap,
  FolderTree,
  Terminal,
} from "lucide-react";

export interface ContextVariable {
  id: string;
  label: string;
  insertText: string;
  icon: React.ElementType;
  description: string;
}

export const CONTEXT_VARIABLES: ContextVariable[] = [
  {
    id: "workspace-file",
    label: "#workspace-file",
    insertText: "{{#file path=\"src/\"}}",
    icon: FileCode2,
    description: "Embed workspace source file",
  },
  {
    id: "git-diff",
    label: "#git-diff",
    insertText: "{{#git-diff HEAD}}",
    icon: GitCompare,
    description: "Current uncommitted changes",
  },
  {
    id: "recent-error",
    label: "#recent-error",
    insertText: "{{#recent-error}}",
    icon: AlertTriangle,
    description: "Last terminal error trace",
  },
  {
    id: "active-skill",
    label: "#active-skill",
    insertText: "{{#skill name=\"\"}}",
    icon: Zap,
    description: "Target specific Hermes skill",
  },
  {
    id: "dir-tree",
    label: "#tree",
    insertText: "{{#tree depth=2}}",
    icon: FolderTree,
    description: "Workspace folder structure",
  },
  {
    id: "terminal-out",
    label: "#last-command",
    insertText: "{{#last-command}}",
    icon: Terminal,
    description: "Output of preceding tool execution",
  },
];

interface VariablePillsProps {
  onInsert: (variable: ContextVariable) => void;
  className?: string;
}

export function VariablePills({ onInsert, className = "" }: VariablePillsProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}>
      <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap mr-0.5">
        Context:
      </span>
      {CONTEXT_VARIABLES.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onInsert(item)}
            title={item.description}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-muted/50 hover:bg-primary/15 hover:text-primary border border-border/40 hover:border-primary/40 transition-all text-muted-foreground cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Icon className="size-3" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
