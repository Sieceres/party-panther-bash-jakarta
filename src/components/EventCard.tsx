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
  venue?: string;
  image?: string;
  attendees?: number;
  attendee_count?: number;
  rating?: number;
  organizer?: string;
  isJoined?: boolean;
  is_joined?: boolean;
  // Optimized data fields
  creator_name?: string;
  creator_avatar?: string;
  creator_verified?: boolean;
}

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
  userAdminStatus?: { is_admin: boolean; is_super_admin: boolean } | null;
}

import { format } from "date-fns";

export const EventCard = ({ event, onJoin, userAdminStatus }: EventCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

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
  const isAdmin = userAdminStatus?.is_admin || userAdminStatus?.is_super_admin || false;
  const canDelete = isOwner || isAdmin;
  
  // Use optimized creator name or fallback to fetching
  const creatorName = event.creator_name || 'Anonymous';

  return (
    <Card className="neon-card bg-card/95 backdrop-blur-sm border border-border/50 group cursor-pointer" onClick={handleCardClick}>
      <div className="p-3 sm:p-4 pb-2 sm:pb-3">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3 line-clamp-2">{event.title}</h3>
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
          {format(new Date(event.date + 'T00:00:00'), 'MMM dd')}
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

      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          <div>
            <p className="text-xs sm:text-sm whitespace-pre-wrap" style={{ color: '#E0E0E0' }}>{format(new Date(event.date + 'T00:00:00'), 'EEEE, MMMM do')} at {event.time}</p>
          </div>
          
          <p className="text-xs sm:text-sm text-white line-clamp-1">{event.venue || event.venue_name}</p>
          
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-1" style={{ color: '#E0E0E0' }}>
              <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{event.attendee_count || event.attendees || 0} going</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] sm:text-xs" style={{ color: '#E0E0E0' }}>
              {creatorName && <span className="line-clamp-1">by {creatorName}</span>}
            </div>
          </div>

        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0 flex justify-between items-center gap-2">
        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={(e) => {
          e.stopPropagation();
          handleCardClick();
        }}>
          View Details
        </Button>
        <Button 
          variant="cta"
          size="sm"
          className="text-xs sm:text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onJoin && onJoin(event.id);
          }}
        >
          {event.isJoined || event.is_joined ? "Joined" : "Join Event"}
        </Button>
      </CardFooter>
    </Card>
  );
};