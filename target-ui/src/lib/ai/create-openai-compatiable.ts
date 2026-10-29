import { z } from "zod";

export const OpenAICompatibleProviderSchema = z.object({
  provider: z.string(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  models: z.array(z.string()),
});

export type OpenAICompatibleProvider = z.infer<typeof OpenAICompatibleProviderSchema>;

export function createOpenAICompatibleModels(config: OpenAICompatibleProvider[]) {
  return {
    providers: {},
    unsupportedModels: new Set(),
  };
}

export function openaiCompatibleModelsSafeParse(config: unknown) {
  return [];
}
