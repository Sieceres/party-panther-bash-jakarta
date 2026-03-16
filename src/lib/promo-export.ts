import XLSX from "xlsx-js-style";
import { Tables } from "@/integrations/supabase/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Color mapping for promo types (RGB hex without #)
const PROMO_TYPE_COLORS: Record<string, { bg: string; font: string }> = {
  "Free Flow": { bg: "7B1FA2", font: "FFFFFF" },      // Purple
  "Ladies Night": { bg: "E91E90", font: "FFFFFF" },    // Pink/Magenta
};
const DEFAULT_PROMO_COLOR = { bg: "FFD600", font: "000000" }; // Gold/Yellow for regular promos

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
  if (promo.description) return promo.description;
  if (promo.discount_text) return promo.discount_text;
  return "–";
}

function getPromoColor(promoType: string) {
  return PROMO_TYPE_COLORS[promoType] || DEFAULT_PROMO_COLOR;
}

/**
 * Export promos as a weekly schedule Excel file grouped by area,
 * with venues as rows and days of week as columns.
 * Each promo type gets its own row per venue.
 * Cells are color-coded by promo type.
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

    // Build rows: header row + one row per venue+promoType
    const rows: (string | null)[][] = [];

    // Title row
    rows.push([`Hot Promos & Free Flows - ${area.toUpperCase()}`]);
    rows.push([]); // spacer

    // Header row
    rows.push(["Venue", ...DAYS]);

    // Track row metadata for styling: { rowIdx, promoType }
    const rowMeta: { rowIdx: number; promoType: string }[] = [];

    // Data rows — one row per venue + promo type
    for (const venue of sortedVenues) {
      const venuePromos = venueMap.get(venue)!;

      // Group promos by type within this venue
      const typeMap = new Map<string, Tables<"promos">[]>();
      for (const p of venuePromos) {
        const pType = p.promo_type || "Other";
        if (!typeMap.has(pType)) typeMap.set(pType, []);
        typeMap.get(pType)!.push(p);
      }

      const sortedTypes = [...typeMap.keys()].sort();
      let isFirstTypeForVenue = true;

      for (const promoType of sortedTypes) {
        const typePromos = typeMap.get(promoType)!;
        // Show venue name only on the first row for this venue
        const row: (string | null)[] = [isFirstTypeForVenue ? venue : ""];
        isFirstTypeForVenue = false;

        for (const day of DAYS) {
          const dayLower = day.toLowerCase();
          const matching = typePromos.filter(p => {
            const days = p.day_of_week || [];
            return days.some(d => d.toLowerCase() === dayLower);
          });

          if (matching.length === 0) {
            row.push("–");
          } else {
            const cellParts: string[] = [promoType];
            for (const m of matching) {
              const text = buildCellText(m as PromoForExport);
              if (text !== "–") cellParts.push(text);
            }
            row.push(cellParts.join("\n"));
          }
        }

        rowMeta.push({ rowIdx: rows.length, promoType });
        rows.push(row);
      }
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Venue
      ...DAYS.map(() => ({ wch: 28 })),
    ];

    // Merge title row across all columns
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    // Apply color coding to data cells using rowMeta
    for (const { rowIdx, promoType } of rowMeta) {
      const color = getPromoColor(promoType);
      for (let di = 0; di < DAYS.length; di++) {
        const colIdx = di + 1;
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        if (ws[cellRef] && ws[cellRef].v !== "–") {
          ws[cellRef].s = {
            fill: { fgColor: { rgb: color.bg } },
            font: { color: { rgb: color.font } },
            alignment: { wrapText: true, vertical: "top" },
          };
        }
      }
      // Style venue name column too
      const venueRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
      if (ws[venueRef]) {
        ws[venueRef].s = {
          font: { bold: true },
          alignment: { vertical: "top" },
        };
      }
    }

    // Style header row
    for (let c = 0; c <= DAYS.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: "37474F" } },
          font: { color: { rgb: "FFFFFF" }, bold: true },
          alignment: { horizontal: "center" },
        };
      }
    }

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
