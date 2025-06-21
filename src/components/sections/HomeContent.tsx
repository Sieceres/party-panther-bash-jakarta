
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { PromoCard } from "@/components/PromoCard";
import { ArrowRight } from "lucide-react";

interface HomeContentProps {
  loading: boolean;
  events: any[];
  promos: any[];
  onSectionChange: (section: string) => void;
  onJoinEvent: (eventId: string) => void;
  onClaimPromo: (promoId: string) => void;
}

export const HomeContent = ({ 
  loading, 
  events, 
  promos, 
  onSectionChange, 
  onJoinEvent, 
  onClaimPromo 
}: HomeContentProps) => {
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
      <Hero onSectionChange={onSectionChange} />
      
      {/* Featured Promos Section - Moved to top */}
      <div className="px-4">
        <div className="container mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-2">Hot Promos</h2>
              <p className="text-muted-foreground">Save money on your next night out</p>
            </div>
            <Button
              onClick={() => onSectionChange("promos")}
              variant="outline"
              className="group"
            >
              See More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promos.slice(0, 3).map((promo) => (
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
                onClaim={onClaimPromo} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Events Section - Moved to bottom */}
      <div className="px-4">
        <div className="container mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-2">Upcoming Events</h2>
              <p className="text-muted-foreground">Don't miss these amazing parties</p>
            </div>
            <Button
              onClick={() => onSectionChange("events")}
              variant="outline"
              className="group"
            >
              See More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 3).map((event) => (
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
                onJoin={onJoinEvent} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
