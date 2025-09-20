import { supabase } from "@/integrations/supabase/client";

export const getEventBySlugOrId = async (identifier: string) => {
  // Get current user for personalized data
  const { data: { user } } = await supabase.auth.getUser();
  
  // Use function that includes attendee counts and user-specific data
  const { data: allEvents, error } = await supabase.rpc('get_events_with_details', {
    user_id_param: user?.id || null
  });
  
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