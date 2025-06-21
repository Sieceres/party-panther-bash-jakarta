
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HomeContent } from "@/components/sections/HomeContent";
import { EventsSection } from "@/components/sections/EventsSection";
import { PromosSection } from "@/components/sections/PromosSection";
import { BlogSection } from "@/components/BlogSection";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  };

  const [dayFilter, setDayFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [drinkTypeFilter, setDrinkTypeFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Handle URL section parameter
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    if (section && ['home', 'events', 'promos', 'blog', 'profile'].includes(section)) {
      setActiveSection(section);
    }
  }, []);

  const fetchData = async () => {
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch promos
      const { data: promosData, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false });

      if (promosError) throw promosError;

      console.log('Fetched events:', eventsData);
      console.log('Fetched promos:', promosData);
      
      setEvents(eventsData || []);
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
    const dayMatch = dayFilter === "all" || promo.day_of_week?.toLowerCase() === dayFilter;
    const areaMatch = areaFilter === "all" || promo.area?.toLowerCase() === areaFilter.replace(' jakarta', '');
    const drinkMatch = drinkTypeFilter === "all" || promo.drink_type?.toLowerCase() === drinkTypeFilter;
    return dayMatch && areaMatch && drinkMatch;
  });

  const handleJoinEvent = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
            onToggleCreatePromo={() => setShowCreatePromo(!showCreatePromo)}
            onClaimPromo={handleClaimPromo}
            onDayFilterChange={setDayFilter}
            onAreaFilterChange={setAreaFilter}
            onDrinkTypeFilterChange={setDrinkTypeFilter}
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
    </div>
  );
};

export default Index;
