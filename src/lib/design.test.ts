import { describe, expect, it } from "vitest";
import { createDefaultDesign, diffDesign, migrateDesign } from "@/lib/design";

describe("design json", () => {
  it("rejects unknown section types", () => {
    const design = createDefaultDesign({
      templateId: "royal-maroon-gold",
      groom: "Raja",
      bride: "Rani",
      dateLabel: "20 December 2026",
      city: "Chennai",
    });
    const broken = { ...design, sections: [{ ...design.sections[0], type: "script" }] };
    expect(() => migrateDesign(broken)).toThrow(/type|Invalid/);
  });

  it("migrates a versionless draft and keeps content", () => {
    const design = createDefaultDesign({
      templateId: "minimal-ivory",
      motifPack: "neutral",
      groom: "Arun",
      bride: "Diya",
      dateLabel: "1 January 2027",
      city: "Madurai",
    });
    const legacy = { ...design, schemaVersion: 0 };
    const migrated = migrateDesign(legacy);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.motifPack).toBe("neutral");
    expect(migrated.sections[0].type).toBe("hero");
  });

  it("diffs added and removed sections", () => {
    const design = createDefaultDesign({
      templateId: "royal-maroon-gold",
      groom: "Raja",
      bride: "Rani",
      dateLabel: "20 December 2026",
      city: "Chennai",
    });
    const next = { ...design, sections: design.sections.slice(0, -1) };
    const diff = diffDesign(design, next);
    expect(diff.removed).toHaveLength(1);
    expect(diff.added).toHaveLength(0);
  });
});
