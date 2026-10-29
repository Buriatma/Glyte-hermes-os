import { describe, it, expect } from "vitest";
import { createOpenAICompatibleModels } from "./create-openai-compatiable";

describe("create-openai-compatiable", () => {
  it("should return empty providers for empty config", () => {
    const res = createOpenAICompatibleModels([]);
    expect(res.providers).toEqual({});
  });
});
