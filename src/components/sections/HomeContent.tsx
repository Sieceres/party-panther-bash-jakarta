import { EventWithSlug, PromoWithSlug } from "@/types/extended-types";
import { Button } from "@/components/ui/button";
import { EventsSection } from "./EventsSection";
import { PromosSection } from "./PromosSection";

import { Hero } from "../Hero";
import { SpinningPaws } from "../ui/spinning-paws";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "../../integrations/supabase/types";
import { EventCard } from "../EventCard";
import { PromoCard } from "../PromoCard";
import { EventCardSkeleton, PromoCardSkeleton } from "../ui/skeleton-card";
import { ArrowRight, Zap, TrendingUp, Calendar } from "lucide-react";
import sectionBackground from "@/assets/section-background.jpg";

interface HomeContentProps {
  loading: boolean;
  events: EventWithSlug[];
  promos: PromoWithSlug[];
  onSectionChange: (section: string) => void;
  onJoinEvent: (eventId: string) => void;
  userAdminStatus?: { is_admin: boolean; is_super_admin: boolean } | null;
  onFavoriteToggle?: (promoId: string, isFavorite: boolean) => void;
}

export const HomeContent = ({
  loading,
  events,
  promos,
  onSectionChange,
  onJoinEvent,
  userAdminStatus,
  onFavoriteToggle,
}: HomeContentProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Hero onSectionChange={onSectionChange} />

      {/* Featured Promos Section */}
      <section className="relative pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-12 sm:pb-16 md:pb-20 lg:pb-24 overflow-hidden">
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

        <div className="relative z-10 px-4 sm:px-6 md:px-8">
          <div className="container mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  <Zap
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8"
                    style={{ color: "#00CFFF", animation: "neon-pulse 2s ease-in-out infinite" }}
                  />
                  Hot Promos
                </h2>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg">Go big without going broke!</p>
              </div>
              <Button
                onClick={() => onSectionChange("promos")}
                variant="outline"
                size="default"
                className="glass-control hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 text-sm min-h-[44px]"
              >
                See More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {loading ? (
                // Show skeleton cards while loading
                [...Array(3)].map((_, index) => (
                  <div
                    key={`promo-skeleton-${index}`}
                    className="animate-stagger-in opacity-0"
                    style={{ animationDelay: `${0.08 * index}s` }}
                  >
                    <PromoCardSkeleton />
                  </div>
                ))
              ) : promos.length === 0 ? (
                <div className="col-span-full text-center py-12 px-4">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="text-5xl mb-3">🍹</div>
                    <p className="text-base sm:text-lg text-muted-foreground">
                      No promos yet — be the first to share an amazing deal! 🎉
                    </p>
                  </div>
                </div>
              ) : (
                promos.slice(0, 3).map((promo, index) => (
                  <div
                    key={promo.id}
                    className="animate-stagger-in opacity-0"
                    style={{ animationDelay: `${0.08 * index}s` }}
                  >
                    <PromoCard
                      promo={{
                        ...promo,
                        discount: promo.discount_text,
                        venue: promo.venue_name,
                        validUntil: promo.valid_until,
                        image:
                          promo.image_url ||
                          "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop",
                        day: Array.isArray(promo.day_of_week) ? promo.day_of_week.join(", ") : promo.day_of_week || "",
                        area: promo.area?.toLowerCase(),
                        drinkType: Array.isArray(promo.drink_type)
                          ? promo.drink_type.join(", ")
                          : promo.drink_type || "",
                      }}
                      userAdminStatus={userAdminStatus}
                      onFavoriteToggle={onFavoriteToggle}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="relative pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-12 sm:pb-16 md:pb-20 lg:pb-24 overflow-hidden">
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

        <div className="relative z-10 px-4 sm:px-6 md:px-8">
          <div className="container mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  <Calendar
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8"
                    style={{ color: "#00CFFF", animation: "neon-pulse 2s ease-in-out infinite" }}
                  />
                  Upcoming Events
                </h2>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg">Don't miss these amazing parties!</p>
              </div>
              <Button
                onClick={() => onSectionChange("events")}
                variant="outline"
                size="default"
                className="glass-control hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 text-sm min-h-[44px]"
              >
                See More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {loading ? (
                // Show skeleton cards while loading
                [...Array(3)].map((_, index) => (
                  <div
                    key={`event-skeleton-${index}`}
                    className="animate-stagger-in opacity-0"
                    style={{ animationDelay: `${0.08 * index}s` }}
                  >
                    <EventCardSkeleton />
                  </div>
                ))
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-12 px-4">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-base sm:text-lg text-muted-foreground">
                      No events yet — create one and start the party! 🎊
                    </p>
                  </div>
                </div>
              ) : (
                events.slice(0, 3).map((event, index) => (
                  <div
                    key={event.id}
                    className="animate-stagger-in opacity-0"
                    style={{ animationDelay: `${0.08 * index}s` }}
                  >
                    <EventCard
                      event={{
                        ...event,
                        venue: event.venue_name,
                        image:
                          event.image_url ||
                          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
                        attendees: event.attendees || 0,
                        rating: 4.5 + Math.random() * 0.5,
                        organizer: event.organizer_name,
                      }}
                      onJoin={onJoinEvent}
                      userAdminStatus={userAdminStatus}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
