import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { HomeContent } from "@/components/sections/HomeContent";
import { EventsSection } from "@/components/sections/EventsSection";
import { PromosSection } from "@/components/sections/PromosSection";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { areaMatchesFilter } from "@/lib/area-config";
import { Helmet } from "react-helmet-async";

interface IndexProps {
  initialSection?: string;
}

const Index = ({ initialSection = "home" }: IndexProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);

  // Set page title based on active section
  const pageTitleMap: Record<string, string> = {
    home: "Home",
    events: "Events",
    promos: "Promos",
    profile: "Profile",
  };
  usePageTitle(pageTitleMap[activeSection] || "Home");

  // Use optimized data hook for better performance
  const { 
    events, 
    promos, 
    allPromos,
    loading, 
    user, 
    userAdminStatus,
    refreshData, 
    updateEventAttendance,
    updatePromoFavorite,
    loadMoreEvents,
    loadMorePromos,
    hasMoreEvents,
    hasMorePromos,
    isDataFresh 
  } = useOptimizedData();

  // Update navigation section when changing between sections properly
  const handleSectionChange = (section: string) => {
    if (section !== "events") {
      setShowCreateEvent(false);
    }
    if (section !== "promos") {
      setShowCreatePromo(false);
    }
    setActiveSection(section);
    
    // Use URL navigation so browser back button works
    const sectionRoutes: Record<string, string> = {
      home: '/',
      events: '/events',
      promos: '/promos',
    };
    const targetRoute = sectionRoutes[section];
    if (targetRoute && window.location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
    
    // Scroll to top when changing sections
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Only refresh data if it's stale or user specifically navigated to a section
    if (!isDataFresh || section === 'events' || section === 'promos') {
      refreshData();
    }
  };

  // Persist promo filters in sessionStorage so they survive navigation
  const storedFilters = typeof window !== 'undefined' ? sessionStorage.getItem('promoFilters') : null;
  const parsedFilters = storedFilters ? JSON.parse(storedFilters) : null;

  const [dayFilter, setDayFilter] = useState<string[]>(parsedFilters?.dayFilter || ["all"]);
  const [areaFilter, setAreaFilter] = useState<string[]>(parsedFilters?.areaFilter || ["all"]);
  const [drinkTypeFilter, setDrinkTypeFilter] = useState<string[]>(parsedFilters?.drinkTypeFilter || ["all"]);
  const [promoTypeFilter, setPromoTypeFilter] = useState<string[]>(parsedFilters?.promoTypeFilter || ["all"]);
  const [promoSortBy, setPromoSortBy] = useState(parsedFilters?.promoSortBy || "newest");
  const [promoSearchQuery, setPromoSearchQuery] = useState(parsedFilters?.promoSearchQuery || "");
  const storedEventFilters = typeof window !== 'undefined' ? sessionStorage.getItem('eventFilters') : null;
  const parsedEventFilters = storedEventFilters ? JSON.parse(storedEventFilters) : null;
  const [eventSortBy, setEventSortBy] = useState(parsedEventFilters?.eventSortBy || "date-asc");


  // Determine if any filter or search is active
  // Save promo filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('promoFilters', JSON.stringify({
      dayFilter, areaFilter, drinkTypeFilter, promoTypeFilter, promoSortBy, promoSearchQuery
    }));
  }, [dayFilter, areaFilter, drinkTypeFilter, promoTypeFilter, promoSortBy, promoSearchQuery]);

  // Save event filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('eventFilters', JSON.stringify({ eventSortBy }));
  }, [eventSortBy]);

  const isPromoFiltering = promoSearchQuery.trim() !== "" || 
    !dayFilter.includes("all") || 
    !areaFilter.includes("all") || 
    !drinkTypeFilter.includes("all") || 
    !promoTypeFilter.includes("all");

  // Use allPromos when any filter/search is active to avoid missing results beyond paginated set
  const promoSource = isPromoFiltering ? allPromos : promos;
  const filteredAndSortedPromos = promoSource
    .filter((promo) => {
      // Search filter
      if (promoSearchQuery.trim()) {
        const q = promoSearchQuery.toLowerCase();
        const searchMatch = 
          (promo.title?.toLowerCase().includes(q)) ||
          (promo.venue_name?.toLowerCase().includes(q)) ||
          (promo.area?.toLowerCase().includes(q)) ||
          (promo.description?.toLowerCase().includes(q)) ||
          (promo.discount_text?.toLowerCase().includes(q)) ||
          (promo.promo_type?.toLowerCase().includes(q));
        if (!searchMatch) return false;
      }
      const dayMatch = dayFilter.includes("all") || 
        (Array.isArray(promo.day_of_week) ? 
          promo.day_of_week.some((day: string) => dayFilter.includes(day?.toLowerCase() || "")) :
          dayFilter.includes((promo.day_of_week as string)?.toLowerCase() || ""));
      const areaMatch = areaFilter.includes("all") || areaMatchesFilter(promo.area, areaFilter);
      const drinkTypeMatch = drinkTypeFilter.includes("all") || 
        (Array.isArray(promo.drink_type) ? 
          promo.drink_type.some((drink: string) => drinkTypeFilter.includes(drink?.toLowerCase() || "")) :
          drinkTypeFilter.includes((promo.drink_type as string)?.toLowerCase() || ""));
      const promoTypeMatch = promoTypeFilter.includes("all") || 
        promoTypeFilter.includes(promo.promo_type || "");
      return dayMatch && areaMatch && drinkTypeMatch && promoTypeMatch;
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
          const aDateTime = new Date(`${a.date}T${a.time}`).getTime();
          const bDateTime = new Date(`${b.date}T${b.time}`).getTime();
          return aDateTime - bDateTime;
        case "date-desc":
          const aDateTimeDesc = new Date(`${a.date}T${a.time}`).getTime();
          const bDateTimeDesc = new Date(`${b.date}T${b.time}`).getTime();
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

  const handlePromoTypeFilterChange = (filter: string[]) => {
    setPromoTypeFilter(filter);
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

      // Check if already joined
      const event = events.find(e => e.id === eventId);
      if (event?.is_joined) {
        toast({
          title: "Already joined",
          description: "You're already registered for this event.",
          variant: "destructive"
        });
        return;
      }

      // Check if user was removed from this event
      const { data: removalData } = await supabase
        .from('removed_event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (removalData) {
        toast({
          title: "Cannot rejoin",
          description: "You have been removed from this event and cannot rejoin.",
          variant: "destructive"
        });
        return;
      }

      // Optimistically update UI
      updateEventAttendance(eventId, true);

      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: user.id
        });

      if (error) {
        // Revert optimistic update on error
        updateEventAttendance(eventId, false);
        
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

      toast({
        title: "Successfully joined event! 🎉",
        description: `You're now registered for "${event?.title}". See you there!`,
      });

    } catch (error) {
      console.error('Error joining event:', error);
      // Revert optimistic update on error
      updateEventAttendance(eventId, false);
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
            userAdminStatus={userAdminStatus}
            onFavoriteToggle={updatePromoFavorite}
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
            userAdminStatus={userAdminStatus}
            onLoadMore={loadMoreEvents}
            hasMore={hasMoreEvents}
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
            promoTypeFilter={promoTypeFilter}
            sortBy={promoSortBy}
            searchQuery={promoSearchQuery}
            loading={loading}
            onToggleCreatePromo={() => setShowCreatePromo(!showCreatePromo)}
            onDayFilterChange={handleDayFilterChange}
            onAreaFilterChange={handleAreaFilterChange}
            onDrinkTypeFilterChange={handleDrinkTypeFilterChange}
            onPromoTypeFilterChange={handlePromoTypeFilterChange}
            onSortChange={setPromoSortBy}
            onSearchChange={setPromoSearchQuery}
            userAdminStatus={userAdminStatus}
            onFavoriteToggle={updatePromoFavorite}
            onLoadMore={loadMorePromos}
            hasMore={isPromoFiltering ? false : hasMorePromos}
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
            userAdminStatus={userAdminStatus}
            onFavoriteToggle={updatePromoFavorite}
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
