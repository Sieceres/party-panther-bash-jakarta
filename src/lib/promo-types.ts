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

/**
 * Keyword-based reclassification of promo type using title, discount text, and description.
 * Returns a PromoType if a match is found, or null if uncertain.
 */
export function reclassifyPromoType(
  title: string | null | undefined,
  discountText: string | null | undefined,
  description: string | null | undefined
): PromoType | null {
  const combined = [title, discountText, description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!combined) return null;

  // Free Flow — ONLY unlimited / all-you-can-drink
  if (
    /\b(free\s*flow|unlimited|all[- ]you[- ]can[- ]drink|all[- ]you[- ]can[- ]eat)\b/.test(combined)
  ) {
    return "Free Flow";
  }

  // Ladies Night
  if (/\b(ladies?\s*(night|nite|only)|women'?s?\s*night)\b/.test(combined)) {
    return "Ladies Night";
  }

  // Brunch Deal
  if (/\bbrunch\b/.test(combined)) {
    return "Brunch Deal";
  }

  // Live Music
  if (/\b(live\s*music|live\s*band|dj\s*night|live\s*performance)\b/.test(combined)) {
    return "Live Music";
  }

  // Bucket Deal — multi-buy bundles
  if (
    /\b(bucket|buy\s*\d+\s*get\s*\d+|(\d+)\s*(beers?|drinks?|bottles?)\s*(for|@)|bundle)\b/.test(combined)
  ) {
    return "Bucket Deal";
  }

  // Bottle Promo — bottle service
  if (/\b(bottle\s*(promo|service|deal|special|discount))\b/.test(combined)) {
    return "Bottle Promo";
  }

  // Happy Hour — time-limited discounts, BOGO, percentage off
  if (
    /\b(happy\s*hour|b[1o]g[1o]|buy\s*1\s*get\s*1|buy\s*one\s*get\s*one|\d+\s*%\s*off|half\s*price|2[\s-]*for[\s-]*1)\b/.test(combined)
  ) {
    return "Happy Hour";
  }

  // Food Special
  if (
    /\b(food\s*special|food\s*deal|food\s*promo|eat|meal|dinner\s*deal|lunch\s*deal)\b/.test(combined) &&
    !/\bdrink\b/.test(combined)
  ) {
    return "Food Special";
  }

  // Drink Special — catch-all for drink discounts not matching above
  if (
    /\b(drink\s*special|cocktail\s*special|beer\s*special|wine\s*special|spirits?\s*special)\b/.test(combined)
  ) {
    return "Drink Special";
  }

  // If it looks like a price discount on drinks, classify as Happy Hour
  if (/\b(idr|rp|k)\b.*\b(cocktail|beer|wine|spirit|drink|shot)\b/.test(combined) ||
      /\b(cocktail|beer|wine|spirit|drink|shot)\b.*\b(idr|rp|k)\b/.test(combined)) {
    return "Happy Hour";
  }

  return null;
}
