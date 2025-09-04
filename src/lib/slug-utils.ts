import { supabase } from "@/integrations/supabase/client";

export const getEventBySlugOrId = async (identifier: string) => {
  const slugResult = await supabase.from('events').select('*').eq('slug', identifier).maybeSingle();
  if (slugResult.data) return slugResult;
  
  return await supabase.from('events').select('*').eq('id', identifier).maybeSingle();
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