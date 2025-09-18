import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HomeContent } from "@/components/sections/HomeContent";
import { EventsSection } from "@/components/sections/EventsSection";
import { PromosSection } from "@/components/sections/PromosSection";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "../integrations/supabase/types";
import { Footer } from "@/components/Footer";
import { User } from "@supabase/supabase-js";
import { EventWithSlug, PromoWithSlug } from "@/types/extended-types";

const Index = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("home");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);

  // Update navigation section when changing between sections properly
  const handleSectionChange = (section: string) => {
    if (section !== "events") {
      setShowCreateEvent(false);
    }
    if (section !== "promos") {
      setShowCreatePromo(false);
    }
    setActiveSection(section);
    
    // Update URL to reflect section change
    const newUrl = section === 'home' ? '/' : `/?section=${section}`;
    window.history.pushState({}, '', newUrl);
    
    // Scroll to top when changing sections
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Refresh data to ensure it's current
    fetchData(user?.id);
  };

  const [dayFilter, setDayFilter] = useState<string[]>(["all"]);
  const [areaFilter, setAreaFilter] = useState<string[]>(["all"]);
  const [drinkTypeFilter, setDrinkTypeFilter] = useState<string[]>(["all"]);
  const [promoSortBy, setPromoSortBy] = useState("newest");
  const [eventSortBy, setEventSortBy] = useState("date-asc");
  const [events, setEvents] = useState<EventWithSlug[]>([]);  
  const [promos, setPromos] = useState<PromoWithSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchData(user?.id); // Pass user ID to fetchData
    };

    fetchUserAndData();
    
    // Handle URL section parameter
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    if (section && ['home', 'events', 'promos', 'profile', 'contact'].includes(section)) {
      setActiveSection(section);
      const newUrl = section === 'home' ? '/' : `/?section=${section}`;
      window.history.replaceState({}, '', newUrl);
    } else {
      setActiveSection('home');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // --- CHANGED: Fetch attendee counts per event and add to events ---
  const fetchData = async (currentUserId?: string) => {
    try {
      // Fetch events using secure function
      const { data: eventsData, error: eventsError } = await supabase
        .rpc('get_events_safe')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      let joinedEventIds: string[] = [];
      if (currentUserId) {
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('event_attendees')
          .select('event_id')
          .eq('user_id', currentUserId);

        if (attendeesError) throw attendeesError;
        joinedEventIds = attendeesData.map(attendee => attendee.event_id);
      }

      // Fetch public attendee counts for all events
      const { data: attendeeCountsData, error: attendeeCountsError } = await supabase
        .rpc('get_event_attendee_counts');

      let attendeeCountsMap: Record<string, number> = {};
      if (attendeeCountsError) {
        console.error('Error fetching attendee counts:', attendeeCountsError);
        // Fallback: manually count attendees if RPC fails
        const { data: fallbackData } = await supabase
          .from('event_attendees')
          .select('event_id');
        
        if (fallbackData) {
          fallbackData.forEach((row: any) => {
            attendeeCountsMap[row.event_id] = (attendeeCountsMap[row.event_id] || 0) + 1;
          });
        }
      } else {
        // Build a map of event_id -> count
        (attendeeCountsData || []).forEach((row: any) => {
          attendeeCountsMap[row.event_id] = Number(row.attendee_count) || 0;
        });
      }

      const eventsWithJoinStatus = (eventsData || []).map((event: any) => ({
        ...event,
        isJoined: joinedEventIds.includes(event.id),
        slug: event.slug || null,
        attendees: attendeeCountsMap[event.id] || 0, // <-- Use real attendee count
      })) as EventWithSlug[];

      // Fetch promos
      const { data: promosData, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false });

      if (promosError) throw promosError;

      setEvents(eventsWithJoinStatus || []);
      setPromos((promosData?.map((promo: any) => ({ ...promo, slug: promo.slug || null })) as PromoWithSlug[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setEvents([]);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedPromos = promos
    .filter((promo) => {
      const dayMatch = dayFilter.includes("all") || 
        (Array.isArray(promo.day_of_week) ? 
          promo.day_of_week.some((day: string) => dayFilter.includes(day?.toLowerCase() || "")) :
          dayFilter.includes((promo.day_of_week as string)?.toLowerCase() || ""));
      const areaMatch = areaFilter.includes("all") || areaFilter.includes(promo.area?.toLowerCase().replace(' jakarta', '') || "");
      const promoTypeMatch = drinkTypeFilter.includes("all") || drinkTypeFilter.includes(promo.promo_type || "");
      return dayMatch && areaMatch && promoTypeMatch;
    })
    .sort((a, b) => {
      switch (promoSortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-low":
          const aPrice = a.discounted_price_amount || 0;
          const bPrice = b.discounted_price_amount || 0;
          return aPrice - bPrice;
        case "price-high":
          const aPriceHigh = a.discounted_price_amount || 0;
          const bPriceHigh = b.discounted_price_amount || 0;
          return bPriceHigh - aPriceHigh;
        case "title-az":
          return a.title.localeCompare(b.title);
        case "title-za":
          return b.title.localeCompare(a.title);
        case "valid-until":
          if (!a.valid_until && !b.valid_until) return 0;
          if (!a.valid_until) return 1;
          if (!b.valid_until) return -1;
          return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
        default:
          return 0;
      }
    });

  const filteredAndSortedEvents = events
    .sort((a, b) => {
      switch (eventSortBy) {
        case "date-asc":
          const aDateTime = new Date(`${a.date} ${a.time}`).getTime();
          const bDateTime = new Date(`${b.date} ${b.time}`).getTime();
          return aDateTime - bDateTime;
        case "date-desc":
          const aDateTimeDesc = new Date(`${a.date} ${a.time}`).getTime();
          const bDateTimeDesc = new Date(`${b.date} ${b.time}`).getTime();
          return bDateTimeDesc - aDateTimeDesc;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title-az":
          return a.title.localeCompare(b.title);
        case "title-za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const handleDayFilterChange = (filter: string[]) => {
    setDayFilter(filter);
  };

  const handleAreaFilterChange = (filter: string[]) => {
    setAreaFilter(filter);
  };

  const handleDrinkTypeFilterChange = (filter: string[]) => {
    setDrinkTypeFilter(filter);
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to join events.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already joined",
            description: "You're already registered for this event.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      const event = events.find(e => e.id === eventId);
      toast({
        title: "Successfully joined event! 🎉",
        description: `You're now registered for "${event?.title}". See you there!`,
      });

      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId ? { ...e, isJoined: true, attendees: (e.attendees || 0) + 1 } : e
        )
      );
    } catch (error) {
      console.error('Error joining event:', error);
      toast({
        title: "Error",
        description: "Failed to join event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <HomeContent
            loading={loading}
            events={filteredAndSortedEvents}
            promos={filteredAndSortedPromos}
            onSectionChange={handleSectionChange}
            onJoinEvent={handleJoinEvent}
          />
        );
      
      case "events":
        return (
          <EventsSection
            events={filteredAndSortedEvents}
            showCreateEvent={showCreateEvent}
            sortBy={eventSortBy}
            onToggleCreateEvent={() => setShowCreateEvent(!showCreateEvent)}
            onJoinEvent={handleJoinEvent}
            onSortChange={setEventSortBy}
            loading={loading}
          />
        );
      
      case "promos":
        return (
          <PromosSection
            promos={promos}
            filteredPromos={filteredAndSortedPromos}
            showCreatePromo={showCreatePromo}
            dayFilter={dayFilter}
            areaFilter={areaFilter}
            drinkTypeFilter={drinkTypeFilter}
            sortBy={promoSortBy}
            loading={loading}
            onToggleCreatePromo={() => setShowCreatePromo(!showCreatePromo)}
            onDayFilterChange={handleDayFilterChange}
            onAreaFilterChange={handleAreaFilterChange}
            onDrinkTypeFilterChange={handleDrinkTypeFilterChange}
            onSortChange={setPromoSortBy}
          />
        );
      
      case "profile":
        return (
          <div className="pt-20 px-4">
            <div className="container mx-auto">
              <UserProfile />
            </div>
          </div>
        );
      
      default:
        return (
          <HomeContent
            loading={loading}
            events={filteredAndSortedEvents}
            promos={filteredAndSortedPromos}
            onSectionChange={handleSectionChange}
            onJoinEvent={handleJoinEvent}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={activeSection} onSectionChange={handleSectionChange} />
      {renderContent()}
      <Footer onSectionChange={handleSectionChange} />
    </div>
  );
};

export default Index;
