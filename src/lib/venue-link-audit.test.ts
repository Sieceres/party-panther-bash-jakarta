import { describe, expect, it } from "vitest";
import { fetchAllAuditRows, findUnlinkedVenueItems, type VenueLinkedItem } from "./venue-link-audit";

const item = (id: string, venue_id: string | null, venue_name = "Blue Grass"): VenueLinkedItem => ({ id, title: id, venue_id, venue_name, slug: null });

describe("venue link audit", () => {
  it("flags promos or events with no venue ID even if they have a venue name", () => {
    expect(findUnlinkedVenueItems([item("unlinked", null)], new Set(["bluegrass"])).map(row => row.id)).toEqual(["unlinked"]);
  });
  it("flags links to venues that do not exist", () => {
    expect(findUnlinkedVenueItems([item("missing", "deleted")], new Set(["bluegrass"])).map(row => row.id)).toEqual(["missing"]);
  });
  it("accepts a valid venue link even when the displayed name differs", () => {
    expect(findUnlinkedVenueItems([item("linked", "bluegrass")], new Set(["bluegrass"]))).toEqual([]);
  });
  it("checks records beyond the first page", async () => {
    const source = Array.from({ length: 1001 }, (_, i) => item(String(i), i === 1000 ? null : "bluegrass"));
    const rows = await fetchAllAuditRows<VenueLinkedItem>(async (from, to) => ({ data: source.slice(from, to + 1), error: null }));
    expect(rows).toHaveLength(1001);
    expect(findUnlinkedVenueItems(rows, new Set(["bluegrass"])).map(row => row.id)).toEqual(["1000"]);
  });
  it("fails the check if a later page cannot be read", async () => {
    await expect(fetchAllAuditRows(async from => ({ data: from === 0 ? Array(500).fill({ id: "row" }) : null, error: from > 0 ? new Error("Read failed") : null }))).rejects.toThrow("Read failed");
  });
});