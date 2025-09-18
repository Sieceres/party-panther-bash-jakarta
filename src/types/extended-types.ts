import { Tables } from "@/integrations/supabase/types";

// Extended types that include slug fields for events and promos
export type EventWithSlug = Tables<'events'> & {
  slug?: string | null;
  attendees?: number;
};

export type PromoWithSlug = Tables<'promos'> & {
  slug?: string | null;
};

// Event with join status for user-specific views
export type EventWithJoinStatus = EventWithSlug & {
  isJoined?: boolean;
};