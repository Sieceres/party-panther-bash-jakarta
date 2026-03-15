import * as XLSX from "xlsx";
import type { ExtractedPromo, ExtractedEvent, ExtractedContact } from "@/components/BatchImportReview";
import { detectDrinkCategory, getPlaceholderImage, enrichDrinkTypes } from "@/lib/drink-categories";
import { normalizePromoType } from "@/lib/promo-types";

type ImportType = "promo" | "event" | "contact";

// Normalize header names to our field names
const HEADER_MAP: Record<string, string> = {
  // Promo fields
  title: "title",
  name: "title",
  promo_title: "title",
  "promo title": "title",
  description: "description",
  desc: "description",
  venue: "venue_name",
  venue_name: "venue_name",
  "venue name": "venue_name",
  venue_address: "venue_address",
  "venue address": "venue_address",
  address: "venue_address",
  discount: "discount_text",
  discount_text: "discount_text",
  "discount text": "discount_text",
  deal: "discount_text",
  promo_type: "promo_type",
  "promo type": "promo_type",
  type: "promo_type",
  day: "day_of_week",
  days: "day_of_week",
  day_of_week: "day_of_week",
  "day of week": "day_of_week",
  area: "area",
  location: "area",
  neighborhood: "area",
  drink_type: "drink_type",
  "drink type": "drink_type",
  drinks: "drink_type",
  category: "category",
  original_price: "original_price_amount",
  "original price": "original_price_amount",
  price: "original_price_amount",
  discounted_price: "discounted_price_amount",
  "discounted price": "discounted_price_amount",
  "sale price": "discounted_price_amount",
  currency: "price_currency",
  price_currency: "price_currency",

  // Event fields
  date: "date",
  event_date: "date",
  "event date": "date",
  time: "time",
  event_time: "time",
  "event time": "time",
  organizer: "organizer_name",
  organizer_name: "organizer_name",
  "organizer name": "organizer_name",

  // Contact fields
  instagram: "instagram",
  ig: "instagram",
  insta: "instagram",
  whatsapp: "whatsapp",
  wa: "whatsapp",
  phone: "whatsapp",
  "phone number": "whatsapp",
  website: "website",
  url: "website",
  web: "website",
  google_maps: "google_maps_link",
  google_maps_link: "google_maps_link",
  "google maps": "google_maps_link",
  "maps link": "google_maps_link",
  gmaps: "google_maps_link",
  opening_hours: "opening_hours",
  "opening hours": "opening_hours",
  hours: "opening_hours",
  "open hours": "opening_hours",
};

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase().replace(/[_\s]+/g, " ");
  return HEADER_MAP[key] || HEADER_MAP[key.replace(/ /g, "_")] || header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseArrayField(value: string): string[] {
  if (!value) return [];
  // Handle comma-separated, semicolon-separated, or pipe-separated
  return value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}

function parseSpreadsheetData(
  rows: Record<string, any>[],
  type: ImportType
): (ExtractedPromo | ExtractedEvent | ExtractedContact)[] {
  return rows.map((row, idx) => {
    // Normalize all keys
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const mappedKey = normalizeHeader(key);
      normalized[mappedKey] = typeof value === "string" ? value.trim() : value;
    }

    const id = `item-${idx}-${Date.now()}`;

    if (type === "contact") {
      return {
        id,
        selected: true,
        venue_name: normalized.venue_name || normalized.title || "",
        instagram: (normalized.instagram || "").replace(/^@/, ""),
        whatsapp: normalized.whatsapp || "",
        website: normalized.website || "",
        google_maps_link: normalized.google_maps_link || "",
        opening_hours: normalized.opening_hours || "",
        address: normalized.venue_address || normalized.address || "",
      } as ExtractedContact;
    }

    if (type === "event") {
      return {
        id,
        selected: true,
        title: normalized.title || "",
        description: normalized.description || "",
        date: normalized.date || "",
        time: normalized.time || "",
        venue_name: normalized.venue_name || "",
        venue_address: normalized.venue_address || "",
        organizer_name: normalized.organizer_name || "",
        price_currency: normalized.price_currency || "IDR",
      } as ExtractedEvent;
    }

    // Promo
    const drinkTypes = parseArrayField(String(normalized.drink_type || ""));
    const title = normalized.title || "";
    const description = normalized.description || "";
    const discountText = normalized.discount_text || "";
    const drinkCategory = detectDrinkCategory(title, description, discountText, drinkTypes);
    const enrichedDrinkTypes = enrichDrinkTypes(drinkTypes, drinkCategory);
    const placeholderImage = getPlaceholderImage(drinkCategory);

    return {
      id,
      selected: true,
      title,
      description,
      venue_name: normalized.venue_name || "",
      venue_address: normalized.venue_address || "",
      discount_text: discountText,
      promo_type: normalized.promo_type || "",
      day_of_week: parseArrayField(String(normalized.day_of_week || "")),
      area: normalized.area || "",
      drink_type: enrichedDrinkTypes,
      original_price_amount: normalized.original_price_amount ? Number(normalized.original_price_amount) : null,
      discounted_price_amount: normalized.discounted_price_amount ? Number(normalized.discounted_price_amount) : null,
      price_currency: normalized.price_currency || "IDR",
      category: normalized.category || "",
      image_url: placeholderImage,
      _drinkCategory: drinkCategory,
    } as ExtractedPromo & { image_url: string; _drinkCategory: string };
  }).filter(item => {
    // Filter out empty rows
    if ("title" in item) return !!item.title;
    if ("venue_name" in item) return !!item.venue_name;
    return false;
  });
}

export async function parseSpreadsheetFile(
  file: File,
  type: ImportType
): Promise<(ExtractedPromo | ExtractedEvent | ExtractedContact)[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

  if (rows.length === 0) {
    throw new Error("The spreadsheet appears to be empty.");
  }

  return parseSpreadsheetData(rows, type);
}

export function isSpreadsheetFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "csv" || ext === "xlsx" || ext === "xls";
}
