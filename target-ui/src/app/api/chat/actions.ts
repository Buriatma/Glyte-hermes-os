"use server";

import { getSession } from "auth/server";

export async function getUserId() {
  const session = await getSession();
  return session?.user?.id || "hermes-operator";
}

export async function generateTitleFromUserMessageAction({
  message,
}: { message: any; model?: any }) {
  const text = message?.parts?.at(-1)?.text || "Hermes Session";
  return text.slice(0, 30);
}

export async function deleteThreadAction(threadId: string) {
  return { success: true, threadId };
}

export async function updateThreadAction(threadId: string, data?: any) {
  return { success: true, threadId, data };
}

export async function deleteThreadsAction(threadIds?: string[]) {
  return { success: true, threadIds };
}

export async function deleteUnarchivedThreadsAction() {
  return { success: true };
}

export async function selectThreadWithMessagesAction(threadId: string) {
  return {
    id: threadId,
    title: "Hermes Session",
    userId: "hermes-operator",
    createdAt: new Date(),
    messages: [],
  };
}

export async function deleteMessagesByChatIdAfterTimestampAction() {
  return { success: true };
}

export async function rememberAgentAction() {
  return { success: true };
}

export async function rememberMcpServerCustomizationsAction() {
  return { success: true };
}

export async function deleteMessageAction() {
  return { success: true };
}

export async function selectThreadListAction() {
  return [];
}
