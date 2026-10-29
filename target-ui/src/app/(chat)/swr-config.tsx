"use client";

import { BasicUser } from "app-types/user";
import { useEffect, useMemo } from "react";
import { SWRConfig, SWRConfiguration } from "swr";

export function SWRConfigProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: BasicUser;
}) {
  const config = useMemo<SWRConfiguration>(() => {
    return {
      focusThrottleInterval: 30000,
      dedupingInterval: 2000,
      errorRetryCount: 1,
      fallback: {
        "/api/user/details": user,
      },
    };
  }, [user]);

  useEffect(() => {
    console.log(
      "%c█░█ █▀▀ █▀█ █▀▄▀█ █▀▀ █▀\n█▀█ ██▄ █▀▄ █░▀░█ ██▄ ▄█\n\n%c⚡ Native Hermes OS Client\nConnected to Hermes Gateway",
      "color: #f59e0b; font-weight: bold; font-family: monospace; font-size: 16px; text-shadow: 0 0 10px rgba(245,158,11,0.5);",
      "color: #aaa; font-size: 12px;",
    );
  }, []);
  return <SWRConfig value={config}>{children}</SWRConfig>;
}
