import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, ArrowLeft, User as UserIcon, Star, Share2, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { GoogleMap } from "./GoogleMap";
import { CommentActions } from "./CommentActions";
import { ReportDialog } from "./ReportDialog";
import { ReceiptUpload } from "./ReceiptUpload";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEventBySlugOrId, getEditEventUrl } from "@/lib/slug-utils";
import Linkify from "linkify-react";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import defaultAvatar from "@/assets/default-avatar.png";

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
  is_recurrent: boolean;
  organizer_name: string;
  organizer_whatsapp: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  slug?: string;
  attendee_count?: number;
  comment_count?: number;
}

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [leavingEvent, setLeavingEvent] = useState(false);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [lastCommentTime, setLastCommentTime] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAllAttendees, setShowAllAttendees] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const memoizedCenter = useMemo(() => {
    if (!event?.venue_latitude || !event?.venue_longitude) {
      return { lat: -6.2088, lng: 106.8456 }; // Jakarta default
    }
    return {
      lat: Number(event.venue_latitude),
      lng: Number(event.venue_longitude)
    };
  }, [event?.venue_latitude, event?.venue_longitude]);

  const markers = useMemo(() => {
    if (!event?.venue_latitude || !event?.venue_longitude) return [];
    return [{
      lat: Number(event.venue_latitude),
      lng: Number(event.venue_longitude),
      title: event.venue_name
    }];
  }, [event?.venue_latitude, event?.venue_longitude, event?.venue_name]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const { data: eventData, error: eventError } = await getEventBySlugOrId(id);
        if (eventError || !eventData) {
          throw new Error('Event not found');
        }
        
        setEvent(eventData);
        
        // Get current user and check admin status
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        setUser(user);
        
        if (user) {
          // Check if user is admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, is_super_admin')
            .eq('user_id', user.id)
            .single();
          
          setIsAdmin(profile?.is_admin || profile?.is_super_admin || false);
        }

        // Check if user has joined this event
        if (user) {
          const { data: attendeeData } = await supabase
            .from('event_attendees')
            .select('id')
            .eq('event_id', eventData.id)
            .eq('user_id', user.id)
            .single();
          
          setHasJoined(!!attendeeData);
        }

        // Use attendee count from RPC function (eventData has attendee_count)
        setTotalAttendees(eventData.attendee_count || 0);

        // Fetch comments for display - using separate queries to avoid foreign key issues
        const { data: commentsData, error: commentsError } = await supabase
          .from('event_comments')
          .select('id, comment, created_at, updated_at, user_id')
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false });

        if (commentsData && !commentsError) {
          // Fetch profiles for comment authors
          const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', userIds);

          // Join comments with profiles
          const commentsWithProfiles = commentsData.map(comment => ({
            ...comment,
            profiles: profilesData?.find(profile => profile.user_id === comment.user_id) || null
          }));
          setComments(commentsWithProfiles);
        }

        // Fetch attendees with profiles for display - using separate queries
          const { data: attendeesData, error: attendeesError } = await supabase
            .from('event_attendees')
            .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at')
            .eq('event_id', eventData.id)
            .order('joined_at', { ascending: false });

        if (attendeesData && !attendeesError) {
          // Fetch profiles for attendees
          const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, is_verified, is_admin, is_super_admin')
            .in('user_id', userIds);

          // Join attendees with profiles
          const attendeesWithProfiles = attendeesData.map(attendee => ({
            ...attendee,
            profiles: profilesData?.find(profile => profile.user_id === attendee.user_id) || null
          }));
          setAttendees(attendeesWithProfiles);
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

    fetchData();
  }, [id, toast]);

  const handleJoinEvent = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join events.",
        variant: "destructive"
      });
      return;
    }

    if (!event) return;

    setJoiningEvent(true);
    try {
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: event.id,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already joined",
            description: "You're already registered for this event.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      setHasJoined(true);
      setTotalAttendees(prev => prev + 1);
      toast({
        title: "Successfully joined event! 🎉",
        description: `You're now registered for "${event.title}". See you there!`,
      });

      // Refresh attendees list
        const { data: attendeesData } = await supabase
          .from('event_attendees')
          .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at')
          .eq('event_id', event.id)
          .order('joined_at', { ascending: false });

      if (attendeesData) {
        // Fetch profiles for attendees
        const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_verified, is_admin, is_super_admin')
          .in('user_id', userIds);

        // Join attendees with profiles
        const attendeesWithProfiles = attendeesData.map(attendee => ({
          ...attendee,
          profiles: profilesData?.find(profile => profile.user_id === attendee.user_id) || null
        }));
        setAttendees(attendeesWithProfiles);
      }
    } catch (error) {
      console.error('Error joining event:', error);
      toast({
        title: "Error",
        description: "Failed to join event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setJoiningEvent(false);
    }
  };

  const handleUnjoinEvent = async () => {
    if (!user || !event) return;

    setLeavingEvent(true);
    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHasJoined(false);
      setTotalAttendees(prev => Math.max(0, prev - 1));
      toast({
        title: "Left event",
        description: "You have left this event.",
      });

      // Refresh attendees list
        const { data: attendeesData } = await supabase
          .from('event_attendees')
          .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at')
          .eq('event_id', event.id)
          .order('joined_at', { ascending: false });

      if (attendeesData) {
        // Fetch profiles for attendees
        const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_verified, is_admin, is_super_admin')
          .in('user_id', userIds);

        // Join attendees with profiles
        const attendeesWithProfiles = attendeesData.map(attendee => ({
          ...attendee,
          profiles: profilesData?.find(profile => profile.user_id === attendee.user_id) || null
        }));
        setAttendees(attendeesWithProfiles);
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      toast({
        title: "Error",
        description: "Failed to leave event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLeavingEvent(false);
    }
  };

  const handleContactOrganizer = () => {
    if (event?.organizer_whatsapp) {
      const message = `Hi! I'm interested in attending "${event.title}" on ${format(new Date(event.date), 'MMMM do, yyyy')} at ${event.time}.`;
      const whatsappUrl = `https://wa.me/${event.organizer_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !event) return;

    // Basic validation
    if (newComment.trim().length < 3) {
      toast({
        title: "Comment too short",
        description: "Comments must be at least 3 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (newComment.trim().length > 500) {
      toast({
        title: "Comment too long",
        description: "Comments must be less than 500 characters.",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting - prevent comments within 30 seconds
    const now = Date.now();
    if (now - lastCommentTime < 30000) {
      const remainingTime = Math.ceil((30000 - (now - lastCommentTime)) / 1000);
      toast({
        title: "Please wait",
        description: `You can comment again in ${remainingTime} seconds.`,
        variant: "destructive"
      });
      return;
    }

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
        .select('id, comment, created_at, updated_at, user_id')
        .single();

      if (data && !error) {
        // Fetch profile for the new comment
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const commentWithProfile = {
          ...data,
          profiles: profileData || null
        };

        setComments([commentWithProfile, ...comments]);
        setNewComment("");
        setLastCommentTime(now);
        toast({
          title: "Comment added!",
          description: "Your comment has been posted.",
        });
      }

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment("");
      setLastCommentTime(now);
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

  const handleCommentDeleted = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment();
    }
  };

  const handleEdit = () => {
    if (!event) return;
    navigate(getEditEventUrl(event));
  };

  const handleDelete = async () => {
    if (!currentUser) {
      toast({
        title: "Unauthorized",
        description: "Please log in to delete events.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is owner or admin
    const isOwner = currentUser.id === event?.created_by;
    if (!isOwner && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You can only delete your own events or need admin privileges.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Use secure-delete function with proper authorization checks
      const { data, error } = await supabase.functions.invoke('secure-delete', {
        body: { event_id: event?.id }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete event');
      }

      toast({
        title: "Success",
        description: "Event deleted successfully!"
      });

      navigate('/?section=events');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",  
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = user && user.id === event?.created_by;
  const canDelete = isOwner || isAdmin;

  // Helper functions for pagination
  const displayedAttendees = showAllAttendees ? attendees : attendees.slice(0, 10);
  const displayedComments = showAllComments ? comments : comments.slice(0, 10);
  
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleTogglePayment = async (attendeeId: string, currentStatus: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only admins can mark payment status.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('event_attendees')
        .update({
          payment_status: !currentStatus,
          payment_date: !currentStatus ? new Date().toISOString() : null,
          payment_marked_by: !currentStatus ? currentUser?.id : null
        })
        .eq('id', attendeeId);

      if (error) throw error;

      // Update local state
      setAttendees(prev => prev.map(attendee => 
        attendee.id === attendeeId 
          ? { 
              ...attendee, 
              payment_status: !currentStatus,
              payment_date: !currentStatus ? new Date().toISOString() : null,
              payment_marked_by: !currentStatus ? currentUser?.id : null
            }
          : attendee
      ));

      toast({
        title: "Payment status updated",
        description: `Attendee marked as ${!currentStatus ? 'paid' : 'unpaid'}.`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAttendee = async (attendeeId: string, attendeeName: string) => {
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only admins can remove attendees.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('id', attendeeId);

      if (error) throw error;

      // Update local state
      setAttendees(prev => prev.filter(attendee => attendee.id !== attendeeId));
      setTotalAttendees(prev => prev - 1);

      toast({
        title: "Attendee removed",
        description: `${attendeeName} has been removed from the event.`,
      });
    } catch (error) {
      console.error('Error removing attendee:', error);
      toast({
        title: "Error",
        description: "Failed to remove attendee. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReceiptUploaded = (attendeeId: string, receiptUrl: string) => {
    // Update local state to show the uploaded receipt
    setAttendees(prev => prev.map(attendee => 
      attendee.id === attendeeId 
        ? { 
            ...attendee, 
            receipt_url: receiptUrl,
            receipt_uploaded_at: new Date().toISOString()
          }
        : attendee
    ));
  };

  const handleToggleCoOrganizer = async (attendeeId: string, currentStatus: boolean, attendeeName: string) => {
    if (!isOwner && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only event creators and admins can manage co-organizers.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('event_attendees')
        .update({
          is_co_organizer: !currentStatus
        })
        .eq('id', attendeeId);

      if (error) throw error;

      // Update local state
      setAttendees(prev => prev.map(attendee => 
        attendee.id === attendeeId 
          ? { 
              ...attendee, 
              is_co_organizer: !currentStatus
            }
          : attendee
      ));

      toast({
        title: currentStatus ? "Co-organizer removed" : "Co-organizer added",
        description: `${attendeeName} is ${currentStatus ? 'no longer' : 'now'} a co-organizer of this event.`,
      });
    } catch (error) {
      console.error('Error updating co-organizer status:', error);
      toast({
        title: "Error",
        description: "Failed to update co-organizer status. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header activeSection="events" onSectionChange={(section) => {
          if (section === 'home') navigate('/');
          else if (section === 'profile') navigate('/profile');
          else if (section === 'promos') navigate('/?section=promos');
          else if (section === 'events') navigate('/?section=events');
        }} />
        <div className="min-h-screen bg-background pt-20 px-4">
          <div className="container mx-auto">
            <div className="text-center space-y-4">
              <SpinningPaws size="lg" />
              <div className="text-center">Loading event details...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header activeSection="events" onSectionChange={(section) => {
          if (section === 'home') navigate('/');
          else if (section === 'profile') navigate('/profile');
          else if (section === 'promos') navigate('/?section=promos');
          else if (section === 'events') navigate('/?section=events');
        }} />
        <div className="min-h-screen bg-background pt-20 px-4">
          <div className="container mx-auto">
            <div className="text-center">Event not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeSection="events" onSectionChange={(section) => {
        if (section === 'home') navigate('/');
        else if (section === 'profile') navigate('/profile');
        else if (section === 'promos') navigate('/?section=promos');
        else if (section === 'events') navigate('/?section=events');
      }} />
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-6xl">
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
                    <span>{format(new Date(event.date), 'EEEE, MMMM do, yyyy')}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                    {event.is_recurrent && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary">Recurring</Badge>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    <Linkify options={{ target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline" }}>
                      {event.description}
                    </Linkify>
                  </div>
                  
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
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span>{event.organizer_name}</span>
                        {event.organizer_whatsapp && user && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleContactOrganizer}
                            className="ml-2"
                          >
                            Contact
                          </Button>
                        )}
                      </div>
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

              {/* Attendees Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5" />
                    <span>Attendees ({totalAttendees})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayedAttendees.map((attendee) => (
                      <div 
                        key={attendee.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div 
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => handleProfileClick(attendee.user_id)}
                        >
                          <Avatar className="w-10 h-10">
            <AvatarImage src={attendee.profiles?.avatar_url || defaultAvatar} />
            <AvatarFallback>
              {attendee.profiles?.display_name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {attendee.profiles?.display_name || 'Anonymous'}
                              </span>
                              {attendee.payment_status && (
                                <span className="text-lg">💰</span>
                              )}
                            </div>
                            {attendee.profiles?.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {attendee.profiles.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {attendee.profiles?.is_verified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                          {attendee.profiles?.is_admin && (
                            <Badge variant="destructive" className="text-xs">Admin</Badge>
                          )}
                          {attendee.profiles?.is_super_admin && (
                            <Badge variant="destructive" className="text-xs">Super Admin</Badge>
                          )}
                          {attendee.is_co_organizer && (
                            <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">Co-Organizer</Badge>
                          )}
                          
                          {/* Receipt Upload - show for the user themselves */}
                          {user && attendee.user_id === user.id && (
                            <ReceiptUpload
                              eventId={event.id}
                              userId={user.id}
                              currentReceiptUrl={attendee.receipt_url}
                              onReceiptUploaded={(receiptUrl) => handleReceiptUploaded(attendee.id, receiptUrl)}
                            />
                          )}
                          
                          {/* Receipt status for admins */}
                          {isAdmin && attendee.receipt_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(attendee.receipt_url, '_blank');
                              }}
                              className="border-blue-500 text-blue-500 hover:bg-blue-50"
                            >
                              View Receipt
                            </Button>
                          )}
                          
                          {(isOwner || isAdmin) && attendee.user_id !== user?.id && (
                            <Button
                              variant={attendee.is_co_organizer ? "outline" : "default"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCoOrganizer(attendee.id, attendee.is_co_organizer, attendee.profiles?.display_name || 'Anonymous');
                              }}
                              className={attendee.is_co_organizer ? "border-purple-500 text-purple-500" : "bg-purple-500 hover:bg-purple-600"}
                            >
                              {attendee.is_co_organizer ? "Remove Co-Organizer" : "Make Co-Organizer"}
                            </Button>
                          )}

                          {isAdmin && (
                            <>
                              <Button
                                variant={attendee.payment_status ? "outline" : "default"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePayment(attendee.id, attendee.payment_status);
                                }}
                                className={attendee.payment_status ? "border-green-500 text-green-500" : "bg-green-500 hover:bg-green-600"}
                              >
                                {attendee.payment_status ? "Mark Unpaid" : "Mark Paid"}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    className="border-red-500 text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Attendee</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {attendee.profiles?.display_name || 'this user'} from the event? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRemoveAttendee(attendee.id, attendee.profiles?.display_name || 'Anonymous')}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {attendees.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {!user ? "Please log in to see Attendees" : "No attendees yet. Be the first to join!"}
                      </p>
                    )}
                    {attendees.length > 10 && !showAllAttendees && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllAttendees(true)}
                      >
                        See all {attendees.length} attendees
                      </Button>
                    )}
                    {showAllAttendees && attendees.length > 10 && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowAllAttendees(false)}
                      >
                        Show less
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Discussion ({comments.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Comment Form */}
                  {user && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <Textarea
                        placeholder="Share your thoughts about this event..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {newComment.length}/500
                        </span>
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || commentsLoading}
                          size="sm"
                        >
                          {commentsLoading ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {displayedComments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {!user ? "Please log in to see Comments" : "No comments yet. Be the first to share your thoughts!"}
                      </p>
                    ) : (
                      displayedComments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex space-x-3">
                            <Avatar 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleProfileClick(comment.user_id)}
                            >
              <AvatarImage src={comment.profiles?.avatar_url || defaultAvatar} />
              <AvatarFallback>
                {comment.profiles?.display_name?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span 
                                    className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleProfileClick(comment.user_id)}
                                  >
                                    {comment.profiles?.display_name || 'Anonymous'}
                                  </span>
                                  {comment.profiles?.is_verified && (
                                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <CommentActions
                                  comment={comment}
                                  currentUserId={currentUser?.id}
                                  isAdmin={isAdmin}
                                  onCommentDeleted={handleCommentDeleted}
                                  commentType="event"
                                />
                              </div>
                              <p className="text-sm leading-relaxed font-light mt-2">{comment.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {comments.length > 10 && !showAllComments && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllComments(true)}
                      >
                        See all {comments.length} comments
                      </Button>
                    )}
                    {showAllComments && comments.length > 10 && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowAllComments(false)}
                      >
                        Show less
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {user && !hasJoined && (
                    <Button
                      variant="cta"
                      onClick={handleJoinEvent}
                      disabled={joiningEvent}
                      className="w-full"
                    >
                      {joiningEvent ? "Joining..." : "Join Event"}
                    </Button>
                  )}
                  {user && hasJoined && (
                    <Button
                      variant="outline"
                      onClick={handleUnjoinEvent}
                      disabled={leavingEvent}
                      className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white"
                    >
                      {leavingEvent ? "Leaving..." : "✓ Joined - Click to Leave"}
                    </Button>
                  )}
                  {!user && (
                    <Button
                      variant="cta"
                      onClick={() => navigate('/auth')}
                      className="w-full"
                    >
                      Join Event
                    </Button>
                  )}
                  
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
                  
                  {(isOwner || isAdmin) && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleEdit}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this event? This action cannot be undone and will remove all associated data including attendees and comments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete Event"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  
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