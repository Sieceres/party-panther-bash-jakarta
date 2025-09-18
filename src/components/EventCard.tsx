import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User as UserIcon, Star, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

import { Tables } from "../integrations/supabase/types";
import { getEventUrl, getEditEventUrl } from "@/lib/slug-utils";

interface Event extends Tables<'events'> {
  venue: string;
  image: string;
  attendees: number;
  rating: number;
  
  organizer: string;
  isJoined?: boolean;
}

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
}

import { format } from "date-fns";

export const EventCard = ({ event, onJoin }: EventCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creatorName, setCreatorName] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      // Fetch creator name using secure function
      if (event.created_by) {
        const { data: profile } = await supabase
          .rpc('get_safe_profile_info', { profile_user_id: event.created_by });
        
        if (profile && profile.length > 0) {
          setCreatorName(profile[0]?.display_name || 'Anonymous');
        } else {
          setCreatorName('Anonymous');
        }
      }

      // Get current user and check admin status
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_super_admin')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || profile?.is_super_admin || false);
      }
    };

    fetchEventData();
  }, [event.created_by, event.id]);

  const handleCardClick = () => {
    navigate(getEventUrl(event));
  };

  const handleEdit = () => {
    navigate(getEditEventUrl(event));
  };

  const handleDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "Please log in to delete events.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is owner or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = profile?.is_admin || profile?.is_super_admin || false;
    const isOwner = user.id === event.created_by;
    
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
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Event deleted successfully!"
      });

      // Refresh the page to show updated data
      window.location.reload();
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

  const isOwner = currentUser && currentUser.id === event.created_by;
  const canDelete = isOwner || isAdmin;

  return (
    <Card className="neon-card bg-card/95 backdrop-blur-sm border border-border/50 group cursor-pointer" onClick={handleCardClick}>
      <div className="p-4 pb-3">
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2" style={{ fontSize: '20px' }}>{event.title}</h3>
      </div>
      <div className="relative overflow-hidden">
        <img 
          src={event.image || event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop'}
          alt={event.title}
          className="card-image w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop';
          }}
        />
        <div className="image-overlay absolute inset-0"></div>
        <div className="neon-tag absolute top-3 right-3">
          {format(new Date(event.date), 'MMM dd')}
        </div>
        {canDelete && (
          <div className="absolute top-3 right-20 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 h-8 w-8"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this event? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#E0E0E0', fontSize: '14px' }}>{format(new Date(event.date), 'EEEE, MMMM do')} at {event.time}</p>
          </div>
          
          <p className="text-sm text-white">{event.venue || event.venue_name}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1" style={{ color: '#E0E0E0' }}>
              <UserIcon className="w-4 h-4" />
              <span>{event.attendees} going</span>
            </div>
            <div className="flex items-center space-x-2 text-xs" style={{ color: '#E0E0E0' }}>
              {creatorName && <span>Created by {creatorName}</span>}
            </div>
          </div>

        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={(e) => {
          e.stopPropagation();
          handleCardClick();
        }}>
          View Details
        </Button>
        <button 
          className="cta-button"
          onClick={(e) => {
            e.stopPropagation();
            onJoin && onJoin(event.id);
          }}
        >
          {event.isJoined ? "Joined" : "Join Event"}
        </button>
      </CardFooter>
    </Card>
  );
};