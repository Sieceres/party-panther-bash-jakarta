import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { PromoCard } from "@/components/PromoCard";
import { CreateEventForm } from "@/components/CreateEventForm";
import { UserProfile } from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import { Calendar, Star } from "lucide-react";

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
    discountedPrice: "IDR 100K"
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
    discountedPrice: "FREE"
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
    discountedPrice: "FREE"
  }
];

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Hero onSectionChange={setActiveSection} />;
      
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
                {mockEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </div>
        );
      
      case "promos":
        return (
          <div className="pt-20 px-4">
            <div className="container mx-auto space-y-8">
              <div>
                <h2 className="text-4xl font-bold gradient-text mb-2">Hot Promos</h2>
                <p className="text-muted-foreground">Save money while partying with these exclusive deals</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockPromos.map((promo) => (
                  <PromoCard key={promo.id} promo={promo} />
                ))}
              </div>
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
