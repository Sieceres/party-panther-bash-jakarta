import { supabase } from "@/integrations/supabase/client";

export const getEventBySlugOrId = async (identifier: string) => {
  // Public (anon-safe) columns. Contact/payment columns are only readable by
  // signed-in users, so they are fetched in a second query when authenticated.
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
    created_by,
    created_at,
    updated_at,
    instagram_post_url,
    slug,
    access_level,
    max_attendees,
    enable_check_in,
    enable_photos,
    venue_id,
    custom_slug,
    custom_slug_expires_at
  `;

  const withPrivateFields = async (event: any) => {
    if (!event) return event;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return event;
    const { data: extra } = await supabase
      .from("events")
      .select("organizer_whatsapp, payment_info, payment_methods, payment_qr_url")
      .eq("id", event.id)
      .maybeSingle();
    return extra ? { ...event, ...extra } : event;
  };

  // Try custom link first
  const { data: eventByCustom } = await supabase
    .from("events")
    .select(commonFields)
    .eq("custom_slug", identifier.toLowerCase())
    .maybeSingle();

  if (eventByCustom) {
    return { data: await withPrivateFields(eventByCustom), error: null };
  }

  // Then slug
  const { data: eventBySlug, error: slugError } = await supabase
    .from("events")
    .select(commonFields)
    .eq("slug", identifier)
    .maybeSingle();

  if (slugError) {
    return { data: null, error: slugError };
  }
  if (eventBySlug) {
    return { data: await withPrivateFields(eventBySlug), error: null };
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

  return { data: eventById ? await withPrivateFields(eventById) : null, error: null };
};

export const getPromoBySlugOrId = async (identifier: string) => {
  const slugResult = await supabase.from("promos").select("*").eq("slug", identifier).maybeSingle();
  if (slugResult.data) return slugResult;

  return await supabase.from("promos").select("*").eq("id", identifier).maybeSingle();
};

export const getVenueBySlugOrId = async (identifier: string) => {
  const slugResult = await supabase.from("venues").select("*").eq("slug", identifier).maybeSingle();
  if (slugResult.data) return slugResult;

  return await supabase.from("venues").select("*").eq("id", identifier).maybeSingle();
};

const activeCustomSlug = (event: any) => {
  if (!event?.custom_slug) return null;
  const exp = event.custom_slug_expires_at;
  if (exp && new Date(exp) < new Date()) return null;
  return event.custom_slug as string;
};

export const getEventUrl = (event: any) => {
  const custom = activeCustomSlug(event);
  return custom ? `/${custom}` : `/event/${event?.slug || event?.id}`;
};
export const getPromoUrl = (promo: any) => `/promo/${promo?.slug || promo?.id}`;
export const getVenueUrl = (venue: any) => `/venue/${venue?.slug || venue?.id}`;
export const getEditEventUrl = (event: any) => `/edit-event/${event?.slug || event?.id}`;
export const getEditPromoUrl = (promo: any) => `/edit-promo/${promo?.slug || promo?.id}`;

// Short share URLs on the main domain. A Vercel edge middleware in front of
// partypanther.net detects social-media crawlers and serves OG HTML from the
// Supabase `og-meta` edge function; everything else is transparently proxied
// to the Lovable origin (partypanther.lovable.app).
const SITE_URL = "https://partypanther.net";
export const getEventShareUrl = (event: any) => {
  const custom = activeCustomSlug(event);
  return custom ? `${SITE_URL}/${custom}` : `${SITE_URL}/e/${event?.slug || event?.id}`;
};
export const getPromoShareUrl = (promo: any) => `${SITE_URL}/p/${promo?.slug || promo?.id}`;
export const getVenueShareUrl = (venue: any) => `${SITE_URL}/v/${venue?.slug || venue?.id}`;
