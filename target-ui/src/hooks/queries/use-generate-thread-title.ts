"use client";

import { appStore } from "@/app/store";
import { ChatModel } from "app-types/chat";
import { useCallback } from "react";

export function useGenerateThreadTitle(option: {
  threadId: string;
  chatModel?: ChatModel;
}) {
  const updateTitle = useCallback(
    (title: string) => {
      appStore.setState((prev) => {
        if (!prev.threadList.some((v) => v.id === option.threadId)) {
          return {
            threadList: [
              {
                id: option.threadId,
                title: title || "New Hermes Session",
                userId: "",
                createdAt: new Date(),
              },
              ...prev.threadList,
            ],
          };
        }

        return {
          threadList: prev.threadList.map((v) =>
            v.id === option.threadId ? { ...v, title } : v
          ),
        };
      });
    },
    [option.threadId]
  );

  const generateTitle = useCallback(
    (message: string) => {
      const summary = message.slice(0, 36).trim() || "Hermes Session";
      updateTitle(summary);
    },
    [updateTitle]
  );

  return generateTitle;
}
