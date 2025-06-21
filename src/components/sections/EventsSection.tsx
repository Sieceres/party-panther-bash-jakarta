
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { CreateEventForm } from "@/components/CreateEventForm";
import { Calendar } from "lucide-react";

interface EventsSectionProps {
  events: any[];
  showCreateEvent: boolean;
  onToggleCreateEvent: () => void;
  onJoinEvent: (eventId: string) => void;
}

export const EventsSection = ({ 
  events, 
  showCreateEvent, 
  onToggleCreateEvent, 
  onJoinEvent 
}: EventsSectionProps) => {
  return (
    <div className="pt-20 px-4">
      <div className="container mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold gradient-text mb-2">Jakarta Events</h2>
            <p className="text-muted-foreground">Discover the hottest parties and events in the city</p>
          </div>
          <Button
            onClick={onToggleCreateEvent}
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
              onJoin={onJoinEvent} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
