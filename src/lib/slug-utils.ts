import { supabase } from "@/integrations/supabase/client";

export const getEventBySlugOrId = async (identifier: string) => {
  // Fetch the event row directly and include instagram_post_url explicitly.
  // This is simpler and guarantees the field is present in the returned object.
  const commonFields = `
    id,
    title,
    description,
    date,
    time,
    venue_name,
    venue_address,
    venue_latitude,
    venue_longitude,
    image_url,
    is_recurrent,
    track_payments,
    organizer_name,
    organizer_whatsapp,
    created_by,
    created_at,
    updated_at,
    instagram_post_url,
    slug,
    access_level,
    max_attendees,
    enable_check_in,
    enable_photos
  `;

  // Try slug first
  const { data: eventBySlug, error: slugError } = await supabase
    .from("events")
    .select(commonFields)
    .eq("slug", identifier)
    .maybeSingle();

  if (slugError) {
    return { data: null, error: slugError };
  }
  if (eventBySlug) {
    return { data: eventBySlug, error: null };
  }

  // Fallback: try by id
  const { data: eventById, error: idError } = await supabase
    .from("events")
    .select(commonFields)
    .eq("id", identifier)
    .maybeSingle();

  if (idError) {
    return { data: null, error: idError };
  }

  return { data: eventById || null, error: null };
};

export const getPromoBySlugOrId = async (identifier: string) => {
  const slugResult = await supabase.from("promos").select("*").eq("slug", identifier).maybeSingle();
  if (slugResult.data) return slugResult;

  return await supabase.from("promos").select("*").eq("id", identifier).maybeSingle();
};

export const getEventUrl = (event: any) => `/event/${event?.slug || event?.id}`;
export const getPromoUrl = (promo: any) => `/promo/${promo?.slug || promo?.id}`;
export const getEditEventUrl = (event: any) => `/edit-event/${event?.slug || event?.id}`;
export const getEditPromoUrl = (promo: any) => `/edit-promo/${promo?.slug || promo?.id}`;
