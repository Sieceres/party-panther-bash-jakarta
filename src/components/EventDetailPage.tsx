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
import { MapPin, ArrowLeft, User as UserIcon, Star, Share2, Edit2, Trash2, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { GoogleMap } from "./GoogleMap";
import { CommentActions } from "./CommentActions";
import { ReportDialog } from "./ReportDialog";
import { ReceiptUpload } from "./ReceiptUpload";
import { Header } from "./Header";
import { EventTags } from "./EventTags";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEventBySlugOrId, getEditEventUrl } from "@/lib/slug-utils";
import { extractInstagramPostId } from "@/lib/instagram-utils";
import Linkify from "linkify-react";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import defaultAvatar from "@/assets/default-avatar.png";
import { AttendeeNoteDialog } from "./AttendeeNoteDialog";
import { EventCheckIn } from "./EventCheckIn";
import { EventPhotoGallery } from "./EventPhotoGallery";
import { EventInviteCodes } from "./EventInviteCodes";

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
  track_payments: boolean;
  organizer_name: string;
  organizer_whatsapp: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  instagram_post_url?: string;
  slug?: string;
  attendee_count?: number;
  comment_count?: number;
  access_level?: string;
  max_attendees?: number;
  enable_check_in?: boolean;
  enable_photos?: boolean;
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
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentAttendeeId, setCurrentAttendeeId] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [eventTags, setEventTags] = useState<any[]>([]);

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
          // Check if user is admin using the new user_roles table
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['admin', 'superadmin']);
          
          setIsAdmin(roles && roles.length > 0);
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

        // Fetch creator profile
        const { data: creatorProfileData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_verified, venue_status, business_name')
          .eq('user_id', eventData.created_by)
          .single();
        
        setCreatorProfile(creatorProfileData);

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
            .select('user_id, display_name, avatar_url, is_verified')
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
            .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at, note')
            .eq('event_id', eventData.id)
            .order('joined_at', { ascending: false });

        if (attendeesData && !attendeesError) {
          // Fetch profiles for attendees
          const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, is_verified')
            .in('user_id', userIds);

          // Join attendees with profiles
          const attendeesWithProfiles = attendeesData.map(attendee => ({
            ...attendee,
            profiles: profilesData?.find(profile => profile.user_id === attendee.user_id) || null
          }));
          setAttendees(attendeesWithProfiles);
        }

        // Fetch event tags
        const { data: tagsData } = await supabase
          .from('event_tag_assignments')
          .select(`
            tag_id,
            event_tags:tag_id (
              id,
              name,
              category,
              sort_order
            )
          `)
          .eq('event_id', eventData.id);

        if (tagsData) {
          const tags = tagsData
            .map(t => t.event_tags)
            .filter(Boolean)
            .sort((a: any, b: any) => a.sort_order - b.sort_order);
          setEventTags(tags);
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

  // Load Instagram embed script when event has instagram_post_url
  useEffect(() => {
    if (event?.instagram_post_url) {
      console.log('🔍 Event has Instagram URL:', event.instagram_post_url);
      const postId = extractInstagramPostId(event.instagram_post_url);
      console.log('🔍 Extracted Post ID:', postId);
      
      const loadInstagramEmbed = () => {
        console.log('🔍 Loading Instagram embed script...');
        if ((window as any).instgrm) {
          console.log('✅ Instagram script already loaded, processing embeds...');
          (window as any).instgrm.Embeds.process();
        } else {
          console.log('📥 Creating new Instagram script tag...');
          const script = document.createElement('script');
          script.src = 'https://www.instagram.com/embed.js';
          script.async = true;
          script.onload = () => {
            console.log('✅ Instagram script loaded successfully!');
            if ((window as any).instgrm) {
              console.log('✅ Processing Instagram embeds...');
              (window as any).instgrm.Embeds.process();
            } else {
              console.error('❌ Instagram script loaded but instgrm object not found');
            }
          };
          script.onerror = () => {
            console.error('❌ Failed to load Instagram embed script');
          };
          document.body.appendChild(script);
          console.log('📌 Instagram script tag appended to body');
        }
      };

      // Small delay to ensure DOM is ready
      const timer = setTimeout(loadInstagramEmbed, 100);
      return () => clearTimeout(timer);
    }
  }, [event?.instagram_post_url]);

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
      
      // Show success toast with action to add note
      toast({
        title: "Successfully joined event! 🎉",
        description: (
          <div className="flex flex-col gap-2">
            <p>You're now registered for "{event.title}". See you there!</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNoteDialog(true)}
              className="w-fit"
            >
              Add note?
            </Button>
          </div>
        ),
        duration: 8000,
      });

      // Refresh attendees list
        const { data: attendeesData } = await supabase
          .from('event_attendees')
          .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at, note')
          .eq('event_id', event.id)
          .order('joined_at', { ascending: false });

        if (attendeesData) {
          // Fetch profiles for attendees
          const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, is_verified')
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
          .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at, note')
          .eq('event_id', event.id)
          .order('joined_at', { ascending: false });

      if (attendeesData) {
        // Fetch profiles for attendees
        const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_verified')
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
      const message = `Hi! I'm interested in attending "${event.title}" on ${format(new Date(event.date + 'T00:00:00'), 'MMMM do, yyyy')} at ${event.time}.`;
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
  const isCoOrganizer = user && attendees.some(a => a.user_id === user.id && a.is_co_organizer);
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

  const handleNoteSaved = async () => {
    // Refresh attendees to show the updated note
    if (!event) return;
    
    const { data: attendeesData } = await supabase
      .from('event_attendees')
      .select('id, user_id, joined_at, payment_status, payment_date, payment_marked_by, receipt_url, receipt_uploaded_at, note')
      .eq('event_id', event.id)
      .order('joined_at', { ascending: false });

    if (attendeesData) {
      const userIds = [...new Set(attendeesData.map(attendee => attendee.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_verified')
        .in('user_id', userIds);

      const attendeesWithProfiles = attendeesData.map(attendee => ({
        ...attendee,
        profiles: profilesData?.find(profile => profile.user_id === attendee.user_id) || null
      }));
      setAttendees(attendeesWithProfiles);
    }
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
              {/* Event Title and Date */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text leading-tight">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                  <span>{format(new Date(event.date + 'T00:00:00'), 'EEEE, MMMM do, yyyy')}</span>
                  <span>•</span>
                  <span>{event.time}</span>
                  {event.is_recurrent && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">Recurring</Badge>
                    </>
                  )}
                </div>
              </div>

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
                <CardContent className="space-y-4 p-4 sm:p-5 md:p-6 pt-6">
                  <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    <Linkify options={{ target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline" }}>
                      {event.description}
                    </Linkify>
                  </div>
                  
                  <p className="text-2xl font-bold text-red-500 bg-yellow-200 p-4 text-center">
                    ⬇️ START OF EMBED LOCATION 1 (RED BORDER) ⬇️
                  </p>
                  
                  {/* TEST LOCATION 1: Right after description */}
                  {event.instagram_post_url && (() => {
                    const postId = extractInstagramPostId(event.instagram_post_url);
                    console.log('🎯 Location 1 - Post ID:', postId);
                    return postId ? (
                      <>
                        <Separator />
                        <div className="flex flex-col items-center space-y-2">
                          <h4 className="text-base sm:text-lg font-semibold self-start bg-red-500 text-white px-2 py-1">TEST LOCATION 1 - After Description</h4>
                          <div className="w-full max-w-md mx-auto border-4 border-red-500 p-2">
                            <blockquote
                              className="instagram-media"
                              data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
                              data-instgrm-version="14"
                              style={{
                                background: '#FFF',
                                border: 0,
                                borderRadius: '3px',
                                boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                                margin: '1px',
                                maxWidth: '540px',
                                minWidth: '326px',
                                padding: 0,
                                width: '99.375%'
                              }}
                            >
                              <a
                                href={`https://www.instagram.com/p/${postId}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View this post on Instagram
                              </a>
                            </blockquote>
                          </div>
                        </div>
                      </>
                    ) : null;
                  })()}
                  
                  <p className="text-2xl font-bold text-red-500 bg-yellow-200 p-4 text-center">
                    ⬆️ END OF EMBED LOCATION 1 (RED BORDER) ⬆️
                  </p>
                  
                  {eventTags.length > 0 && (
                    <>
                      <Separator />
                      <EventTags tags={eventTags} variant="full" />
                    </>
                  )}
                  
                  <Separator />
                  
                  <p className="text-2xl font-bold text-blue-500 bg-yellow-200 p-4 text-center">
                    ⬇️ START OF EMBED LOCATION 2 (BLUE BORDER) ⬇️
                  </p>
                  
                  {/* TEST LOCATION 2: Before venue section */}
                  {event.instagram_post_url && (() => {
                    const postId = extractInstagramPostId(event.instagram_post_url);
                    console.log('🎯 Location 2 - Post ID:', postId);
                    return postId ? (
                      <div className="flex flex-col items-center space-y-2 my-4">
                        <h4 className="text-base sm:text-lg font-semibold self-start bg-blue-500 text-white px-2 py-1">TEST LOCATION 2 - Before Venue</h4>
                        <div className="w-full max-w-md mx-auto border-4 border-blue-500 p-2">
                          <blockquote
                            className="instagram-media"
                            data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
                            data-instgrm-version="14"
                            style={{
                              background: '#FFF',
                              border: 0,
                              borderRadius: '3px',
                              boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                              margin: '1px',
                              maxWidth: '540px',
                              minWidth: '326px',
                              padding: 0,
                              width: '99.375%'
                            }}
                          >
                            <a
                              href={`https://www.instagram.com/p/${postId}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View this post on Instagram
                            </a>
                          </blockquote>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  
                  <p className="text-2xl font-bold text-blue-500 bg-yellow-200 p-4 text-center">
                    ⬆️ END OF EMBED LOCATION 2 (BLUE BORDER) ⬆️
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-semibold">Venue</h4>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-medium">{event.venue_name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{event.venue_address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-semibold">Organizer</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <UserIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm sm:text-base">{event.organizer_name}</span>
                        {creatorProfile?.venue_status === 'verified' && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Verified Venue
                          </Badge>
                        )}
                        {event.organizer_whatsapp && user && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleContactOrganizer}
                            className="text-xs sm:text-sm"
                          >
                            Contact
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {markers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-semibold">Location</h4>
                      <GoogleMap
                        center={memoizedCenter}
                        markers={markers}
                        height="300px"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Check-In Section */}
              {event.enable_check_in && (
                <EventCheckIn
                  eventId={event.id}
                  eventDate={event.date}
                  eventTime={event.time}
                  isJoined={hasJoined}
                  canManage={isOwner || isCoOrganizer || isAdmin}
                />
              )}

              {/* Photo Gallery Section */}
              {event.enable_photos && (
                <EventPhotoGallery
                  eventId={event.id}
                  isJoined={hasJoined}
                  canManage={isOwner || isCoOrganizer || isAdmin}
                />
              )}

              <p className="text-2xl font-bold text-green-500 bg-yellow-200 p-4 text-center">
                ⬇️ START OF EMBED LOCATION 3 (GREEN BORDER) ⬇️
              </p>

              {/* TEST LOCATION 3: Before Attendees section */}
              {event.instagram_post_url && (() => {
                const postId = extractInstagramPostId(event.instagram_post_url);
                return postId ? (
                  <Card className="border-4 border-green-500">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <h4 className="text-base sm:text-lg font-semibold bg-green-500 text-white px-2 py-1 mb-4">TEST LOCATION 3 - Before Attendees</h4>
                      <div className="w-full max-w-md mx-auto">
                        <blockquote
                          className="instagram-media"
                          data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
                          data-instgrm-version="14"
                          style={{
                            background: '#FFF',
                            border: 0,
                            borderRadius: '3px',
                            boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                            margin: '1px',
                            maxWidth: '540px',
                            minWidth: '326px',
                            padding: 0,
                            width: '99.375%'
                          }}
                        >
                          <a
                            href={`https://www.instagram.com/p/${postId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View this post on Instagram
                          </a>
                        </blockquote>
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              <p className="text-2xl font-bold text-green-500 bg-yellow-200 p-4 text-center">
                ⬆️ END OF EMBED LOCATION 3 (GREEN BORDER) ⬆️
              </p>

              {/* Attendees Section */}
              <Card>
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <UserIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Attendees ({totalAttendees})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                  <div className="space-y-3">
                    {displayedAttendees.map((attendee) => (
                      <div 
                        key={attendee.id} 
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer min-w-0"
                          onClick={() => handleProfileClick(attendee.user_id)}
                        >
                          <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage src={attendee.profiles?.avatar_url || defaultAvatar} />
            <AvatarFallback className="text-xs sm:text-sm">
              {attendee.profiles?.display_name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-medium">
                                {attendee.profiles?.display_name || 'Anonymous'}
                              </span>
                          {attendee.payment_status && event.track_payments && (
                            <span className="text-base sm:text-lg">💰</span>
                          )}
                            </div>
                            {attendee.profiles?.bio && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                                {attendee.profiles.bio}
                              </p>
                            )}
                            {attendee.note && (
                              <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-2 mt-1 max-w-full break-words">
                                💭 {attendee.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto md:justify-end">
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
                          
                          {/* Receipt Upload - show for the user themselves and only if payment tracking is enabled */}
                          {user && attendee.user_id === user.id && event.track_payments && (
                            <ReceiptUpload
                              eventId={event.id}
                              userId={user.id}
                              currentReceiptUrl={attendee.receipt_url}
                              onReceiptUploaded={(receiptUrl) => handleReceiptUploaded(attendee.id, receiptUrl)}
                            />
                          )}
                          
                          {/* Edit Note - show for the user themselves */}
                          {user && attendee.user_id === user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentAttendeeId(attendee.id);
                                setShowNoteDialog(true);
                              }}
                              className="border-cyan-500 text-cyan-500 hover:bg-cyan-50"
                            >
                              {attendee.note ? "Edit Note" : "Add Note"}
                            </Button>
                          )}
                          
                          {/* Receipt status for admins - only if payment tracking is enabled */}
                          {isAdmin && attendee.receipt_url && event.track_payments && (
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
                              {/* Payment status toggle - only if payment tracking is enabled */}
                              {event.track_payments && (
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
                              )}
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
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span>Discussion ({comments.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-5 md:p-6 pt-0">
                  {/* Add Comment Form */}
                  {user && (
                    <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <Textarea
                        placeholder="Share your thoughts about this event..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={3}
                        className="text-sm sm:text-base"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {newComment.length}/500
                        </span>
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || commentsLoading}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          {commentsLoading ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {displayedComments.length === 0 ? (
                      <p className="text-center text-sm sm:text-base text-muted-foreground py-6 sm:py-8">
                        {!user ? "Please log in to see Comments" : "No comments yet. Be the first to share your thoughts!"}
                      </p>
                    ) : (
                      displayedComments.map((comment) => (
                        <div key={comment.id} className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                          <div className="flex gap-3">
                            <Avatar 
                              className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleProfileClick(comment.user_id)}
                            >
              <AvatarImage src={comment.profiles?.avatar_url || defaultAvatar} />
              <AvatarFallback className="text-xs sm:text-sm">
                {comment.profiles?.display_name?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <span 
                                    className="text-sm sm:text-base font-medium cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleProfileClick(comment.user_id)}
                                  >
                                    {comment.profiles?.display_name || 'Anonymous'}
                                  </span>
                                  {comment.profiles?.is_verified && (
                                    <Badge variant="secondary" className="text-xs flex-shrink-0">Verified</Badge>
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

              {/* Invite Codes Management - only for organizers of private events */}
              {(isOwner || isCoOrganizer) && event.access_level !== 'public' && (
                <EventInviteCodes
                  eventId={event.id}
                  eventDate={event.date}
                  eventTime={event.time}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendee Note Dialog */}
      <AttendeeNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        eventId={event?.id || ""}
        userId={user?.id || ""}
        initialNote={attendees.find(a => a.user_id === user?.id)?.note || ""}
        onNoteSaved={handleNoteSaved}
      />
    </>
  );
};