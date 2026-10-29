"use server";

import { BasicUserWithLastLogin, UserPreferences } from "app-types/user";
import { getSession } from "auth/server";

export async function getUser(
  userId?: string,
): Promise<BasicUserWithLastLogin | null> {
  const session = await getSession();
  const user = session?.user || {
    id: "hermes-operator",
    name: "Hermes Operator",
    email: "operator@hermes.local",
    role: "admin",
  };

  return {
    ...user,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
  };
}

export async function getUserAccounts(userId?: string) {
  return {
    hasPassword: true,
    oauthProviders: [],
  };
}

export async function getUserSessions() {
  const session = await getSession();
  return [
    {
      id: (session as any)?.session?.id || "active-session",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: "127.0.0.1",
      userAgent: "Hermes OS Client",
      isCurrent: true,
    },
  ];
}

export async function getUserStats(userId?: string) {
  return {
    threadCount: 1,
    messageCount: 1,
    modelStats: [
      {
        model: "hermes-default",
        messageCount: 1,
        totalTokens: 100,
      },
    ],
    totalTokens: 100,
    period: "all",
  };
}

export async function getUserPreferences(userId?: string): Promise<UserPreferences | null> {
  return {
    displayName: "Hermes Operator",
    botName: "Hermes Agent",
  };
}

export async function updateUserDetails(data: {
  userId: string;
  name?: string;
  email?: string;
  image?: string;
}) {
  return {
    id: data.userId || "hermes-operator",
    name: data.name || "Hermes Operator",
    email: data.email || "operator@hermes.local",
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: null,
  };
}
