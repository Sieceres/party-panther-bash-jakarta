import { EventWithSlug } from "@/types/extended-types";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { EventForm } from "@/components/EventForm";
import { EventFilters } from "@/components/EventFilters";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { LoginDialog } from "@/components/LoginDialog";
import { ContinuousStarfield } from "@/components/ContinuousStarfield";
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
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const EventsSection = ({
  events,
  showCreateEvent,
  sortBy,
  onToggleCreateEvent,
  onJoinEvent,
  onSortChange,
  loading,
  userAdminStatus,
  onLoadMore,
  hasMore = false,
}: EventsSectionProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [eventTagAssignments, setEventTagAssignments] = useState<Record<string, string[]>>({});
  // States for past events section
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [pastEventsSearchTerm, setPastEventsSearchTerm] = useState("");
  const [pastEventsSelectedDate, setPastEventsSelectedDate] = useState<Date | undefined>();
  const [pastEventsSelectedTagIds, setPastEventsSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    const getUser = async () => {
      setAuthLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    getUser();

    const fetchEventTagAssignments = async () => {
      const { data } = await supabase
        .from("event_tag_assignments")
        .select("event_id, tag_id");
      
      if (data) {
        const assignments: Record<string, string[]> = {};
        data.forEach(({ event_id, tag_id }) => {
          if (!assignments[event_id]) {
            assignments[event_id] = [];
          }
          assignments[event_id].push(tag_id);
        });
        setEventTagAssignments(assignments);
      }
    };
    fetchEventTagAssignments();
  }, []);

  const handleCreateEventClick = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    onToggleCreateEvent();
  };

  const filterUpcomingEvents = (events: EventWithSlug[]) => {
    const now = new Date();
    return events.filter((event) => {
      const eventDateTime = new Date(`${event.date}T${event.time}`);

      if (eventDateTime < now) return false;
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) && !event.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedDate) {
        const eventDate = new Date(event.date + "T00:00:00");
        if (eventDate.toDateString() !== selectedDate.toDateString()) return false;
      }
      // Tag filter: event must have ALL selected tags
      if (selectedTagIds.length > 0) {
        const eventTags = eventTagAssignments[event.id] || [];
        const hasAllTags = selectedTagIds.every(tagId => eventTags.includes(tagId));
        if (!hasAllTags) return false;
      }
      return true;
    });
  };

  // Filter for past events only (past events section)
  const filterPastEvents = (events: EventWithSlug[]) => {
    const now = new Date();
    return events.filter((event) => {
      const eventDateTime = new Date(`${event.date}T${event.time}`);

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
        const eventDate = new Date(event.date + "T00:00:00");
        if (eventDate.toDateString() !== pastEventsSelectedDate.toDateString()) {
          return false;
        }
      }

      // Tag filter for past events
      if (pastEventsSelectedTagIds.length > 0) {
        const eventTags = eventTagAssignments[event.id] || [];
        const hasAllTags = pastEventsSelectedTagIds.every(tagId => eventTags.includes(tagId));
        if (!hasAllTags) return false;
      }

      return true;
    });
  };

  const upcomingEvents = filterUpcomingEvents(events);
  const pastEvents = filterPastEvents(events);

  const handleResetFilters = () => {
    setSelectedDate(undefined);
    setSearchTerm("");
    setSelectedTagIds([]);
  };

  const handleResetPastFilters = () => {
    setPastEventsSelectedDate(undefined);
    setPastEventsSearchTerm("");
    setPastEventsSelectedTagIds([]);
  };

  return (
    <div className="relative">
      <ContinuousStarfield />
      <div className="pt-20 px-4 sm:px-6 md:px-8 relative z-10">
        <div className="container mx-auto space-y-6 sm:space-y-8">
        {/* Main Events Section - Upcoming Events Only */}
        <div>
          <div className="mb-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent mb-2">
              Events
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Discover the hottest parties and events in the city!
            </p>
          </div>

          {/* Always show "Create Event" as default while auth is loading */}
          {authLoading ? (
            <Button
              onClick={handleCreateEventClick}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]"
            >
              <Star className="w-5 h-5 mr-2" />
              Create Event
            </Button>
          ) : (
            <Button
              onClick={handleCreateEventClick}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]"
            >
              {user ? (
                <>
                  <Star className="w-5 h-5 mr-2" />
                  Create Event
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
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
            onTagFilter={setSelectedTagIds}
            onResetFilters={handleResetFilters}
            selectedDate={selectedDate}
            searchTerm={searchTerm}
            selectedTagIds={selectedTagIds}
            sortBy={sortBy}
            onSortChange={onSortChange}
          />
        </div>

        {/* Upcoming Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <SpinningPaws size="lg" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="col-span-full text-center py-16 sm:py-20 px-4">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {events.length === 0 ? (
                    "No events yet — create one and start the party!"
                  ) : (selectedDate || searchTerm || selectedTagIds.length > 0) ? (
                    "No events match your filters"
                  ) : (
                    "No events are currently listed"
                  )}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {events.length === 0 ? (
                    "Be the first to create an amazing event and get the party started! 🎊"
                  ) : (selectedDate || searchTerm || selectedTagIds.length > 0) ? (
                    "Try adjusting your search or filters to discover more events."
                  ) : (
                    "Maybe you can go ahead and create one?"
                  )}
                </p>
                {(selectedDate || searchTerm || selectedTagIds.length > 0) && (
                  <Button onClick={handleResetFilters} variant="default" size="lg" className="mt-4">
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
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
            ))
          )}
        </div>

        {/* Load More Button for Upcoming Events */}
        {!loading && hasMore && upcomingEvents.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button onClick={onLoadMore} size="lg" variant="outline">
              Load More Events
            </Button>
          </div>
        )}

        {/* Toggle Past Events Button */}
        {pastEvents.length > 0 && (
          <div className="flex justify-center mt-12">
            <Button
              onClick={() => setShowPastEvents(!showPastEvents)}
              size="lg"
              variant="outline"
              className="min-h-[44px]"
            >
              {showPastEvents ? "Hide Past Events" : "Show Past Events"}
            </Button>
          </div>
        )}

        {/* Past Events Section */}
        {showPastEvents && pastEvents.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent mb-2">
                Past Events
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">Browse events that have already taken place</p>
            </div>

            <div className="space-y-4 mb-8">
              <EventFilters
                onDateFilter={setPastEventsSelectedDate}
                onSearchFilter={setPastEventsSearchTerm}
                onTagFilter={setPastEventsSelectedTagIds}
                onResetFilters={handleResetPastFilters}
                selectedDate={pastEventsSelectedDate}
                searchTerm={pastEventsSearchTerm}
                selectedTagIds={pastEventsSelectedTagIds}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.length === 0 ? (
                <div className="col-span-full text-center py-16 sm:py-20 px-4">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">No past events found</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Try adjusting your filters to discover past events.
                    </p>
                    {(pastEventsSelectedDate || pastEventsSearchTerm || pastEventsSelectedTagIds.length > 0) && (
                      <Button onClick={handleResetPastFilters} variant="default" size="lg" className="mt-4">
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
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
    </div>
  );
};
