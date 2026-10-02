import { supabase } from "@/integrations/supabase/client";

/** Find an existing venue by name (ignores case, punctuation, spacing and a leading "The"). */
export async function findVenueIdByName(name: string): Promise<string | null> {
  if (!name.trim()) return null;
  const { data, error } = await (supabase.rpc as any)("find_venue_by_name", { _name: name.trim() });
  if (error) return null;
  return (data as string | null) ?? null;
}
