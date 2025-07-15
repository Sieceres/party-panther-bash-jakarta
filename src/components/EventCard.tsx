import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export const EventCard = ({ event, onJoin }: EventCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group hover:scale-105 transition-all duration-300 bg-card border-border hover:border-primary/50 overflow-hidden">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image || event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop';
          }}
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary text-primary-foreground font-semibold">
            {event.price}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="text-white text-xs font-medium">{event.rating.toFixed(2)}</span>
        </div>
      </div>

      <CardHeader className="pb-3">
        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center text-sm text-muted-foreground space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{event.date}</span>
          </div>
          <span>{event.time}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{event.venue}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{event.attendees} going</span>
          </div>
          <span className="text-xs text-muted-foreground">by {event.organizer}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate(`/event/${event.id}`)}
        >
          View Details
        </Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => onJoin?.(event.id)}
        >
          {event.isJoined ? 'Joined' : 'Join Event'} {/* Change text based on isJoined */}
        </Button>
      </CardFooter>
    </Card>
  );
};