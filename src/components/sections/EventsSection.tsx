
import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { EventForm } from "@/components/EventForm";
import { EventFilters } from "@/components/EventFilters";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { LoginDialog } from "@/components/LoginDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Lock, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface EventsSectionProps {
  events: Tables<'events'>[];
  showCreateEvent: boolean;
  sortBy: string;
  onToggleCreateEvent: () => void;
  onJoinEvent: (eventId: string) => void;
  onSortChange: (sort: string) => void;
  loading: boolean;
}

export const EventsSection = ({
  events,
  showCreateEvent,
  sortBy,
  onToggleCreateEvent,
  onJoinEvent,
  onSortChange,
  loading
}: EventsSectionProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    getUser();
  }, []);

  const handleCreateEventClick = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    onToggleCreateEvent();
  };

  const filterEvents = (events: Tables<'events'>[]) => {
    return events.filter(event => {
      // Search filter
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !event.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Date filter
      if (selectedDate) {
        const eventDate = new Date(event.date);
        if (eventDate.toDateString() !== selectedDate.toDateString()) {
          return false;
        }
      }
      
      // Tag filter (placeholder - would need to implement tag system)
      if (selectedTags.length > 0) {
        // For now, just show all events if tags are selected
        // TODO: Implement actual tag filtering when event tags are stored
      }
      
      return true;
    });
  };

  const filteredEvents = filterEvents(events);

  const handleResetFilters = () => {
    setSelectedDate(undefined);
    setSelectedTags([]);
    setSearchTerm("");
  };
  return (
    <div className="pt-20 px-4">
      <div className="container mx-auto space-y-8">
        <div>
          <h2 className="text-4xl font-bold gradient-text mb-2">Jakarta Events</h2>
          <p className="text-muted-foreground mb-4">Discover the hottest parties and events in the city!</p>
          {!authLoading && (
            <Button
              onClick={handleCreateEventClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {user ? (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Create Event
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Login to Create Event
                </>
              )}
            </Button>
          )}
        </div>

        {showCreateEvent && (
          <div className="mb-8">
            <EventForm />
          </div>
        )}

        <div className="space-y-4 mb-8">
          <EventFilters
            onDateFilter={(date) => setSelectedDate(date)}
            onTagFilter={(tags) => setSelectedTags(tags)}
            onSearchFilter={(search) => setSearchTerm(search)}
            onResetFilters={() => {
              setSelectedDate(undefined);
              setSelectedTags([]);
              setSearchTerm('');
            }}
            selectedDate={selectedDate}
            selectedTags={selectedTags}
            searchTerm={searchTerm}
          />
          
          <div className="flex justify-end">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date: Nearest First</SelectItem>
                  <SelectItem value="date-desc">Date: Latest First</SelectItem>
                  <SelectItem value="newest">Newest Posted</SelectItem>
                  <SelectItem value="oldest">Oldest Posted</SelectItem>
                  <SelectItem value="title-az">Title: A-Z</SelectItem>
                  <SelectItem value="title-za">Title: Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <SpinningPaws size="lg" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {events.length === 0 
                  ? "No events are currently available."
                  : "Try adjusting your filters to see more events."
                }
              </p>
              {(selectedDate || selectedTags.length > 0 || searchTerm) && (
                <Button onClick={handleResetFilters} variant="outline">
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={{
                  ...event,
                  price: 'Free',
                  venue: event.venue_name,
                  image: event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
                  attendees: 0, // Use actual attendee count from database
                  rating: 4.5 + Math.random() * 0.5,
                  tags: ['Party', 'Music', 'Dance'],
                  organizer: event.organizer_name
                }}
                onJoin={onJoinEvent} 
              />
            ))
          )}
        </div>
        
        <LoginDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog}
          onSuccess={() => {
            setShowLoginDialog(false);
            onToggleCreateEvent();
          }}
        />
      </div>
    </div>
  );
};
