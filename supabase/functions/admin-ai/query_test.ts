import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { matchesPlan, requireAdmin, validatePlan, type QueryPlan } from "./query.ts";

Deno.test("only signed-in admins can use the assistant", () => {
  assertThrows(() => requireAdmin(null, true));
  assertThrows(() => requireAdmin({ id: "user" }, false));
  assertThrows(() => requireAdmin({ id: "user" }, "true"));
  requireAdmin({ id: "admin" }, true);
});
Deno.test("venues with Instagram but no promos uses actual zero linked promos", () => {
  const plan: QueryPlan = { entity: "venues", supported: true, explanation: "", filters: [{ field: "instagram", operator: "present", value: null }, { field: "promo_count", operator: "equals", value: "0" }] };
  assert(matchesPlan({ id: "a", instagram: "@venue", promo_count: 0 }, plan));
  assertEquals(matchesPlan({ id: "b", instagram: "@venue", promo_count: 1 }, plan), false);
  assertEquals(matchesPlan({ id: "c", instagram: " ", promo_count: 0 }, plan), false);
});
Deno.test("filters cannot use unrelated entity fields", () => {
  assertThrows(() => validatePlan({ entity: "promos", supported: true, explanation: "", filters: [{ field: "instagram", operator: "present", value: null }] }));
});
Deno.test("all matching results remain available without a daily usage counter", () => {
  const plan: QueryPlan = { entity: "venues", supported: true, explanation: "", filters: [] };
  for (let request = 0; request < 60; request++) {
    const rows = Array.from({ length: 1100 }, (_, i) => ({ id: String(i) }));
    assertEquals(rows.filter(row => matchesPlan(row, plan)).length, 1100);
  }
});