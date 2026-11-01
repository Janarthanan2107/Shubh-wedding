// Human-readable labels for values stored in the database.

const REPLY: Record<string, string> = {
  attending: "Attending",
  not_attending: "Not attending",
  maybe: "Maybe",
  pending: "Awaiting reply",
};

const MEAL: Record<string, string> = { veg: "Vegetarian", "non-veg": "Non-vegetarian", jain: "Jain" };

const SIDE: Record<string, string> = { bride: "Bride's side", groom: "Groom's side", friends: "Friends", family: "Family", work: "Work" };

const STATUS: Record<string, string> = { draft: "Draft", published: "Published", unpublished: "Unpublished" };

export const humanize = (value: string) => value.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const replyLabel = (value: string | null | undefined) => REPLY[value || "pending"] ?? humanize(value || "");
export const mealLabel = (value: string | null | undefined) => (value ? (MEAL[value] ?? humanize(value)) : "—");
export const sideLabel = (value: string | null | undefined) => (value ? (SIDE[value] ?? humanize(value)) : "—");
export const statusLabel = (value: string) => STATUS[value] ?? humanize(value);
export const planLabel = (value: string) => (value === "premium" ? "Premium plan" : "Free plan");

export const replyTone = (value: string | null | undefined): "green" | "gold" | "blush" | "neutral" =>
  value === "attending" ? "green" : value === "maybe" ? "gold" : value === "not_attending" ? "blush" : "neutral";

export const statusTone = (value: string): "green" | "neutral" => (value === "published" ? "green" : "neutral");

/** +919810000000 → +91 98100 00000. Leaves anything that is not a 10-digit Indian number untouched. */
export function formatIndianPhone(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 10 ? digits : null;
  return local ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : phone;
}
