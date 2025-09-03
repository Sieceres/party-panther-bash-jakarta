import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Star, Share2, MessageSquare, Send } from "lucide-react";
import { GoogleMap } from "./GoogleMap";
import { EventForm } from "./EventForm";
import { ReportDialog } from "./ReportDialog";
import { Header } from "./Header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  const [hasJoined, setHasJoined] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

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
          .rpc('get_events_safe')
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

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('event_comments')
          .select(`
            *,
            profiles (
              display_name,
              avatar_url
            )
          `)
          .eq('event_id', id)
          .order('created_at', { ascending: true });

        if (commentsData && !commentsError) {
          setComments(commentsData);
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !event) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment.",
        variant: "destructive"
      });
      return;
    }

    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: event.id,
          user_id: user.id,
          comment: newComment.trim()
        })
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment("");
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCommentsLoading(false);
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
    <>
      <Header activeSection="events" onSectionChange={() => navigate('/?section=events')} />
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/?section=events')}
            className="mb-6 hover:bg-gradient-to-r hover:from-neon-blue hover:to-neon-cyan hover:text-white transition-all"
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

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Discussion ({comments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment Form */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Share your thoughts about this event..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || commentsLoading}
                    className="bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:opacity-90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {commentsLoading ? "Posting..." : "Post Comment"}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  ) : (
                     comments.map((comment) => (
                       <div key={comment.id} className="flex space-x-3 p-3 bg-muted/50 rounded-lg">
                         <Avatar className="w-8 h-8">
                           <AvatarImage src={comment.profiles?.avatar_url} />
                           <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-cyan text-white font-semibold text-sm">
                             {comment.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                           </AvatarFallback>
                         </Avatar>
                         <div className="flex-1 space-y-1">
                           <div className="flex items-center space-x-2">
                             <p className="font-semibold text-sm" style={{ color: '#2596be' }}>
                               {comment.profiles?.display_name || 'Anonymous'}
                             </p>
                             <p className="text-xs text-muted-foreground">
                               {new Date(comment.created_at).toLocaleString()}
                             </p>
                           </div>
                           <p className="text-sm leading-relaxed font-light">{comment.comment}</p>
                         </div>
                       </div>
                     ))
                  )}
                </div>
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
                
                <ReportDialog
                  type="event"
                  targetId={event.id}
                  targetTitle={event.title}
                />
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};