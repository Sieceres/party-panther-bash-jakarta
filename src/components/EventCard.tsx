import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User as UserIcon, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Tables } from "../integrations/supabase/types";

interface Event extends Tables<'events'> {
  venue: string;
  price: string;
  image: string;
  attendees: number;
  rating: number;
  tags: string[];
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
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [eventTags, setEventTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchEventData = async () => {
      // Fetch creator name
      if (event.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', event.created_by)
          .single();
        
        setCreatorName(profile?.display_name || 'Anonymous');
      }

      // Fetch event tags
      const { data: tags } = await supabase
        .from('event_event_tags')
        .select('tag_name')
        .eq('event_id', event.id);
      
      if (tags) {
        setEventTags(tags.map(t => t.tag_name));
      }
    };

    fetchEventData();
  }, [event.created_by, event.id]);

  const handleCardClick = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <Card className="neon-card bg-card/95 backdrop-blur-sm border border-border/50 group cursor-pointer" onClick={handleCardClick}>
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
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{event.title}</h3>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>{format(new Date(event.date), 'EEEE, MMMM do')} at {event.time}</p>
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

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {eventTags.slice(0, 2).map((tag, index) => (
              <span key={index} className="neon-tag text-xs">
                {tag}
              </span>
            ))}
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