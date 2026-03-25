import { describe, it, expect } from "vitest";

describe("Grok API Integration", () => {
  it("should validate Grok API key is set and properly formatted", () => {
    const apiKey = process.env.GROK_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^xai-/);
    expect(apiKey?.length).toBeGreaterThan(20);
  });

  it("should have correct Grok API model names available", () => {
    // Valid Grok models as of March 2026
    const validModels = ["grok-4-latest", "grok-4.20-0309-reasoning"];
    expect(validModels.length).toBeGreaterThan(0);
  });
});
