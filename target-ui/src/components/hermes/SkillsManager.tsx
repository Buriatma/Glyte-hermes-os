"use client";

import { useEffect, useState } from "react";
import {
  getGatewayClient,
  HermesSkill,
} from "@/lib/hermes/gateway-client";
import {
  Wrench,
  Search,
  RefreshCw,
  FileCode,
  Save,
  Check,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SkillsManagerProps {
  className?: string;
}

export function SkillsManager({ className }: SkillsManagerProps) {
  const [skills, setSkills] = useState<HermesSkill[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<HermesSkill | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorPath, setEditorPath] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterProvenance, setFilterProvenance] = useState<string>("all");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const client = getGatewayClient();
      const list = await client.listSkills();
      setSkills(list);
    } catch (e) {
      console.error("Failed to load skills:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleToggle = async (skill: HermesSkill, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEnabled = !skill.enabled;
    // Optimistic update
    setSkills((prev) =>
      prev.map((s) => (s.name === skill.name ? { ...s, enabled: newEnabled } : s))
    );
    try {
      const client = getGatewayClient();
      await client.toggleSkill(skill.name, newEnabled);
    } catch (err) {
      console.error("Failed to toggle skill:", err);
      // Revert
      setSkills((prev) =>
        prev.map((s) => (s.name === skill.name ? { ...s, enabled: skill.enabled } : s))
      );
    }
  };

  const handleOpenEditor = async (skill: HermesSkill) => {
    setSelectedSkill(skill);
    setSaving(false);
    setSavedSuccess(false);
    try {
      const client = getGatewayClient();
      const res = await client.readSkill(skill.name);
      setEditorContent(res.content || "");
      setEditorPath(res.path || "");
      setEditorOpen(true);
    } catch (e) {
      console.error("Failed to read skill content:", e);
      setEditorContent(skill.content || `# ${skill.name}\n\n${skill.description || ""}`);
      setEditorOpen(true);
    }
  };

  const handleSaveSkill = async () => {
    if (!selectedSkill) return;
    setSaving(true);
    try {
      const client = getGatewayClient();
      await client.writeSkill(selectedSkill.name, editorContent);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      await loadSkills();
    } catch (e) {
      console.error("Failed to save skill:", e);
    } finally {
      setSaving(false);
    }
  };

  const getProvenanceBadge = (prov?: string) => {
    switch (prov) {
      case "bundled":
        return (
          <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
            Bundled
          </Badge>
        );
      case "hub":
        return (
          <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
            Hub
          </Badge>
        );
      case "agent":
        return (
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Learned
          </Badge>
        );
      case "external":
        return (
          <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
            External
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Custom
          </Badge>
        );
    }
  };

  const filteredSkills = skills.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q);
    const matchProv =
      filterProvenance === "all" || s.provenance === filterProvenance;
    return matchSearch && matchProv;
  });

  return (
    <div className={cn("flex flex-col h-full bg-background/50", className)}>
      {/* Top Header */}
      <div className="p-4 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-primary" />
            <h2 className="font-semibold text-sm tracking-tight text-foreground">
              Hermes Skills Library
            </h2>
            <Badge variant="outline" className="text-[11px] font-mono">
              {skills.length} available
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={loadSkills}
              disabled={loading}
              title="Refresh skills"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search skill name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background/70"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {["all", "bundled", "hub", "agent"].map((prov) => (
              <Button
                key={prov}
                variant={filterProvenance === prov ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 text-[11px] capitalize"
                onClick={() => setFilterProvenance(prov)}
              >
                {prov}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Skills */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && skills.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span>Scanning SKILL.md library...</span>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs p-4 border border-dashed rounded-xl">
            <Package className="size-6 mb-2 opacity-50" />
            <p className="font-medium text-foreground">No matching skills found</p>
            <p className="text-[11px] mt-1 text-muted-foreground">
              Try adjusting your search terms or filter tags.
            </p>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <Card
              key={skill.name}
              onClick={() => handleOpenEditor(skill)}
              className={cn(
                "cursor-pointer transition-all border rounded-xl hover:border-primary/50 group flex flex-col justify-between overflow-hidden",
                skill.enabled
                  ? "border-border/60 hover:bg-muted/30"
                  : "border-border/30 opacity-70 bg-muted/10"
              )}
            >
              <CardHeader className="p-3.5 pb-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors">
                      {skill.name}
                    </span>
                    {getProvenanceBadge(skill.provenance)}
                  </div>
                  <div
                    onClick={(e) => handleToggle(skill, e)}
                    className="flex items-center"
                    title={skill.enabled ? "Disable skill" : "Enable skill"}
                  >
                    <Switch
                      checked={skill.enabled}
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3.5 pt-0 space-y-2">
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {skill.description || "No description provided in SKILL.md metadata."}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-border/30">
                  <span className="font-mono flex items-center gap-1">
                    <FileCode className="size-3" />
                    SKILL.md
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-primary transition-opacity flex items-center gap-0.5">
                    View & Edit ↵
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* SKILL.md Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/60">
          <DialogHeader className="p-4 pb-2 border-b border-border/40 space-y-1">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <FileCode className="size-4 text-primary" />
                <DialogTitle className="font-mono text-sm">
                  {selectedSkill?.name} / SKILL.md
                </DialogTitle>
                {selectedSkill && getProvenanceBadge(selectedSkill.provenance)}
              </div>
            </div>
            {editorPath && (
              <DialogDescription className="font-mono text-[11px] text-muted-foreground truncate">
                {editorPath}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="flex-1 w-full min-h-[380px] p-3 rounded-lg border border-border/50 bg-black/60 font-mono text-xs leading-relaxed text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <DialogFooter className="p-3 px-4 border-t border-border/40 bg-muted/20 flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-muted-foreground">
              {editorContent.length} characters
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(false)}
                className="h-8 text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSkill}
                disabled={saving}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    {saving ? "Saving..." : "Save SKILL.md"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
