import { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";

// Mock data
const mockEvents = [
  {
    id: "1",
    title: "Electronic Night: Jakarta Vibes",
    date: "Dec 25, 2024",
    time: "22:00",
    venue: "Sky Bar, Kemang",
    price: "IDR 200K",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop",
    attendees: 127,
    rating: 4.8,
    tags: ["Electronic", "Rooftop", "VIP"],
    organizer: "Jakarta Nights"
  },
  {
    id: "2", 
    title: "Friday Night Fever",
    date: "Dec 27, 2024",
    time: "21:00",
    venue: "District 8, SCBD",
    price: "IDR 150K",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    attendees: 89,
    rating: 4.6,
    tags: ["Dance", "Cocktails", "Premium"],
    organizer: "Party Central"
  },
  {
    id: "3",
    title: "Rooftop Party Experience",
    date: "Dec 30, 2024", 
    time: "20:00",
    venue: "Potato Head, Senayan",
    price: "IDR 300K",
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop",
    attendees: 156,
    rating: 4.9,
    tags: ["Rooftop", "Sunset", "Exclusive"],
    organizer: "Elite Events"
  }
];

const mockPromos = [
  {
    id: "1",
    title: "50% Off All Cocktails",
    description: "Happy hour special - all premium cocktails half price!",
    discount: "50% OFF",
    venue: "The Jungle Bar",
    validUntil: "Dec 31, 2024",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop",
    category: "Drinks",
    originalPrice: "IDR 200K",
    discountedPrice: "IDR 100K",
    day: "friday",
    area: "south",
    drinkType: "cocktails"
  },
  {
    id: "2",
    title: "Free Entry Before 10PM",
    description: "Skip the line and save money with early entry!",
    discount: "FREE",
    venue: "Zodiac Club",
    validUntil: "Every Friday",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    category: "Entry",
    originalPrice: "IDR 150K",
    discountedPrice: "FREE",
    day: "friday",
    area: "central",
    drinkType: "all"
  },
  {
    id: "3",
    title: "Ladies Night Special",
    description: "Free drinks for ladies all night long!",
    discount: "100% OFF",
    venue: "Immigrant Club",
    validUntil: "Every Wednesday",
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop",
    category: "Ladies Night",
    originalPrice: "IDR 250K",
    discountedPrice: "FREE",
    day: "wednesday",
    area: "west",
    drinkType: "beer"
  },
  {
    id: "4",
    title: "Wine Wednesday Special",
    description: "Premium wines at unbeatable prices every Wednesday!",
    discount: "40% OFF",
    venue: "Cork & Screw",
    validUntil: "Every Wednesday",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop",
    category: "Wine",
    originalPrice: "IDR 300K",
    discountedPrice: "IDR 180K",
    day: "wednesday",
    area: "north",
    drinkType: "wine"
  },
  {
    id: "5",
    title: "Saturday Night Shots",
    description: "Buy 2 get 1 free on all premium shots!",
    discount: "BUY 2 GET 1",
    venue: "Shot Bar Jakarta",
    validUntil: "Every Saturday",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    category: "Shots",
    originalPrice: "IDR 150K",
    discountedPrice: "IDR 100K",
    day: "saturday",
    area: "east",
    drinkType: "spirits"
  }
];

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      const { data: promosData } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      setEvents(eventsData || []);
      setPromos(promosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromos = promos.filter((promo) => {
    const dayMatch = dayFilter === "all" || promo.day_of_week?.toLowerCase() === dayFilter;
    const areaMatch = areaFilter === "all" || promo.area?.toLowerCase().includes(areaFilter);
    const drinkMatch = drinkTypeFilter === "all" || promo.drink_type?.toLowerCase() === drinkTypeFilter;
    return dayMatch && areaMatch && drinkMatch;
  });

  const handleJoinEvent = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleClaimPromo = (promoId: string) => {
    navigate(`/promo/${promoId}`);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div>
            <Hero onSectionChange={setActiveSection} />
            {/* Sample Events Section */}
            <div className="py-16 px-4 bg-background">
              <div className="container mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold gradient-text mb-2">Featured Events</h2>
                    <p className="text-muted-foreground">Don't miss these amazing upcoming events</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSection("events")}
                    className="flex items-center space-x-2"
                  >
                    <span>See more</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-card rounded-lg h-64"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={{
                          id: event.id,
                          title: event.title,
                          date: new Date(event.date).toLocaleDateString(),
                          time: event.time,
                          venue: event.venue_name,
                          price: "Free",
                          image: event.image_url,
                          organizer: event.organizer_name || "Anonymous",
                          attendees: 0,
                          rating: 0,
                          tags: []
                        }} 
                        onJoin={handleJoinEvent} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sample Promos Section */}
            <div className="py-16 px-4 bg-muted/30">
              <div className="container mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold gradient-text mb-2">Hot Promos</h2>
                    <p className="text-muted-foreground">Save money while partying with these exclusive deals</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSection("promos")}
                    className="flex items-center space-x-2"
                  >
                    <span>See more</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-card rounded-lg h-64"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promos.map((promo) => (
                      <PromoCard 
                        key={promo.id} 
                        promo={{
                          id: promo.id,
                          title: promo.title,
                          description: promo.description,
                          discount: promo.discount_text,
                          venue: promo.venue_name,
                          validUntil: promo.valid_until || "Limited time",
                          image: promo.image_url,
                          category: promo.category,
                          originalPrice: promo.original_price_amount ? `IDR ${promo.original_price_amount.toLocaleString()}` : "N/A",
                          discountedPrice: promo.discounted_price_amount ? `IDR ${promo.discounted_price_amount.toLocaleString()}` : "FREE",
                          day: promo.day_of_week || "",
                          area: promo.area || "",
                          drinkType: promo.drink_type || ""
                        }} 
                        onClaim={handleClaimPromo} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
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
                      id: event.id,
                      title: event.title,
                      date: new Date(event.date).toLocaleDateString(),
                      time: event.time,
                      venue: event.venue_name,
                      price: "Free",
                      image: event.image_url,
                      organizer: event.organizer_name || "Anonymous",
                      attendees: 0,
                      rating: 0,
                      tags: []
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
                  <PromoCard key={promo.id} promo={promo} onClaim={handleClaimPromo} />
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
        return <Hero onSectionChange={setActiveSection} />;
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
