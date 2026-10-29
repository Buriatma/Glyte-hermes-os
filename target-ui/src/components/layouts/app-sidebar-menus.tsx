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
  FolderSearchIcon,
  Waypoints,
  Brain,
  Clock,
  Layers,
  Network,
  Key,
} from "lucide-react";
import { BasicUser } from "app-types/user";

export function AppSidebarMenus({ user: _user }: { user?: BasicUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("");
  const { setOpenMobile } = useSidebar();

  const navItems = [
    {
      title: "Workspace",
      href: "/workspace",
      icon: Layers,
    },
    {
      title: "Swarm Visualizer",
      href: "/swarm",
      icon: Network,
    },
    {
      title: "Secret Vault",
      href: "/secrets",
      icon: Key,
    },
    {
      title: "Skills Library",
      href: "/skills",
      icon: Waypoints,
    },
    {
      title: "Memory & Profile",
      href: "/memory",
      icon: Brain,
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

        <div className="space-y-1">
          {navItems.map((item) => {
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
