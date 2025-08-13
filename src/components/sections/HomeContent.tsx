
import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { PromoCard } from "@/components/PromoCard";
import { ArrowRight, Zap, TrendingUp } from "lucide-react";
import sectionBackground from "@/assets/section-background.jpg";

interface HomeContentProps {
  loading: boolean;
  events: Tables<'events'>[];
  promos: Tables<'promos'>[];
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
          <div className="text-center flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full party-gradient flex items-center justify-center animate-spin">
              <span className="text-4xl">🐾</span>
            </div>
            <p className="text-muted-foreground">Loading amazing events and promos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <Hero onSectionChange={onSectionChange} />
      
      {/* Featured Promos Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${sectionBackground})` }}
        >
          <div className="absolute inset-0 section-bg"></div>
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="floating-element absolute top-10 right-20 w-16 h-16 rounded-full bg-neon-cyan blur-md"></div>
          <div className="floating-element absolute bottom-20 left-10 w-20 h-20 rounded-full bg-neon-indigo blur-md"></div>
        </div>

        <div className="relative z-10 px-4 py-16">
          <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between animate-slide-up">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-6 h-6 text-neon-cyan animate-pulse" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-neon-cyan">Hot Deals</span>
                </div>
                <h2 className="text-4xl font-bold gradient-text mb-2">Hot Promos</h2>
                <p className="text-muted-foreground text-lg">Save money on your next night out!</p>
              </div>
              <Button
                onClick={() => onSectionChange("promos")}
                variant="outline"
                className="group hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
              >
                See More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {promos.slice(0, 3).map((promo, index) => (
                <div 
                  key={promo.id} 
                  className="card-hover"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <PromoCard 
                    promo={{
                      ...promo,
                      discount: promo.discount_text,
                      venue: promo.venue_name,
                      validUntil: promo.valid_until,
                      image: promo.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
                      originalPrice: promo.original_price_amount ? `IDR ${promo.original_price_amount.toLocaleString()}` : 'N/A',
                      discountedPrice: promo.discounted_price_amount ? `IDR ${promo.discounted_price_amount.toLocaleString()}` : 'FREE',
                      day: promo.day_of_week?.toLowerCase(),
                      area: promo.area?.toLowerCase(),
                      drinkType: promo.drink_type?.toLowerCase()
                    }} 
                    onClaim={onClaimPromo} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full party-gradient blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-green blur-3xl"></div>
        </div>

        {/* Geometric decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="floating-element absolute top-20 left-1/3 w-24 h-24 border-2 border-neon-blue rounded-lg rotate-45"></div>
          <div className="floating-element absolute bottom-20 right-1/3 w-32 h-32 border-2 border-neon-cyan rounded-full"></div>
        </div>

        <div className="relative z-10 px-4 py-16">
          <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between animate-slide-up">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-6 h-6 text-neon-indigo animate-pulse" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-neon-indigo">Popular</span>
                </div>
                <h2 className="text-4xl font-bold gradient-text mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground text-lg">Don't miss these amazing parties</p>
              </div>
              <Button
                onClick={() => onSectionChange("events")}
                variant="outline"
                className="group hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
              >
                See More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {events.slice(0, 3).map((event, index) => (
                <div 
                  key={event.id} 
                  className="card-hover"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <EventCard 
                    event={{
                      ...event,
                      price: 'Free',
                      venue: event.venue_name,
                      image: event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
                      attendees: 0,
                      rating: 4.5 + Math.random() * 0.5,
                      tags: ['Party', 'Music', 'Dance'],
                      organizer: event.organizer_name
                    }} 
                    onJoin={onJoinEvent} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 party-gradient opacity-10"></div>
        <div className="absolute inset-0">
          <div className="floating-element absolute top-10 left-10 w-12 h-12 bg-neon-blue rounded-full blur-sm"></div>
          <div className="floating-element absolute bottom-10 right-10 w-16 h-16 bg-neon-cyan rounded-full blur-sm"></div>
          <div className="floating-element absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-neon-indigo rounded-full blur-md opacity-50"></div>
        </div>
        
        <div className="relative z-10 text-center space-y-6 px-4">
          <h3 className="text-3xl font-bold gradient-text animate-slide-up">Ready to Party?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Join thousands of party-goers discovering the best events and exclusive promos in Jakarta
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              onClick={() => onSectionChange('events')}
              size="lg"
              className="bg-gradient-to-r from-neon-blue to-neon-cyan text-white font-semibold px-8 py-3 rounded-full hover:scale-105 transition-all"
            >
              Explore All Events
            </Button>
            <Button 
              onClick={() => onSectionChange('promos')}
              size="lg"
              variant="outline"
              className="font-semibold px-8 py-3 rounded-full hover:scale-105 transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Browse Promos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
