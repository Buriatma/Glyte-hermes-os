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
  ExternalLink,
  Code2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const [activeTab, setActiveTab] = useState<"all" | "skills" | "plugins">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
      const res = await fetch(`/api/hermes/skills/content?name=${encodeURIComponent(skill.name)}`);
      if (res.ok) {
        const data = await res.json();
        setEditorContent(data.content || "");
        setEditorPath(data.path || "");
      } else {
        setEditorContent(skill.content || `# ${skill.name}\n\n${skill.description || ""}`);
        setEditorPath(skill.path || "");
      }
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
      const res = await fetch("/api/hermes/skills/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedSkill.name, content: editorContent }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
        await loadSkills();
      }
    } catch (e) {
      console.error("Failed to save skill:", e);
    } finally {
      setSaving(false);
    }
  };

  // Derive unique categories
  const categories = ["all", "software-development", "research", "devops", "productivity", "apple", "tools", "media", "memory"];

  const filteredSkills = skills.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      (s.title || "").toLowerCase().includes(q) ||
      (s.description || "").toLowerCase().includes(q) ||
      (s.category || "").toLowerCase().includes(q);

    const matchTab =
      activeTab === "all" ||
      (activeTab === "skills" && s.type === "skill") ||
      (activeTab === "plugins" && s.type === "plugin");

    const matchCategory =
      selectedCategory === "all" ||
      (s.category && s.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchSearch && matchTab && matchCategory;
  });

  return (
    <div className={cn("flex flex-col h-full bg-background/50", className)}>
      {/* Top Header */}
      <div className="p-4 md:p-6 border-b border-border/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wrench className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-foreground">
                  Official Hermes Skills & Plugins Catalog
                </h1>
                <Badge variant="outline" className="text-[11px] font-mono text-primary border-primary/30">
                  {skills.length} Loaded
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse official Nous Research agent capabilities, tools, and community plugins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={loadSkills}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Sync Catalog
            </Button>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex rounded-lg bg-muted/60 p-0.5 border border-border/40 text-xs font-medium">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-1 rounded-md transition-all",
                activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              All ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={cn(
                "px-3 py-1 rounded-md transition-all flex items-center gap-1",
                activeTab === "skills" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Code2 className="size-3 text-cyan-400" />
              Official Skills ({skills.filter((s) => s.type === "skill").length})
            </button>
            <button
              onClick={() => setActiveTab("plugins")}
              className={cn(
                "px-3 py-1 rounded-md transition-all flex items-center gap-1",
                activeTab === "plugins" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Package className="size-3 text-purple-400" />
              Official Plugins ({skills.filter((s) => s.type === "plugin").length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by skill name, tool, or description..."
              className="h-8 pl-8 text-xs bg-background/60 border-border/50 font-mono"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="text-[11px] font-mono text-muted-foreground mr-1">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-mono capitalize transition-all whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              {cat.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Skill Cards */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs font-mono space-y-2">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <span>Scanning Hermes skills and plugin catalog...</span>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
            <Package className="size-10 stroke-[1.2] text-zinc-600" />
            <p>No skills or plugins found matching your filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSkills.map((skill) => {
              const isSkill = skill.type === "skill";
              return (
                <Card
                  key={skill.name}
                  onClick={() => handleOpenEditor(skill)}
                  className="group relative border-border/50 bg-card/30 hover:bg-card/70 hover:border-primary/40 transition-all cursor-pointer rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={cn(
                            "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                            isSkill
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          )}
                        >
                          {isSkill ? <Code2 className="size-4" /> : <Package className="size-4" />}
                        </div>
                        <div className="truncate">
                          <h3 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {skill.title || skill.name}
                          </h3>
                          <span className="text-[10px] font-mono text-muted-foreground truncate block">
                            {skill.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={skill.enabled}
                          onCheckedChange={() => handleToggle(skill, {} as any)}
                          className="scale-75 data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {skill.description || "Official Hermes Agent capability."}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] font-mono text-zinc-500">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase">
                        {skill.category || "tools"}
                      </Badge>
                      <span className="truncate max-w-[120px]">{skill.author || "Nous Research"}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-card border-border/70 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="size-5 text-primary" />
                <DialogTitle className="font-mono text-base">
                  {selectedSkill?.title || selectedSkill?.name}
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {selectedSkill?.type || "skill"}
                </Badge>
              </div>
              {selectedSkill?.repo && (
                <a
                  href={selectedSkill.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-primary flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="size-3" />
                  GitHub Repo
                </a>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground truncate font-mono">
              {editorPath || `skills/${selectedSkill?.name}/SKILL.md`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[300px] overflow-hidden rounded-xl border border-border/50 bg-[#090d16] flex flex-col">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="flex-1 w-full p-4 font-mono text-xs text-zinc-300 bg-transparent resize-none focus:outline-none leading-relaxed"
            />
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            <span className="text-xs text-muted-foreground font-mono">
              {savedSuccess ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="size-3.5" /> Saved to ~/.hermes/skills
                </span>
              ) : (
                "Editable: Saved copies persist to ~/.hermes/skills/"
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                disabled={saving}
                onClick={handleSaveSkill}
                className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="size-3.5" />
                {saving ? "Saving..." : "Save to User Skills"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
