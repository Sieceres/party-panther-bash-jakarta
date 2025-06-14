import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Star } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  image: string;
  attendees: number;
  rating: number;
  tags: string[];
  organizer: string;
}

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
}

export const EventCard = ({ event, onJoin }: EventCardProps) => {
  return (
    <Card className="group hover:scale-105 transition-all duration-300 bg-card border-border hover:border-primary/50 overflow-hidden">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary text-primary-foreground font-semibold">
            {event.price}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="text-white text-xs font-medium">{event.rating}</span>
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

      <CardFooter>
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => onJoin?.(event.id)}
        >
          Join Event
        </Button>
      </CardFooter>
    </Card>
  );
};