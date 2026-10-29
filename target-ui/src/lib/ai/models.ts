import "server-only";

import { ChatModel } from "app-types/chat";
export type { ChatModel };
export type OpenAICompatibleConfig = {
  apiKey?: string;
  baseURL?: string;
  name?: string;
  provider?: string;
};

export const HERMES_MODELS = [
  { provider: "hermes", model: "hermes-3-llama-3.1-8b" },
  { provider: "hermes", model: "hermes-3-llama-3.1-70b" },
  { provider: "hermes", model: "hermes-3-llama-3.1-405b" },
];

export const customModelProvider = {
  getModel: (chatModel?: ChatModel) => {
    return {
      provider: "hermes",
      modelId: chatModel?.model || "hermes-3-llama-3.1-8b",
    };
  },
  getAllModels: () => HERMES_MODELS,
};

export function isToolCallUnsupportedModel(chatModel?: ChatModel): boolean {
  return false;
}
