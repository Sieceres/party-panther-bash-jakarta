import { supabase } from "@/integrations/supabase/client";

export interface KamUser {
  user_id: string;
  display_name: string;
}

export const STALE_DAYS = 30;

export const isStale = (lastChecked: string | null | undefined) =>
  !lastChecked || Date.now() - new Date(lastChecked).getTime() > STALE_DAYS * 86400000;

export const fetchKamUsers = async (): Promise<KamUser[]> => {
  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "kam" as any);
  const ids = (roles || []).map((r) => r.user_id);
  if (!ids.length) return [];
  const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
  return ids
    .map((id) => ({ user_id: id, display_name: profiles?.find((p) => p.user_id === id)?.display_name || "Unnamed" }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
};

export const isCurrentUserKam = async (userId: string) => {
  const { data } = await supabase.from("user_roles").select("id").eq("user_id", userId).eq("role", "kam" as any);
  return !!data?.length;
};

export interface VenueLoad {
  id: string;
  area: string | null;
  promoCount: number;
}

/**
 * Balanced distribution: every KAM gets the same number of venues (±1) and
 * roughly the same number of promos. Venues are sorted by promo count (largest
 * first) and each goes to the KAM with the fewest promos among those that still
 * have venue capacity. Ties prefer a KAM already covering the same area so each
 * person's venues stay geographically close.
 */
export const distributeVenues = (
  venues: VenueLoad[],
  kamIds: string[],
  existing: VenueLoad[] & { kam_id?: string | null }[] = [],
) => {
  const n = kamIds.length;
  const count: Record<string, number> = Object.fromEntries(kamIds.map((k) => [k, 0]));
  const promos: Record<string, number> = Object.fromEntries(kamIds.map((k) => [k, 0]));
  const areas: Record<string, Set<string>> = Object.fromEntries(kamIds.map((k) => [k, new Set<string>()]));
  // Start from current assignments so later rounds keep things balanced
  (existing as any[]).forEach((v) => {
    if (v.kam_id && v.kam_id in count) {
      count[v.kam_id]++;
      promos[v.kam_id] += v.promoCount;
      if (v.area) areas[v.kam_id].add(v.area);
    }
  });
  const total = venues.length + Object.values(count).reduce((a, b) => a + b, 0);
  const base = Math.floor(total / n);
  let extra = total % n;
  const cap: Record<string, number> = {};
  [...kamIds].sort((a, b) => count[b] - count[a]).forEach((k) => { cap[k] = base + (extra-- > 0 ? 1 : 0); });
  const result: Record<string, string> = {};
  const sorted = [...venues].sort((a, b) => b.promoCount - a.promoCount || (a.area || "").localeCompare(b.area || ""));
  for (const v of sorted) {
    let open = kamIds.filter((k) => count[k] < cap[k]);
    if (!open.length) open = [...kamIds];
    open.sort((a, b) => {
      const d = promos[a] - promos[b];
      if (d !== 0) return d;
      const aa = v.area && areas[a].has(v.area) ? 0 : 1;
      const bb = v.area && areas[b].has(v.area) ? 0 : 1;
      return aa - bb || count[a] - count[b];
    });
    const k = open[0];
    result[v.id] = k;
    count[k]++;
    promos[k] += v.promoCount;
    if (v.area) areas[k].add(v.area);
  }
  return result;
};
