"use client";

import {
  SidebarMenuButton,
  useSidebar,
} from "ui/sidebar";
import { Tooltip } from "ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroupContent } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";
import Link from "next/link";
import { getShortcutKeyList, Shortcuts } from "lib/keyboard-shortcuts";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { WriteIcon } from "ui/write-icon";
import {
  FolderKanban,
  Users,
  FolderSearchIcon,
  Waypoints,
  Brain,
  Clock,
  Layers,
  Network,
  Key,
  Terminal,
} from "lucide-react";
import { BasicUser } from "app-types/user";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { Badge } from "@/components/ui/badge";

export function AppSidebarMenus({ user: _user }: { user?: BasicUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("");
  const { setOpenMobile } = useSidebar();

  const [activeRightPanel, appStoreMutate] = appStore(
    useShallow((state) => [state.activeRightPanel, state.mutate])
  );

  const handleTogglePanel = (panel: "kanban" | "rooms" | "workspace" | "memory") => {
    setOpenMobile(false);
    const next = activeRightPanel === panel ? "none" : panel;
    appStoreMutate({ activeRightPanel: next });
    if (pathname !== "/" && !pathname.startsWith("/chat")) {
      router.push("/");
    }
  };

  const handleOpenLogs = () => {
    setOpenMobile(false);
    appStoreMutate({ openUserSettings: true, userSettingsTab: "logs" });
  };

  const isChatRoute = pathname === "/" || pathname.startsWith("/chat");

  const systemNavItems = [
    {
      title: "Swarm Visualizer",
      href: "/swarm",
      icon: Network,
    },
    {
      title: "Skills Library",
      href: "/skills",
      icon: Waypoints,
    },
    {
      title: "Secret Vault",
      href: "/secrets",
      icon: Key,
    },
    {
      title: "Cron Scheduler",
      href: "/cron",
      icon: Clock,
    },
    {
      title: "Sessions Lineage",
      href: "/sessions",
      icon: FolderSearchIcon,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem className="mb-2">
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMobile(false);
                  appStoreMutate({ activeRightPanel: "none" });
                  router.push(`/`);
                  router.refresh();
                }}
              >
                <SidebarMenuButton className="flex font-semibold group/new-chat bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                  <WriteIcon className="size-4" />
                  {t("Layout.newChat")}
                  <div className="flex items-center gap-1 text-xs font-medium ml-auto opacity-0 group-hover/new-chat:opacity-100 transition-opacity">
                    {getShortcutKeyList(Shortcuts.openNewChat).map((key) => (
                      <span
                        key={key}
                        className="border w-5 h-5 flex items-center justify-center bg-accent rounded"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>

        {/* Operational Workspace Panels */}
        <div className="space-y-1 pt-1 pb-2 border-b border-sidebar-border/40">
          <div className="px-2 py-1 text-[10px] font-mono uppercase font-semibold text-muted-foreground tracking-wider">
            Workspace & Ops
          </div>

          {/* Kanban Board Toggle */}
          <SidebarMenu>
            <Tooltip>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleTogglePanel("kanban")}
                  className={`font-medium transition-all ${
                    isChatRoute && activeRightPanel === "kanban"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold"
                      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FolderKanban className="size-4 text-amber-400" />
                  <span>Kanban Tasks</span>
                  <Badge variant="outline" className="ml-auto text-[9px] font-mono px-1 py-0 text-amber-400 border-amber-500/30">
                    Live
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Tooltip>
          </SidebarMenu>

          {/* Multi-Agent Rooms Toggle */}
          <SidebarMenu>
            <Tooltip>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleTogglePanel("rooms")}
                  className={`font-medium transition-all ${
                    isChatRoute && activeRightPanel === "rooms"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold"
                      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="size-4 text-purple-400" />
                  <span>Agent Rooms</span>
                  <Badge variant="outline" className="ml-auto text-[9px] font-mono px-1 py-0 text-purple-400 border-purple-500/30">
                    Swarm
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Tooltip>
          </SidebarMenu>

          {/* Workspace Explorer Drawer Toggle */}
          <SidebarMenu>
            <Tooltip>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleTogglePanel("workspace")}
                  className={`font-medium transition-all ${
                    isChatRoute && activeRightPanel === "workspace"
                      ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="size-4 text-cyan-400" />
                  <span>Workspace Explorer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Tooltip>
          </SidebarMenu>

          {/* Memory Graph Drawer Toggle */}
          <SidebarMenu>
            <Tooltip>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleTogglePanel("memory")}
                  className={`font-medium transition-all ${
                    isChatRoute && activeRightPanel === "memory"
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold"
                      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Brain className="size-4 text-indigo-400" />
                  <span>Memory Graph</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Tooltip>
          </SidebarMenu>

          {/* Live System Logs in Settings */}
          <SidebarMenu>
            <Tooltip>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleOpenLogs}
                  className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                >
                  <Terminal className="size-4 text-emerald-400" />
                  <span>Gateway & Logs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Tooltip>
          </SidebarMenu>
        </div>

        {/* Sovereign OS Routes */}
        <div className="space-y-1 pt-2">
          <div className="px-2 py-1 text-[10px] font-mono uppercase font-semibold text-muted-foreground tracking-wider">
            Sovereign OS
          </div>

          {systemNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <SidebarMenu key={item.href}>
                <Tooltip>
                  <SidebarMenuItem>
                    <Link
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                    >
                      <SidebarMenuButton
                        className={`font-medium transition-colors ${
                          isActive
                            ? "bg-accent font-semibold text-accent-foreground"
                            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </Tooltip>
              </SidebarMenu>
            );
          })}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
