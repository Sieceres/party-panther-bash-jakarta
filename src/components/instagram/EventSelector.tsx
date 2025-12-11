import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { PostContent } from "@/types/instagram-post";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue_name: string | null;
  venue_address: string | null;
  description: string | null;
  image_url: string | null;
}

interface EventSelectorProps {
  onAutoFill: (updates: Partial<PostContent>) => void;
}

export const EventSelector = ({ onAutoFill }: EventSelectorProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, time, venue_name, venue_address, description, image_url")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(20);

      if (!error && data) {
        setEvents(data);
      }
    };

    fetchEvents();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleAutoFill = () => {
    if (!selectedEvent) return;
    setLoading(true);

    try {
      const dateStr = format(new Date(selectedEvent.date), "EEEE, MMMM d, yyyy");
      const timeStr = selectedEvent.time ? format(new Date(`2000-01-01T${selectedEvent.time}`), "h:mm a") : "";

      const updates: Partial<PostContent> = {
        headline: selectedEvent.title,
        sections: [
          {
            subheadline: `${dateStr}${timeStr ? ` • ${timeStr}` : ""}`,
            body: selectedEvent.venue_name || selectedEvent.description?.slice(0, 100) || "",
          },
        ],
      };

      // If event has an image, set it as background
      if (selectedEvent.image_url) {
        updates.background = {
          style: "custom-image",
          image: selectedEvent.image_url,
          opacity: 40,
        };
      }

      onAutoFill(updates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Auto-fill from Event</Label>
      </div>

      <div className="space-y-3">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event..." />
          </SelectTrigger>
          <SelectContent>
            {events.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No upcoming events found
              </div>
            ) : (
              events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedEvent && (
          <div className="p-3 bg-background rounded border text-sm space-y-1">
            <p className="font-medium">{selectedEvent.title}</p>
            <p className="text-muted-foreground text-xs">
              {format(new Date(selectedEvent.date), "EEEE, MMMM d, yyyy")}
            </p>
            {selectedEvent.venue_name && (
              <p className="text-muted-foreground text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedEvent.venue_name}
              </p>
            )}
          </div>
        )}

        <Button
          onClick={handleAutoFill}
          disabled={!selectedEventId || loading}
          className="w-full"
          variant="secondary"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {loading ? "Filling..." : "Auto-fill Post"}
        </Button>
      </div>
    </div>
  );
};
