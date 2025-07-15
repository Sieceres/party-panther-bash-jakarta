import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Star, Share2 } from "lucide-react";
import { GoogleMap } from "./GoogleMap";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address: string;
  venue_latitude: number;
  venue_longitude: number;
  image_url: string;
  organizer_name: string;
  organizer_whatsapp: string;
  created_at: string;
  is_recurrent: boolean | null; // Added is_recurrent
}

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false); // New state for joined status

  const memoizedCenter = useMemo(() => {
    if (event?.venue_latitude && event?.venue_longitude) {
      return { lat: Number(event.venue_latitude), lng: Number(event.venue_longitude) };
    }
    return undefined;
  }, [event]);

  const markers = useMemo(() => (event?.venue_latitude && event?.venue_longitude ? [{
    lat: Number(event.venue_latitude),
    lng: Number(event.venue_longitude),
    title: event.venue_name
  }] : []), [event]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);

        // Check if the current user has already joined this event
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: attendeeData, error: attendeeError } = await supabase
            .from('event_attendees')
            .select('*')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (attendeeData && !attendeeError) {
            setHasJoined(true);
          }
        }

      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, toast]);

  const handleJoinEvent = async () => {
    if (!event) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join this event.",
        variant: "destructive"
      });
      return;
    }

    if (hasJoined) {
      handleUnjoinEvent(user.id);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: event.id,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already joined!",
            description: "You're already registered for this event.",
            variant: "destructive"
          });
          setHasJoined(true);
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Successfully joined event! 🎉",
        description: `You're now registered for "${event.title}". See you there!`,
      });
      setHasJoined(true);
    } catch (error) {
      console.error('Error joining event:', error);
      toast({
        title: "Error",
        description: "Failed to join event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnjoinEvent = async (userId: string) => {
    if (!event) return;

    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Successfully unjoined event!",
        description: `You've unjoined "${event.title}".`,
      });
      setHasJoined(false);
    } catch (error) {
      console.error('Error unjoining event:', error);
      toast({
        title: "Error",
        description: "Failed to unjoin event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleContactOrganizer = () => {
    if (event?.organizer_whatsapp) {
      const message = `Hi! I'm interested in your event: ${event.title}`;
      const whatsappUrl = `https://wa.me/${event.organizer_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center">Event not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/?section=events')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl gradient-text">{event.title}</CardTitle>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  {event.is_recurrent && (
                    <Badge variant="secondary" className="text-xs">
                      Recurrent Event
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Venue</h4>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{event.venue_name}</p>
                        <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Organizer</h4>
                    <p>{event.organizer_name}</p>
                    {event.organizer_whatsapp && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleContactOrganizer}
                        className="text-xs"
                      >
                        Contact via WhatsApp
                      </Button>
                    )}
                  </div>
                </div>

                {markers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Location</h4>
                    <GoogleMap
                      center={memoizedCenter}
                      markers={markers}
                      height="300px"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entry</span>
                  <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                    Free
                  </Badge>
                </div>

                <Button
                  onClick={handleJoinEvent}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {hasJoined ? "Joined" : "Join Event"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link Copied!",
                      description: "Event link copied to clipboard.",
                    });
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};