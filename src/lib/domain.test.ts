import { describe, expect, it } from "vitest";
import {
  canUseTemplate,
  draftDeletionError,
  coupleSlug,
  entitlementsFor,
  importGuestRows,
  invitationMessage,
  normalizeIndianPhone,
  normalizeRsvp,
  paymentUnlocksPremium,
  quoteInr,
  uniqueSlug,
  whatsAppShareUrl,
  parseCsv,
} from "@/lib/domain";

describe("plans and payments", () => {
  it("keeps premium locked unless the payment is verified success", () => {
    expect(paymentUnlocksPremium("failed", false)).toBe(false);
    expect(paymentUnlocksPremium("pending", false)).toBe(false);
    expect(paymentUnlocksPremium("success", false)).toBe(false);
    expect(paymentUnlocksPremium("success", true)).toBe(true);
  });

  it("quotes GST in INR", () => {
    expect(quoteInr(999)).toEqual({ subtotal: 999, gst: 179.82, total: 1178.82, currency: "INR", gstRate: 0.18 });
  });

  it("deletes drafts for the owner and leaves published weddings untouched", () => {
    expect(draftDeletionError("draft", true)).toBeNull();
    expect(draftDeletionError("draft", false)?.status).toBe(403);
    expect(draftDeletionError("published", true)?.status).toBe(409);
    expect(draftDeletionError("unpublished", true)?.status).toBe(409);
  });

  it("gates premium templates on the free plan", () => {
    expect(canUseTemplate("free", "free")).toBe(true);
    expect(canUseTemplate("free", "premium")).toBe(false);
    expect(canUseTemplate("premium", "premium")).toBe(true);
    expect(entitlementsFor("free").maxPhotos).toBe(6);
    expect(entitlementsFor("premium").exportCard).toBe(true);
  });
});

describe("slugs, phones, whatsapp, rsvp, csv", () => {
  it("builds a stable couple slug", () => {
    expect(coupleSlug("Raja", "Rani")).toBe("raja-weds-rani");
    expect(uniqueSlug("raja-weds-rani", new Set(["raja-weds-rani"]))).toBe("raja-weds-rani-2");
  });

  it("normalises Indian mobiles", () => {
    expect(normalizeIndianPhone("9840011122")).toBe("+919840011122");
    expect(normalizeIndianPhone("+91 98400 11122")).toBe("+919840011122");
    expect(normalizeIndianPhone("12345")).toBeNull();
  });

  it("encodes a WhatsApp message", () => {
    const message = invitationMessage({
      groom: "Raja",
      bride: "Rani",
      dateLabel: "20 December 2026",
      url: "http://localhost:3000/w/raja-weds-rani",
      guestName: "Asha",
    });
    const link = whatsAppShareUrl(message);
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toContain("Raja & Rani");
    expect(decodeURIComponent(link.split("text=")[1])).toContain("http://localhost:3000/w/raja-weds-rani");
  });

  it("normalises RSVP headcount", () => {
    expect(normalizeRsvp({ status: "not_attending", headcount: 4 }).headcount).toBe(0);
    expect(normalizeRsvp({ status: "attending", headcount: 0 }).headcount).toBe(1);
  });

  it("imports guests and reports duplicates", () => {
    const table = parseCsv("name,phone,side\nAsha,+919876543210,bride\nAsha,+919876543210,bride\nBad,123,friends");
    const report = importGuestRows({
      headers: table[0],
      rows: table.slice(1),
      mapping: { name: "name", phone: "phone", side: "side" },
      existingPhones: [],
      existingNames: [],
    });
    expect(report.accepted).toHaveLength(1);
    expect(report.duplicates).toHaveLength(1);
    expect(report.errors).toHaveLength(1);
  });
});
