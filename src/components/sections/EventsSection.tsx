
import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { EventForm } from "@/components/EventForm";
import { Calendar, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface EventsSectionProps {
  events: Tables<'events'>[];
  showCreateEvent: boolean;
  onToggleCreateEvent: () => void;
  onJoinEvent: (eventId: string) => void;
  loading: boolean; // Added loading prop
}

export const EventsSection = ({
  events,
  showCreateEvent,
  onToggleCreateEvent,
  onJoinEvent,
  loading
}: EventsSectionProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleCreateEventClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an event.",
        variant: "destructive"
      });
      return;
    }
    onToggleCreateEvent();
  };
  return (
    <div className="pt-20 px-4">
      <div className="container mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold gradient-text mb-2">Jakarta Events</h2>
            <p className="text-muted-foreground">Discover the hottest parties and events in the city, Alvaro!</p>
          </div>
          <Button
            onClick={handleCreateEventClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {user ? (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Login to Create Event
              </>
            )}
          </Button>
        </div>

        {showCreateEvent && (
          <div className="mb-8">
            <EventForm />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[350px] w-full rounded-xl" />
            ))
          ) : (
            events.map((event) => (
              <EventCard 
                key={event.id} 
                event={{
                  ...event,
                  price: 'Free',
                  venue: event.venue_name,
                  image: event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
                  attendees: Math.floor(Math.random() * 100) + 20,
                  rating: 4.5 + Math.random() * 0.5,
                  tags: ['Party', 'Music', 'Dance'],
                  organizer: event.organizer_name
                }}
                onJoin={onJoinEvent} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
