import { z } from "npm:zod@3.25.76";

export const fields = ["name", "title", "area", "instagram", "whatsapp", "website", "google_maps_link", "booking_url", "venue_name", "venue_id", "date", "created_at", "valid_until", "promo_type", "registration_enabled", "promo_count", "event_count"] as const;
export const PlanSchema = z.object({
  entity: z.enum(["venues", "promos", "events"]),
  explanation: z.string(),
  supported: z.boolean(),
  filters: z.array(z.object({
    field: z.enum(fields),
    operator: z.enum(["present", "missing", "equals", "contains", "gte", "lte"]),
    value: z.string().nullable(),
  }).strict()),
}).strict();
export type QueryPlan = z.infer<typeof PlanSchema>;
export type Row = Record<string, unknown> & { id: string };
export const columns = {
  venues: "id,name,slug,area,instagram,whatsapp,website,google_maps_link,booking_url,created_at",
  promos: "id,title,slug,venue_id,venue_name,area,promo_type,valid_until,created_at",
  events: "id,title,slug,venue_id,venue_name,date,time,registration_enabled,created_at",
} as const;
const allowed: Record<QueryPlan["entity"], Set<string>> = {
  venues: new Set([...columns.venues.split(","), "promo_count", "event_count"]),
  promos: new Set(columns.promos.split(",")),
  events: new Set([...columns.events.split(","), "area"]),
};
export function validatePlan(plan: QueryPlan) {
  for (const filter of plan.filters) {
    if (!allowed[plan.entity].has(filter.field)) throw new Error(`Cannot filter ${plan.entity} by ${filter.field}.`);
    if (!["present", "missing"].includes(filter.operator) && filter.value === null) throw new Error("A filter value is missing.");
  }
}
export function matchesPlan(row: Row, plan: QueryPlan) {
  return plan.filters.every(({ field, operator, value }) => {
    const raw = row[field];
    const actual = raw == null ? "" : String(raw).trim();
    if (operator === "present") return actual !== "";
    if (operator === "missing") return actual === "";
    if (operator === "equals") return actual.toLowerCase() === value?.toLowerCase();
    if (operator === "contains") return actual.toLowerCase().includes((value || "").toLowerCase());
    if (!actual) return false;
    if (field.endsWith("_count")) return operator === "gte" ? Number(actual) >= Number(value) : Number(actual) <= Number(value);
    return operator === "gte" ? actual >= (value || "") : actual <= (value || "");
  });
}
export function requireAdmin(user: unknown, admin: unknown) {
  if (!user) throw new Error("Sign in to use the AI assistant.");
  if (admin !== true) throw new Error("Admin access required.");
}