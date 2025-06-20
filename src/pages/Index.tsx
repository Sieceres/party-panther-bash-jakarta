import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { PromoCard } from "@/components/PromoCard";
import { CreateEventForm } from "@/components/CreateEventForm";
import { CreatePromoForm } from "@/components/CreatePromoForm";
import { UserProfile } from "@/components/UserProfile";
import { BlogSection } from "@/components/BlogSection";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("home");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [drinkTypeFilter, setDrinkTypeFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(3);

      if (eventsError) throw eventsError;

      // Fetch promos
      const { data: promosData, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (promosError) throw promosError;

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

  const renderHomeContent = () => {
    if (loading) {
      return (
        <div className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-16">
        <Hero onSectionChange={setActiveSection} />
        
        {/* Featured Events Section */}
        <div className="px-4">
          <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">Don't miss these amazing parties</p>
              </div>
              <Button
                onClick={() => setActiveSection("events")}
                variant="outline"
                className="group"
              >
                See More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={{
                    ...event,
                    price: event.price_amount ? `IDR ${event.price_amount.toLocaleString()}` : 'Free',
                    venue: event.venue_name,
                    attendees: Math.floor(Math.random() * 100) + 20,
                    rating: 4.5 + Math.random() * 0.5,
                    tags: ['Party', 'Music', 'Dance'],
                    organizer: event.organizer_name
                  }} 
                  onJoin={handleJoinEvent} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Featured Promos Section */}
        <div className="px-4">
          <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2">Hot Promos</h2>
                <p className="text-muted-foreground">Save money on your next night out</p>
              </div>
              <Button
                onClick={() => setActiveSection("promos")}
                variant="outline"
                className="group"
              >
                See More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promos.map((promo) => (
                <PromoCard 
                  key={promo.id} 
                  promo={{
                    ...promo,
                    discount: promo.discount_text,
                    venue: promo.venue_name,
                    validUntil: promo.valid_until,
                    originalPrice: promo.original_price_amount ? `IDR ${promo.original_price_amount.toLocaleString()}` : 'N/A',
                    discountedPrice: promo.discounted_price_amount ? `IDR ${promo.discounted_price_amount.toLocaleString()}` : 'FREE',
                    day: promo.day_of_week?.toLowerCase(),
                    area: promo.area?.toLowerCase(),
                    drinkType: promo.drink_type?.toLowerCase()
                  }} 
                  onClaim={handleClaimPromo} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return renderHomeContent();
      
      case "events":
        return (
          <div className="pt-20 px-4">
            <div className="container mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold gradient-text mb-2">Jakarta Events</h2>
                  <p className="text-muted-foreground">Discover the hottest parties and events in the city</p>
                </div>
                <Button
                  onClick={() => setShowCreateEvent(!showCreateEvent)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {showCreateEvent && (
                <div className="mb-8">
                  <CreateEventForm />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={{
                      ...event,
                      price: event.price_amount ? `IDR ${event.price_amount.toLocaleString()}` : 'Free',
                      venue: event.venue_name,
                      attendees: Math.floor(Math.random() * 100) + 20,
                      rating: 4.5 + Math.random() * 0.5,
                      tags: ['Party', 'Music', 'Dance'],
                      organizer: event.organizer_name
                    }} 
                    onJoin={handleJoinEvent} 
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case "promos":
        return (
          <div className="pt-20 px-4">
            <div className="container mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold gradient-text mb-2">Hot Promos</h2>
                  <p className="text-muted-foreground">Save money while partying with these exclusive deals</p>
                </div>
                <Button
                  onClick={() => setShowCreatePromo(!showCreatePromo)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Create Promo
                </Button>
              </div>

              {showCreatePromo && (
                <div className="mb-8">
                  <CreatePromoForm />
                </div>
              )}

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by:</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Day of week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      <SelectItem value="north">North Jakarta</SelectItem>
                      <SelectItem value="south">South Jakarta</SelectItem>
                      <SelectItem value="east">East Jakarta</SelectItem>
                      <SelectItem value="west">West Jakarta</SelectItem>
                      <SelectItem value="central">Central Jakarta</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={drinkTypeFilter} onValueChange={setDrinkTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Drink type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drinks</SelectItem>
                      <SelectItem value="cocktails">Cocktails</SelectItem>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                      <SelectItem value="spirits">Spirits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPromos.map((promo) => (
                  <PromoCard 
                    key={promo.id} 
                    promo={{
                      ...promo,
                      discount: promo.discount_text,
                      venue: promo.venue_name,
                      validUntil: promo.valid_until,
                      originalPrice: promo.original_price_amount ? `IDR ${promo.original_price_amount.toLocaleString()}` : 'N/A',
                      discountedPrice: promo.discounted_price_amount ? `IDR ${promo.discounted_price_amount.toLocaleString()}` : 'FREE',
                      day: promo.day_of_week?.toLowerCase(),
                      area: promo.area?.toLowerCase(),
                      drinkType: promo.drink_type?.toLowerCase()
                    }} 
                    onClaim={handleClaimPromo} 
                  />
                ))}
              </div>
            </div>
          </div>
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
        return renderHomeContent();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      {renderContent()}
    </div>
  );
};

export default Index;