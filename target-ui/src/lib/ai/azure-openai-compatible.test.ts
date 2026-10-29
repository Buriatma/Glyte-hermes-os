import { describe, it, expect } from "vitest";
import { createAzureOpenAICompatible } from "./azure-openai-compatible";

describe("azure-openai-compatible", () => {
  it("should instantiate without external provider", () => {
    const provider = createAzureOpenAICompatible({});
    expect(provider).toBeDefined();
  });
});
