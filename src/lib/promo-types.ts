/**
 * Single source of truth for all promo types used across the app.
 * These must be Title Case and match the values stored in the database.
 */
export const PROMO_TYPES = [
  "Happy Hour",
  "Ladies Night",
  "Free Flow",
  "Bottle Promo",
  "Bucket Deal",
  "Brunch Deal",
  "Food Special",
  "Drink Special",
  "Live Music",
  "Other",
] as const;

export type PromoType = (typeof PROMO_TYPES)[number];

/**
 * Maps snake_case or inconsistent AI output to the canonical Title Case value.
 */
const PROMO_TYPE_ALIASES: Record<string, PromoType> = {
  happy_hour: "Happy Hour",
  ladies_night: "Ladies Night",
  free_flow: "Free Flow",
  bottle_promo: "Bottle Promo",
  bucket_deal: "Bucket Deal",
  brunch_deal: "Brunch Deal",
  food_special: "Food Special",
  drink_special: "Drink Special",
  live_music: "Live Music",
  other: "Other",
  // Common variations
  "happy hour": "Happy Hour",
  "ladies night": "Ladies Night",
  "free flow": "Free Flow",
  "bottle promo": "Bottle Promo",
  "bucket deal": "Bucket Deal",
  "brunch deal": "Brunch Deal",
  "food special": "Food Special",
  "drink special": "Drink Special",
  "live music": "Live Music",
};

/**
 * Normalizes a promo type string from AI output or legacy data
 * to the canonical Title Case value.
 */
export function normalizePromoType(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // Check if it's already a valid type (exact match)
  if ((PROMO_TYPES as readonly string[]).includes(trimmed)) return trimmed;
  // Check aliases (case-insensitive)
  const lower = trimmed.toLowerCase();
  return PROMO_TYPE_ALIASES[lower] || trimmed;
}
