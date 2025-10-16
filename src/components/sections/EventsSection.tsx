import { EventWithSlug } from "@/types/extended-types";
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
  events: EventWithSlug[];
  showCreateEvent: boolean;
  sortBy: string;
  onToggleCreateEvent: () => void;
  onJoinEvent: (eventId: string) => void;
  onSortChange: (sort: string) => void;
  loading: boolean;
  userAdminStatus?: { is_admin: boolean; is_super_admin: boolean } | null;
}

export const EventsSection = ({
  events,
  showCreateEvent,
  sortBy,
  onToggleCreateEvent,
  onJoinEvent,
  onSortChange,
  loading,
  userAdminStatus
}: EventsSectionProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  // States for past events section
  const [pastEventsSearchTerm, setPastEventsSearchTerm] = useState("");
  const [pastEventsSelectedDate, setPastEventsSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    const getUser = async () => {
      setAuthLoading(true);
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

  // Filter for upcoming events only (main section)
  const filterUpcomingEvents = (events: EventWithSlug[]) => {
    const now = new Date();
    return events.filter(event => {
      const eventDateTime = new Date(`${event.date} ${event.time}`);
      
      // Only show future events
      if (eventDateTime < now) {
        return false;
      }
      
      // Search filter
      if (
        searchTerm &&
        !event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      
      // Date filter
      if (selectedDate) {
        const eventDate = new Date(event.date);
        if (eventDate.toDateString() !== selectedDate.toDateString()) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Filter for past events only (past events section)
  const filterPastEvents = (events: EventWithSlug[]) => {
    const now = new Date();
    return events.filter(event => {
      const eventDateTime = new Date(`${event.date} ${event.time}`);
      
      // Only show past events
      if (eventDateTime >= now) {
        return false;
      }
      
      // Search filter for past events
      if (
        pastEventsSearchTerm &&
        !event.title.toLowerCase().includes(pastEventsSearchTerm.toLowerCase()) &&
        !event.description?.toLowerCase().includes(pastEventsSearchTerm.toLowerCase())
      ) {
        return false;
      }
      
      // Date filter for past events
      if (pastEventsSelectedDate) {
        const eventDate = new Date(event.date);
        if (eventDate.toDateString() !== pastEventsSelectedDate.toDateString()) {
          return false;
        }
      }
      
      return true;
    });
  };

  const upcomingEvents = filterUpcomingEvents(events);
  const pastEvents = filterPastEvents(events);

  const handleResetFilters = () => {
    setSelectedDate(undefined);
    setSearchTerm("");
  };

  const handleResetPastFilters = () => {
    setPastEventsSelectedDate(undefined);
    setPastEventsSearchTerm("");
  };

  return (
    <div className="pt-20 px-4">
      <div className="container mx-auto space-y-8">
        {/* Main Events Section - Upcoming Events Only */}
        <div>
          <div className="mb-4">
            <h2 className="text-4xl font-bold gradient-text mb-2 overflow-hidden text-ellipsis">Events</h2>
            <p className="text-muted-foreground">
              Discover the hottest parties and events in the city!
            </p>
          </div>
          
          {/* Always show "Create Event" as default while auth is loading */}
          {authLoading ? (
            <Button
              onClick={handleCreateEventClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Star className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          ) : (
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
            onDateFilter={setSelectedDate}
            onSearchFilter={setSearchTerm}
            onResetFilters={handleResetFilters}
            selectedDate={selectedDate}
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

        {/* Upcoming Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <SpinningPaws size="lg" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <h3 className="text-xl font-semibold mb-2">No upcoming events found</h3>
              <p className="text-muted-foreground mb-4">
                {events.length === 0
                  ? "No events available right now. Be the first to create one!"
                  : "Try adjusting your filters to see more events."
                }
              </p>
              {(selectedDate || searchTerm) && (
                <Button onClick={handleResetFilters} variant="outline">
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  venue: event.venue_name,
                  image: event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
                  attendees: event.attendees || 0,
                  rating: 4.5 + Math.random() * 0.5,
                  organizer: event.organizer_name
                }}
                onJoin={onJoinEvent}
                userAdminStatus={userAdminStatus}
              />
            ))
          )}
        </div>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <div className="mb-4">
              <h2 className="text-3xl font-bold gradient-text mb-2">Past Events</h2>
              <p className="text-muted-foreground">
                Browse events that have already taken place
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <EventFilters
                onDateFilter={setPastEventsSelectedDate}
                onSearchFilter={setPastEventsSearchTerm}
                onResetFilters={handleResetPastFilters}
                selectedDate={pastEventsSelectedDate}
                searchTerm={pastEventsSearchTerm}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <h3 className="text-xl font-semibold mb-2">No past events found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters to see more past events.
                  </p>
                  {(pastEventsSelectedDate || pastEventsSearchTerm) && (
                    <Button onClick={handleResetPastFilters} variant="outline">
                      Reset Filters
                    </Button>
                  )}
                </div>
              ) : (
                pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{
                      ...event,
                      venue: event.venue_name,
                      image: event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
                      attendees: event.attendees || 0,
                      rating: 4.5 + Math.random() * 0.5,
                      organizer: event.organizer_name
                    }}
                    onJoin={onJoinEvent}
                    userAdminStatus={userAdminStatus}
                  />
                ))
              )}
            </div>
          </div>
        )}

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