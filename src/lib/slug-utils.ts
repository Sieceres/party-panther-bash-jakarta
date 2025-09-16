import { supabase } from "@/integrations/supabase/client";

export const getEventBySlugOrId = async (identifier: string) => {
  // Use secure function to get events data that properly handles sensitive information
  const { data: allEvents, error } = await supabase.rpc('get_events_safe');
  
  if (error) {
    return { data: null, error };
  }
  
  // First try to find by slug
  const eventBySlug = allEvents?.find((event: any) => event.slug === identifier);
  if (eventBySlug) {
    return { data: eventBySlug, error: null };
  }
  
  // Then try to find by ID
  const eventById = allEvents?.find((event: any) => event.id === identifier);
  return { data: eventById || null, error: null };
};

export const getPromoBySlugOrId = async (identifier: string) => {
  const slugResult = await supabase.from('promos').select('*').eq('slug', identifier).maybeSingle();
  if (slugResult.data) return slugResult;
  
  return await supabase.from('promos').select('*').eq('id', identifier).maybeSingle();
};

export const getEventUrl = (event: any) => `/event/${event?.slug || event?.id}`;
export const getPromoUrl = (promo: any) => `/promo/${promo?.slug || promo?.id}`;
export const getEditEventUrl = (event: any) => `/edit-event/${event?.slug || event?.id}`;
export const getEditPromoUrl = (promo: any) => `/edit-promo/${promo?.slug || promo?.id}`;