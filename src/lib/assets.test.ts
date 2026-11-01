import { describe, expect, it } from "vitest";
import { validateAssets } from "@/lib/assets";

describe("template assets", () => {
  it("finds every required file inside the size budget", () => {
    const issues = validateAssets();
    expect(issues).toEqual([]);
  });
});
