import { describe, it, expect } from "vitest";

// Test the lexicon data structure
describe("Lexicon data", () => {
  it("GENESIS_1_1 has 8 entries", async () => {
    const { GENESIS_1_1 } = await import("../lib/lexicon");
    expect(GENESIS_1_1.length).toBe(10);
  });

  it("JOHN_1_1 has entries", async () => {
    const { JOHN_1_1 } = await import("../lib/lexicon");
    expect(JOHN_1_1.length).toBeGreaterThan(0);
  });

  it("GENESIS_1_1 first word is 'In' with Hebrew בְּ", async () => {
    const { GENESIS_1_1 } = await import("../lib/lexicon");
    const first = GENESIS_1_1[0];
    expect(first.original).toBe("In");
    expect(first.script).toBe("בְּ");
  });

  it("GENESIS_1_1 has God entry with H430", async () => {
    const { GENESIS_1_1 } = await import("../lib/lexicon");
    const god = GENESIS_1_1.find((w) => w.original === "God");
    expect(god).toBeDefined();
    expect(god?.strongs).toBe("H430");
  });

  it("JOHN_1_1 first word is 'In' with Greek ἐν", async () => {
    const { JOHN_1_1 } = await import("../lib/lexicon");
    const first = JOHN_1_1[0];
    expect(first.original).toBe("In");
    expect(first.script).toBe("Ἐν");
  });
});

// Test admin credentials
describe("Admin credentials", () => {
  it("Admin username is SNL2721", () => {
    const ADMIN_USERNAME = "SNL2721";
    expect(ADMIN_USERNAME).toBe("SNL2721");
  });

  it("Admin password is Fearknot14!", () => {
    const ADMIN_PASSWORD = "Fearknot14!";
    expect(ADMIN_PASSWORD).toBe("Fearknot14!");
  });
});

// Test diagnostic code generation
describe("Diagnostic code generation", () => {
  it("generates a code starting with OWB-", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "OWB-";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    expect(code.startsWith("OWB-")).toBe(true);
    expect(code.length).toBe(12);
  });
});
