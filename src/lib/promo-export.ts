import * as XLSX from "xlsx";
import { Tables } from "@/integrations/supabase/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface PromoForExport {
  title: string;
  venue_name: string;
  day_of_week: string[] | null;
  discount_text: string;
  area: string | null;
  promo_type: string | null;
  drink_type: string[] | null;
  description: string;
  original_price_amount: number | null;
  discounted_price_amount: number | null;
  price_currency: string | null;
}

function buildCellText(promo: PromoForExport): string {
  const lines: string[] = [];

  // Promo type label
  const promoType = promo.promo_type || "";
  if (promoType) {
    lines.push(promoType);
  }

  // Description / discount text
  if (promo.discount_text) {
    lines.push(promo.discount_text);
  }
  if (promo.description && promo.description !== promo.discount_text) {
    lines.push(promo.description);
  }

  return lines.join("\n") || "–";
}

/**
 * Export promos as a weekly schedule Excel file grouped by area,
 * with venues as rows and days of week as columns.
 */
export function exportPromosToExcel(promos: Tables<"promos">[]) {
  const wb = XLSX.utils.book_new();

  // Group promos by area
  const areaMap = new Map<string, Tables<"promos">[]>();
  for (const p of promos) {
    const area = p.area || "Other";
    if (!areaMap.has(area)) areaMap.set(area, []);
    areaMap.get(area)!.push(p);
  }

  // Sort areas alphabetically
  const sortedAreas = [...areaMap.keys()].sort();

  for (const area of sortedAreas) {
    const areaPromos = areaMap.get(area)!;

    // Group by venue within this area
    const venueMap = new Map<string, Tables<"promos">[]>();
    for (const p of areaPromos) {
      const venue = p.venue_name || "Unknown";
      if (!venueMap.has(venue)) venueMap.set(venue, []);
      venueMap.get(venue)!.push(p);
    }

    const sortedVenues = [...venueMap.keys()].sort();

    // Build rows: header row + one row per venue
    const rows: (string | null)[][] = [];

    // Title row
    rows.push([`Hot Promos & Free Flows - ${area.toUpperCase()}`]);
    rows.push([]); // spacer

    // Header row
    rows.push(["Venue", ...DAYS]);

    // Data rows
    for (const venue of sortedVenues) {
      const venuePromos = venueMap.get(venue)!;
      const row: (string | null)[] = [venue];

      for (const day of DAYS) {
        // Find promos for this venue on this day
        const dayLower = day.toLowerCase();
        const matching = venuePromos.filter(p => {
          const days = p.day_of_week || [];
          return days.some(d => d.toLowerCase() === dayLower);
        });

        if (matching.length === 0) {
          row.push("–");
        } else {
          const cellTexts = matching.map(m => buildCellText(m as PromoForExport));
          row.push(cellTexts.join("\n\n"));
        }
      }

      rows.push(row);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Venue
      ...DAYS.map(() => ({ wch: 25 })),
    ];

    // Merge title row across all columns
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    // Sanitize sheet name (max 31 chars, no special chars)
    const sheetName = area.substring(0, 31).replace(/[[\]*?/\\:]/g, "");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // If no areas, create empty sheet
  if (sortedAreas.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["No promos to export"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Promos");
  }

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  XLSX.writeFile(wb, `Hot_Promos_${monthYear.replace(" ", "_")}.xlsx`);
}
