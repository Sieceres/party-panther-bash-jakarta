import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { EventWithSlug, PromoWithSlug } from '@/types/extended-types';

interface OptimizedEvent extends EventWithSlug {
  attendee_count: number;
  is_joined: boolean;
  creator_name: string;
  creator_avatar?: string;
  creator_verified: boolean;
  // Keep attendees for compatibility
  attendees: number;
}

interface OptimizedPromo extends PromoWithSlug {
  creator_name: string;
  creator_avatar?: string;
  creator_verified: boolean;
  average_rating: number;
  total_reviews: number;
  is_favorite: boolean;
}

interface CachedData {
  events: OptimizedEvent[];
  promos: OptimizedPromo[];
  userAdminStatus: { is_admin: boolean; is_super_admin: boolean } | null;
  timestamp: number;
}

const CACHE_DURATION = 300000; // 5 minutes
let globalCache: CachedData | null = null;

export function useOptimizedData() {
  const [events, setEvents] = useState<OptimizedEvent[]>([]);
  const [promos, setPromos] = useState<OptimizedPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userAdminStatus, setUserAdminStatus] = useState<{ is_admin: boolean; is_super_admin: boolean } | null>(null);
  const lastFetchRef = useRef<number>(0);

  const isDataFresh = useCallback(() => {
    if (!globalCache) return false;
    return Date.now() - globalCache.timestamp < CACHE_DURATION;
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Prevent rapid successive calls
    if (now - lastFetchRef.current < 1000 && !forceRefresh) {
      return;
    }
    lastFetchRef.current = now;

    // Use cache if fresh and not forcing refresh
    if (!forceRefresh && globalCache && isDataFresh()) {
      setEvents(globalCache.events);
      setPromos(globalCache.promos);
      setUserAdminStatus(globalCache.userAdminStatus);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Use simple functions by default for better performance
      // Only use detailed functions when specifically needed
      let eventsResult, promosResult, adminStatusResult;
      
      console.log('Fetching data with detailed functions for complete information...');
      
      try {
        // Use detailed functions to get creator info and attendee counts
        [eventsResult, promosResult, adminStatusResult] = await Promise.all([
          supabase.rpc('get_events_with_details', { user_id_param: currentUser?.id || null }),
          supabase.rpc('get_promos_with_details', { user_id_param: currentUser?.id || null }),
          currentUser ? supabase.rpc('get_user_admin_status', { user_id_param: currentUser.id }) : { data: null, error: null }
        ]);
        
        console.log('Detailed functions completed successfully');
      } catch (error) {
        console.error('Error with detailed functions:', error);
        throw error;
      }

      if (eventsResult.error) throw eventsResult.error;
      if (promosResult.error) throw promosResult.error;
      if (adminStatusResult.error) throw adminStatusResult.error;

      // Process events data
      const eventsData = (eventsResult.data || []).map((event: any) => ({
        ...event,
        // Handle both detailed and simple function results
        attendees: Number(event.attendee_count) || 0,
        isJoined: Boolean(event.is_joined) || false,
        is_joined: Boolean(event.is_joined) || false,
        attendee_count: Number(event.attendee_count) || 0,
        creator_name: event.creator_name || 'Anonymous',
        creator_avatar: event.creator_avatar || null,
        creator_verified: Boolean(event.creator_verified) || false,
        slug: event.slug || null
      })) as OptimizedEvent[];

      // Process promos data  
      const promosData = (promosResult.data || []).map((promo: any) => ({
        ...promo,
        slug: promo.slug || null,
        // Map the database fields to component expected fields
        discount: promo.discount_text,
        venue: promo.venue_name,
        validUntil: promo.valid_until,
        image: promo.image_url,
        category: promo.category,
        day: promo.day_of_week,
        area: promo.area,
        drinkType: promo.drink_type,
        // Handle both detailed and simple function results
        creator_name: promo.creator_name || 'Anonymous',
        creator_avatar: promo.creator_avatar || null,
        creator_verified: Boolean(promo.creator_verified) || false,
        average_rating: Number(promo.average_rating) || 0,
        total_reviews: Number(promo.total_reviews) || 0,
        is_favorite: Boolean(promo.is_favorite) || false
      })) as OptimizedPromo[];

      const adminStatus = adminStatusResult.data?.[0] || { is_admin: false, is_super_admin: false };

      // Update cache
      globalCache = {
        events: eventsData,
        promos: promosData,
        userAdminStatus: adminStatus,
        timestamp: now
      };

      setEvents(eventsData);
      setPromos(promosData);
      setUserAdminStatus(adminStatus);
      
    } catch (error) {
      console.error('Error fetching optimized data:', error);
      setEvents([]);
      setPromos([]);
      setUserAdminStatus(null);
    } finally {
      setLoading(false);
    }
  }, [isDataFresh]);

  const refreshData = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const updateEventAttendance = useCallback((eventId: string, isJoined: boolean) => {
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          const attendeeChange = isJoined ? 1 : -1;
          return {
            ...event,
            is_joined: isJoined,
            isJoined: isJoined,
            attendees: Math.max(0, (event.attendees || 0) + attendeeChange)
          };
        }
        return event;
      })
    );
    
    // Update cache as well
    if (globalCache) {
      globalCache.events = globalCache.events.map(event => {
        if (event.id === eventId) {
          const attendeeChange = isJoined ? 1 : -1;
          return {
            ...event,
            is_joined: isJoined,
            isJoined: isJoined,
            attendees: Math.max(0, (event.attendees || 0) + attendeeChange)
          };
        }
        return event;
      });
    }
  }, []);

  const updatePromoFavorite = useCallback((promoId: string, isFavorite: boolean) => {
    setPromos(prevPromos =>
      prevPromos.map(promo => 
        promo.id === promoId ? { ...promo, is_favorite: isFavorite } : promo
      )
    );
    
    // Update cache as well
    if (globalCache) {
      globalCache.promos = globalCache.promos.map(promo => 
        promo.id === promoId ? { ...promo, is_favorite: isFavorite } : promo
      );
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    events,
    promos,
    loading,
    user,
    userAdminStatus,
    refreshData,
    updateEventAttendance,
    updatePromoFavorite,
    isDataFresh: isDataFresh()
  };
}