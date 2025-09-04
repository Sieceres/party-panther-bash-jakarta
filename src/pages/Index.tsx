
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HomeContent } from "@/components/sections/HomeContent";
import { EventsSection } from "@/components/sections/EventsSection";
import { PromosSection } from "@/components/sections/PromosSection";
import { BlogSection } from "@/components/BlogSection";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "../integrations/supabase/types";
import { Footer } from "@/components/Footer";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("home");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);

  // Cancel create forms when section changes
  const handleSectionChange = (section: string) => {
    if (section !== "events") {
      setShowCreateEvent(false);
    }
    if (section !== "promos") {
      setShowCreatePromo(false);
    }
    setActiveSection(section);
    
    // Scroll to top when changing sections
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [dayFilter, setDayFilter] = useState<string[]>(["all"]);
  const [areaFilter, setAreaFilter] = useState<string[]>(["all"]);
  const [drinkTypeFilter, setDrinkTypeFilter] = useState<string[]>(["all"]);
  const [events, setEvents] = useState<Tables<'events'>[]>([]);
  const [promos, setPromos] = useState<Tables<'promos'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // Added user state

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchData(user?.id); // Pass user ID to fetchData
    };

    fetchUserAndData();
    
    // Handle URL section parameter - only if there's actually a section parameter
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    if (section && ['home', 'events', 'promos', 'blog', 'profile', 'contact'].includes(section)) {
      setActiveSection(section);
    } else {
      // Ensure we're on home section if no URL parameter
      setActiveSection('home');
    }
  }, []);

  const fetchData = async (currentUserId?: string) => { // Modified to accept currentUserId
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

      const eventsWithJoinStatus = eventsData.map(event => ({
        ...event,
        isJoined: joinedEventIds.includes(event.id)
      }));

      // Fetch promos
      const { data: promosData, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false });

      if (promosError) throw promosError;

      console.log('Fetched events:', eventsWithJoinStatus);
      console.log('Fetched promos:', promosData);
      
      setEvents(eventsWithJoinStatus || []);
      setPromos(promosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use fallback mock data if database fails
      setEvents([]);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromos = promos.filter((promo) => {
    const dayMatch = dayFilter.includes("all") || dayFilter.includes(promo.day_of_week?.toLowerCase() || "");
    const areaMatch = areaFilter.includes("all") || areaFilter.includes(promo.area?.toLowerCase().replace(' jakarta', '') || "");
    const promoTypeMatch = drinkTypeFilter.includes("all") || drinkTypeFilter.includes(promo.promo_type || "");
    return dayMatch && areaMatch && promoTypeMatch;
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
      if (!user) { // Use the user from state
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
        if (error.code === '23505') { // Unique constraint violation
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

      // Update the specific event's isJoined status in the state
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId ? { ...e, isJoined: true } : e
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

  const handleClaimPromo = (promoId: string) => {
    const promo = promos.find(p => p.id === promoId);
    toast({
      title: "Promo claimed! 🎊",
      description: `"${promo?.title}" has been added to your account. Show this at the venue.`,
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <HomeContent
            loading={loading}
            events={events}
            promos={promos}
            onSectionChange={handleSectionChange}
            onJoinEvent={handleJoinEvent}
            onClaimPromo={handleClaimPromo}
          />
        );
      
      case "events":
        return (
          <EventsSection
            events={events}
            showCreateEvent={showCreateEvent}
            onToggleCreateEvent={() => setShowCreateEvent(!showCreateEvent)}
            onJoinEvent={handleJoinEvent}
            loading={loading} // Pass loading state
          />
        );
      
      case "promos":
        return (
          <PromosSection
            promos={promos}
            filteredPromos={filteredPromos}
            showCreatePromo={showCreatePromo}
            dayFilter={dayFilter}
            areaFilter={areaFilter}
            drinkTypeFilter={drinkTypeFilter}
            loading={loading}
            onToggleCreatePromo={() => setShowCreatePromo(!showCreatePromo)}
            onClaimPromo={handleClaimPromo}
            onDayFilterChange={handleDayFilterChange}
            onAreaFilterChange={handleAreaFilterChange}
            onDrinkTypeFilterChange={handleDrinkTypeFilterChange}
          />
        );
      
      case "blog":
        return (
          <div className="pt-20 px-4">
            <div className="container mx-auto">
              <BlogSection />
            </div>
          </div>
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
            events={events}
            promos={promos}
            onSectionChange={handleSectionChange}
            onJoinEvent={handleJoinEvent}
            onClaimPromo={handleClaimPromo}
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
